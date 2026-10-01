import type {
  ComponentDefinition,
  LabComponent,
  Mixture,
  PropertySchema,
  Reading,
  SimEvent,
  SimulateResult,
  WorldContext,
} from "@/lib/engine/types";
import { getDefinition } from "@/lib/engine/registry";
import { componentAt, componentBelow, localPoint } from "@/lib/engine/geometry";
import { cloneMixture, computePH, describeContents, emptyMixture, heatCapacity, react, totalMass, transfer } from "@/lib/chemistry/mixture";
import { getChemical, prettyFormula } from "@/lib/chemistry/chemicals";

export const num = (c: LabComponent, key: string, fallback = 0): number => {
  const v = c.properties[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
};
export const bool = (c: LabComponent, key: string): boolean => c.properties[key] === true;
export const str = (c: LabComponent, key: string, fallback = ""): string => {
  const v = c.properties[key];
  return typeof v === "string" ? v : fallback;
};

export const hasRole = (c: LabComponent, role: string) => getDefinition(c.type)?.roles.includes(role as never) ?? false;
export const isContainer = (c: LabComponent) => hasRole(c, "container");

export function mixtureOf(c: LabComponent): Mixture {
  return (c.state.mixture as Mixture | undefined) ?? emptyMixture();
}

export const P = {
  capacity: (max = 1000): PropertySchema => ({ key: "capacity", label: "Capacity", kind: "number", unit: "mL", min: 1, max, step: 1, group: "Specification" }),
  toggle: (key: string, label: string, group = "Controls"): PropertySchema => ({ key, label, kind: "toggle", group }),
  slider: (key: string, label: string, min: number, max: number, step: number, unit?: string, group = "Controls"): PropertySchema => ({ key, label, kind: "slider", min, max, step, unit, group }),
  number: (key: string, label: string, unit?: string, min?: number, max?: number, step?: number, group = "Parameters"): PropertySchema => ({ key, label, kind: "number", unit, min, max, step, group }),
  select: (key: string, label: string, options: [string, string][], group = "Parameters"): PropertySchema => ({ key, label, kind: "select", options: options.map(([value, label]) => ({ value, label })), group }),
};

/* ------------------------------------------------------------------ */
/* Heat sources                                                         */
/* ------------------------------------------------------------------ */

const HEATER_REACH: Record<string, number> = { "hot-plate": 30, "bunsen-burner": 230, heater: 40, "magnetic-stirrer": 30 };

export function heaterPower(h: LabComponent, T: number): number {
  switch (h.type) {
    case "hot-plate": {
      if (!bool(h, "heat")) return 0;
      const set = num(h, "setTemperature", 80);
      return 700 * Math.max(0, Math.min(1, (set - T) / 8));
    }
    case "bunsen-burner": {
      if (!bool(h, "lit")) return 0;
      const size = { low: 250, medium: 500, high: 850 }[str(h, "flame", "medium")] ?? 500;
      return size * (bool(h, "airHole") ? 1 : 0.55);
    }
    case "heater":
      return bool(h, "on") ? num(h, "power", 200) : 0;
    default:
      return 0;
  }
}

function findHeat(c: LabComponent, world: WorldContext): { power: number; source?: LabComponent; stir: boolean } {
  const bottom = localPoint(c, 0.5, 1);
  const mix = mixtureOf(c);
  let power = 0;
  let source: LabComponent | undefined;
  let stir = false;
  const below = componentBelow(world, bottom, 240, (x) => hasRole(x, "heater") || hasRole(x, "stirrer"), c.id);
  if (below) {
    const dy = localPoint(below, 0.5, 0).y - bottom.y;
    if (dy <= (HEATER_REACH[below.type] ?? 30)) {
      power += heaterPower(below, mix.temperature);
      source = below;
      if ((below.type === "hot-plate" && bool(below, "stir")) || (below.type === "magnetic-stirrer" && bool(below, "on"))) stir = true;
    }
  }
  // immersion heaters inside the container
  for (const h of world.byId.values()) {
    if (h.type !== "heater" || h.id === below?.id) continue;
    const tip = localPoint(h, 0.5, 0.9);
    if (componentAt(world, tip, (x) => x.id === c.id)) {
      power += heaterPower(h, mix.temperature);
      source = h;
    }
  }
  return { power, source, stir };
}

/* ------------------------------------------------------------------ */
/* Containers                                                          */
/* ------------------------------------------------------------------ */

export function containerSimulate(c: LabComponent, world: WorldContext): SimulateResult {
  const dt = world.dt;
  let mix = mixtureOf(c);
  const events: SimEvent[] = [];
  const state: Record<string, unknown> = {};
  const T0 = mix.temperature;

  // Heating / cooling
  const { power, source, stir } = findHeat(c, world);
  const cap = heatCapacity(mix);
  let T = mix.temperature;
  const bath = componentAt(world, localPoint(c, 0.5, 0.95), (x) => x.type === "water-bath" && bool(x, "on"), c.id);
  if (bath) T += (num(bath, "setTemperature", 60) - T) * Math.min(1, 0.03 * dt);
  if (power > 0 && mix.volumeMl + Object.keys(mix.solids).length > 0) T += (power * dt) / cap;
  const insulation = num(c, "insulation", 0);
  const loss = 0.0025 * (1 - Math.min(0.95, insulation));
  T += (world.env.ambientTemperature - T) * Math.min(1, loss * dt);

  // Boiling
  let volume = mix.volumeMl;
  const boiling = volume > 0 && T >= 100;
  if (boiling) {
    const excess = (T - 100) * cap;
    T = 100;
    volume = Math.max(0, volume - excess / 2260);
    if (!c.state.boiling) events.push({ kind: "observation", message: `${c.name}: solution is boiling (100 °C)` });
  }
  mix = { ...mix, temperature: T, volumeMl: volume };
  if (volume === 0 && mix.volumeMl > 0 && Object.keys(mix.species).length) {
    // evaporated to dryness: dissolved species crystallise
    const solids = { ...mix.solids };
    for (const [id, n] of Object.entries(mix.species)) solids[id] = (solids[id] ?? 0) + n;
    mix = { ...mix, species: {}, solids };
    events.push({ kind: "observation", message: `${c.name}: evaporated to dryness — crystals remain` });
  }
  state.boiling = boiling;
  state.stirring = stir;
  state.heatedBy = source?.id ?? null;

  // Reactions
  const gasesBefore = { ...mix.gases };
  const r = react(mix, dt * (stir ? 1.6 : 1), world.time);
  mix = r.mixture;
  for (const info of r.started) {
    events.push({ kind: "reaction", message: `${c.name}: ${info.equation} — ${info.type}`, effect: info.effect });
    for (const o of info.observations) events.push({ kind: "observation", message: `${c.name}: ${o}` });
  }
  for (const info of r.completed) events.push({ kind: "reaction", message: `${c.name}: reaction complete (${info.equation})` });

  // Combustion: hydrogen pops, burning vapours and burning metals
  mix = combustion(c, mix, world, source, events, state);

  // Per-gas evolution rates (splint tests, coloured gas haze, fizzing sounds)
  const gasRates: Record<string, number> = {};
  for (const [id, n] of Object.entries(mix.gases)) {
    const d = n - (gasesBefore[id] ?? 0);
    if (d > 1e-12 && dt > 0) gasRates[id] = d / dt;
  }
  state.gasRates = gasRates;
  state.gasRate = Object.values(gasRates).reduce((a, b) => a + b, 0);
  if (mix.volumeMl < 0.5) mix = { ...mix, temperature: Math.min(mix.temperature, 1100) };

  // Automatic observations for the timeline
  const lastT = typeof c.state.lastLoggedT === "number" ? (c.state.lastLoggedT as number) : T0;
  if (Math.abs(mix.temperature - lastT) >= (mix.temperature > 150 ? 100 : 3)) {
    events.push({ kind: "measurement", message: `${c.name}: temperature ${mix.temperature > lastT ? "increased" : "decreased"} to ${mix.temperature.toFixed(1)} °C` });
    state.lastLoggedT = mix.temperature;
  } else if (c.state.lastLoggedT == null) state.lastLoggedT = T0;
  const ph = computePH(mix);
  const lastPH = c.state.lastLoggedPH as number | null | undefined;
  if (ph != null) {
    if (lastPH != null && (lastPH - 7) * (ph - 7) < 0) events.push({ kind: "measurement", message: `${c.name}: pH reached 7.0 (neutral point)` });
    else if (lastPH != null && Math.abs(ph - lastPH) >= 1.5) events.push({ kind: "measurement", message: `${c.name}: pH changed to ${ph.toFixed(2)}` });
    if (lastPH == null || Math.abs(ph - lastPH) >= 1.5 || (lastPH - 7) * (ph - 7) < 0) state.lastLoggedPH = ph;
  }
  state.mixture = mix;
  return { state, events };
}

/* ------------------------------------------------------------------ */
/* Flames & combustion                                                 */
/* ------------------------------------------------------------------ */

const FLAME_HEIGHT: Record<string, number> = { low: 28, medium: 44, high: 62 };

/** Point where a Bunsen burner's flame sits (base) and its height, in world units. */
export function burnerFlame(b: LabComponent): { base: { x: number; y: number }; height: number } {
  return { base: localPoint(b, 0.5, 0.18), height: FLAME_HEIGHT[str(b, "flame", "medium")] ?? 44 };
}

/** Find an open flame within `radius` of point `p` (lit burner, burning splint, or a vessel on fire). */
export function flameNear(world: WorldContext, p: { x: number; y: number }, radius: number, excludeId?: string): LabComponent | undefined {
  for (const f of world.byId.values()) {
    if (f.id === excludeId) continue;
    if (f.type === "bunsen-burner" && bool(f, "lit")) {
      const { base, height } = burnerFlame(f);
      const y = Math.max(base.y - height, Math.min(base.y, p.y));
      if (Math.hypot(p.x - base.x, p.y - y) < radius) return f;
    } else if (f.type === "splint" && str(f, "condition") === "burning") {
      const tip = localPoint(f, 0.5, 1);
      if (Math.hypot(p.x - tip.x, p.y - tip.y) < radius) return f;
    } else if (f.state.onFire || f.state.burning) {
      const m = localPoint(f, 0.5, 0);
      if (Math.hypot(p.x - m.x, p.y - m.y) < radius) return f;
    }
  }
  return undefined;
}

function combustion(c: LabComponent, input: Mixture, world: WorldContext, heatSource: LabComponent | undefined, events: SimEvent[], state: Record<string, unknown>): Mixture {
  const dt = world.dt;
  let mix = input;
  const mouth = localPoint(c, 0.5, 0.02);
  const flame = flameNear(world, mouth, 70, c.id);
  const onBurner = heatSource?.type === "bunsen-burner" && bool(heatSource, "lit");

  // 1. Hydrogen escaping near a flame burns with a "squeaky pop"
  const h2Now = (mix.gases.h2 ?? 0) - ((c.state.mixture as Mixture | undefined)?.gases.h2 ?? 0);
  const lastPop = typeof c.state.lastPop === "number" ? (c.state.lastPop as number) : -Infinity;
  if (h2Now > 1e-7 && flame && world.time - lastPop >= 3) {
    events.push({ kind: "observation", message: `${c.name}: squeaky pop — hydrogen burns in air (2H₂ + O₂ → 2H₂O)`, effect: "pop" });
    state.lastPop = world.time;
  }

  // 2. Flammable liquids ignite when an open flame reaches their vapour
  const flammables = Object.keys(mix.species).filter((id) => getChemical(id)?.flammable && getChemical(id)?.form === "liquid");
  let onFire = Boolean(c.state.onFire);
  if (!onFire && flammables.length && mix.volumeMl > 0.2 && (flame || onBurner)) {
    onFire = true;
    const names = flammables.map((id) => getChemical(id)?.name).join(", ");
    events.push({ kind: "safety", message: `${c.name}: ${names} vapour ignites — the liquid is on fire! Cover the vessel to smother the flames.`, effect: "ignite" });
  }
  if (onFire) {
    if (!flammables.length || mix.volumeMl <= 0.2) {
      onFire = false;
      events.push({ kind: "observation", message: `${c.name}: flames die out — the fuel is used up`, effect: "smoke" });
    } else {
      // burn ~0.5 mL of fuel per second; part of the combustion heat warms the vessel
      mix = cloneMixture(mix);
      let heat = 0;
      for (const id of flammables) {
        const ch = getChemical(id)!;
        const moles = Math.min(mix.species[id], ((0.5 * ch.density) / ch.molarMass) * dt / flammables.length);
        mix.species[id] -= moles;
        if (mix.species[id] < 1e-9) delete mix.species[id];
        mix.volumeMl = Math.max(0, mix.volumeMl - (moles * ch.molarMass) / ch.density);
        mix.gases.co2 = (mix.gases.co2 ?? 0) + moles * 2;
        heat += moles * 1300e3 * 0.08;
      }
      mix.temperature += heat / Math.max(heatCapacity(mix), 1);
    }
  }
  state.onFire = onFire;

  // 3. Magnesium heated strongly in air burns with a dazzling white flame
  const mg = mix.solids.mg ?? 0;
  const dry = mix.volumeMl < 0.5;
  let burning = c.state.burning === "mg" ? "mg" : null;
  if (!burning && mg > 1e-6 && dry && (onBurner || flameNear(world, localPoint(c, 0.5, 0.6), 60, c.id))) {
    burning = "mg";
    events.push({ kind: "reaction", message: `${c.name}: magnesium ignites and burns with a dazzling white flame — 2Mg + O₂ → 2MgO`, effect: "flash" });
    events.push({ kind: "safety", message: `${c.name}: do not look directly at burning magnesium (intense UV light)` });
  }
  if (burning) {
    if (mg <= 1e-6 || !dry) {
      burning = null;
      events.push({ kind: "observation", message: `${c.name}: burning stops — white magnesium oxide ash remains`, effect: "smoke" });
    } else {
      mix = cloneMixture(mix);
      const n = Math.min(mg, 0.01 * dt);
      mix.solids.mg -= n;
      if (mix.solids.mg < 1e-9) delete mix.solids.mg;
      mix.solids.mgo = (mix.solids.mgo ?? 0) + n;
      mix.temperature = Math.max(mix.temperature, 900);
    }
  }
  state.burning = burning;
  return mix;
}

export function containerReadings(c: LabComponent): Reading[] {
  const mix = mixtureOf(c);
  const r: Reading[] = [
    { key: "volume", label: "Volume", value: mix.volumeMl, unit: "mL", precision: 1 },
    { key: "temperature", label: "Temperature", value: mix.temperature, unit: "°C", precision: 1 },
  ];
  const ph = computePH(mix);
  if (ph != null) r.push({ key: "ph", label: "pH", value: ph, unit: "", precision: 2 });
  const gas = Object.values(mix.gases).reduce((a, b) => a + b, 0);
  if (gas > 0) r.push({ key: "gasVolume", label: "Gas evolved", value: gas * 24000, unit: "mL", precision: 1, log: true });
  const cloud = mix.solids["s-ppt"] ? Math.min(100, ((mix.solids["s-ppt"] / Math.max(mix.volumeMl / 1000, 1e-6)) / 0.04) * 100) : 0;
  if (cloud > 0) r.push({ key: "turbidity", label: "Turbidity", value: cloud, unit: "%", precision: 1, log: true });
  return r;
}

/** Find the container a dispenser at `tip` would pour into (passing through funnels). */
export function targetBelow(world: WorldContext, tip: { x: number; y: number }, excludeId: string, depth = 0): LabComponent | undefined {
  const inside = componentAt(world, tip, (x) => isContainer(x) || x.type === "funnel", excludeId);
  const t = inside ?? componentBelow(world, tip, 420, (x) => isContainer(x) || x.type === "funnel", excludeId);
  if (t?.type === "funnel" && depth < 3) return targetBelow(world, localPoint(t, 0.5, 1), t.id, depth + 1);
  return t;
}

export function describeTransfer(mix: Mixture, volumeMl: number): string {
  const main = Object.entries(mix.species).sort((a, b) => b[1] - a[1])[0];
  if (!main) return `${volumeMl.toFixed(1)} mL of water`;
  const conc = (main[1] / Math.max(mix.volumeMl, 1e-9)) * 1000;
  return `${volumeMl.toFixed(volumeMl < 1 ? 2 : 1)} mL of ${conc.toFixed(conc < 0.1 ? 3 : 2)} M ${prettyFormula(getChemical(main[0])?.formula ?? main[0])}`;
}

/** Continuous dispenser (burette, separatory funnel). */
export function stopcockSimulate(c: LabComponent, world: WorldContext): SimulateResult {
  const base = containerSimulate(c, world);
  if (!bool(c, "open")) return base;
  const mix = (base.state?.mixture as Mixture) ?? mixtureOf(c);
  if (mix.volumeMl <= 0) return { ...base, properties: { open: false }, events: [...(base.events ?? []), { kind: "action", message: `${c.name} is empty — stopcock closed` }] };
  const tip = localPoint(c, 0.5, 1);
  const target = targetBelow(world, tip, c.id);
  const vol = Math.min(mix.volumeMl, num(c, "flowRate", 0.5) * world.dt);
  const events = [...(base.events ?? [])];
  if (!target) {
    const t = transfer(mix, emptyMixture(), vol);
    return { ...base, state: { ...base.state, mixture: t.from, delivered: ((c.state.delivered as number) ?? 0) + vol } };
  }
  const t = transfer(mix, mixtureOf(target), vol);
  const delivered = ((c.state.delivered as number) ?? 0) + t.moved;
  const lastLog = (c.state.lastLoggedDelivered as number) ?? 0;
  const state: Record<string, unknown> = { ...base.state, mixture: t.from, delivered };
  if (delivered - lastLog >= 5 || (lastLog === 0 && delivered > 0)) {
    events.push({ kind: "action", message: `${c.name}: ${delivered.toFixed(1)} mL delivered into ${target.name}` });
    state.lastLoggedDelivered = delivered;
  }
  return { ...base, state, events, patches: [{ id: target.id, state: { mixture: t.to } }] };
}

export function dispenseAction(action: string, c: LabComponent, world: WorldContext): SimulateResult | void {
  const tip = localPoint(c, 0.5, 1);
  const mix = mixtureOf(c);
  const capacity = num(c, "capacity", 10);
  if (action === "draw") {
    const source = componentAt(world, tip, isContainer, c.id);
    if (!source) return { events: [{ kind: "action", message: `${c.name}: place the tip inside a container to draw liquid` }] };
    const t = transfer(mixtureOf(source), mix, Math.max(0, capacity - mix.volumeMl));
    return {
      state: { mixture: t.to },
      patches: [{ id: source.id, state: { mixture: t.from } }],
      events: [{ kind: "action", message: `${c.name}: drew ${describeTransfer(t.to, t.moved)} from ${source.name}` }],
    };
  }
  if (action === "dispense" || action === "drop") {
    const target = targetBelow(world, tip, c.id);
    if (!target) return { events: [{ kind: "action", message: `${c.name}: no container below the tip` }] };
    const amount = action === "drop" ? Math.min(mix.volumeMl, 0.05 * Math.max(1, num(c, "drops", 1))) : mix.volumeMl;
    if (amount <= 0) return { events: [{ kind: "action", message: `${c.name} is empty` }] };
    const desc = describeTransfer(mix, amount);
    const t = transfer(mix, mixtureOf(target), amount);
    return {
      state: { mixture: t.from },
      patches: [{ id: target.id, state: { mixture: t.to } }],
      events: [{ kind: "action", message: `Added ${desc} to ${target.name}` }],
    };
  }
}

/* ------------------------------------------------------------------ */
/* Sensors                                                             */
/* ------------------------------------------------------------------ */

export function probeTemperature(c: LabComponent, world: WorldContext, rx = 0.5, ry = 0.94): number {
  const tip = localPoint(c, rx, ry);
  const target = componentAt(world, tip, (x) => isContainer(x) || x.type === "gas-chamber" || x.type === "water-bath", c.id);
  if (!target) return world.env.ambientTemperature;
  if (target.type === "gas-chamber") return (target.state.temperature as number) ?? world.env.ambientTemperature;
  if (target.type === "water-bath") return (target.state.temperature as number) ?? num(target, "setTemperature", 25);
  const mix = mixtureOf(target);
  return mix.volumeMl > 0 || Object.keys(mix.solids).length ? mix.temperature : world.env.ambientTemperature;
}

export function itemsOnPan(c: LabComponent, world: WorldContext): LabComponent[] {
  const top = localPoint(c, 0.5, 0.18).y;
  const x1 = c.position.x;
  const x2 = c.position.x + c.dimensions.width;
  const out: LabComponent[] = [];
  for (const o of world.byId.values()) {
    if (o.id === c.id) continue;
    const b = localPoint(o, 0.5, 1);
    if (b.x > x1 && b.x < x2 && Math.abs(b.y - top) < 30) out.push(o);
  }
  return out;
}

export function massOf(o: LabComponent): number {
  const def = getDefinition(o.type);
  let m = def?.emptyMass ?? 0;
  if (o.state.mixture) m += totalMass(o.state.mixture as Mixture);
  if (typeof o.properties.mass === "number") m += (o.properties.mass as number) * 1000;
  return m;
}

export function contentsSummary(c: LabComponent): string {
  return describeContents(mixtureOf(c));
}

export type Def = ComponentDefinition;
