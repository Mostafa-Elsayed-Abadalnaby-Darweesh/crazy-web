/**
 * Core data model of the Virtual Lab simulation engine.
 *
 * Everything placed on the workspace is a `LabComponent` – a plain, JSON-serialisable object.
 * Behaviour (rendering, properties, sensors, simulation) lives in `ComponentDefinition`s that are
 * registered once in the component registry, so new equipment can be added without touching the
 * core engine, the canvas or the persistence layer.
 */

export type LabMode = "chemistry" | "physics";
export type PropValue = number | string | boolean;

export interface Vec2 {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Chemical contents of a container. Amounts are stored in moles so reactions stay stoichiometric. */
export interface Mixture {
  volumeMl: number;
  temperature: number; // °C
  species: Record<string, number>; // dissolved / liquid chemicals, moles
  solids: Record<string, number>; // undissolved solids & precipitates, moles
  gases: Record<string, number>; // cumulative gas evolved, moles
  indicators: string[];
  lastReaction?: ReactionInfo;
  reactions: ReactionInfo[];
}

export interface ReactionInfo {
  id: string;
  equation: string;
  type: string;
  products: string[];
  observations: string[];
  deltaT: number;
  extent: number; // mol
  at: number; // sim time (s)
  completed?: boolean;
  effect?: EffectType;
}

export interface ComponentState {
  mixture?: Mixture;
  [key: string]: unknown;
}

export interface LabComponent {
  id: string;
  type: string;
  category: LabMode;
  name: string;
  position: Vec2; // top-left in workspace units (1 unit = 1 mm)
  rotation: number; // degrees, around the component centre
  dimensions: Size;
  properties: Record<string, PropValue>;
  connections: string[]; // ids of wires attached to this component
  state: ComponentState;
  locked?: boolean;
  groupId?: string;
  hidden?: boolean;
}

export interface WireEnd {
  componentId: string;
  terminal: string;
}

export interface Wire {
  id: string;
  from: WireEnd;
  to: WireEnd;
  color?: string;
}

export interface Reading {
  key: string; // canonical quantity key, e.g. "temperature"
  label: string;
  value: number;
  unit: string;
  precision?: number;
  /** Include in automatic data logging even if the component is not a sensor. */
  log?: boolean;
}

export type TimelineKind = "system" | "action" | "reaction" | "measurement" | "observation" | "safety";

export interface TimelineEvent {
  id: string;
  t: number; // experiment clock, seconds
  kind: TimelineKind;
  message: string;
  wallTime: number; // epoch ms
}

export interface Measurement {
  id: string;
  name: string;
  source: string; // component name
  key: string;
  value: number;
  unit: string;
  t: number;
  timestamp: number;
}

export interface DataRow {
  id: string;
  t: number;
  values: Record<string, number | null>;
  observation?: string;
}

export interface DataColumn {
  id: string;
  label: string;
  unit: string;
}

export type ChartKind = "line" | "bar" | "scatter" | "area";

export interface ChartConfig {
  id: string;
  title: string;
  kind: ChartKind;
  x: string; // column id ("t" for time)
  y: string[];
}

export type SafetyLevel = "safe" | "caution" | "danger";

export interface SafetyAlert {
  id: string;
  level: SafetyLevel;
  title: string;
  message: string;
  ppe: string[];
  componentId?: string;
  at: number;
}

export interface NotebookSections {
  title: string;
  objective: string;
  theory: string;
  hypothesis: string;
  materials: string;
  equipment: string;
  procedure: string;
  observations: string;
  measurements: string;
  results: string;
  calculations: string;
  charts: string;
  discussion: string;
  conclusion: string;
  safety: string;
}

export interface ReportMeta {
  institution: string;
  logo?: string; // data URL
  reportTitle: string;
  studentName: string;
  studentId: string;
  course: string;
  instructor: string;
  date: string;
}

export interface RecordedFrame {
  id: string;
  t: number;
  label: string;
  kind: TimelineKind;
  components: LabComponent[];
  wires: Wire[];
  readings: { source: string; reading: Reading }[];
}

export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

export interface WorkspaceSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  showRulers: boolean;
  showLabels: boolean;
}

export type ExperimentStatus = "draft" | "completed";

/** The persisted experiment document (stored as structured JSON). */
export interface Experiment {
  id: string;
  title: string;
  category: LabMode;
  status: ExperimentStatus;
  templateId?: string;
  workspaceState: { viewport: Viewport; settings: WorkspaceSettings; simTime: number };
  components: LabComponent[];
  wires: Wire[];
  chemicals: string[];
  measurements: Measurement[];
  dataRows: DataRow[];
  timeline: TimelineEvent[];
  observations: string[];
  charts: ChartConfig[];
  notebook: NotebookSections;
  report: ReportMeta;
  recording: RecordedFrame[];
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/* Component definitions                                               */
/* ------------------------------------------------------------------ */

export type PropertyKind = "number" | "slider" | "select" | "toggle" | "text" | "color";

export interface PropertySchema {
  key: string;
  label: string;
  kind: PropertyKind;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
  group?: string;
  help?: string;
}

export interface TerminalDef {
  id: string;
  x: number; // 0..1 relative to width
  y: number; // 0..1 relative to height
  label?: string;
}

export type ComponentRole =
  | "container"
  | "heater"
  | "stirrer"
  | "support"
  | "sensor"
  | "dispenser"
  | "circuit"
  | "light-emitter"
  | "optical"
  | "mechanics"
  | "tool";

/** Electrical model used by the circuit solver. */
export type CircuitModel =
  | { kind: "source"; voltageKey: string; internalR?: number; acKey?: string; freqKey?: string; enabledKey?: string }
  | { kind: "resistor"; resistanceKey: string; fixed?: number; stateKey?: string }
  | { kind: "switch"; closedKey: string }
  | { kind: "wire" }
  | { kind: "ammeter" }
  | { kind: "voltmeter" }
  | { kind: "multimeter" }
  | { kind: "diode"; forwardVoltageKey?: string; forwardVoltage?: number }
  | { kind: "capacitor"; capacitanceKey: string }
  | { kind: "inductor"; inductanceKey: string };

export interface VisualSpec {
  archetype: string; // renderer key
  variant?: string;
  color?: string;
}

export interface WorldContext {
  components: LabComponent[];
  byId: Map<string, LabComponent>;
  wires: Wire[];
  time: number;
  dt: number;
  env: Environment;
  circuit: CircuitSolution;
  optics: OpticsSolution;
}

export interface Environment {
  gravity: number; // m/s²
  ambientTemperature: number; // °C
  pressure: number; // kPa
}

export interface ElementSolution {
  voltage: number; // V across terminals a→b
  current: number; // A flowing a→b
  power: number; // W
}

export interface CircuitSolution {
  elements: Record<string, ElementSolution>;
  nodeVoltages: Record<string, number>; // terminal key -> V
  closedLoops: number;
}

export interface RaySegment {
  from: Vec2;
  to: Vec2;
  color: string;
  intensity: number;
}

export interface OpticsSolution {
  rays: RaySegment[];
  readings: Record<string, Reading[]>; // componentId -> readings
  screenHits: Record<string, { y: number; color: string }[]>;
}

/** Transient audio-visual effects (flashes, pops, splashes…) triggered by the simulation. */
export type EffectType =
  | "pop"
  | "flash"
  | "ignite"
  | "precipitate"
  | "splash"
  | "spark"
  | "burnout"
  | "extinguish"
  | "relight"
  | "sizzle"
  | "smoke"
  | "click";

export interface SimEvent {
  kind: TimelineKind;
  message: string;
  alert?: Omit<SafetyAlert, "id" | "at">;
  effect?: EffectType;
}

export interface ComponentPatch {
  id: string;
  state?: Partial<ComponentState>;
  properties?: Record<string, PropValue>;
  position?: Vec2;
}

export interface SimulateResult {
  state?: Partial<ComponentState>;
  properties?: Record<string, PropValue>;
  position?: Vec2;
  events?: SimEvent[];
  /** Changes to other components (e.g. a burette dispensing into a flask). */
  patches?: ComponentPatch[];
}

export interface ComponentDefinition {
  type: string;
  label: string;
  category: LabMode;
  group: string; // library group
  /** Also list this component in another lab's library group. */
  alsoIn?: { category: LabMode; group: string }[];
  description: string;
  keywords?: string[];
  size: Size;
  visual: VisualSpec;
  roles: ComponentRole[];
  properties: PropertySchema[];
  defaults: Record<string, PropValue>;
  terminals?: TerminalDef[];
  circuit?: CircuitModel;
  /** Live readings exposed to the measurement system. */
  readings?: (c: LabComponent, world: WorldContext) => Reading[];
  /** Per-tick behaviour. Must be pure: return the changes instead of mutating. */
  simulate?: (c: LabComponent, world: WorldContext) => SimulateResult | void;
  /** Initial runtime state. */
  initialState?: (c: LabComponent) => ComponentState;
  /** Actions shown as buttons in the properties panel. */
  actions?: { id: string; label: string }[];
  onAction?: (action: string, c: LabComponent, world: WorldContext) => SimulateResult | void;
  /** Mass of the empty item in grams (used by balances). */
  emptyMass?: number;
}
