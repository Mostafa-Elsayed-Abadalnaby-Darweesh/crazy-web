"use client";
import { Plus } from "lucide-react";
import { useLab } from "@/store/labStore";
import { ChartEditor } from "@/components/charts/ChartEditor";
import { useColumns } from "./DataTable";

export function ChartsPanel() {
  const s = useLab();
  const columns = useColumns(s.dataRows, s.columnMeta);
  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[12px] text-slate-500">Charts update live as measurements are logged. Choose axes and chart type for each.</span>
        <button className="btn btn-primary btn-sm" onClick={() => s.addChart({ title: "New chart", x: "t", y: columns.filter((c) => c.id !== "t").slice(0, 1).map((c) => c.id) })}>
          <Plus size={12} /> Add chart
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {s.charts.map((c) => (
          <ChartEditor key={c.id} config={c} rows={s.dataRows} columns={columns} onChange={(p) => s.updateChart(c.id, p)} onDelete={() => s.deleteChart(c.id)} height={Math.max(160, s.bottomHeight - 150)} />
        ))}
        {s.charts.length === 0 && <div className="col-span-full py-8 text-center text-xs text-slate-400">No charts yet — add one to plot your data.</div>}
      </div>
    </div>
  );
}
