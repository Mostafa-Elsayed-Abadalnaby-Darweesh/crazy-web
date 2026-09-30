"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search, FileText, Play } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useExperiments, timeAgo } from "@/hooks/useExperiments";
import { ExperimentCard, EmptyState, StatusBadge } from "@/components/experiments/ExperimentCard";

export default function ExperimentsPage() {
  const items = useExperiments();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | "chemistry" | "physics">("all");
  const [status, setStatus] = useState<"all" | "draft" | "completed">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const list = useMemo(
    () => (items ?? []).filter((e) => (cat === "all" || e.category === cat) && (status === "all" || e.status === status) && e.title.toLowerCase().includes(q.toLowerCase())),
    [items, q, cat, status],
  );
  return (
    <PageShell
      title="My Experiments"
      subtitle="Experiment history — every saved lab session with its timeline, data and report."
      actions={
        <Link href="/lab" className="btn btn-primary">
          <Plus size={14} /> New experiment
        </Link>
      }
    >
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8" placeholder="Search experiments…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {(["all", "chemistry", "physics"] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${cat === c ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600"}`}>
            {c}
          </button>
        ))}
        <select className="input w-36 py-1 text-xs" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
          <option value="all">All statuses</option>
          <option value="draft">Drafts</option>
          <option value="completed">Completed</option>
        </select>
        <div className="ml-auto flex rounded-md border border-slate-200 bg-white p-0.5">
          <button className={`icon-btn h-7 w-7 ${view === "grid" ? "icon-btn-active" : ""}`} onClick={() => setView("grid")} aria-label="Grid view">
            <LayoutGrid size={14} />
          </button>
          <button className={`icon-btn h-7 w-7 ${view === "list" ? "icon-btn-active" : ""}`} onClick={() => setView("list")} aria-label="List view">
            <List size={14} />
          </button>
        </div>
      </div>
      {items && list.length === 0 ? (
        <EmptyState title="No experiments found" text="Save an experiment from the workspace (Ctrl + S) and it will appear here." action={<Link href="/templates" className="btn btn-primary">Start from a template</Link>} />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => (
            <ExperimentCard key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Experiment</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Timeline</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Last edited</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium">{e.title}</td>
                  <td className="px-4 py-2 capitalize text-slate-600">{e.category}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-4 py-2 text-slate-600">{e.timeline.length} events</td>
                  <td className="px-4 py-2 text-slate-600">{e.dataRows.length} rows</td>
                  <td className="px-4 py-2 text-slate-500">{timeAgo(e.updatedAt)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/lab/${e.id}`} className="btn btn-sm mr-1">
                      <Play size={12} /> Open
                    </Link>
                    <Link href={`/reports/${e.id}`} className="btn btn-sm">
                      <FileText size={12} /> Report
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
