"use client";
import { Trash2 } from "lucide-react";
import type { ChartConfig, ChartKind, DataColumn, DataRow } from "@/lib/engine/types";
import { ChartView, SERIES_COLORS } from "./ChartView";

export function ChartEditor({ config, rows, columns, onChange, onDelete, height = 220 }: { config: ChartConfig; rows: DataRow[]; columns: DataColumn[]; onChange: (p: Partial<ChartConfig>) => void; onDelete: () => void; height?: number }) {
  const kinds: ChartKind[] = ["line", "bar", "scatter", "area"];
  return (
    <div className="panel p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <input className="min-w-0 flex-1 rounded border border-transparent px-1 text-sm font-semibold hover:border-slate-200 focus:border-primary focus:outline-none" value={config.title} onChange={(e) => onChange({ title: e.target.value })} />
        <div className="flex rounded-md bg-slate-100 p-0.5">
          {kinds.map((k) => (
            <button key={k} onClick={() => onChange({ kind: k })} className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ${config.kind === k ? "bg-white text-primary shadow-sm" : "text-slate-500"}`}>
              {k}
            </button>
          ))}
        </div>
        <button className="icon-btn h-7 w-7 text-slate-400 hover:text-red-600" onClick={onDelete} title="Delete chart">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        <label className="flex items-center gap-1">
          <span className="font-semibold text-slate-500">X axis</span>
          <select className="rounded border border-slate-200 px-1 py-0.5" value={config.x} onChange={(e) => onChange({ x: e.target.value })}>
            {columns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <span className="font-semibold text-slate-500">Y axis</span>
        {columns
          .filter((c) => c.id !== config.x)
          .map((c) => {
            const idx = config.y.indexOf(c.id);
            const on = idx >= 0;
            return (
              <button key={c.id} onClick={() => onChange({ y: on ? config.y.filter((y) => y !== c.id) : [...config.y, c.id] })} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${on ? "border-slate-300 bg-white text-ink" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                {on && <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[idx % 8] }} />}
                {c.label}
              </button>
            );
          })}
      </div>
      <ChartView config={config} rows={rows} columns={columns} height={height} animate={false} />
    </div>
  );
}
