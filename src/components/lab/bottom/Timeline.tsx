"use client";
import { useState } from "react";
import { Activity, AlertTriangle, Eye, FlaskRound, Gauge, MousePointerClick, Plus, Settings, Trash2 } from "lucide-react";
import { useLab } from "@/store/labStore";
import type { TimelineKind } from "@/lib/engine/types";

export const KIND_STYLE: Record<TimelineKind, { icon: typeof Activity; cls: string; label: string }> = {
  system: { icon: Settings, cls: "text-slate-500 bg-slate-100", label: "System" },
  action: { icon: MousePointerClick, cls: "text-primary bg-primary-50", label: "Action" },
  reaction: { icon: FlaskRound, cls: "text-violet-600 bg-violet-50", label: "Reaction" },
  measurement: { icon: Gauge, cls: "text-teal-700 bg-teal-50", label: "Measurement" },
  observation: { icon: Eye, cls: "text-amber-700 bg-amber-50", label: "Observation" },
  safety: { icon: AlertTriangle, cls: "text-red-600 bg-red-50", label: "Safety" },
};

export const mmss = (t: number) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export function Timeline() {
  const timeline = useLab((s) => s.timeline);
  const addObservation = useLab((s) => s.addObservation);
  const del = useLab((s) => s.deleteTimelineEvent);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<TimelineKind | "all">("all");
  const items = timeline.filter((e) => filter === "all" || e.kind === filter).slice().reverse();
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
        <form
          className="flex min-w-[280px] flex-1 gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            addObservation(text);
            setText("");
          }}
        >
          <input className="input h-8 text-[12.5px]" placeholder="Add a manual observation (e.g. 'Solution turned pale pink')" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary h-8 shrink-0" type="submit">
            <Plus size={14} /> Add
          </button>
        </form>
        <div className="flex flex-wrap gap-1">
          {(["all", "action", "reaction", "observation", "measurement", "safety", "system"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-2 py-0.5 text-[11px] capitalize ${filter === k ? "border-primary bg-primary text-white" : "border-slate-200 text-slate-600"}`}>
              {k}
            </button>
          ))}
        </div>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
        {items.length === 0 && <div className="py-8 text-center text-xs text-slate-400">Every action is recorded here automatically.</div>}
        <ol className="relative ml-2 space-y-1 border-l border-slate-200 pl-5">
          {items.map((e) => {
            const K = KIND_STYLE[e.kind];
            return (
              <li key={e.id} className="group relative flex items-start gap-2 text-[12.5px]">
                <span className={`absolute -left-[30px] top-0 flex h-[18px] w-[18px] items-center justify-center rounded-full ${K.cls}`}>
                  <K.icon size={10} />
                </span>
                <span className="w-12 shrink-0 font-mono text-[11px] text-slate-400">{mmss(e.t)}</span>
                <span className={`flex-1 ${e.kind === "safety" ? "font-medium text-red-600" : "text-slate-700"}`}>{e.message}</span>
                <button className="opacity-0 transition group-hover:opacity-100" onClick={() => del(e.id)} title="Remove">
                  <Trash2 size={12} className="text-slate-400 hover:text-red-500" />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
