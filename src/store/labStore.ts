"use client";
import { create } from "zustand";
import type {
  ChartConfig,
  DataRow,
  Experiment,
  ExperimentStatus,
  LabComponent,
  LabMode,
  Measurement,
  NotebookSections,
  PropValue,
  RecordedFrame,
  ReportMeta,
  TimelineEvent,
  TimelineKind,
  Vec2,
  Viewport,
  Wire,
  WireEnd,
  WorkspaceSettings,
  EffectType,
  CircuitSolution,
  OpticsSolution,
  Environment,
} from "@/lib/engine/types";
import "@/lib/catalog";
import { getDefinition } from "@/lib/engine/registry";
import { createComponent, initialStateFor, uid } from "@/lib/engine/factory";
import { buildWorld, collectReadings, runAction, stepSimulation, DEFAULT_ENV, type LiveReading } from "@/lib/engine/simulation";
import { evaluateSafety, type SafetyFinding, LEVEL_RANK } from "@/lib/engine/safety";
import { componentAt, contains, boundsOf } from "@/lib/engine/geometry";
import { addChemical, describeAmount, emptyMixture, mixtureAppearance, react, transfer, defaultAmount, type AddAmount } from "@/lib/chemistry/mixture";
import { getChemical } from "@/lib/chemistry/chemicals";
import { columnIds, loggableReadings } from "@/lib/engine/columns";
import { getTemplate } from "@/lib/templates";
import { saveExperiment } from "@/lib/storage/experiments";
import { snapshotWorkspace } from "@/lib/canvasRegistry";
import { describeTransfer } from "@/lib/catalog/helpers";

type Snapshot = { components: LabComponent[]; wires: Wire[] };
export type Tool = "select" | "wire" | "pan";
export type SimStatus = "idle" | "running" | "paused";
export type RecStatus = "idle" | "recording" | "paused";
export type BottomTab = "timeline" | "measurements" | "data" | "charts" | "notebook" | "recording";

/** A short-lived audio-visual effect anchored to a component (wall-clock timed). */
export interface LabEffect {
  id: string;
  type: EffectType | "pour";
  componentId: string;
  targetId?: string;
  color?: string;
  at: number;
}

export interface Notification {
  id: string;
  level: "info" | "success" | "caution" | "danger";
  title: string;
  message: string;
  at: number;
  read: boolean;
}

export const EMPTY_NOTEBOOK: NotebookSections = {
  title: "",
  objective: "",
  theory: "",
  hypothesis: "",
  materials: "",
  equipment: "",
  procedure: "",
  observations: "",
  measurements: "",
  results: "",
  calculations: "",
  charts: "",
  discussion: "",
  conclusion: "",
  safety: "",
};

export const DEFAULT_SETTINGS: WorkspaceSettings = { showGrid: true, snapToGrid: true, gridSize: 10, showRulers: true, showLabels: true };

function defaultReport(title: string): ReportMeta {
  return { institution: "Virtual Lab University", reportTitle: title, studentName: "", studentId: "", course: "", instructor: "", date: new Date().toISOString().slice(0, 10) };
}

interface LabState {
  experimentId: string;
  title: string;
  mode: LabMode;
  status: ExperimentStatus;
  templateId?: string;
  createdAt: number;
  components: LabComponent[];
  wires: Wire[];
  timeline: TimelineEvent[];
  measurements: Measurement[];
  dataRows: DataRow[];
  columnMeta: Record<string, { label: string; unit: string }>;
  charts: ChartConfig[];
  notebook: NotebookSections;
  report: ReportMeta;
  recording: RecordedFrame[];
  thumbnail?: string;
  chemicalsUsed: string[];

  viewport: Viewport;
  settings: WorkspaceSettings;
  tool: Tool;
  selection: string[];
  selectedWireId: string | null;
  clipboard: LabComponent[] | null;
  past: Snapshot[];
  future: Snapshot[];

  simStatus: SimStatus;
  simTime: number;
  speed: number;
  logInterval: number;
  lastLogAt: number;
  runSnapshot: Snapshot | null;
  env: Environment;
  autoLog: boolean;

  liveReadings: LiveReading[];
  circuit: CircuitSolution;
  optics: OpticsSolution;
  safety: SafetyFinding[];

  recStatus: RecStatus;
  replayIndex: number | null;

  notifications: Notification[];
  dirty: boolean;
  lastSavedAt: number | null;
  bottomTab: BottomTab;
  bottomOpen: boolean;
  bottomHeight: number;
  dropHighlight: boolean;
  dropTargetId: string | null;
  chemPickerFor: string | null;
  fitRequest: number;
  effects: LabEffect[];
  pushEffect: (e: Omit<LabEffect, "id" | "at">) => void;
  extinguish: (id: string) => void;

  // lifecycle
  newExperiment: (mode: LabMode, title?: string) => void;
  loadExperiment: (e: Experiment) => void;
  loadTemplate: (id: string) => void;
  toExperiment: () => Experiment;
  save: (opts?: { silent?: boolean }) => boolean;
  setTitle: (t: string) => void;
  setMode: (m: LabMode) => void;
  setStatus: (s: ExperimentStatus) => void;

  // editing
  addComponent: (type: string, pos: Vec2) => string | null;
  updateComponent: (id: string, patch: Partial<LabComponent>, opts?: { history?: boolean }) => void;
  setProperty: (id: string, key: string, value: PropValue) => void;
  renameComponent: (id: string, name: string) => void;
  moveComponents: (moves: { id: string; position: Vec2 }[]) => void;
  transformComponent: (id: string, t: { position: Vec2; rotation: number; width: number; height: number }) => void;
  deleteSelection: () => void;
  duplicateSelection: () => void;
  copySelection: () => void;
  paste: (at?: Vec2) => void;
  rotateSelection: (deg: number) => void;
  groupSelection: () => void;
  ungroupSelection: () => void;
  toggleLockSelection: () => void;
  bringToFront: (id: string) => void;
  select: (ids: string[], additive?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  selectWire: (id: string | null) => void;
  addWire: (from: WireEnd, to: WireEnd) => void;
  deleteWire: (id: string) => void;
  undo: () => void;
  redo: () => void;
  commit: () => void;

  // chemistry
  addChemicalTo: (containerId: string, chemId: string, amount?: AddAmount) => void;
  dropChemical: (chemId: string, pos: Vec2) => void;
  pour: (fromId: string, toId: string, volumeMl?: number) => void;
  emptyContainer: (id: string) => void;
  setContainerTemperature: (id: string, t: number) => void;
  runComponentAction: (id: string, action: string) => void;

  // simulation
  run: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
  tick: (realDt: number) => void;
  recompute: () => void;
  setSpeed: (s: number) => void;
  setLogInterval: (s: number) => void;
  setAutoLog: (b: boolean) => void;
  setEnv: (e: Partial<Environment>) => void;

  // data
  log: (kind: TimelineKind, message: string) => void;
  addObservation: (text: string) => void;
  deleteTimelineEvent: (id: string) => void;
  captureMeasurements: () => void;
  addDataRow: () => void;
  updateDataRow: (id: string, patch: Partial<DataRow>) => void;
  setDataValue: (rowId: string, col: string, value: number | null) => void;
  deleteDataRow: (id: string) => void;
  clearData: () => void;
  addColumn: (label: string, unit: string) => void;
  addChart: (c?: Partial<ChartConfig>) => void;
  updateChart: (id: string, patch: Partial<ChartConfig>) => void;
  deleteChart: (id: string) => void;
  updateNotebook: (patch: Partial<NotebookSections>) => void;
  updateReport: (patch: Partial<ReportMeta>) => void;

  // recording
  startRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  recordFrame: (label: string, kind: TimelineKind) => void;
  setReplayIndex: (i: number | null) => void;
  clearRecording: () => void;

  // ui
  setViewport: (v: Partial<Viewport>) => void;
  setSettings: (s: Partial<WorkspaceSettings>) => void;
  setTool: (t: Tool) => void;
  setBottomTab: (t: BottomTab) => void;
  setBottomOpen: (b: boolean) => void;
  setBottomHeight: (h: number) => void;
  setDropHighlight: (b: boolean) => void;
  setDropTarget: (id: string | null) => void;
  openChemPicker: (id: string | null) => void;
  requestFit: () => void;
  notify: (n: Omit<Notification, "id" | "at" | "read">) => void;
  markNotificationsRead: () => void;
  clearNotifications: () => void;
}

const EMPTY_CIRCUIT: CircuitSolution = { elements: {}, nodeVoltages: {}, closedLoops: 0 };
const EMPTY_OPTICS: OpticsSolution = { rays: [], readings: {}, screenHits: {} };

const clone = <T,>(v: T): T => structuredClone(v);

function baseState(mode: LabMode, title: string) {
  const now = Date.now();
  return {
    experimentId: uid("exp-"),
    title,
    mode,
    status: "draft" as ExperimentStatus,
    templateId: undefined,
    createdAt: now,
    components: [],
    wires: [],
    timeline: [],
    measurements: [],
    dataRows: [],
    columnMeta: {},
    charts: [],
    notebook: { ...EMPTY_NOTEBOOK, title },
    report: defaultReport(title),
    recording: [],
    thumbnail: undefined,
    chemicalsUsed: [] as string[],
    viewport: { x: 40, y: 20, scale: 1 },
    selection: [],
    selectedWireId: null,
    past: [],
    future: [],
    simStatus: "idle" as SimStatus,
    simTime: 0,
    lastLogAt: -Infinity,
    runSnapshot: null,
    recStatus: "idle" as RecStatus,
    replayIndex: null,
    dirty: false,
    lastSavedAt: null,
    liveReadings: [],
    circuit: EMPTY_CIRCUIT,
    optics: EMPTY_OPTICS,
    safety: [],
  };
}

export const useLab = create<LabState>()((set, get) => {
  const event = (kind: TimelineKind, message: string, t?: number): TimelineEvent => ({ id: uid("ev-"), t: t ?? get().simTime, kind, message, wallTime: Date.now() });

  /** Push the current workspace to the undo stack. */
  const checkpoint = () => {
    const { components, wires, past } = get();
    set({ past: [...past.slice(-99), { components, wires }], future: [], dirty: true });
  };

  const addEvents = (events: TimelineEvent[]) => {
    if (!events.length) return;
    set((s) => ({ timeline: [...s.timeline, ...events].slice(-2000) }));
    const st = get();
    if (st.recStatus === "recording") {
      const important = events.filter((e) => e.kind !== "system");
      if (important.length) st.recordFrame(important.map((e) => e.message).join(" · "), important[0].kind);
    }
  };

  const withReactions = (components: LabComponent[], ids: string[]): { components: LabComponent[]; events: TimelineEvent[] } => {
    const events: TimelineEvent[] = [];
    const next = components.map((c) => {
      if (!ids.includes(c.id) || !c.state.mixture) return c;
      const r = react(c.state.mixture, 0, get().simTime);
      for (const info of r.started) {
        if (info.effect) get().pushEffect({ type: info.effect, componentId: c.id });
        events.push(event("reaction", `${c.name}: ${info.equation} — ${info.type}`));
        for (const o of info.observations) events.push(event("observation", `${c.name}: ${o}`));
      }
      return { ...c, state: { ...c.state, mixture: r.mixture } };
    });
    return { components: next, events };
  };

  const selectionIds = () => {
    const { selection, components } = get();
    const groups = new Set(components.filter((c) => selection.includes(c.id) && c.groupId).map((c) => c.groupId));
    return components.filter((c) => selection.includes(c.id) || (c.groupId && groups.has(c.groupId))).map((c) => c.id);
  };

  return {
    ...baseState("chemistry", "Untitled experiment"),
    settings: DEFAULT_SETTINGS,
    tool: "select",
    clipboard: null,
    speed: 1,
    logInterval: 1,
    env: DEFAULT_ENV,
    autoLog: true,
    notifications: [],
    bottomTab: "timeline",
    bottomOpen: true,
    bottomHeight: 260,
    dropHighlight: false,
    dropTargetId: null,
    chemPickerFor: null,
    fitRequest: 0,
    effects: [],
    pushEffect: (e) => {
      const now = Date.now();
      set((s) => ({ effects: [...s.effects.filter((x) => now - x.at < 6000), { ...e, id: uid("fx-"), at: now }].slice(-40) }));
    },
    extinguish: (id) => {
      const c = get().components.find((x) => x.id === id);
      if (!c || (!c.state.onFire && !c.state.burning)) return;
      checkpoint();
      set((s) => ({ components: s.components.map((x) => (x.id === id ? { ...x, state: { ...x.state, onFire: false, burning: null } } : x)) }));
      get().pushEffect({ type: "extinguish", componentId: id });
      addEvents([event("action", `${c.name}: flames smothered by covering the vessel`)]);
      get().recompute();
    },

    /* ---------------- lifecycle ---------------- */
    newExperiment: (mode, title = mode === "chemistry" ? "New chemistry experiment" : "New physics experiment") => {
      set({ ...baseState(mode, title), timeline: [], charts: [{ id: uid("chart-"), title: "Readings vs time", kind: "line", x: "t", y: [] }] });
      set({ timeline: [event("system", `Experiment created — ${mode === "chemistry" ? "Chemistry" : "Physics"} Lab`, 0)] });
      get().recompute();
    },

    loadExperiment: (e) => {
      set({
        ...baseState(e.category, e.title),
        experimentId: e.id,
        title: e.title,
        mode: e.category,
        status: e.status,
        templateId: e.templateId,
        createdAt: e.createdAt,
        components: e.components,
        wires: e.wires,
        timeline: e.timeline,
        measurements: e.measurements,
        dataRows: e.dataRows,
        columnMeta: (e as Experiment & { columnMeta?: Record<string, { label: string; unit: string }> }).columnMeta ?? {},
        charts: e.charts,
        notebook: { ...EMPTY_NOTEBOOK, ...e.notebook },
        report: { ...defaultReport(e.title), ...e.report },
        recording: e.recording ?? [],
        thumbnail: e.thumbnail,
        chemicalsUsed: e.chemicals ?? [],
        viewport: e.workspaceState?.viewport ?? { x: 40, y: 20, scale: 1 },
        settings: { ...DEFAULT_SETTINGS, ...(e.workspaceState?.settings ?? {}) },
        simTime: e.workspaceState?.simTime ?? 0,
        lastSavedAt: e.updatedAt,
      });
      get().recompute();
    },

    loadTemplate: (id) => {
      const t = getTemplate(id);
      if (!t) return;
      get().newExperiment(t.category, t.name);
      const refs = new Map<string, LabComponent>();
      const comps: LabComponent[] = [];
      for (const tc of t.components) {
        const c = createComponent(tc.type, { x: tc.x, y: tc.y }, comps, { properties: tc.props, name: tc.name, rotation: tc.rotation, width: tc.width, height: tc.height });
        if (!c) continue;
        if (tc.fill && c.state.mixture) {
          let m = c.state.mixture;
          for (const f of tc.fill) m = addChemical(m, f.chem, f.amount, tc.temperature ?? 25);
          c.state = { ...c.state, mixture: react(m, 0, 0).mixture };
        }
        refs.set(tc.ref, c);
        comps.push(c);
      }
      const wires: Wire[] = [];
      for (const [a, ta, b, tb] of t.wires ?? []) {
        const ca = refs.get(a);
        const cb = refs.get(b);
        if (!ca || !cb) continue;
        const w: Wire = { id: uid("wire-"), from: { componentId: ca.id, terminal: ta }, to: { componentId: cb.id, terminal: tb } };
        wires.push(w);
        ca.connections.push(w.id);
        cb.connections.push(w.id);
      }
      const equipment = [...new Set(comps.map((c) => getDefinition(c.type)?.label ?? c.type))];
      const chemicals = [...new Set(t.components.flatMap((c) => c.fill?.map((f) => getChemical(f.chem)?.name ?? f.chem) ?? []))];
      set({
        templateId: t.id,
        chemicalsUsed: [...new Set(t.components.flatMap((c) => c.fill?.map((f) => f.chem) ?? []))],
        components: comps,
        wires,
        charts: (t.charts ?? [{ title: "Readings vs time", kind: "line", x: "t", y: [] }]).map((c) => ({ ...c, id: uid("chart-") })),
        logInterval: t.logInterval ?? get().logInterval,
        notebook: {
          ...EMPTY_NOTEBOOK,
          title: t.name,
          equipment: equipment.map((e) => `• ${e}`).join("\n"),
          materials: chemicals.map((c) => `• ${c}`).join("\n"),
          procedure: t.steps.map((s, i) => `${i + 1}. ${s}`).join("\n"),
          safety: "This is a virtual, educational simulation. Do not attempt hazardous procedures outside a supervised laboratory.",
          ...t.notebook,
        },
        report: defaultReport(t.name),
        dirty: true,
      });
      addEvents([event("system", `Template loaded: ${t.name}`, 0)]);
      get().recompute();
    },

    toExperiment: () => {
      const s = get();
      const chemicals = new Set<string>(s.chemicalsUsed);
      for (const c of s.components) {
        const m = c.state.mixture;
        if (m) [...Object.keys(m.species), ...Object.keys(m.solids)].forEach((id) => chemicals.add(id));
      }
      return {
        id: s.experimentId,
        title: s.title,
        category: s.mode,
        status: s.status,
        templateId: s.templateId,
        workspaceState: { viewport: s.viewport, settings: s.settings, simTime: s.simTime },
        components: s.components,
        wires: s.wires,
        chemicals: [...chemicals],
        measurements: s.measurements,
        dataRows: s.dataRows,
        timeline: s.timeline,
        observations: s.timeline.filter((e) => e.kind === "observation").map((e) => e.message),
        charts: s.charts,
        notebook: s.notebook,
        report: s.report,
        recording: s.recording,
        thumbnail: s.thumbnail,
        createdAt: s.createdAt,
        updatedAt: Date.now(),
        columnMeta: s.columnMeta,
      } as Experiment;
    },

    save: (opts) => {
      const thumb = snapshotWorkspace({ maxWidth: 1000, mime: "image/jpeg", quality: 0.8 });
      if (thumb) set({ thumbnail: thumb });
      const exp = get().toExperiment();
      const ok = saveExperiment(exp);
      if (ok) {
        set({ dirty: false, lastSavedAt: exp.updatedAt });
        if (!opts?.silent) get().notify({ level: "success", title: "Experiment saved", message: `"${exp.title}" was saved to your library.` });
      } else get().notify({ level: "danger", title: "Save failed", message: "Browser storage is full. Delete old experiments or recordings." });
      return ok;
    },

    setTitle: (title) => set((s) => ({ title, dirty: true, notebook: s.notebook.title ? s.notebook : { ...s.notebook, title }, report: { ...s.report, reportTitle: s.report.reportTitle === s.title ? title : s.report.reportTitle } })),
    setMode: (mode) => {
      if (mode === get().mode) return;
      set({ mode, dirty: true });
      addEvents([event("system", `Switched to ${mode === "chemistry" ? "Chemistry" : "Physics"} Lab`)]);
    },
    setStatus: (status) => {
      set({ status, dirty: true });
      if (status === "completed") addEvents([event("system", "Experiment marked as completed")]);
    },

    /* ---------------- editing ---------------- */
    addComponent: (type, pos) => {
      const s = get();
      const snap = s.settings.snapToGrid ? s.settings.gridSize : 1;
      const def = getDefinition(type);
      if (!def) return null;
      const p = { x: Math.round((pos.x - def.size.width / 2) / snap) * snap, y: Math.round((pos.y - def.size.height / 2) / snap) * snap };
      const c = createComponent(type, p, s.components);
      if (!c) return null;
      checkpoint();
      set({ components: [...get().components, c], selection: [c.id], selectedWireId: null });
      addEvents([event("action", `Added ${c.name} to the workspace`)]);
      get().recompute();
      return c.id;
    },

    updateComponent: (id, patch, opts) => {
      if (opts?.history !== false) checkpoint();
      set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, ...patch } : c)), dirty: true }));
      get().recompute();
    },

    setProperty: (id, key, value) => {
      const c = get().components.find((x) => x.id === id);
      if (!c || c.properties[key] === value) return;
      checkpoint();
      const def = getDefinition(c.type);
      const schema = def?.properties.find((p) => p.key === key);
      const updated: LabComponent = { ...c, properties: { ...c.properties, [key]: value } };
      // Re-initialise runtime state for parameters that define initial conditions
      const reinit = ["amplitude", "length", "height", "initialVelocity", "initialTemperature"].includes(key) && get().simStatus === "idle";
      if (reinit) updated.state = { ...initialStateFor(updated), mixture: c.state.mixture };
      set((s) => ({ components: s.components.map((x) => (x.id === id ? updated : x)), dirty: true }));
      const label = schema?.label ?? key;
      const shown = typeof value === "boolean" ? (value ? "on" : "off") : `${value}${schema?.unit ? " " + schema.unit : ""}`;
      addEvents([event("action", `${c.name}: ${label} set to ${shown}`)]);
      get().recompute();
    },

    renameComponent: (id, name) => {
      checkpoint();
      set((s) => ({ components: s.components.map((c) => (c.id === id ? { ...c, name } : c)) }));
    },

    moveComponents: (moves) => {
      if (!moves.length) return;
      checkpoint();
      const map = new Map(moves.map((m) => [m.id, m.position]));
      set((s) => ({ components: s.components.map((c) => (map.has(c.id) ? { ...c, position: map.get(c.id)! } : c)) }));
      get().recompute();
    },

    transformComponent: (id, t) => {
      checkpoint();
      set((s) => ({
        components: s.components.map((c) => (c.id === id ? { ...c, position: t.position, rotation: t.rotation, dimensions: { width: t.width, height: t.height } } : c)),
      }));
      get().recompute();
    },

    deleteSelection: () => {
      const s = get();
      if (s.selectedWireId) return get().deleteWire(s.selectedWireId);
      const ids = selectionIds().filter((id) => !s.components.find((c) => c.id === id)?.locked);
      if (!ids.length) return;
      checkpoint();
      const names = s.components.filter((c) => ids.includes(c.id)).map((c) => c.name);
      const wires = s.wires.filter((w) => !ids.includes(w.from.componentId) && !ids.includes(w.to.componentId));
      set({
        components: s.components.filter((c) => !ids.includes(c.id)).map((c) => ({ ...c, connections: c.connections.filter((wid) => wires.some((w) => w.id === wid)) })),
        wires,
        selection: [],
      });
      addEvents([event("action", `Removed ${names.join(", ")}`)]);
      get().recompute();
    },

    duplicateSelection: () => {
      get().copySelection();
      get().paste();
    },

    copySelection: () => {
      const s = get();
      const ids = selectionIds();
      if (!ids.length) return;
      set({ clipboard: clone(s.components.filter((c) => ids.includes(c.id))) });
    },

    paste: (at) => {
      const s = get();
      if (!s.clipboard?.length) return;
      checkpoint();
      const minX = Math.min(...s.clipboard.map((c) => c.position.x));
      const minY = Math.min(...s.clipboard.map((c) => c.position.y));
      const groupMap = new Map<string, string>();
      const created: LabComponent[] = [];
      const all = [...s.components];
      for (const c of s.clipboard) {
        const fresh = createComponent(c.type, { x: 0, y: 0 }, all);
        if (!fresh) continue;
        const pos = at ? { x: at.x + (c.position.x - minX), y: at.y + (c.position.y - minY) } : { x: c.position.x + 30, y: c.position.y + 30 };
        const gid = c.groupId ? (groupMap.get(c.groupId) ?? groupMap.set(c.groupId, uid("grp-")).get(c.groupId)) : undefined;
        const copy: LabComponent = { ...clone(c), id: fresh.id, name: fresh.name, position: pos, connections: [], groupId: gid, locked: false };
        created.push(copy);
        all.push(copy);
      }
      set({ components: all, selection: created.map((c) => c.id), clipboard: created.map((c) => ({ ...c })) });
      addEvents([event("action", `Pasted ${created.map((c) => c.name).join(", ")}`)]);
      get().recompute();
    },

    rotateSelection: (deg) => {
      const ids = selectionIds();
      if (!ids.length) return;
      checkpoint();
      set((s) => ({ components: s.components.map((c) => (ids.includes(c.id) && !c.locked ? { ...c, rotation: (((c.rotation + deg) % 360) + 360) % 360 } : c)) }));
      get().recompute();
    },

    groupSelection: () => {
      const ids = selectionIds();
      if (ids.length < 2) return;
      checkpoint();
      const gid = uid("grp-");
      set((s) => ({ components: s.components.map((c) => (ids.includes(c.id) ? { ...c, groupId: gid } : c)) }));
      addEvents([event("action", `Grouped ${ids.length} objects`)]);
    },

    ungroupSelection: () => {
      const ids = selectionIds();
      checkpoint();
      set((s) => ({ components: s.components.map((c) => (ids.includes(c.id) ? { ...c, groupId: undefined } : c)) }));
    },

    toggleLockSelection: () => {
      const ids = selectionIds();
      if (!ids.length) return;
      checkpoint();
      const lock = !get().components.find((c) => c.id === ids[0])?.locked;
      set((s) => ({ components: s.components.map((c) => (ids.includes(c.id) ? { ...c, locked: lock } : c)) }));
      addEvents([event("action", `${lock ? "Locked" : "Unlocked"} ${ids.length} object${ids.length > 1 ? "s" : ""}`)]);
    },

    bringToFront: (id) =>
      set((s) => {
        const c = s.components.find((x) => x.id === id);
        return c ? { components: [...s.components.filter((x) => x.id !== id), c] } : {};
      }),

    select: (ids, additive) =>
      set((s) => ({
        selection: additive ? [...new Set([...s.selection.filter((x) => !ids.includes(x)), ...ids.filter((x) => !s.selection.includes(x))])] : ids,
        selectedWireId: null,
      })),
    selectAll: () => set((s) => ({ selection: s.components.map((c) => c.id), selectedWireId: null })),
    clearSelection: () => set({ selection: [], selectedWireId: null }),
    selectWire: (id) => set({ selectedWireId: id, selection: [] }),

    addWire: (from, to) => {
      if (from.componentId === to.componentId && from.terminal === to.terminal) return;
      const s = get();
      const dup = s.wires.some(
        (w) =>
          (w.from.componentId === from.componentId && w.from.terminal === from.terminal && w.to.componentId === to.componentId && w.to.terminal === to.terminal) ||
          (w.to.componentId === from.componentId && w.to.terminal === from.terminal && w.from.componentId === to.componentId && w.from.terminal === to.terminal),
      );
      if (dup) return;
      checkpoint();
      const w: Wire = { id: uid("wire-"), from, to };
      const a = s.components.find((c) => c.id === from.componentId);
      const b = s.components.find((c) => c.id === to.componentId);
      set({
        wires: [...s.wires, w],
        components: s.components.map((c) => (c.id === from.componentId || c.id === to.componentId ? { ...c, connections: [...c.connections, w.id] } : c)),
      });
      addEvents([event("action", `Connected ${a?.name}:${from.terminal} → ${b?.name}:${to.terminal}`)]);
      get().recompute();
    },

    deleteWire: (id) => {
      checkpoint();
      set((s) => ({
        wires: s.wires.filter((w) => w.id !== id),
        components: s.components.map((c) => ({ ...c, connections: c.connections.filter((x) => x !== id) })),
        selectedWireId: null,
      }));
      addEvents([event("action", "Removed a wire")]);
      get().recompute();
    },

    undo: () => {
      const { past, components, wires, future } = get();
      const prev = past[past.length - 1];
      if (!prev) return;
      set({ past: past.slice(0, -1), future: [{ components, wires }, ...future], components: prev.components, wires: prev.wires, dirty: true });
      get().recompute();
    },
    redo: () => {
      const { past, components, wires, future } = get();
      const next = future[0];
      if (!next) return;
      set({ future: future.slice(1), past: [...past, { components, wires }], components: next.components, wires: next.wires, dirty: true });
      get().recompute();
    },
    commit: checkpoint,

    /* ---------------- chemistry ---------------- */
    addChemicalTo: (containerId, chemId, amount) => {
      const s = get();
      const c = s.components.find((x) => x.id === containerId);
      const chem = getChemical(chemId);
      if (!c || !chem || !c.state.mixture) return;
      const a = amount ?? defaultAmount(chemId);
      const capacity = Number(c.properties.capacity) || Infinity;
      if (c.state.mixture.volumeMl + (a.volumeMl ?? 0) > capacity * 1.05) {
        get().notify({ level: "caution", title: "Container overflow", message: `${c.name} can hold ${capacity} mL — reduce the amount or use a larger vessel.` });
        return;
      }
      checkpoint();
      const mixture = addChemical(c.state.mixture, chemId, a, s.env.ambientTemperature);
      const updated = s.components.map((x) => (x.id === containerId ? { ...x, state: { ...x.state, mixture } } : x));
      get().pushEffect({ type: "splash", componentId: containerId });
      const r = withReactions(updated, [containerId]);
      set({ components: r.components, chemicalsUsed: s.chemicalsUsed.includes(chemId) ? s.chemicalsUsed : [...s.chemicalsUsed, chemId] });
      addEvents([event("action", `Added ${describeAmount(chemId, a)} to ${c.name}`), ...r.events]);
      get().recompute();
    },

    dropChemical: (chemId, pos) => {
      const s = get();
      const world = buildWorld(s.components, s.wires, s.simTime, 0, s.env);
      const target = componentAt(world, pos, (c) => Boolean(getDefinition(c.type)?.roles.includes("container")));
      if (target) return get().addChemicalTo(target.id, chemId);
      const chem = getChemical(chemId);
      const type = chem?.form === "solid" ? "watch-glass" : "beaker";
      const id = get().addComponent(type, pos);
      if (id) get().addChemicalTo(id, chemId);
    },

    pour: (fromId, toId, volumeMl) => {
      const s = get();
      const from = s.components.find((c) => c.id === fromId);
      const to = s.components.find((c) => c.id === toId);
      if (!from?.state.mixture || !to?.state.mixture) return;
      const vol = volumeMl ?? from.state.mixture.volumeMl;
      if (vol <= 0) return get().notify({ level: "info", title: "Nothing to pour", message: `${from.name} is empty.` });
      const capacity = Number(to.properties.capacity) || Infinity;
      const space = Math.max(0, capacity - to.state.mixture.volumeMl);
      const amount = Math.min(vol, space);
      if (amount <= 0) return get().notify({ level: "caution", title: "Container full", message: `${to.name} has no room left.` });
      checkpoint();
      const desc = describeTransfer(from.state.mixture, amount);
      const t = transfer(from.state.mixture, to.state.mixture, amount);
      const updated = s.components.map((c) => (c.id === fromId ? { ...c, state: { ...c.state, mixture: t.from } } : c.id === toId ? { ...c, state: { ...c.state, mixture: t.to } } : c));
      get().pushEffect({ type: "pour", componentId: fromId, targetId: toId, color: mixtureAppearance(from.state.mixture).liquid });
      const r = withReactions(updated, [toId]);
      set({ components: r.components });
      addEvents([event("action", `Poured ${desc} from ${from.name} into ${to.name}`), ...r.events]);
      get().recompute();
    },

    emptyContainer: (id) => {
      const c = get().components.find((x) => x.id === id);
      if (!c?.state.mixture) return;
      checkpoint();
      set((s) => ({ components: s.components.map((x) => (x.id === id ? { ...x, state: { ...x.state, mixture: emptyMixture(s.env.ambientTemperature), delivered: 0 } } : x)) }));
      addEvents([event("action", `Emptied ${c.name}`)]);
      get().recompute();
    },

    setContainerTemperature: (id, t) => {
      const c = get().components.find((x) => x.id === id);
      if (!c?.state.mixture) return;
      checkpoint();
      set((s) => ({ components: s.components.map((x) => (x.id === id ? { ...x, state: { ...x.state, mixture: { ...x.state.mixture!, temperature: t } } } : x)) }));
      addEvents([event("action", `${c.name}: temperature set to ${t.toFixed(1)} °C`)]);
      get().recompute();
    },

    runComponentAction: (id, action) => {
      const s = get();
      if (action === "empty") return get().emptyContainer(id);
      const res = runAction(s.components, s.wires, id, action, s.simTime, s.env);
      if (!res) return;
      checkpoint();
      const touched = res.components.filter((c, i) => c !== s.components[i]).map((c) => c.id);
      const r = withReactions(res.components, touched);
      set({ components: r.components });
      for (const e of res.events) if (e.effect) get().pushEffect({ type: e.effect, componentId: id });
      addEvents([...res.events.map((e) => event(e.kind, e.message)), ...r.events]);
      get().recompute();
    },

    /* ---------------- simulation ---------------- */
    run: () => {
      const s = get();
      if (s.simStatus === "running") return;
      const fresh = s.simStatus === "idle";
      set({ simStatus: "running", runSnapshot: fresh ? { components: s.components, wires: s.wires } : s.runSnapshot, lastLogAt: fresh ? -Infinity : s.lastLogAt });
      addEvents([event("system", fresh ? (s.simTime > 0 ? "Experiment resumed" : "Experiment started") : "Experiment resumed")]);
    },
    pause: () => {
      if (get().simStatus !== "running") return;
      set({ simStatus: "paused" });
      addEvents([event("system", "Experiment paused")]);
    },
    reset: () => {
      const s = get();
      const snap = s.runSnapshot;
      set({
        simStatus: "idle",
        simTime: 0,
        lastLogAt: -Infinity,
        runSnapshot: null,
        components: snap ? snap.components : s.components.map((c) => ({ ...c, state: { ...initialStateFor(c), mixture: c.state.mixture } })),
        wires: snap ? snap.wires : s.wires,
        replayIndex: null,
      });
      addEvents([event("system", "Experiment reset to initial conditions", 0)]);
      get().recompute();
    },
    restart: () => {
      get().reset();
      get().run();
    },

    tick: (realDt) => {
      const s = get();
      if (s.simStatus !== "running" || s.replayIndex != null) return;
      const total = Math.min(realDt, 0.25) * s.speed;
      let components = s.components;
      let time = s.simTime;
      const evs: TimelineEvent[] = [];
      const steps = Math.max(1, Math.ceil(total / 0.05));
      const h = total / steps;
      for (let i = 0; i < steps; i++) {
        const r = stepSimulation(components, s.wires, time, h, s.env);
        components = r.components;
        time += h;
        for (const e of r.events) {
          evs.push(event(e.event.kind, e.event.message, time));
          if (e.event.effect) get().pushEffect({ type: e.event.effect, componentId: e.componentId });
        }
      }
      set({ components, simTime: time });
      addEvents(evs);
      get().recompute();
      // periodic frames so continuous motion can be replayed step by step
      const rec = get();
      const lastFrame = rec.recording[rec.recording.length - 1];
      if (rec.recStatus === "recording" && (!lastFrame || time - lastFrame.t >= 1)) rec.recordFrame(`State at ${time.toFixed(1)} s`, "measurement");
      // automatic data logging
      const st = get();
      if (st.autoLog && time - st.lastLogAt >= st.logInterval - 1e-9) {
        const types = new Map(st.components.map((c) => [c.id, c.type]));
        const loggable = loggableReadings(st.liveReadings, types);
        if (loggable.length) {
          const ids = columnIds(loggable);
          const values: Record<string, number> = {};
          const meta = { ...st.columnMeta };
          for (const r of loggable) {
            const id = ids.get(r)!;
            values[id] = Number(r.reading.value.toFixed(Math.min(6, (r.reading.precision ?? 3) + 1)));
            if (!meta[id]) meta[id] = { label: id.includes("@") ? `${r.reading.label} (${r.source})` : r.reading.label, unit: r.reading.unit };
          }
          // Charts without series pick up the first logged quantities automatically
          const charts = st.charts.some((c) => !c.y.length) ? st.charts.map((c) => (c.y.length ? c : { ...c, y: Object.keys(values).filter((k) => k !== c.x).slice(0, 2) })) : st.charts;
          set({ dataRows: [...st.dataRows, { id: uid("row-"), t: Number(time.toFixed(2)), values }].slice(-5000), lastLogAt: time, columnMeta: meta, charts });
        } else set({ lastLogAt: time });
      }
    },

    recompute: () => {
      const s = get();
      const comps = s.replayIndex != null ? (s.recording[s.replayIndex]?.components ?? s.components) : s.components;
      const world = buildWorld(comps, s.wires, s.simTime, 0.05, s.env);
      const readings = collectReadings(world);
      const safety = evaluateSafety(world);
      const prevKeys = new Set(s.safety.map((f) => f.key));
      const fresh = safety.filter((f) => !prevKeys.has(f.key) && LEVEL_RANK[f.level] >= LEVEL_RANK.caution && !f.key.startsWith("flame:") && !f.key.startsWith("laser:"));
      set({ liveReadings: readings, circuit: world.circuit, optics: world.optics, safety });
      if (fresh.length) {
        for (const f of fresh) get().notify({ level: f.level === "danger" ? "danger" : "caution", title: f.title, message: f.message });
        addEvents(fresh.map((f) => event("safety", `${f.level === "danger" ? "DANGER" : "Caution"}: ${f.message}`)));
      }
    },

    setSpeed: (speed) => set({ speed }),
    setLogInterval: (logInterval) => set({ logInterval: Math.max(0.05, logInterval) }),
    setAutoLog: (autoLog) => set({ autoLog }),
    setEnv: (e) => {
      set((s) => ({ env: { ...s.env, ...e } }));
      get().recompute();
    },

    /* ---------------- data ---------------- */
    log: (kind, message) => addEvents([event(kind, message)]),
    addObservation: (text) => {
      if (!text.trim()) return;
      addEvents([event("observation", text.trim())]);
      set({ dirty: true });
    },
    deleteTimelineEvent: (id) => set((s) => ({ timeline: s.timeline.filter((e) => e.id !== id), dirty: true })),

    captureMeasurements: () => {
      const s = get();
      const types = new Map(s.components.map((c) => [c.id, c.type]));
      const readings = s.liveReadings.filter((r) => {
        const def = getDefinition(types.get(r.componentId) ?? "");
        return def?.roles.includes("sensor") || def?.roles.includes("container") || def?.roles.includes("optical") || r.reading.log;
      });
      if (!readings.length) {
        get().notify({ level: "info", title: "No sensor readings", message: "Add a thermometer, pH meter, balance or meter to capture measurements." });
        return;
      }
      const now = Date.now();
      const ms: Measurement[] = readings.map((r) => ({ id: uid("m-"), name: r.reading.label, source: r.source, key: r.reading.key, value: r.reading.value, unit: r.reading.unit, t: s.simTime, timestamp: now }));
      const loggable = loggableReadings(readings, types);
      const ids = columnIds(loggable);
      const values: Record<string, number> = {};
      const meta = { ...s.columnMeta };
      for (const r of loggable) {
        const id = ids.get(r)!;
        values[id] = Number(r.reading.value.toFixed(Math.min(6, (r.reading.precision ?? 3) + 1)));
        if (!meta[id]) meta[id] = { label: id.includes("@") ? `${r.reading.label} (${r.source})` : r.reading.label, unit: r.reading.unit };
      }
      set({
        measurements: [...s.measurements, ...ms],
        dataRows: loggable.length ? [...s.dataRows, { id: uid("row-"), t: Number(s.simTime.toFixed(2)), values, observation: "Manual capture" }] : s.dataRows,
        columnMeta: meta,
        dirty: true,
      });
      addEvents([event("measurement", `Captured ${ms.length} readings: ${ms.slice(0, 4).map((m) => `${m.name} ${m.value.toFixed(2)} ${m.unit}`.trim()).join(", ")}${ms.length > 4 ? "…" : ""}`)]);
    },

    addDataRow: () => set((s) => ({ dataRows: [...s.dataRows, { id: uid("row-"), t: Number(s.simTime.toFixed(2)), values: {} }], dirty: true })),
    updateDataRow: (id, patch) => set((s) => ({ dataRows: s.dataRows.map((r) => (r.id === id ? { ...r, ...patch } : r)), dirty: true })),
    setDataValue: (rowId, col, value) =>
      set((s) => ({
        dataRows: s.dataRows.map((r) => (r.id !== rowId ? r : col === "t" ? { ...r, t: value ?? 0 } : { ...r, values: { ...r.values, [col]: value } })),
        dirty: true,
      })),
    deleteDataRow: (id) => set((s) => ({ dataRows: s.dataRows.filter((r) => r.id !== id), dirty: true })),
    clearData: () => set({ dataRows: [], measurements: [], columnMeta: {}, dirty: true }),
    addColumn: (label, unit) => {
      const id = label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") || uid("col-");
      set((s) => ({ columnMeta: { ...s.columnMeta, [id]: { label: label.trim() || id, unit } }, dirty: true }));
    },
    addChart: (c) => set((s) => ({ charts: [...s.charts, { id: uid("chart-"), title: c?.title ?? "New chart", kind: c?.kind ?? "line", x: c?.x ?? "t", y: c?.y ?? [] }], dirty: true })),
    updateChart: (id, patch) => set((s) => ({ charts: s.charts.map((c) => (c.id === id ? { ...c, ...patch } : c)), dirty: true })),
    deleteChart: (id) => set((s) => ({ charts: s.charts.filter((c) => c.id !== id), dirty: true })),
    updateNotebook: (patch) => set((s) => ({ notebook: { ...s.notebook, ...patch }, dirty: true })),
    updateReport: (patch) => set((s) => ({ report: { ...s.report, ...patch }, dirty: true })),

    /* ---------------- recording ---------------- */
    startRecording: () => {
      const s = get();
      if (s.recStatus === "recording") return;
      set({ recStatus: "recording", recording: s.recStatus === "idle" ? [] : s.recording });
      get().recordFrame(s.recStatus === "idle" ? "Recording started" : "Recording resumed", "system");
      get().notify({ level: "info", title: "Recording", message: "Every action, measurement and observation is now being captured." });
    },
    pauseRecording: () => {
      if (get().recStatus !== "recording") return;
      get().recordFrame("Recording paused", "system");
      set({ recStatus: "paused" });
    },
    stopRecording: () => {
      if (get().recStatus === "idle") return;
      get().recordFrame("Recording stopped", "system");
      set({ recStatus: "idle", bottomTab: "recording", bottomOpen: true, dirty: true });
      get().notify({ level: "success", title: "Recording saved", message: `${get().recording.length} steps captured — open the Recording tab to replay.` });
    },
    recordFrame: (label, kind) => {
      const s = get();
      if (s.recStatus === "idle" && label !== "Recording started") return;
      const frame: RecordedFrame = {
        id: uid("frame-"),
        t: s.simTime,
        label,
        kind,
        components: s.components,
        wires: s.wires,
        readings: s.liveReadings.slice(0, 40).map((r) => ({ source: r.source, reading: r.reading })),
      };
      set({ recording: [...s.recording, frame].slice(-400) });
    },
    setReplayIndex: (i) => {
      set({ replayIndex: i, selection: [] });
      if (i != null && get().simStatus === "running") set({ simStatus: "paused" });
      get().recompute();
    },
    clearRecording: () => set({ recording: [], replayIndex: null, recStatus: "idle", dirty: true }),

    /* ---------------- ui ---------------- */
    setViewport: (v) => set((s) => ({ viewport: { ...s.viewport, ...v } })),
    setSettings: (x) => set((s) => ({ settings: { ...s.settings, ...x } })),
    setTool: (tool) => set({ tool }),
    setBottomTab: (bottomTab) => set({ bottomTab, bottomOpen: true }),
    setBottomOpen: (bottomOpen) => set({ bottomOpen }),
    setBottomHeight: (h) => set({ bottomHeight: Math.max(140, Math.min(640, h)) }),
    setDropHighlight: (dropHighlight) => set({ dropHighlight }),
    setDropTarget: (dropTargetId) => {
      if (get().dropTargetId !== dropTargetId) set({ dropTargetId });
    },
    openChemPicker: (chemPickerFor) => set({ chemPickerFor }),
    requestFit: () => set((st) => ({ fitRequest: st.fitRequest + 1 })),
    notify: (n) =>
      set((s) => {
        const dup = s.notifications.find((x) => x.title === n.title && x.message === n.message && Date.now() - x.at < 5000);
        return dup ? {} : { notifications: [{ ...n, id: uid("n-"), at: Date.now(), read: false }, ...s.notifications].slice(0, 50) };
      }),
    markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
    clearNotifications: () => set({ notifications: [] }),
  };
});

export function componentsInRect(components: LabComponent[], rect: { x1: number; y1: number; x2: number; y2: number }): string[] {
  return components
    .filter((c) => {
      const b = boundsOf(c);
      return contains(rect, { x: b.x1, y: b.y1 }) && contains(rect, { x: b.x2, y: b.y2 });
    })
    .map((c) => c.id);
}

if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as { __vlab: typeof useLab }).__vlab = useLab;
}
