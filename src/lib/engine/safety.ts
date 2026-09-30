import type { LabComponent, Mixture, SafetyAlert, SafetyLevel, WorldContext } from "./types";
import { getChemical } from "@/lib/chemistry/chemicals";
import { center } from "./geometry";

export type SafetyFinding = Omit<SafetyAlert, "id" | "at"> & { key: string };

const ACIDS = ["hcl", "h2so4", "hno3", "ch3cooh", "h3po4"];
const ORGANICS = ["ethanol", "methanol", "acetone", "hexane", "glucose"];
const OXIDISERS = ["kmno4", "hno3", "k2cr2o7"];
const HEAVY_METALS = ["pbno32", "pbi2", "k2cr2o7", "bacl2"];

const FUME = ["Safety goggles", "Nitrile gloves", "Lab coat", "Fume hood"];
const BASIC = ["Safety goggles", "Lab coat"];

export const LEVEL_RANK: Record<SafetyLevel, number> = { safe: 0, caution: 1, danger: 2 };

function present(m: Mixture): Set<string> {
  return new Set([...Object.keys(m.species), ...Object.keys(m.solids), ...Object.entries(m.gases).filter(([, n]) => n > 1e-6).map(([k]) => k)]);
}

export function evaluateSafety(world: WorldContext): SafetyFinding[] {
  const out: SafetyFinding[] = [];
  const comps = [...world.byId.values()];
  const flames = comps.filter((c) => c.type === "bunsen-burner" && c.properties.lit === true);
  const nearFlame = (c: LabComponent) =>
    flames.some((f) => {
      const a = center(c);
      const b = center(f);
      return Math.hypot(a.x - b.x, a.y - b.y) < 320;
    });

  for (const c of comps) {
    const m = c.state.mixture as Mixture | undefined;
    if (m) {
      const has = present(m);
      const any = (ids: string[]) => ids.some((i) => has.has(i));
      const add = (rule: string, level: SafetyLevel, title: string, message: string, ppe: string[]) =>
        out.push({ key: `${rule}:${c.id}`, level, title, message: `${c.name}: ${message}`, ppe, componentId: c.id });

      if ((has.has("naocl") && any(ACIDS)) || has.has("cl2"))
        add("chlorine", "danger", "Toxic chlorine gas", "Warning: This reaction may produce toxic chlorine gas. Never mix bleach with acids.", FUME);
      if (has.has("naocl") && has.has("nh3")) add("chloramine", "danger", "Toxic chloramine vapours", "Bleach and ammonia release toxic chloramine vapours.", FUME);
      if (has.has("na") && m.volumeMl > 0) add("sodium-water", "danger", "Violent reaction", "Sodium reacts violently with water, releasing flammable hydrogen that may ignite.", [...FUME, "Face shield"]);
      if (any(OXIDISERS) && any(ORGANICS)) add("oxidiser-organic", "danger", "Fire risk", "Strong oxidiser mixed with organic material — risk of fire or explosion.", FUME);
      if (has.has("h2")) add("hydrogen", flames.length ? "danger" : "caution", "Flammable hydrogen", flames.length ? "Hydrogen is being produced near an open flame — explosion risk." : "Hydrogen gas is produced — keep away from flames.", BASIC);
      if (has.has("so2")) add("so2", "caution", "Toxic sulfur dioxide", "SO₂ gas is released — work in a fume hood.", FUME);
      if (has.has("nh3g")) add("nh3g", "caution", "Ammonia gas", "Pungent ammonia gas released — use a fume hood.", FUME);
      if (any(HEAVY_METALS)) add("heavy-metal", "caution", "Toxic compounds", "Contains toxic heavy-metal compounds — dispose of as hazardous waste.", FUME);
      const flammable = [...has].some((id) => getChemical(id)?.flammable && id !== "h2");
      if (flammable && nearFlame(c)) add("flammable-flame", "danger", "Flammable near flame", "Flammable liquid close to an open flame — vapours may ignite.", FUME);
      for (const id of Object.keys(m.species)) {
        const ch = getChemical(id);
        if (!ch) continue;
        const conc = m.volumeMl > 0 ? (m.species[id] / m.volumeMl) * 1000 : 0;
        if ((ch.acid && !ch.acid.Ka) || (ch.base && !ch.base.Kb)) {
          if (conc >= 6) add(`conc-${id}`, "danger", "Concentrated corrosive", `${ch.name} at ${conc.toFixed(1)} M is highly corrosive.`, ["Safety goggles", "Nitrile gloves", "Lab coat", "Face shield"]);
          else if (conc >= 0.5) add(`corrosive-${id}`, "caution", "Corrosive solution", `${ch.name} (${conc.toFixed(2)} M) can burn skin and eyes.`, ["Safety goggles", "Nitrile gloves", "Lab coat"]);
        }
        if (ch.hazard.level === "danger" && !["hno3", "h2so4"].includes(id)) add(`chem-${id}`, "danger", ch.name, ch.hazard.statement, ch.hazard.ppe);
      }
      if (m.temperature > 60) add("hot", "caution", "Hot liquid", `Temperature is ${m.temperature.toFixed(0)} °C — use tongs and heat-resistant gloves.`, ["Heat-resistant gloves", "Safety goggles"]);
    }

    const el = world.circuit.elements[c.id];
    if (el) {
      if ((c.type === "battery" || c.type === "power-supply") && Math.abs(el.current) > 5)
        out.push({ key: `short:${c.id}`, level: "danger", title: "Short circuit", message: `${c.name} is delivering ${Math.abs(el.current).toFixed(1)} A — possible short circuit. Wires would overheat.`, ppe: ["Insulated gloves"], componentId: c.id });
      if (c.type === "led" && el.current > 0.04)
        out.push({ key: `led:${c.id}`, level: "caution", title: "LED over-current", message: `${c.name} carries ${(el.current * 1000).toFixed(0)} mA — add a series resistor.`, ppe: [], componentId: c.id });
      if (c.type === "bulb" && typeof c.state.brightness === "number" && (c.state.brightness as number) > 1.1)
        out.push({ key: `bulb:${c.id}`, level: "caution", title: "Bulb over-driven", message: `${c.name} exceeds its rated power and may burn out.`, ppe: [], componentId: c.id });
    }
    if (c.type === "laser" && c.properties.on !== false)
      out.push({ key: `laser:${c.id}`, level: "caution", title: "Laser in use", message: `${c.name}: never look directly into the beam.`, ppe: ["Laser safety goggles"], componentId: c.id });
    if (c.type === "gas-chamber") {
      const T = ((c.state.temperature as number) ?? 25) + 273.15;
      const p = ((Number(c.properties.moles) || 0.05) * 8.314 * T) / (Number(c.properties.volume) || 1.2);
      if (p > 400) out.push({ key: `pressure:${c.id}`, level: "danger", title: "Over-pressure", message: `${c.name} is at ${p.toFixed(0)} kPa — risk of rupture.`, ppe: ["Face shield", "Safety goggles"], componentId: c.id });
    }
    if (c.type === "bunsen-burner" && c.properties.lit === true)
      out.push({ key: `flame:${c.id}`, level: "caution", title: "Open flame", message: `${c.name} is lit — tie back hair and keep flammables away.`, ppe: ["Safety goggles", "Lab coat"], componentId: c.id });
  }
  return out;
}

export function overallLevel(findings: { level: SafetyLevel }[]): SafetyLevel {
  return findings.reduce<SafetyLevel>((acc, f) => (LEVEL_RANK[f.level] > LEVEL_RANK[acc] ? f.level : acc), "safe");
}

export function recommendedPPE(findings: { ppe: string[] }[]): string[] {
  const set = new Set<string>(["Safety goggles", "Lab coat"]);
  for (const f of findings) f.ppe.forEach((p) => set.add(p));
  return [...set];
}
