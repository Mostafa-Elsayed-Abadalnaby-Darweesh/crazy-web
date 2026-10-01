import type { ChartConfig, DataColumn, DataRow, Experiment, ReportMeta } from "@/lib/engine/types";
import { deriveColumns } from "@/lib/engine/columns";
import { autoNotebook, chemicalList, columnStats, equipmentList, reactionsOf, regression, type ColumnStats } from "./build";
import { EMPTY_NOTEBOOK } from "@/store/labStore";

export type ExperimentDoc = Experiment & { columnMeta?: Record<string, { label: string; unit: string }> };

export interface ReportModel {
  meta: ReportMeta;
  title: string;
  category: string;
  snapshot?: string;
  objective: string;
  theory: string;
  hypothesis: string;
  equipment: string[];
  chemicals: string[];
  procedure: string;
  observations: string[];
  measurements: { name: string; source: string; value: string; unit: string; time: string }[];
  columns: DataColumn[];
  rows: DataRow[];
  totalRows: number;
  charts: ChartConfig[];
  stats: ColumnStats[];
  calculations: string;
  fits: { chart: string; x: string; y: string; slope: number; intercept: number; r2: number; n: number }[];
  results: string;
  reactions: ReturnType<typeof reactionsOf>;
  discussion: string;
  conclusion: string;
  safety: string;
  duration: number;
}

const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

/** Evenly sample rows so tables stay readable in print. */
export function sampleRows(rows: DataRow[], max = 30): DataRow[] {
  if (rows.length <= max) return rows;
  const out: DataRow[] = [];
  for (let i = 0; i < max; i++) out.push(rows[Math.round((i * (rows.length - 1)) / (max - 1))]);
  return out;
}

export function buildReportModel(e: ExperimentDoc): ReportModel {
  const meta = e.columnMeta ?? {};
  const nb = autoNotebook(e, { ...EMPTY_NOTEBOOK, ...e.notebook });
  const columns = deriveColumns(e.dataRows, meta);
  const label = (id: string) => columns.find((c) => c.id === id)?.label ?? id;
  const fits = e.charts.flatMap((c) =>
    c.y
      .map((y) => {
        const f = regression(e, c.x, y);
        return f ? { chart: c.title, x: label(c.x), y: label(y), ...f } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x != null),
  );
  const observations = [
    ...(nb.observations ? nb.observations.split("\n").filter(Boolean) : []),
    ...e.timeline.filter((t) => t.kind === "observation" && !nb.observations.includes(t.message)).map((t) => `[${mmss(t.t)}] ${t.message}`),
  ];
  return {
    meta: { ...e.report, reportTitle: e.report.reportTitle || e.title },
    title: e.report.reportTitle || nb.title || e.title,
    category: e.category === "chemistry" ? "Chemistry" : "Physics",
    snapshot: e.thumbnail,
    objective: nb.objective,
    theory: nb.theory,
    hypothesis: nb.hypothesis,
    equipment: equipmentList(e),
    chemicals: e.category === "chemistry" || chemicalList(e).length ? chemicalList(e) : e.components.map((c) => c.name),
    procedure: nb.procedure,
    observations: [...new Set(observations)].slice(0, 40),
    measurements: e.measurements.slice(-40).map((m) => ({ name: m.name, source: m.source, value: m.value.toPrecision(5), unit: m.unit, time: mmss(m.t) })),
    columns,
    rows: sampleRows(e.dataRows),
    totalRows: e.dataRows.length,
    charts: e.charts.filter((c) => c.y.length),
    stats: columnStats(e, meta),
    calculations: nb.calculations,
    fits,
    results: nb.results,
    reactions: reactionsOf(e),
    discussion: nb.discussion,
    conclusion: nb.conclusion,
    safety: nb.safety,
    duration: e.workspaceState?.simTime ?? 0,
  };
}
