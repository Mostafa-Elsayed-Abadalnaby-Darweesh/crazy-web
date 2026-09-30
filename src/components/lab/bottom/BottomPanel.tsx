"use client";
import { useRef } from "react";
import { BookOpen, ChevronDown, ChevronUp, Clapperboard, Gauge, History, LineChart, Table2 } from "lucide-react";
import { useLab, type BottomTab } from "@/store/labStore";
import { Timeline } from "./Timeline";
import { Measurements } from "./Measurements";
import { DataTable } from "./DataTable";
import { ChartsPanel } from "./ChartsPanel";
import { Notebook } from "./Notebook";
import { RecordingPanel } from "./RecordingPanel";

const TABS: { id: BottomTab; label: string; icon: typeof History }[] = [
  { id: "timeline", label: "Timeline", icon: History },
  { id: "measurements", label: "Measurements", icon: Gauge },
  { id: "data", label: "Data Table", icon: Table2 },
  { id: "charts", label: "Charts", icon: LineChart },
  { id: "notebook", label: "Notebook", icon: BookOpen },
  { id: "recording", label: "Recording", icon: Clapperboard },
];

export function BottomPanel() {
  const s = useLab();
  const drag = useRef<{ y: number; h: number } | null>(null);
  const counts: Partial<Record<BottomTab, number>> = { timeline: s.timeline.length, measurements: s.measurements.length, data: s.dataRows.length, charts: s.charts.length, recording: s.recording.length };

  return (
    <div className="flex shrink-0 flex-col border-t border-slate-200 bg-white" style={{ height: s.bottomOpen ? s.bottomHeight : 38 }}>
      {s.bottomOpen && (
        <div
          className="h-1 cursor-row-resize bg-transparent hover:bg-primary/30"
          onMouseDown={(e) => {
            drag.current = { y: e.clientY, h: s.bottomHeight };
            const move = (ev: MouseEvent) => drag.current && s.setBottomHeight(drag.current.h + (drag.current.y - ev.clientY));
            const up = () => {
              drag.current = null;
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
        />
      )}
      <div className="flex h-[34px] shrink-0 items-center gap-0.5 border-b border-slate-100 px-2">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => s.setBottomTab(t.id)} className={`flex h-full items-center gap-1.5 border-b-2 px-2.5 text-[12px] font-medium ${s.bottomOpen && s.bottomTab === t.id ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-ink"}`}>
            <t.icon size={13} />
            {t.label}
            {counts[t.id] ? <span className="rounded-full bg-slate-100 px-1.5 text-[10px] text-slate-500">{counts[t.id]}</span> : null}
            {t.id === "recording" && s.recStatus === "recording" && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
          </button>
        ))}
        <button className="icon-btn ml-auto h-7 w-7" onClick={() => s.setBottomOpen(!s.bottomOpen)} title={s.bottomOpen ? "Collapse panel" : "Expand panel"}>
          {s.bottomOpen ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
      </div>
      {s.bottomOpen && (
        <div className="min-h-0 flex-1">
          {s.bottomTab === "timeline" && <Timeline />}
          {s.bottomTab === "measurements" && <Measurements />}
          {s.bottomTab === "data" && (
            <DataTable
              title={s.title}
              rows={s.dataRows}
              columnMeta={s.columnMeta}
              onAddRow={s.addDataRow}
              onSetValue={s.setDataValue}
              onSetObservation={(id, text) => s.updateDataRow(id, { observation: text })}
              onDeleteRow={s.deleteDataRow}
              onAddColumn={s.addColumn}
            />
          )}
          {s.bottomTab === "charts" && <ChartsPanel />}
          {s.bottomTab === "notebook" && <Notebook />}
          {s.bottomTab === "recording" && <RecordingPanel />}
        </div>
      )}
    </div>
  );
}
