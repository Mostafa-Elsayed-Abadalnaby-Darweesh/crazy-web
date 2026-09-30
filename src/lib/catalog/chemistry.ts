import type { ComponentDefinition, LabComponent, Reading, WorldContext } from "@/lib/engine/types";
import { componentAt, localPoint } from "@/lib/engine/geometry";
import { computePH } from "@/lib/chemistry/mixture";
import {
  P,
  bool,
  containerReadings,
  containerSimulate,
  dispenseAction,
  isContainer,
  itemsOnPan,
  massOf,
  mixtureOf,
  num,
  probeTemperature,
  stopcockSimulate,
  str,
} from "./helpers";

const GROUP_GLASS = "Glassware";
const GROUP_TRANSFER = "Measuring & transfer";
const GROUP_SUPPORT = "Supports & tools";
const GROUP_HEAT = "Heating & mixing";
const GROUP_INSTR = "Instruments";

interface ContainerOpts {
  type: string;
  label: string;
  archetype: string;
  variant?: string;
  width: number;
  height: number;
  capacity: number;
  group?: string;
  description: string;
  emptyMass: number;
  keywords?: string[];
  extraProps?: ComponentDefinition["properties"];
  extraDefaults?: ComponentDefinition["defaults"];
}

function container(o: ContainerOpts): ComponentDefinition {
  return {
    type: o.type,
    label: o.label,
    category: "chemistry",
    group: o.group ?? GROUP_GLASS,
    description: o.description,
    keywords: o.keywords,
    size: { width: o.width, height: o.height },
    visual: { archetype: o.archetype, variant: o.variant },
    roles: ["container"],
    properties: [P.capacity(Math.max(o.capacity * 4, 100)), ...(o.extraProps ?? [])],
    defaults: { capacity: o.capacity, ...(o.extraDefaults ?? {}) },
    emptyMass: o.emptyMass,
    simulate: containerSimulate,
    readings: (c) => containerReadings(c),
    actions: [{ id: "empty", label: "Empty container" }],
  };
}

const stopcockProps = [P.toggle("open", "Stopcock open"), P.slider("flowRate", "Flow rate", 0.05, 5, 0.05, "mL/s")];

export const CHEMISTRY_DEFINITIONS: ComponentDefinition[] = [
  container({ type: "beaker", label: "Beaker", archetype: "beaker", width: 90, height: 110, capacity: 250, emptyMass: 105, description: "Cylindrical glass vessel with a spout for mixing and heating liquids." }),
  container({ type: "test-tube", label: "Test tube", archetype: "testtube", width: 26, height: 130, capacity: 20, emptyMass: 12, description: "Small tube for qualitative tests and small-scale reactions." }),
  container({ type: "flask", label: "Flask (Florence)", archetype: "flask", width: 100, height: 140, capacity: 250, emptyMass: 120, description: "Flat-bottomed flask with a spherical body and long neck." }),
  container({ type: "erlenmeyer-flask", label: "Erlenmeyer flask", archetype: "erlenmeyer", width: 100, height: 130, capacity: 250, emptyMass: 115, description: "Conical flask – ideal for titrations and swirling.", keywords: ["conical"] }),
  container({ type: "volumetric-flask", label: "Volumetric flask", archetype: "volumetric", width: 80, height: 160, capacity: 100, emptyMass: 70, description: "Precise flask with a single calibration mark for standard solutions." }),
  container({ type: "round-bottom-flask", label: "Round-bottom flask", archetype: "roundbottom", width: 100, height: 130, capacity: 250, emptyMass: 110, description: "Spherical flask for uniform heating, refluxing and distillation." }),
  container({ type: "graduated-cylinder", label: "Graduated cylinder", archetype: "cylinder", width: 40, height: 180, capacity: 100, emptyMass: 90, group: GROUP_TRANSFER, description: "Tall cylinder for measuring liquid volumes." }),
  {
    ...container({ type: "burette", label: "Burette", archetype: "burette", width: 24, height: 280, capacity: 50, emptyMass: 60, group: GROUP_TRANSFER, description: "Graduated tube with a stopcock for delivering precise volumes during titration.", extraProps: stopcockProps, extraDefaults: { open: false, flowRate: 0.5 } }),
    simulate: stopcockSimulate,
    readings: (c) => [...containerReadings(c), { key: "volumeDelivered", label: "Volume delivered", value: (c.state.delivered as number) ?? 0, unit: "mL", precision: 2, log: true }],
    actions: [{ id: "empty", label: "Empty burette" }, { id: "resetReading", label: "Zero reading" }],
    onAction: (a) => (a === "resetReading" ? { state: { delivered: 0, lastLoggedDelivered: 0 } } : undefined),
  },
  {
    ...container({ type: "pipette", label: "Pipette", archetype: "pipette", width: 16, height: 200, capacity: 25, emptyMass: 20, group: GROUP_TRANSFER, description: "Volumetric pipette that draws and dispenses a fixed volume." }),
    actions: [{ id: "draw", label: "Draw from container" }, { id: "dispense", label: "Dispense all" }, { id: "empty", label: "Empty" }],
    onAction: dispenseAction,
  },
  {
    ...container({ type: "dropper", label: "Dropper", archetype: "dropper", width: 18, height: 90, capacity: 3, emptyMass: 5, group: GROUP_TRANSFER, description: "Dispenses liquids drop-by-drop (≈0.05 mL per drop).", extraProps: [P.number("drops", "Drops per press", "", 1, 20, 1, "Controls")], extraDefaults: { drops: 1 } }),
    actions: [{ id: "draw", label: "Draw from container" }, { id: "drop", label: "Add drop(s)" }, { id: "empty", label: "Empty" }],
    onAction: dispenseAction,
  },
  {
    type: "funnel",
    label: "Funnel",
    category: "chemistry",
    group: GROUP_TRANSFER,
    description: "Guides liquids into narrow openings; anything poured passes to the vessel below.",
    size: { width: 70, height: 80 },
    visual: { archetype: "funnel" },
    roles: ["tool"],
    properties: [],
    defaults: {},
    emptyMass: 40,
  },
  {
    ...container({ type: "separatory-funnel", label: "Separatory funnel", archetype: "sepfunnel", width: 70, height: 190, capacity: 250, emptyMass: 150, group: GROUP_TRANSFER, description: "Pear-shaped funnel with a stopcock for separating immiscible liquids.", extraProps: stopcockProps, extraDefaults: { open: false, flowRate: 1 } }),
    simulate: stopcockSimulate,
  },
  container({ type: "petri-dish", label: "Petri dish", archetype: "dish", variant: "petri", width: 110, height: 28, capacity: 40, emptyMass: 30, description: "Shallow dish for cultures and small-scale observations." }),
  container({ type: "watch-glass", label: "Watch glass", archetype: "dish", variant: "watch", width: 90, height: 22, capacity: 10, emptyMass: 25, description: "Concave glass for evaporating small volumes or weighing solids." }),
  container({ type: "crucible", label: "Crucible", archetype: "crucible", width: 50, height: 50, capacity: 25, emptyMass: 35, group: GROUP_HEAT, description: "Ceramic cup for strongly heating solids." }),
  container({ type: "evaporating-dish", label: "Evaporating dish", archetype: "dish", variant: "evaporating", width: 100, height: 40, capacity: 100, emptyMass: 80, group: GROUP_HEAT, description: "Porcelain dish for evaporating solutions to crystallise salts." }),
  {
    type: "mortar-pestle",
    label: "Mortar & pestle",
    category: "chemistry",
    group: GROUP_SUPPORT,
    description: "Grinds solids into fine powders (increases surface area).",
    size: { width: 90, height: 70 },
    visual: { archetype: "mortar" },
    roles: ["container", "tool"],
    properties: [P.capacity(200)],
    defaults: { capacity: 50 },
    emptyMass: 350,
    simulate: containerSimulate,
    readings: (c) => containerReadings(c),
    actions: [{ id: "grind", label: "Grind contents" }],
    onAction: (a, c) => (a === "grind" ? { state: { ground: true }, events: [{ kind: "action", message: `${c.name}: contents ground to a fine powder` }] } : undefined),
  },
  { type: "test-tube-rack", label: "Test tube rack", category: "chemistry", group: GROUP_SUPPORT, description: "Holds test tubes upright.", size: { width: 180, height: 70 }, visual: { archetype: "rack" }, roles: ["support"], properties: [], defaults: {}, emptyMass: 200 },
  { type: "clamp", label: "Clamp", category: "chemistry", group: GROUP_SUPPORT, description: "Holds glassware on a retort stand.", size: { width: 90, height: 30 }, visual: { archetype: "clamp" }, roles: ["support"], properties: [], defaults: {}, emptyMass: 150 },
  { type: "retort-stand", label: "Retort stand", category: "chemistry", group: GROUP_SUPPORT, description: "Heavy base with a vertical rod for clamps and burettes.", size: { width: 120, height: 320 }, visual: { archetype: "stand" }, roles: ["support"], properties: [], defaults: {}, emptyMass: 1500 },
  { type: "tripod", label: "Tripod", category: "chemistry", group: GROUP_HEAT, description: "Three-legged stand placed over a Bunsen burner.", size: { width: 110, height: 110 }, visual: { archetype: "tripod" }, roles: ["support"], properties: [], defaults: {}, emptyMass: 400 },
  { type: "wire-gauze", label: "Wire gauze", category: "chemistry", group: GROUP_HEAT, description: "Spreads heat evenly under glassware.", size: { width: 110, height: 10 }, visual: { archetype: "gauze" }, roles: ["support"], properties: [], defaults: {}, emptyMass: 60 },
  { type: "spatula", label: "Spatula", category: "chemistry", group: GROUP_SUPPORT, description: "Transfers small amounts of solids.", size: { width: 110, height: 14 }, visual: { archetype: "spatula" }, roles: ["tool"], properties: [], defaults: {}, emptyMass: 15 },
  { type: "scoopula", label: "Scoopula", category: "chemistry", group: GROUP_SUPPORT, description: "Curved spatula for scooping solids.", size: { width: 110, height: 16 }, visual: { archetype: "spatula", variant: "scoop" }, roles: ["tool"], properties: [], defaults: {}, emptyMass: 18 },

  /* ---------------- Instruments ---------------- */
  {
    type: "thermometer",
    label: "Thermometer",
    category: "chemistry",
    group: GROUP_INSTR,
    alsoIn: [{ category: "physics", group: "Thermodynamics" }],
    description: "Place the bulb inside a liquid to measure its temperature.",
    size: { width: 14, height: 170 },
    visual: { archetype: "thermometer" },
    roles: ["sensor"],
    properties: [P.select("unit", "Display unit", [["C", "°C"], ["K", "K"], ["F", "°F"]], "Display")],
    defaults: { unit: "C" },
    emptyMass: 20,
    readings: (c, w) => {
      const t = probeTemperature(c, w);
      const unit = str(c, "unit", "C");
      if (unit === "K") return [{ key: "temperature", label: "Temperature", value: t + 273.15, unit: "K", precision: 1 }];
      if (unit === "F") return [{ key: "temperature", label: "Temperature", value: (t * 9) / 5 + 32, unit: "°F", precision: 1 }];
      return [{ key: "temperature", label: "Temperature", value: t, unit: "°C", precision: 1 }];
    },
  },
  {
    type: "ph-meter",
    label: "pH meter",
    category: "chemistry",
    group: GROUP_INSTR,
    description: "Digital pH meter — dip the electrode tip into a solution.",
    size: { width: 90, height: 150 },
    visual: { archetype: "phmeter" },
    roles: ["sensor"],
    properties: [P.select("resolution", "Resolution", [["1", "0.1"], ["2", "0.01"]], "Display")],
    defaults: { resolution: "2" },
    emptyMass: 300,
    readings: (c: LabComponent, w: WorldContext): Reading[] => {
      const tip = localPoint(c, 0.12, 0.98);
      const target = componentAt(w, tip, isContainer, c.id);
      if (!target) return [];
      const ph = computePH(mixtureOf(target));
      if (ph == null) return [];
      return [{ key: "ph", label: "pH", value: ph, unit: "", precision: Number(str(c, "resolution", "2")) }];
    },
  },
  ...(["analytical-balance", "digital-balance"] as const).map<ComponentDefinition>((type) => ({
    type,
    label: type === "analytical-balance" ? "Analytical balance" : "Digital balance",
    category: "chemistry",
    group: GROUP_INSTR,
    description: type === "analytical-balance" ? "High-precision balance (±0.0001 g, max 220 g)." : "Top-pan balance (±0.01 g, max 2000 g).",
    size: { width: type === "analytical-balance" ? 150 : 140, height: type === "analytical-balance" ? 110 : 60 },
    visual: { archetype: "balance", variant: type === "analytical-balance" ? "analytical" : "digital" },
    roles: ["sensor"],
    properties: [P.number("capacity", "Max load", "g", 1, 10000, 1, "Specification")],
    defaults: { capacity: type === "analytical-balance" ? 220 : 2000 },
    emptyMass: 0,
    actions: [{ id: "tare", label: "Tare (zero)" }],
    onAction: (a, c, w) => {
      if (a !== "tare") return;
      const load = itemsOnPan(c, w).reduce((s, o) => s + massOf(o), 0);
      return { state: { tare: load }, events: [{ kind: "action", message: `${c.name} tared at ${load.toFixed(2)} g` }] };
    },
    readings: (c, w) => {
      const load = itemsOnPan(c, w).reduce((s, o) => s + massOf(o), 0);
      const value = Math.min(load, num(c, "capacity", 2000)) - ((c.state.tare as number) ?? 0);
      return [{ key: "mass", label: "Mass", value, unit: "g", precision: type === "analytical-balance" ? 4 : 2 }];
    },
  })),

  /* ---------------- Heating & mixing ---------------- */
  {
    type: "hot-plate",
    label: "Hot plate",
    category: "chemistry",
    group: GROUP_HEAT,
    alsoIn: [{ category: "physics", group: "Thermodynamics" }],
    description: "Electric hot plate with temperature control and optional magnetic stirring.",
    size: { width: 130, height: 50 },
    visual: { archetype: "hotplate" },
    roles: ["heater", "stirrer"],
    properties: [P.toggle("heat", "Heating"), P.slider("setTemperature", "Set temperature", 25, 350, 1, "°C"), P.toggle("stir", "Magnetic stirring"), P.slider("stirSpeed", "Stir speed", 0, 1500, 50, "rpm")],
    defaults: { heat: false, setTemperature: 80, stir: false, stirSpeed: 600 },
    emptyMass: 2500,
  },
  {
    type: "magnetic-stirrer",
    label: "Magnetic stirrer",
    category: "chemistry",
    group: GROUP_HEAT,
    description: "Rotating magnet that stirs solutions to speed up mixing and reactions.",
    size: { width: 120, height: 40 },
    visual: { archetype: "stirrer" },
    roles: ["stirrer"],
    properties: [P.toggle("on", "Stirring"), P.slider("speed", "Speed", 0, 1500, 50, "rpm")],
    defaults: { on: false, speed: 600 },
    emptyMass: 1500,
  },
  {
    type: "bunsen-burner",
    label: "Bunsen burner",
    category: "chemistry",
    group: GROUP_HEAT,
    description: "Gas burner — place a tripod and gauze above it to heat glassware.",
    size: { width: 50, height: 120 },
    visual: { archetype: "burner" },
    roles: ["heater"],
    properties: [P.toggle("lit", "Lit"), P.select("flame", "Flame size", [["low", "Low"], ["medium", "Medium"], ["high", "High"]], "Controls"), P.toggle("airHole", "Air hole open (blue flame)")],
    defaults: { lit: false, flame: "medium", airHole: true },
    emptyMass: 400,
  },
  {
    type: "water-bath",
    label: "Water bath",
    category: "chemistry",
    group: GROUP_HEAT,
    description: "Thermostatic bath — vessels placed inside approach the set temperature.",
    size: { width: 220, height: 110 },
    visual: { archetype: "waterbath" },
    roles: ["heater"],
    properties: [P.toggle("on", "Power"), P.slider("setTemperature", "Set temperature", 20, 100, 1, "°C")],
    defaults: { on: false, setTemperature: 60 },
    emptyMass: 3000,
    initialState: () => ({ temperature: 25 }),
    simulate: (c, w) => {
      const T = (c.state.temperature as number) ?? w.env.ambientTemperature;
      const target = bool(c, "on") ? num(c, "setTemperature", 60) : w.env.ambientTemperature;
      return { state: { temperature: T + (target - T) * Math.min(1, 0.02 * w.dt) } };
    },
    readings: (c) => [{ key: "bathTemperature", label: "Bath temperature", value: (c.state.temperature as number) ?? 25, unit: "°C", precision: 1 }],
  },
  {
    type: "centrifuge",
    label: "Centrifuge",
    category: "chemistry",
    group: GROUP_HEAT,
    description: "Spins test tubes to separate precipitates from solution.",
    size: { width: 130, height: 90 },
    visual: { archetype: "centrifuge" },
    roles: ["tool"],
    properties: [P.slider("speed", "Speed", 500, 6000, 100, "rpm"), P.number("duration", "Spin time", "s", 5, 600, 5, "Controls")],
    defaults: { speed: 3000, duration: 30 },
    emptyMass: 5000,
    actions: [{ id: "spin", label: "Start spin" }],
    onAction: (a, c) => (a === "spin" ? { state: { spinRemaining: num(c, "duration", 30) }, events: [{ kind: "action", message: `${c.name}: spinning at ${num(c, "speed", 3000)} rpm` }] } : undefined),
    simulate: (c, w) => {
      const rem = (c.state.spinRemaining as number) ?? 0;
      if (rem <= 0) return;
      const next = Math.max(0, rem - w.dt);
      return {
        state: { spinRemaining: next, angle: (((c.state.angle as number) ?? 0) + num(c, "speed", 3000) * 6 * w.dt) % 360 },
        events: next === 0 ? [{ kind: "observation", message: `${c.name}: spin complete — solids compacted into a pellet` }] : [],
      };
    },
  },

  /* ---------------- Electrochemistry ---------------- */
  {
    type: "electrolysis-cell",
    label: "Electrolysis cell",
    category: "chemistry",
    group: "Electrochemistry",
    description: "Beaker with two graphite electrodes. Connect to a power supply; gases collect at each electrode (Faraday's laws).",
    size: { width: 130, height: 150 },
    visual: { archetype: "electrolysis" },
    roles: ["container", "circuit"],
    terminals: [
      { id: "anode", x: 0.3, y: 0, label: "+ anode" },
      { id: "cathode", x: 0.7, y: 0, label: "− cathode" },
    ],
    circuit: { kind: "resistor", resistanceKey: "resistance", stateKey: "resistance" },
    properties: [P.capacity(1000)],
    defaults: { capacity: 250 },
    emptyMass: 180,
    simulate: (c, w) => {
      const base = containerSimulate(c, w);
      const mix = (base.state?.mixture as ReturnType<typeof mixtureOf>) ?? mixtureOf(c);
      const ions = Object.values(mix.species).reduce((a, b) => a + b, 0) / Math.max(mix.volumeMl / 1000, 1e-6);
      const resistance = mix.volumeMl > 1 ? 4 + 40 / (ions + 0.02) : 1e7;
      const I = Math.abs(w.circuit.elements[c.id]?.current ?? 0);
      const molE = (I * w.dt) / 96485;
      const has = (id: string) => (mix.species[id] ?? 0) > 1e-6;
      let cathode = "H₂";
      let anode = "O₂";
      if (has("cuso4")) cathode = "Cu";
      if (has("nacl") || has("hcl") || has("kcl")) anode = "Cl₂";
      const cg = ((c.state.cathodeGas as number) ?? 0) + (cathode === "Cu" ? 0 : (molE / 2) * 24000);
      const ag = ((c.state.anodeGas as number) ?? 0) + (anode === "O₂" ? (molE / 4) * 24000 : (molE / 2) * 24000);
      const deposit = ((c.state.copperDeposited as number) ?? 0) + (cathode === "Cu" ? (molE / 2) * 63.55 : 0);
      const events = [...(base.events ?? [])];
      if (I > 0.005 && !c.state.electrolysing) events.push({ kind: "observation", message: `${c.name}: electrolysis started — ${cathode} at cathode, ${anode} at anode` });
      return {
        ...base,
        state: { ...base.state, resistance, cathodeGas: cg, anodeGas: ag, copperDeposited: deposit, cathodeProduct: cathode, anodeProduct: anode, electrolysing: I > 0.005, current: I },
        events,
      };
    },
    readings: (c) => [
      ...containerReadings(c),
      { key: "current", label: "Cell current", value: (c.state.current as number) ?? 0, unit: "A", precision: 3 },
      { key: "cathodeGas", label: `Gas at cathode`, value: (c.state.cathodeGas as number) ?? 0, unit: "mL", precision: 2, log: true },
      { key: "anodeGas", label: `Gas at anode`, value: (c.state.anodeGas as number) ?? 0, unit: "mL", precision: 2, log: true },
      { key: "copperDeposited", label: "Copper deposited", value: (c.state.copperDeposited as number) ?? 0, unit: "g", precision: 4, log: true },
    ],
  },
];

