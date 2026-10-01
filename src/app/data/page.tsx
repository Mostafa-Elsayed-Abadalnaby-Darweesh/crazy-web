"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FlaskConical, Plus, Sigma } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useExperiments } from "@/hooks/useExperiments";
import { saveExperiment } from "@/lib/storage/experiments";
import { DataTable } from "@/components/lab/bottom/DataTable";
import { ChartEditor } from "@/components/charts/ChartEditor";
import { EmptyState } from "@/components/experiments/ExperimentCard";
import { deriveColumns } from "@/lib/engine/columns";
import { columnStats, regression } from "@/lib/report/build";
import { uid } from "@/lib/engine/factory";
import type { ChartConfig, DataRow } from "@/lib/engine/types";
import type { ExperimentDoc } from "@/lib/report/model";

function DataInner() {
  const items = useExperiments() as ExperimentDoc[] | null;
  const params = useSearchParams();
  const router = useRouter();
  const [exp, setExp] = useState<ExperimentDoc | null>(null);
  const withData = useMemo(() => (items ?? []).filter((e) => e.dataRows.length || e.charts.length), [items]);

  useEffect(() => {
    if (!items) return;
    const id = params.get("id");
    setExp((id && items.find((e) => e.id === id)) || withData[0] || items[0] || null);
  }, [items, params, withData]);

  const commit = (patch: Partial<ExperimentDoc>) => {
    if (!exp) return;
    const next = { ...exp, ...patch, updatedAt: Date.now() };
    setExp(next);
    saveExperiment(next);
  };

  if (!items) return null;
  if (!exp) return <EmptyState title="No data yet" text="Run and save an experiment to analyse its data here." action={<Link className="btn btn-primary" href="/templates">Start an experiment</Link>} />;

  const meta = exp.columnMeta ?? {};
  const columns = deriveColumns(exp.dataRows, meta);
  const stats = columnStats(exp, meta);
  const setRows = (dataRows: DataRow[]) => commit({ dataRows });
  const setCharts = (charts: ChartConfig[]) => commit({ charts });

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <select className="input w-80" value={exp.id} onChange={(e) => router.replace(`/data?id=${e.target.value}`)}>
          {items.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({e.dataRows.length} rows)
            </option>
          ))}
        </select>
        <Link className="btn" href={`/lab/${exp.id}`}>
          <FlaskConical size={14} /> Open in workspace
        </Link>
        <Link className="btn" href={`/reports/${exp.id}`}>
          Report
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {stats.slice(0, 8).map((s) => (
          <div key={s.column.id} className="panel p-3">
            <div className="truncate text-[11px] uppercase tracking-wide text-slate-500">{s.column.label}</div>
            <div className="mt-1 font-mono text-lg font-semibold">
              {s.last.toPrecision(4)} <span className="text-xs font-normal text-slate-500">{s.column.unit}</span>
            </div>
            <div className="text-[11px] text-slate-500">
              min {s.min.toPrecision(3)} · max {s.max.toPrecision(3)} · mean {s.mean.toPrecision(3)} · n {s.n}
            </div>
          </div>
        ))}
      </div>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Charts</h2>
          <button className="btn btn-primary btn-sm" onClick={() => setCharts([...exp.charts, { id: uid("chart-"), title: "New chart", kind: "line", x: "t", y: columns.filter((c) => c.id !== "t").slice(0, 1).map((c) => c.id) }])}>
            <Plus size={12} /> Add chart
          </button>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {exp.charts.map((c) => {
            const fits = c.y.map((y) => ({ y, f: regression(exp, c.x, y) })).filter((x) => x.f);
            return (
              <div key={c.id}>
                <ChartEditor config={c} rows={exp.dataRows} columns={columns} height={280} onChange={(p) => setCharts(exp.charts.map((x) => (x.id === c.id ? { ...x, ...p } : x)))} onDelete={() => setCharts(exp.charts.filter((x) => x.id !== c.id))} />
                {fits.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-3 px-1 text-[11px] text-slate-500">
                    <Sigma size={12} />
                    {fits.map(({ y, f }) => (
                      <span key={y}>
                        {columns.find((col) => col.id === y)?.label}: slope {f!.slope.toPrecision(4)}, intercept {f!.intercept.toPrecision(4)}, R² {f!.r2.toFixed(3)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {exp.charts.length === 0 && <p className="text-sm text-slate-400">No charts — add one above.</p>}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Data table</h2>
        <div className="panel h-[520px] overflow-hidden">
          <DataTable
            title={exp.title}
            rows={exp.dataRows}
            columnMeta={meta}
            onAddRow={() => setRows([...exp.dataRows, { id: uid("row-"), t: exp.dataRows.at(-1)?.t ?? 0, values: {} }])}
            onSetValue={(rowId, col, v) => setRows(exp.dataRows.map((r) => (r.id !== rowId ? r : col === "t" ? { ...r, t: v ?? 0 } : { ...r, values: { ...r.values, [col]: v } })))}
            onSetObservation={(rowId, text) => setRows(exp.dataRows.map((r) => (r.id === rowId ? { ...r, observation: text } : r)))}
            onDeleteRow={(id) => setRows(exp.dataRows.filter((r) => r.id !== id))}
            onAddColumn={(label, unit) => commit({ columnMeta: { ...meta, [label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_")]: { label, unit } } })}
          />
        </div>
      </section>
    </>
  );
}

export default function DataPage() {
  return (
    <PageShell title="Data & Charts" subtitle="Analyse logged measurements, edit data, fit trends and export CSV.">
      <Suspense>
        <DataInner />
      </Suspense>
    </PageShell>
  );
}
