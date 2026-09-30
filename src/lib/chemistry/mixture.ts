import type { Mixture, ReactionInfo } from "@/lib/engine/types";
import { getChemical, prettyFormula } from "./chemicals";
import { REACTIONS, type ReactionRule } from "./reactions";
import { indicatorColor } from "./indicators";

const EPS = 1e-9;
const KW = 1e-14;

export function emptyMixture(temperature = 25): Mixture {
  return { volumeMl: 0, temperature, species: {}, solids: {}, gases: {}, indicators: [], reactions: [] };
}

export function cloneMixture(m: Mixture): Mixture {
  return {
    ...m,
    species: { ...m.species },
    solids: { ...m.solids },
    gases: { ...m.gases },
    indicators: [...m.indicators],
    reactions: m.reactions.map((r) => ({ ...r })),
  };
}

export interface AddAmount {
  volumeMl?: number; // for solutions & liquids
  concentration?: number; // mol/L for solutions
  massG?: number; // for solids
}

/** Describe the default amount the library dispenses for a chemical. */
export function defaultAmount(chemId: string): AddAmount {
  const c = getChemical(chemId);
  if (!c) return { volumeMl: 10 };
  if (c.form === "solid") return { massG: c.id === "na" ? 0.5 : 2 };
  if (c.indicator) return { volumeMl: 1, concentration: c.defaultConcentration };
  if (c.form === "solution") return { volumeMl: 50, concentration: c.defaultConcentration ?? 1 };
  return { volumeMl: 50 };
}

export function describeAmount(chemId: string, a: AddAmount): string {
  const c = getChemical(chemId);
  const name = c ? `${c.name} (${prettyFormula(c.formula)})` : chemId;
  if (a.massG != null) return `${round(a.massG, 2)} g ${name}`;
  if (a.concentration != null) return `${round(a.volumeMl ?? 0, 1)} mL of ${round(a.concentration, 3)} M ${name}`;
  return `${round(a.volumeMl ?? 0, 1)} mL ${name}`;
}

/** Add a chemical to a mixture, returning a new mixture. */
export function addChemical(mix: Mixture, chemId: string, amount: AddAmount, temperature = 25): Mixture {
  const c = getChemical(chemId);
  const m = cloneMixture(mix);
  if (!c) return m;
  const heatCapBefore = heatCapacity(m);
  let addedCap = 0;

  if (c.indicator) {
    if (!m.indicators.includes(c.indicator)) m.indicators.push(c.indicator);
    m.volumeMl += amount.volumeMl ?? 1;
    addedCap = (amount.volumeMl ?? 1) * 4.18;
  } else if (c.id === "h2o") {
    m.volumeMl += amount.volumeMl ?? 0;
    addedCap = (amount.volumeMl ?? 0) * 4.18;
  } else if (amount.massG != null) {
    const moles = amount.massG / c.molarMass;
    m.solids[chemId] = (m.solids[chemId] ?? 0) + moles;
    addedCap = amount.massG * 0.8;
  } else if (c.form === "solution" || amount.concentration != null) {
    const v = amount.volumeMl ?? 0;
    const conc = amount.concentration ?? c.defaultConcentration ?? 1;
    m.species[chemId] = (m.species[chemId] ?? 0) + (conc * v) / 1000;
    m.volumeMl += v;
    addedCap = v * 4.18;
  } else if (c.form === "gas") {
    m.gases[chemId] = (m.gases[chemId] ?? 0) + (amount.volumeMl ?? 0) / 24000;
  } else {
    // pure liquid
    const v = amount.volumeMl ?? 0;
    m.species[chemId] = (m.species[chemId] ?? 0) + (v * c.density) / c.molarMass;
    m.volumeMl += v;
    addedCap = v * c.density * 2.4;
  }

  // Thermal mixing of the added portion
  const total = heatCapBefore + addedCap;
  if (total > EPS) m.temperature = (m.temperature * heatCapBefore + temperature * addedCap) / total;
  else m.temperature = temperature;

  // Dilution of concentrated sulfuric acid is exothermic (educational effect)
  if (chemId === "h2o" && (m.species["h2so4"] ?? 0) > 0) {
    const conc = (m.species["h2so4"] / Math.max(m.volumeMl, EPS)) * 1000;
    if (conc > 2) m.temperature += Math.min(40, conc * 1.5);
  }
  return dissolve(m);
}

/** Soluble solids dissolve once there is liquid present. */
function dissolve(m: Mixture): Mixture {
  if (m.volumeMl <= EPS) return m;
  for (const [id, n] of Object.entries(m.solids)) {
    const c = getChemical(id);
    if (c?.soluble && n > EPS) {
      m.species[id] = (m.species[id] ?? 0) + n;
      delete m.solids[id];
    }
  }
  return m;
}

/** Transfer `volumeMl` of liquid (and proportional dissolved species) from one mixture to another. */
export function transfer(from: Mixture, to: Mixture, volumeMl: number): { from: Mixture; to: Mixture; moved: number } {
  const src = cloneMixture(from);
  const dst = cloneMixture(to);
  const moved = Math.max(0, Math.min(volumeMl, src.volumeMl));
  if (moved <= EPS) return { from: src, to: dst, moved: 0 };
  const f = moved / src.volumeMl;
  const capDst = heatCapacity(dst);
  const capMoved = moved * 4.18;
  for (const [id, n] of Object.entries(src.species)) {
    const dn = n * f;
    src.species[id] = n - dn;
    dst.species[id] = (dst.species[id] ?? 0) + dn;
    if (src.species[id] < EPS) delete src.species[id];
  }
  for (const ind of src.indicators) if (!dst.indicators.includes(ind)) dst.indicators.push(ind);
  src.volumeMl -= moved;
  dst.volumeMl += moved;
  dst.temperature = capDst + capMoved > EPS ? (dst.temperature * capDst + src.temperature * capMoved) / (capDst + capMoved) : src.temperature;
  if (src.volumeMl < 0.01) {
    src.volumeMl = 0;
    src.species = {};
    src.indicators = [];
  }
  return { from: src, to: dissolve(dst), moved };
}

export function heatCapacity(m: Mixture): number {
  let solidMass = 0;
  for (const [id, n] of Object.entries(m.solids)) solidMass += n * (getChemical(id)?.molarMass ?? 50);
  return m.volumeMl * 4.18 + solidMass * 0.8 + 0.5;
}

export function totalMass(m: Mixture): number {
  let mass = m.volumeMl * 1.0;
  for (const [id, n] of Object.entries(m.species)) {
    const c = getChemical(id);
    if (!c) continue;
    // pure liquids are already represented by their volume
    if (c.form === "liquid") mass += n * c.molarMass - (n * c.molarMass) / c.density;
    else mass += n * c.molarMass;
  }
  for (const [id, n] of Object.entries(m.solids)) mass += n * (getChemical(id)?.molarMass ?? 0);
  return mass;
}

function available(m: Mixture, id: string): number {
  if (id === "h2o") return m.volumeMl > 0.5 ? (m.volumeMl / 18) : 0;
  return (m.species[id] ?? 0) + (m.solids[id] ?? 0);
}

function consume(m: Mixture, id: string, n: number) {
  if (id === "h2o") {
    m.volumeMl = Math.max(0, m.volumeMl - n * 18);
    return;
  }
  let left = n;
  const fromSpecies = Math.min(left, m.species[id] ?? 0);
  if (fromSpecies > 0) {
    m.species[id] -= fromSpecies;
    left -= fromSpecies;
    if (m.species[id] < EPS) delete m.species[id];
  }
  if (left > 0 && m.solids[id]) {
    m.solids[id] -= left;
    if (m.solids[id] < EPS) delete m.solids[id];
  }
}

function produce(m: Mixture, id: string, n: number) {
  if (id === "h2o") {
    m.volumeMl += n * 0.018;
    return;
  }
  const c = getChemical(id);
  if (!c) return;
  if (c.state === "gas") m.gases[id] = (m.gases[id] ?? 0) + n;
  else if (c.soluble && m.volumeMl > EPS) m.species[id] = (m.species[id] ?? 0) + n;
  else m.solids[id] = (m.solids[id] ?? 0) + n;
}

export function reactionEquation(r: ReactionRule): string {
  const side = (terms: { id: string; n: number }[]) =>
    terms
      .map((t) => {
        const c = getChemical(t.id);
        const f = c ? prettyFormula(c.formula) : t.id;
        const suffix = c?.state === "gas" ? "↑" : c && !c.soluble && c.form === "solid" && r.products.includes(t) ? "↓" : "";
        return `${t.n !== 1 ? t.n : ""}${f}${suffix}`;
      })
      .join(" + ");
  const cat = r.catalyst ? ` (${prettyFormula(getChemical(r.catalyst)?.formula ?? r.catalyst)} catalyst)` : "";
  return `${side(r.reactants)} → ${side(r.products)}${cat}`;
}

export interface ReactResult {
  mixture: Mixture;
  started: ReactionInfo[];
  completed: ReactionInfo[];
}

/**
 * Run all applicable reaction rules. Instantaneous rules go to completion; kinetic rules
 * progress according to their rate constant, concentration and temperature.
 */
export function react(mix: Mixture, dt: number, time: number): ReactResult {
  const m = cloneMixture(mix);
  const started: ReactionInfo[] = [];
  const completed: ReactionInfo[] = [];
  for (let pass = 0; pass < 6; pass++) {
    let any = false;
    for (const rule of REACTIONS) {
      if (rule.catalyst && available(m, rule.catalyst) <= EPS) continue;
      if (rule.minTemperature != null && m.temperature < rule.minTemperature) continue;
      let limit = Infinity;
      for (const r of rule.reactants) limit = Math.min(limit, available(m, r.id) / r.n);
      const existing = m.reactions.find((x) => x.id === rule.id);
      if (!(limit > 1e-7)) {
        if (existing && rule.rate && !existing.completed) {
          existing.completed = true;
          completed.push({ ...existing });
        }
        continue;
      }
      let extent = limit;
      if (rule.rate) {
        if (pass > 0 || dt <= 0) continue;
        const dissolved = rule.reactants.find((r) => (m.species[r.id] ?? 0) > 0 && r.id !== "h2o");
        const conc = dissolved && m.volumeMl > 0 ? (m.species[dissolved.id] / m.volumeMl) * 1000 : 1;
        const tf = Math.pow(2, (m.temperature - 25) / 10);
        const k = rule.rate * tf * Math.min(4, Math.max(0.05, conc));
        extent = limit * (1 - Math.exp(-k * dt));
        if (limit - extent < 1e-7) extent = limit;
      }
      if (extent <= 1e-12) continue;
      const cap = heatCapacity(m);
      for (const r of rule.reactants) consume(m, r.id, r.n * extent);
      for (const p of rule.products) produce(m, p.id, p.n * extent);
      const deltaT = (-rule.deltaH * 1000 * extent) / Math.max(cap, 1);
      m.temperature += deltaT;
      any = true;
      if (existing) {
        existing.extent += extent;
        existing.deltaT += deltaT;
        existing.at = time;
        if (rule.rate && existing.completed) {
          existing.completed = false;
          started.push({ ...existing });
        }
      } else {
        const info: ReactionInfo = {
          id: rule.id,
          equation: reactionEquation(rule),
          type: rule.type,
          products: rule.products.map((p) => p.id),
          observations: rule.observations,
          deltaT,
          extent,
          at: time,
          completed: !rule.rate,
        };
        m.reactions = [...m.reactions.filter((x) => x.id !== rule.id), info];
        started.push(info);
      }
      m.lastReaction = m.reactions.find((x) => x.id === rule.id);
    }
    if (!any) break;
  }
  return { mixture: dissolve(m), started, completed };
}

/* ------------------------------------------------------------------ */
/* pH                                                                  */
/* ------------------------------------------------------------------ */

export function computePH(m: Mixture): number | null {
  const V = m.volumeMl / 1000;
  if (V < 1e-4) return null;
  let strongH = 0;
  let strongOH = 0;
  let weakA = 0; // Σ Ka·C
  let weakB = 0; // Σ Kb·C
  for (const [id, n] of Object.entries(m.species)) {
    const c = getChemical(id);
    if (!c || n <= EPS) continue;
    // Buffer: weak acid together with its conjugate base → Henderson–Hasselbalch
    if (c.acid?.Ka && c.conjugate && (m.species[c.conjugate] ?? 0) > EPS) {
      const base = m.species[c.conjugate];
      let strongNet = 0;
      for (const [id2, n2] of Object.entries(m.species)) {
        const c2 = getChemical(id2);
        if (c2?.acid && !c2.acid.Ka) strongNet += n2 * c2.acid.protons;
        if (c2?.base && !c2.base.Kb) strongNet -= n2 * c2.base.hydroxides;
      }
      if (Math.abs(strongNet) < 1e-6) return clampPH(-Math.log10(c.acid.Ka) + Math.log10(base / n));
    }
    if (c.acid) {
      if (c.acid.Ka) weakA += c.acid.Ka * (n / V);
      else strongH += n * c.acid.protons;
    }
    if (c.base) {
      if (c.base.Kb) weakB += c.base.Kb * (n / V);
      else strongOH += n * c.base.hydroxides;
    }
  }
  const net = (strongH - strongOH) / V;
  const x = net + Math.sqrt(weakA) - Math.sqrt(weakB);
  const h = (x + Math.sqrt(x * x + 4 * KW)) / 2;
  return clampPH(-Math.log10(h));
}

function clampPH(p: number) {
  return Math.max(-1, Math.min(15, p));
}

/* ------------------------------------------------------------------ */
/* Appearance                                                          */
/* ------------------------------------------------------------------ */

export interface MixtureAppearance {
  liquid: string; // css colour with alpha
  solid: string | null;
  solidAmount: number; // 0..1
  cloudiness: number; // 0..1
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function mixtureAppearance(m: Mixture): MixtureAppearance {
  let rgb: [number, number, number] = [214, 232, 250];
  let alpha = 0.45;
  const V = Math.max(m.volumeMl / 1000, 1e-6);
  for (const [id, n] of Object.entries(m.species)) {
    const c = getChemical(id);
    if (!c?.color || !c.colorStrength) continue;
    const w = Math.min(1, n / V / c.colorStrength);
    rgb = mixRgb(rgb, hexToRgb(c.color), w * 0.9);
    alpha = Math.max(alpha, 0.45 + 0.45 * w);
  }
  const ph = computePH(m);
  if (m.indicators.length && ph != null) {
    const ic = indicatorColor(m.indicators[m.indicators.length - 1], ph);
    if (ic) {
      rgb = mixRgb(rgb, hexToRgb(ic.color), ic.strength);
      alpha = Math.max(alpha, 0.45 + 0.4 * ic.strength);
    }
  }
  let solid: string | null = null;
  let solidMoles = 0;
  let cloud = 0;
  for (const [id, n] of Object.entries(m.solids)) {
    const c = getChemical(id);
    if (!c || n <= EPS) continue;
    if (n > solidMoles) {
      solid = c.color ?? "#d1d5db";
      solidMoles = n;
    }
    if (id === "s-ppt") cloud = Math.min(1, n / V / 0.04);
  }
  if (cloud > 0) {
    rgb = mixRgb(rgb, hexToRgb("#fde68a"), cloud * 0.8);
    alpha = Math.max(alpha, 0.45 + 0.5 * cloud);
  }
  return {
    liquid: `rgba(${rgb.map((v) => Math.round(v)).join(",")},${alpha.toFixed(2)})`,
    solid,
    solidAmount: Math.min(1, solidMoles * 40),
    cloudiness: cloud,
  };
}

export function describeContents(m: Mixture): string {
  const parts = [
    ...Object.keys(m.species).map((id) => prettyFormula(getChemical(id)?.formula ?? id)),
    ...Object.keys(m.solids).map((id) => `${prettyFormula(getChemical(id)?.formula ?? id)}(s)`),
  ];
  return parts.length ? parts.join(", ") : m.volumeMl > 0 ? "H₂O" : "empty";
}

export function concentrationOf(m: Mixture, id: string): number {
  if (m.volumeMl <= EPS) return 0;
  return ((m.species[id] ?? 0) / m.volumeMl) * 1000;
}

function round(v: number, d: number) {
  const f = 10 ** d;
  return Math.round(v * f) / f;
}
