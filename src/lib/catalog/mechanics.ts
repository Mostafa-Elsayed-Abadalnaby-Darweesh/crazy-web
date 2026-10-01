import type { ComponentDefinition, LabComponent, Reading, WorldContext } from "@/lib/engine/types";
import { boundsOf, center, localPoint, overlaps } from "@/lib/engine/geometry";
import { P, bool, num } from "./helpers";

const G = "Mechanics";
export const PX_PER_M = 100; // on-screen scale for moving objects

const gravityProp = P.number("gravity", "Gravity", "m/s²", 0, 30, 0.01, "Environment");
const g = (c: LabComponent, w: WorldContext) => (typeof c.properties.gravity === "number" ? (c.properties.gravity as number) : w.env.gravity);
const st = (c: LabComponent, key: string, fallback = 0) => (typeof c.state[key] === "number" ? (c.state[key] as number) : fallback);

function hangingMass(c: LabComponent, w: WorldContext): number {
  // slotted masses placed at the bottom (hook) of a spring add to its load
  const hook = localPoint(c, 0.5, 1);
  let m = 0;
  for (const o of w.byId.values()) {
    if (o.type !== "mass" || o.id === c.id) continue;
    const b = boundsOf(o);
    if (hook.x > b.x1 - 10 && hook.x < b.x2 + 10 && hook.y > b.y1 - 60 && hook.y < b.y2) m += num(o, "mass", 0.1);
  }
  return m;
}

export function springLoad(c: LabComponent, w: WorldContext) {
  return num(c, "load", 0) + hangingMass(c, w);
}

export const MECHANICS_DEFINITIONS: ComponentDefinition[] = [
  {
    type: "block",
    label: "Block",
    category: "physics",
    group: G,
    description: "Rigid block on the bench. Apply a force to accelerate it (F = ma).",
    size: { width: 70, height: 50 },
    visual: { archetype: "block" },
    roles: ["mechanics", "sensor"],
    properties: [
      P.number("mass", "Mass", "kg", 0.01, 100, 0.1),
      P.number("appliedForce", "Applied force", "N", -500, 500, 0.5),
      P.slider("friction", "Friction coefficient μ", 0, 1, 0.01, "", "Parameters"),
      P.number("initialVelocity", "Initial velocity", "m/s", -20, 20, 0.1),
      gravityProp,
    ],
    defaults: { mass: 1, appliedForce: 5, friction: 0.1, initialVelocity: 0, gravity: 9.81 },
    initialState: (c) => ({ v: num(c, "initialVelocity", 0), x: 0, a: 0 }),
    simulate: (c, w) => {
      const m = Math.max(num(c, "mass", 1), 1e-3);
      const F = num(c, "appliedForce", 0);
      const mu = num(c, "friction", 0);
      let v = st(c, "v", num(c, "initialVelocity", 0));
      const fmax = mu * m * g(c, w);
      let a: number;
      if (Math.abs(v) < 1e-4 && Math.abs(F) <= fmax) a = 0;
      else a = (F - Math.sign(v || F) * fmax) / m;
      let vNew = v + a * w.dt;
      if (v !== 0 && Math.sign(vNew) !== Math.sign(v) && Math.abs(F) <= fmax) vNew = 0;
      v = vNew;
      const dx = v * w.dt;
      return {
        state: { v, a, x: st(c, "x") + dx },
        position: { x: c.position.x + dx * PX_PER_M, y: c.position.y },
      };
    },
    readings: (c) => [
      { key: "displacement", label: "Displacement", value: st(c, "x"), unit: "m", precision: 3 },
      { key: "velocity", label: "Velocity", value: st(c, "v"), unit: "m/s", precision: 3 },
      { key: "acceleration", label: "Acceleration", value: st(c, "a"), unit: "m/s²", precision: 3 },
      { key: "force", label: "Net force", value: st(c, "a") * num(c, "mass", 1), unit: "N", precision: 2 },
    ],
  },
  {
    type: "inclined-plane",
    label: "Inclined plane",
    category: "physics",
    group: G,
    description: "Ramp with a block sliding under gravity: a = g(sin θ − μ cos θ).",
    size: { width: 260, height: 150 },
    visual: { archetype: "incline" },
    roles: ["mechanics", "sensor"],
    properties: [
      P.slider("angle", "Angle θ", 0, 80, 1, "°", "Parameters"),
      P.slider("friction", "Friction coefficient μ", 0, 1, 0.01, "", "Parameters"),
      P.number("mass", "Block mass", "kg", 0.01, 100, 0.1),
      P.number("length", "Ramp length", "m", 0.2, 5, 0.1),
      gravityProp,
    ],
    defaults: { angle: 30, friction: 0.2, mass: 1, length: 1.5, gravity: 9.81 },
    initialState: () => ({ s: 0, v: 0, t: 0 }),
    simulate: (c, w) => {
      const th = (num(c, "angle", 30) * Math.PI) / 180;
      const mu = num(c, "friction", 0);
      const L = num(c, "length", 1.5);
      let s = st(c, "s");
      let v = st(c, "v");
      if (s >= L) return;
      const a = Math.max(0, g(c, w) * (Math.sin(th) - mu * Math.cos(th)));
      v += a * w.dt;
      s = Math.min(L, s + v * w.dt);
      const t = st(c, "t") + w.dt;
      return {
        state: { s, v, a, t },
        events: s >= L ? [{ kind: "measurement", message: `${c.name}: block reached the bottom after ${t.toFixed(2)} s at ${v.toFixed(2)} m/s` }] : a === 0 && st(c, "t") === 0 ? [{ kind: "observation", message: `${c.name}: friction holds the block stationary` }] : [],
      };
    },
    readings: (c, w) => {
      const th = (num(c, "angle", 30) * Math.PI) / 180;
      const m = num(c, "mass", 1);
      return [
        { key: "distance", label: "Distance along ramp", value: st(c, "s"), unit: "m", precision: 3 },
        { key: "velocity", label: "Velocity", value: st(c, "v"), unit: "m/s", precision: 3 },
        { key: "acceleration", label: "Acceleration", value: st(c, "a", Math.max(0, g(c, w) * (Math.sin(th) - num(c, "friction", 0) * Math.cos(th)))), unit: "m/s²", precision: 3 },
        { key: "normalForce", label: "Normal force", value: m * g(c, w) * Math.cos(th), unit: "N", precision: 2 },
      ];
    },
  },
  {
    type: "pulley",
    label: "Pulley (Atwood machine)",
    category: "physics",
    group: G,
    description: "Two masses connected over a pulley: a = (m₁ − m₂)g / (m₁ + m₂).",
    size: { width: 140, height: 240 },
    visual: { archetype: "pulley" },
    roles: ["mechanics", "sensor"],
    properties: [P.number("mass1", "Mass m₁ (left)", "kg", 0.01, 50, 0.05), P.number("mass2", "Mass m₂ (right)", "kg", 0.01, 50, 0.05), gravityProp],
    defaults: { mass1: 0.6, mass2: 0.4, gravity: 9.81 },
    initialState: () => ({ y: 0, v: 0 }),
    simulate: (c, w) => {
      const m1 = num(c, "mass1", 0.6);
      const m2 = num(c, "mass2", 0.4);
      const a = ((m1 - m2) * g(c, w)) / (m1 + m2);
      let y = st(c, "y");
      let v = st(c, "v");
      if (Math.abs(y) >= 0.8) return;
      v += a * w.dt;
      y = Math.max(-0.8, Math.min(0.8, y + v * w.dt));
      return { state: { y, v, a }, events: Math.abs(y) >= 0.8 ? [{ kind: "observation", message: `${c.name}: heavier mass reached the floor` }] : [] };
    },
    readings: (c, w) => {
      const m1 = num(c, "mass1", 0.6);
      const m2 = num(c, "mass2", 0.4);
      return [
        { key: "acceleration", label: "Acceleration", value: ((m1 - m2) * g(c, w)) / (m1 + m2), unit: "m/s²", precision: 3 },
        { key: "tension", label: "Tension", value: (2 * m1 * m2 * g(c, w)) / (m1 + m2), unit: "N", precision: 3 },
        { key: "velocity", label: "Velocity", value: st(c, "v"), unit: "m/s", precision: 3 },
        { key: "distance", label: "Displacement", value: st(c, "y"), unit: "m", precision: 3 },
      ];
    },
  },
  {
    type: "spring",
    label: "Spring",
    category: "physics",
    group: G,
    description: "Helical spring obeying Hooke's law (F = kx). Hang slotted masses on the hook.",
    size: { width: 50, height: 200 },
    visual: { archetype: "spring" },
    roles: ["mechanics", "sensor"],
    properties: [P.number("springConstant", "Spring constant k", "N/m", 1, 5000, 1), P.number("load", "Attached load", "kg", 0, 20, 0.05), P.slider("damping", "Damping", 0, 5, 0.1, "", "Parameters"), gravityProp],
    defaults: { springConstant: 50, load: 0.1, damping: 1.2, gravity: 9.81 },
    initialState: () => ({ x: 0, v: 0 }),
    simulate: (c, w) => {
      const k = Math.max(num(c, "springConstant", 50), 0.1);
      const m = springLoad(c, w);
      const b = num(c, "damping", 1.2);
      let x = st(c, "x");
      let v = st(c, "v");
      const mass = Math.max(m, 0.02);
      const steps = 4;
      const h = w.dt / steps;
      for (let i = 0; i < steps; i++) {
        const a = (m * g(c, w) - k * x - b * v) / mass;
        v += a * h;
        x += v * h;
      }
      return { state: { x, v } };
    },
    readings: (c, w) => {
      const k = num(c, "springConstant", 50);
      const x = st(c, "x");
      return [
        { key: "extension", label: "Extension", value: x * 100, unit: "cm", precision: 2 },
        { key: "force", label: "Spring force", value: k * x, unit: "N", precision: 3 },
        { key: "load", label: "Load", value: springLoad(c, w), unit: "kg", precision: 3 },
      ];
    },
  },
  {
    type: "pendulum",
    label: "Pendulum",
    category: "physics",
    group: G,
    description: "Simple pendulum: T = 2π√(L/g) for small angles.",
    size: { width: 220, height: 260 },
    visual: { archetype: "pendulum" },
    roles: ["mechanics", "sensor"],
    properties: [P.number("length", "String length", "m", 0.05, 3, 0.01), P.number("bobMass", "Bob mass", "kg", 0.01, 10, 0.01), P.slider("amplitude", "Release angle", 1, 80, 1, "°", "Parameters"), P.slider("damping", "Air resistance", 0, 1, 0.01, "", "Parameters"), gravityProp],
    defaults: { length: 1, bobMass: 0.2, amplitude: 15, damping: 0.02, gravity: 9.81 },
    initialState: (c) => ({ theta: (num(c, "amplitude", 15) * Math.PI) / 180, omega: 0, crossings: 0, lastCross: null, measuredPeriod: null, t: 0 }),
    simulate: (c, w) => {
      const L = Math.max(num(c, "length", 1), 0.01);
      const b = num(c, "damping", 0.02);
      let th = st(c, "theta", (num(c, "amplitude", 15) * Math.PI) / 180);
      let om = st(c, "omega");
      const steps = 6;
      const h = w.dt / steps;
      const prev = th;
      for (let i = 0; i < steps; i++) {
        const a = -(g(c, w) / L) * Math.sin(th) - b * om;
        om += a * h;
        th += om * h;
      }
      const t = st(c, "t") + w.dt;
      const state: Record<string, unknown> = { theta: th, omega: om, t };
      const events = [];
      if (prev > 0 && th <= 0) {
        const last = c.state.lastCross as number | null;
        if (last != null) {
          state.measuredPeriod = t - last;
          if (st(c, "crossings") % 5 === 0) events.push({ kind: "measurement" as const, message: `${c.name}: measured period ${(t - last).toFixed(3)} s` });
        }
        state.lastCross = t;
        state.crossings = st(c, "crossings") + 1;
      }
      return { state, events };
    },
    readings: (c, w) => {
      const L = num(c, "length", 1);
      const r: Reading[] = [
        { key: "angle", label: "Angle", value: (st(c, "theta") * 180) / Math.PI, unit: "°", precision: 1 },
        { key: "period", label: "Period (theory)", value: 2 * Math.PI * Math.sqrt(L / g(c, w)), unit: "s", precision: 3 },
        { key: "oscillations", label: "Oscillations", value: st(c, "crossings"), unit: "", precision: 0 },
      ];
      if (typeof c.state.measuredPeriod === "number") r.push({ key: "measuredPeriod", label: "Period (measured)", value: c.state.measuredPeriod as number, unit: "s", precision: 3 });
      return r;
    },
  },
  {
    type: "mass",
    label: "Slotted mass",
    category: "physics",
    group: G,
    description: "Calibrated mass. Place under a spring hook or on a balance.",
    size: { width: 44, height: 30 },
    visual: { archetype: "mass" },
    roles: ["mechanics"],
    properties: [P.number("mass", "Mass", "kg", 0.001, 50, 0.01)],
    defaults: { mass: 0.1 },
    readings: (c, w) => [{ key: "weight", label: "Weight", value: num(c, "mass", 0.1) * w.env.gravity, unit: "N", precision: 3 }],
  },
  {
    type: "drop-ball",
    label: "Free-fall ball",
    category: "physics",
    group: G,
    description: "Ball released from rest; falls with acceleration g (no air resistance).",
    size: { width: 60, height: 320 },
    visual: { archetype: "dropball" },
    roles: ["mechanics", "sensor"],
    properties: [P.number("height", "Drop height", "m", 0.1, 20, 0.1), P.number("mass", "Ball mass", "kg", 0.01, 10, 0.01), gravityProp],
    defaults: { height: 1.5, mass: 0.1, gravity: 9.81 },
    initialState: () => ({ s: 0, v: 0, t: 0, landed: false }),
    simulate: (c, w) => {
      if (c.state.landed) return;
      const H = num(c, "height", 1.5);
      const v = st(c, "v") + g(c, w) * w.dt;
      const s = Math.min(H, st(c, "s") + v * w.dt);
      const t = st(c, "t") + w.dt;
      const landed = s >= H;
      return { state: { s, v, t, landed }, events: landed ? [{ kind: "measurement", message: `${c.name}: landed after ${t.toFixed(3)} s at ${v.toFixed(2)} m/s` }] : [] };
    },
    readings: (c) => [
      { key: "time", label: "Fall time", value: st(c, "t"), unit: "s", precision: 3 },
      { key: "distance", label: "Distance fallen", value: st(c, "s"), unit: "m", precision: 3 },
      { key: "velocity", label: "Velocity", value: st(c, "v"), unit: "m/s", precision: 3 },
    ],
  },
  {
    type: "force-sensor",
    label: "Force sensor",
    category: "physics",
    group: G,
    description: "Measures the force of an overlapping spring, block or hanging mass.",
    size: { width: 70, height: 50 },
    visual: { archetype: "device", variant: "force" },
    roles: ["sensor"],
    properties: [],
    defaults: {},
    readings: (c, w) => {
      const b = boundsOf(c);
      const pad = { x1: b.x1 - 40, y1: b.y1 - 40, x2: b.x2 + 40, y2: b.y2 + 40 };
      for (const o of w.byId.values()) {
        if (o.id === c.id || !overlaps(pad, boundsOf(o))) continue;
        if (o.type === "spring") return [{ key: "force", label: "Force", value: num(o, "springConstant", 50) * st(o, "x"), unit: "N", precision: 3 }];
        if (o.type === "block") return [{ key: "force", label: "Force", value: num(o, "appliedForce", 0), unit: "N", precision: 3 }];
        if (o.type === "mass") return [{ key: "force", label: "Force", value: num(o, "mass", 0.1) * w.env.gravity, unit: "N", precision: 3 }];
      }
      return [{ key: "force", label: "Force", value: 0, unit: "N", precision: 3 }];
    },
  },
  {
    type: "stopwatch",
    label: "Stopwatch",
    category: "physics",
    group: G,
    description: "Times events in simulation time; runs while the experiment runs.",
    size: { width: 70, height: 84 },
    visual: { archetype: "stopwatch" },
    roles: ["sensor"],
    properties: [P.toggle("running", "Running", "Controls")],
    defaults: { running: true },
    actions: [{ id: "toggle", label: "Start / stop" }, { id: "reset", label: "Reset" }, { id: "lap", label: "Lap" }],
    onAction: (a, c) => {
      if (a === "toggle") return { properties: { running: !bool(c, "running") } };
      if (a === "reset") return { state: { elapsed: 0 }, events: [{ kind: "action", message: `${c.name} reset` }] };
      if (a === "lap") return { events: [{ kind: "measurement", message: `${c.name}: lap at ${st(c, "elapsed").toFixed(2)} s` }] };
    },
    simulate: (c, w) => (bool(c, "running") ? { state: { elapsed: st(c, "elapsed") + w.dt } } : undefined),
    readings: (c) => [{ key: "time", label: "Elapsed", value: st(c, "elapsed"), unit: "s", precision: 2 }],
  },
  ...(
    [
      ["meter-ruler", "Meter ruler", "1 m ruler with millimetre divisions (±0.5 mm).", 1, 400, 30, 0.1, "cm", 50],
      ["vernier-caliper", "Vernier caliper", "Measures lengths to ±0.02 mm.", 0.002, 220, 70, 0.001, "cm", 2.54],
      ["micrometer", "Micrometer", "Screw gauge measuring to ±0.01 mm.", 0.001, 150, 70, 0.001, "mm", 5.21],
    ] as const
  ).map<ComponentDefinition>(([type, label, description, resolution, w, h, step, unit, dflt]) => ({
    type,
    label,
    category: "physics",
    group: G,
    description,
    size: { width: w, height: h },
    visual: { archetype: "ruler", variant: type },
    roles: ["sensor", "tool"],
    properties: [P.number("objectSize", "Object size", unit, 0, 1000, step, "Measurement")],
    defaults: { objectSize: dflt },
    readings: (c) => {
      const res = unit === "cm" ? resolution * 100 : resolution * 1000;
      const v = Math.round(num(c, "objectSize", 0) / res) * res;
      return [{ key: "length", label: "Length", value: v, unit, precision: unit === "cm" ? (type === "meter-ruler" ? 1 : 3) : 2 }];
    },
  })),
  {
    type: "motion-sensor",
    label: "Motion sensor",
    category: "physics",
    group: G,
    description: "Ultrasonic sensor: measures distance and velocity of the nearest object in front of it.",
    size: { width: 60, height: 50 },
    visual: { archetype: "device", variant: "motion" },
    roles: ["sensor"],
    properties: [P.number("range", "Range", "m", 0.1, 10, 0.1, "Specification")],
    defaults: { range: 4 },
    simulate: (c, w) => {
      const d = motionDistance(c, w);
      const prev = c.state.distance as number | undefined;
      const v = d != null && prev != null && w.dt > 0 ? (d - prev) / w.dt : 0;
      return { state: { distance: d, velocity: v } };
    },
    readings: (c, w) => {
      const d = motionDistance(c, w);
      if (d == null) return [];
      return [
        { key: "distance", label: "Distance", value: d, unit: "m", precision: 3 },
        { key: "velocity", label: "Velocity", value: st(c, "velocity"), unit: "m/s", precision: 3 },
      ];
    },
  },
];

function motionDistance(c: LabComponent, w: WorldContext): number | null {
  const origin = localPoint(c, 1, 0.5);
  const th = (c.rotation * Math.PI) / 180;
  const dir = { x: Math.cos(th), y: Math.sin(th) };
  let best: number | null = null;
  for (const o of w.byId.values()) {
    if (o.id === c.id || !["block", "mass", "drop-ball"].includes(o.type)) continue;
    let p = center(o);
    if (o.type === "drop-ball") {
      const H = num(o, "height", 1.5);
      const frac = Math.min(1, st(o, "s") / H);
      p = localPoint(o, 0.5, 0.1 + 0.8 * frac);
    }
    const rel = { x: p.x - origin.x, y: p.y - origin.y };
    const along = rel.x * dir.x + rel.y * dir.y;
    const off = Math.abs(-rel.x * dir.y + rel.y * dir.x);
    if (along > 0 && off < 80) {
      const dist = o.type === "drop-ball" ? st(o, "s") + 0.05 : (along - o.dimensions.width / 2) / PX_PER_M;
      if (dist <= num(c, "range", 4) && (best == null || dist < best)) best = Math.max(0, dist);
    }
  }
  return best;
}
