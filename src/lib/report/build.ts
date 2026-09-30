import "@/lib/catalog";
import type { DataColumn, Experiment, NotebookSections } from "@/lib/engine/types";
import { getDefinition } from "@/lib/engine/registry";
import { getChemical, prettyFormula } from "@/lib/chemistry/chemicals";
import { deriveColumns } from "@/lib/engine/columns";
import { computePH } from "@/lib/chemistry/mixture";

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export function equipmentList(e: Pick<Experiment, "components">): string[] {
  const counts = new Map<string, number>();
  for (const c of e.components) {
    const label = getDefinition(c.type)?.label ?? c.type;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].map(([l, n]) => (n > 1 ? `${l} ×${n}` : l));
}

export function chemicalList(e: Pick<Experiment, "components" | "timeline"> & { chemicals?: string[] }): string[] {
  const ids = new Set<string>(e.chemicals ?? []);
  for (const c of e.components) {
    const m = c.state.mixture;
    if (!m) continue;
    Object.keys(m.species).forEach((i) => ids.add(i));
    Object.keys(m.solids).forEach((i) => ids.add(i));
  }
  return [...ids].map((id) => {
    const ch = getChemical(id);
    return ch ? `${ch.name} (${prettyFormula(ch.formula)})` : id;
  });
}

export function reactionsOf(e: Pick<Experiment, "components">) {
  const out: { vessel: string; equation: string; type: string; deltaT: number; observations: string[] }[] = [];
  for (const c of e.components) for (const r of c.state.mixture?.reactions ?? []) out.push({ vessel: c.name, equation: r.equation, type: r.type, deltaT: r.deltaT, observations: r.observations });
  return out;
}

export interface ColumnStats {
  column: DataColumn;
  n: number;
  min: number;
  max: number;
  mean: number;
  first: number;
  last: number;
}

export function columnStats(e: Pick<Experiment, "dataRows">, meta: Record<string, { label: string; unit: string }>): ColumnStats[] {
  const cols = deriveColumns(e.dataRows, meta).filter((c) => c.id !== "t");
  return cols
    .map((column) => {
      const vals = e.dataRows.map((r) => r.values[column.id]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      if (!vals.length) return null;
      return { column, n: vals.length, min: Math.min(...vals), max: Math.max(...vals), mean: vals.reduce((a, b) => a + b, 0) / vals.length, first: vals[0], last: vals[vals.length - 1] };
    })
    .filter((x): x is ColumnStats => x != null);
}

/** Linear regression y = a + b x for a pair of columns (used for Ohm's/Hooke's law style analysis). */
export function regression(e: Pick<Experiment, "dataRows">, x: string, y: string) {
  const pts = e.dataRows
    .map((r) => [x === "t" ? r.t : r.values[x], y === "t" ? r.t : r.values[y]] as const)
    .filter((p): p is readonly [number, number] => typeof p[0] === "number" && typeof p[1] === "number");
  if (pts.length < 3) return null;
  const n = pts.length;
  const sx = pts.reduce((a, p) => a + p[0], 0);
  const sy = pts.reduce((a, p) => a + p[1], 0);
  const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0);
  const sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
  const syy = pts.reduce((a, p) => a + p[1] * p[1], 0);
  const den = n * sxx - sx * sx;
  if (Math.abs(den) < 1e-12) return null;
  const slope = (n * sxy - sx * sy) / den;
  const intercept = (sy - slope * sx) / n;
  const r = (n * sxy - sx * sy) / Math.sqrt(den * (n * syy - sy * sy) || 1);
  return { slope, intercept, r2: r * r, n };
}

/** Generate notebook sections from what actually happened in the experiment. */
export function autoNotebook(e: Experiment & { columnMeta?: Record<string, { label: string; unit: string }> }, current: NotebookSections): NotebookSections {
  const eq = equipmentList(e);
  const chems = chemicalList(e);
  const obs = e.timeline.filter((t) => t.kind === "observation" || t.kind === "reaction");
  const actions = e.timeline.filter((t) => t.kind === "action");
  const stats = columnStats(e, e.columnMeta ?? {});
  const reactions = reactionsOf(e);
  const safety = [...new Set(e.timeline.filter((t) => t.kind === "safety").map((t) => t.message))];
  const pick = (cur: string, gen: string) => (cur.trim() ? cur : gen);
  const vessels = e.components.filter((c) => c.state.mixture && c.state.mixture.volumeMl > 0);
  const results = [
    ...vessels.map((c) => {
      const m = c.state.mixture!;
      const ph = computePH(m);
      return `${c.name}: ${m.volumeMl.toFixed(1)} mL at ${m.temperature.toFixed(1)} °C${ph != null ? `, pH ${ph.toFixed(2)}` : ""}`;
    }),
    ...stats.map((s) => `${s.column.label}: ${s.first.toPrecision(4)} → ${s.last.toPrecision(4)} ${s.column.unit} (min ${s.min.toPrecision(4)}, max ${s.max.toPrecision(4)})`),
  ];
  return {
    ...current,
    title: pick(current.title, e.title),
    equipment: pick(current.equipment, eq.map((x) => `• ${x}`).join("\n")),
    materials: pick(current.materials, chems.map((x) => `• ${x}`).join("\n")),
    procedure: pick(current.procedure, actions.slice(0, 25).map((a, i) => `${i + 1}. ${a.message}`).join("\n")),
    observations: pick(current.observations, obs.slice(0, 30).map((o) => `[${mmss(o.t)}] ${o.message}`).join("\n")),
    measurements: pick(current.measurements, stats.map((s) => `${s.column.label}: ${s.n} readings, mean ${s.mean.toPrecision(4)} ${s.column.unit}`).join("\n")),
    results: pick(current.results, [...reactions.map((r) => `${r.vessel}: ${r.equation} (${r.type}, ΔT ${r.deltaT >= 0 ? "+" : ""}${r.deltaT.toFixed(2)} °C)`), ...results].join("\n")),
    safety: pick(current.safety, [...safety, "This experiment was performed in a virtual, educational simulation."].join("\n")),
  };
}
