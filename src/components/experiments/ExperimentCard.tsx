"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Atom, CopyPlus, FileText, FlaskConical, MoreHorizontal, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Experiment } from "@/lib/engine/types";
import { deleteExperiment, duplicateExperiment } from "@/lib/storage/experiments";
import { uid } from "@/lib/engine/factory";
import { timeAgo } from "@/hooks/useExperiments";
import { useSettings } from "@/store/settingsStore";

export function StatusBadge({ status }: { status: Experiment["status"] }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{status === "completed" ? "Completed" : "Draft"}</span>;
}

export function ExperimentCard({ e }: { e: Experiment }) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const confirmDelete = useSettings((s) => s.preferences.confirmDelete);
  const Icon = e.category === "chemistry" ? FlaskConical : Atom;
  return (
    <div className="panel group relative flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-float">
      <Link href={`/lab/${e.id}`} className="relative block aspect-[16/9] overflow-hidden border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100">
        {e.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.thumbnail} alt="" className="h-full w-full object-cover object-center transition group-hover:scale-[1.02]" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <Icon size={42} />
          </div>
        )}
        <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${e.category === "chemistry" ? "bg-primary text-white" : "bg-secondary text-white"}`}>
          <Icon size={11} /> {e.category === "chemistry" ? "Chemistry" : "Physics"}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-start gap-2">
          <Link href={`/lab/${e.id}`} className="line-clamp-2 flex-1 text-sm font-semibold text-ink hover:text-primary">
            {e.title}
          </Link>
          <div className="relative">
            <button className="icon-btn h-7 w-7" onClick={() => setMenu(!menu)} aria-label="More actions">
              <MoreHorizontal size={15} />
            </button>
            {menu && (
              <div className="panel absolute right-0 top-8 z-20 w-44 p-1 shadow-float" onMouseLeave={() => setMenu(false)}>
                <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] hover:bg-slate-50" onClick={() => router.push(`/lab/${e.id}`)}>
                  <Play size={13} /> Open
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] hover:bg-slate-50"
                  onClick={() => {
                    duplicateExperiment(e.id, uid("exp-"));
                    setMenu(false);
                  }}
                >
                  <CopyPlus size={13} /> Duplicate
                </button>
                <button className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] hover:bg-slate-50" onClick={() => router.push(`/reports/${e.id}`)}>
                  <FileText size={13} /> Export report
                </button>
                <button
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[13px] text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (!confirmDelete || confirm(`Delete "${e.title}"? This cannot be undone.`)) deleteExperiment(e.id);
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11.5px] text-slate-500">
          <StatusBadge status={e.status} />
          <span>Edited {timeAgo(e.updatedAt)}</span>
        </div>
        <div className="mt-2 flex gap-3 text-[11px] text-slate-400">
          <span>{e.components.length} items</span>
          <span>{e.dataRows.length} data rows</span>
          <span>{e.charts.length} charts</span>
        </div>
        <div className="mt-3 flex gap-1.5 pt-1">
          <Link href={`/lab/${e.id}`} className="btn btn-sm flex-1">
            <Play size={12} /> Open
          </Link>
          <button className="btn btn-sm" title="Duplicate" onClick={() => duplicateExperiment(e.id, uid("exp-"))}>
            <CopyPlus size={12} />
          </button>
          <Link href={`/reports/${e.id}`} className="btn btn-sm" title="Export report">
            <FileText size={12} />
          </Link>
          <button className="btn btn-sm text-red-600" title="Delete" onClick={() => (!confirmDelete || confirm(`Delete "${e.title}"?`)) && deleteExperiment(e.id)}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
      <FlaskConical size={34} className="text-slate-300" />
      <div className="mt-3 text-sm font-semibold text-ink">{title}</div>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
