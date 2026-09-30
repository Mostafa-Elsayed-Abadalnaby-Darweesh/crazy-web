"use client";
import { Camera, Trash2 } from "lucide-react";
import { useLab } from "@/store/labStore";
import { getDefinition } from "@/lib/engine/registry";
import { mmss } from "./Timeline";

export function Measurements() {
  const s = useLab();
  const live = s.liveReadings.filter((r) => {
    const c = s.components.find((x) => x.id === r.componentId);
    const def = c && getDefinition(c.type);
    return def?.roles.includes("sensor") || def?.roles.includes("container") || def?.roles.includes("optical") || r.reading.log;
  });
  return (
    <div className="grid h-full grid-cols-1 divide-x divide-slate-100 md:grid-cols-2">
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="section-title">Live instruments ({live.length})</span>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <label className="flex items-center gap-1">
              <input type="checkbox" checked={s.autoLog} onChange={(e) => s.setAutoLog(e.target.checked)} /> Auto-log every
            </label>
            <select className="rounded border border-slate-200 px-1 py-0.5" value={s.logInterval} onChange={(e) => s.setLogInterval(Number(e.target.value))}>
              {[0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10].map((v) => (
                <option key={v} value={v}>
                  {v} s
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={s.captureMeasurements}>
              <Camera size={12} /> Capture
            </button>
          </div>
        </div>
        <div className="scrollbar-thin grid flex-1 auto-rows-min grid-cols-2 gap-1.5 overflow-y-auto p-3 lg:grid-cols-3">
          {live.length === 0 && <div className="col-span-full py-6 text-center text-xs text-slate-400">No instruments on the bench.</div>}
          {live.map((r, i) => (
            <button key={i} onClick={() => s.select([r.componentId])} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:border-primary">
              <div className="truncate text-[10px] uppercase tracking-wide text-slate-400">{r.source}</div>
              <div className="truncate text-[11px] text-slate-600">{r.reading.label}</div>
              <div className="font-mono text-[14px] font-semibold text-ink">
                {r.reading.value.toFixed(r.reading.precision ?? 2)} <span className="text-[11px] font-normal text-slate-500">{r.reading.unit}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
          <span className="section-title">Captured measurements ({s.measurements.length})</span>
        </div>
        <div className="scrollbar-thin flex-1 overflow-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 bg-slate-50 text-left text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-1.5">Measurement</th>
                <th className="px-2 py-1.5">Source</th>
                <th className="px-2 py-1.5 text-right">Value</th>
                <th className="px-2 py-1.5">Unit</th>
                <th className="px-2 py-1.5">Time</th>
                <th className="px-2 py-1.5">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {s.measurements
                .slice()
                .reverse()
                .map((m) => (
                  <tr key={m.id} className="border-t border-slate-100">
                    <td className="px-3 py-1">{m.name}</td>
                    <td className="px-2 py-1 text-slate-500">{m.source}</td>
                    <td className="px-2 py-1 text-right font-mono">{m.value.toFixed(3)}</td>
                    <td className="px-2 py-1">{m.unit}</td>
                    <td className="px-2 py-1 font-mono">{mmss(m.t)}</td>
                    <td className="px-2 py-1 text-slate-400">{new Date(m.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          {s.measurements.length === 0 && <div className="py-6 text-center text-xs text-slate-400">Press Capture to record a snapshot of every instrument.</div>}
        </div>
        {s.measurements.length > 0 && (
          <div className="border-t border-slate-100 px-3 py-1.5 text-right">
            <button className="btn btn-ghost btn-sm text-red-600" onClick={s.clearData}>
              <Trash2 size={12} /> Clear data
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
