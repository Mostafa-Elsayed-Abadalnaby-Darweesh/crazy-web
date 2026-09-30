"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragMoveEvent, type DragStartEvent } from "@dnd-kit/core";
import { FileText, Pause, Play, RotateCcw, Save, Check, Pencil, Info } from "lucide-react";
import { useLab } from "@/store/labStore";
import { useSettings } from "@/store/settingsStore";
import { canvasApi } from "@/lib/canvasRegistry";
import { getDefinition } from "@/lib/engine/registry";
import { buildWorld } from "@/lib/engine/simulation";
import { componentAt } from "@/lib/engine/geometry";
import { prettyFormula } from "@/lib/chemistry/chemicals";
import { AppHeader } from "@/components/layout/AppHeader";
import { MadeBy } from "@/components/layout/Footer";
import { Toasts } from "@/components/ui/Toasts";
import { Library, type DragData } from "./Library";
import { PropertiesPanel } from "./PropertiesPanel";
import { Toolbar } from "./Toolbar";
import { BottomPanel } from "./bottom/BottomPanel";
import { LabIcon } from "./LabIcon";

const LabCanvas = dynamic(() => import("./canvas/LabCanvas"), { ssr: false, loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-400">Loading workbench…</div> });

function useKeyboardShortcuts() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName) || t.isContentEditable) return;
      const s = useLab.getState();
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "s") {
        e.preventDefault();
        if (s.save()) router.replace(`/lab/${s.experimentId}`);
      } else if (mod && k === "z" && !e.shiftKey) {
        e.preventDefault();
        s.undo();
      } else if ((mod && k === "y") || (mod && e.shiftKey && k === "z")) {
        e.preventDefault();
        s.redo();
      } else if (mod && k === "c") s.copySelection();
      else if (mod && k === "v") s.paste();
      else if (mod && k === "d") {
        e.preventDefault();
        s.duplicateSelection();
      } else if (mod && k === "a") {
        e.preventDefault();
        s.selectAll();
      } else if (mod && k === "g") {
        e.preventDefault();
        if (e.shiftKey) s.ungroupSelection();
        else s.groupSelection();
      } else if (mod && k === "l") {
        e.preventDefault();
        s.toggleLockSelection();
      } else if (k === "delete" || k === "backspace") {
        e.preventDefault();
        s.deleteSelection();
      } else if (k === "escape") {
        s.clearSelection();
        s.setTool("select");
      } else if (!mod && k === "r") s.rotateSelection(e.shiftKey ? -15 : 90);
      else if (!mod && k === "v") s.setTool("select");
      else if (!mod && k === "w") s.setTool("wire");
      else if (!mod && k === "h") s.setTool("pan");
      else if (!mod && k === "f") canvasApi()?.fit();
      else if (!mod && k === "0") s.setViewport({ scale: 1 });
      else if (!mod && (k === "+" || k === "=")) s.setViewport({ scale: Math.min(4, s.viewport.scale * 1.2) });
      else if (!mod && k === "-") s.setViewport({ scale: Math.max(0.15, s.viewport.scale / 1.2) });
      else if (k.startsWith("arrow") && s.selection.length) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const dx = k === "arrowleft" ? -d : k === "arrowright" ? d : 0;
        const dy = k === "arrowup" ? -d : k === "arrowdown" ? d : 0;
        s.moveComponents(s.components.filter((c) => s.selection.includes(c.id) && !c.locked).map((c) => ({ id: c.id, position: { x: c.position.x + dx, y: c.position.y + dy } })));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}

function useSimulationLoop() {
  const status = useLab((s) => s.simStatus);
  useEffect(() => {
    if (status !== "running") return;
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const loop = (now: number) => {
      acc += (now - last) / 1000;
      last = now;
      if (acc >= 0.05) {
        useLab.getState().tick(acc);
        acc = 0;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);
}

function useAutosave() {
  const autosave = useSettings((s) => s.preferences.autosave);
  useEffect(() => {
    if (!autosave) return;
    const id = setInterval(() => {
      const s = useLab.getState();
      if (s.dirty && s.components.length && s.lastSavedAt) s.save({ silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, [autosave]);
}

function pointerOf(e: DragMoveEvent | DragEndEvent) {
  const ev = e.activatorEvent as PointerEvent;
  return { x: ev.clientX + e.delta.x, y: ev.clientY + e.delta.y };
}

function Title() {
  const title = useLab((s) => s.title);
  const setTitle = useLab((s) => s.setTitle);
  const dirty = useLab((s) => s.dirty);
  const lastSavedAt = useLab((s) => s.lastSavedAt);
  const [edit, setEdit] = useState(false);
  return (
    <div className="flex min-w-0 items-center gap-2">
      {edit ? (
        <input autoFocus className="input h-7 w-64 text-[13px] font-semibold" defaultValue={title} onBlur={(e) => { setTitle(e.target.value.trim() || title); setEdit(false); }} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
      ) : (
        <button className="group flex min-w-0 items-center gap-1.5 rounded px-1.5 py-0.5 hover:bg-slate-100" onClick={() => setEdit(true)}>
          <span className="max-w-[220px] truncate text-[13px] font-semibold text-ink">{title}</span>
          <Pencil size={11} className="text-slate-400 opacity-0 group-hover:opacity-100" />
        </button>
      )}
      <span className="whitespace-nowrap text-[11px] text-slate-400">{dirty ? "Unsaved changes" : lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span>
    </div>
  );
}

export function Workspace() {
  const s = useLab();
  const router = useRouter();
  const [drag, setDrag] = useState<DragData | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const worldCache = useRef<ReturnType<typeof buildWorld> | null>(null);
  useKeyboardShortcuts();
  useSimulationLoop();
  useAutosave();

  const onDragStart = (e: DragStartEvent) => {
    setDrag(e.active.data.current as DragData);
    s.setDropHighlight(true);
    const st = useLab.getState();
    worldCache.current = buildWorld(st.components, st.wires, st.simTime, 0, st.env);
  };
  const onDragMove = (e: DragMoveEvent) => {
    const data = e.active.data.current as DragData;
    const p = pointerOf(e);
    const api = canvasApi();
    const inside = api?.isInside(p.x, p.y) ?? false;
    s.setDropHighlight(inside);
    if (data?.kind === "chemical" && inside && worldCache.current) {
      const w = api!.toWorld(p.x, p.y)!;
      const target = componentAt(worldCache.current, w, (c) => Boolean(getDefinition(c.type)?.roles.includes("container")));
      s.setDropTarget(target?.id ?? null);
    } else s.setDropTarget(null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    const data = e.active.data.current as DragData;
    s.setDropHighlight(false);
    s.setDropTarget(null);
    setDrag(null);
    const p = pointerOf(e);
    const api = canvasApi();
    if (!data || !api?.isInside(p.x, p.y)) return;
    const w = api.toWorld(p.x, p.y);
    if (!w) return;
    if (data.kind === "equipment") s.addComponent(data.type, w);
    else s.dropChemical(data.id, w);
  };

  const save = () => {
    if (s.save()) router.replace(`/lab/${s.experimentId}`);
  };

  const actions = (
    <div className="flex items-center gap-1.5">
      <button className="btn h-8" onClick={save} title="Save (Ctrl+S)">
        {s.dirty ? <Save size={14} /> : <Check size={14} className="text-emerald-600" />} Save
      </button>
      {s.simStatus === "running" ? (
        <button className="btn h-8 border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" onClick={s.pause}>
          <Pause size={14} /> Pause
        </button>
      ) : (
        <button className="btn btn-primary h-8" onClick={s.run}>
          <Play size={14} /> {s.simStatus === "paused" ? "Resume" : "Run Experiment"}
        </button>
      )}
      <button className="btn h-8" onClick={s.reset} disabled={s.simStatus === "idle" && s.simTime === 0} title="Reset to initial conditions">
        <RotateCcw size={14} /> Reset
      </button>
      <button
        className="btn btn-secondary h-8"
        onClick={() => {
          if (s.save({ silent: true })) router.push(`/reports/${s.experimentId}`);
        }}
      >
        <FileText size={14} /> Export Report
      </button>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <AppHeader actions={actions} searchProps={{ onPickEquipment: (t) => { const c = canvasApi()?.center(); if (c) s.addComponent(t, c); }, onPickChemical: (id) => { const c = canvasApi()?.center(); if (c) s.dropChemical(id, c); } }} />
      <div className="flex h-9 shrink-0 items-center gap-3 border-b border-slate-200 bg-slate-50 px-3">
        <Title />
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-amber-700">
          <Info size={12} /> Educational simulation — virtual experiments only. Never attempt hazardous procedures in real life.
        </div>
      </div>
      <Toolbar />
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={() => { setDrag(null); s.setDropHighlight(false); s.setDropTarget(null); }}>
        <div className="flex min-h-0 flex-1">
          <Library mode={s.mode} />
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="relative min-h-0 flex-1">
              <LabCanvas />
            </div>
            <BottomPanel />
          </div>
          <PropertiesPanel />
        </div>
        <DragOverlay dropAnimation={null}>
          {drag && (
            <div className="pointer-events-none flex items-center gap-2 rounded-lg border border-primary/40 bg-white/95 px-3 py-2 shadow-float">
              {drag.kind === "equipment" ? (
                <LabIcon archetype={drag.archetype} variant={drag.variant} size={34} className="text-primary" />
              ) : (
                <span className="rounded bg-primary-50 px-1.5 py-1 font-mono text-xs font-semibold text-primary">{prettyFormula(drag.formula)}</span>
              )}
              <div>
                <div className="text-[12px] font-semibold text-ink">{drag.label}</div>
                <div className="text-[10px] text-slate-500">{drag.kind === "equipment" ? "Drop on the workbench" : "Drop onto a vessel"}</div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
      <footer className="flex h-6 shrink-0 items-center justify-between border-t border-slate-200 bg-white px-3 text-[10.5px] text-slate-500">
        <span>
          {s.components.length} objects · {s.wires.length} wires · {s.mode === "chemistry" ? "Chemistry" : "Physics"} Lab · <Link className="hover:text-primary" href="/help#shortcuts">Keyboard shortcuts</Link>
        </span>
        <MadeBy />
      </footer>
      <Toasts />
    </div>
  );
}
