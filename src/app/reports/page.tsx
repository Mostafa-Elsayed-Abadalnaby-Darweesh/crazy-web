"use client";
import Link from "next/link";
import { FileText, Download } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useExperiments, timeAgo } from "@/hooks/useExperiments";
import { EmptyState, StatusBadge } from "@/components/experiments/ExperimentCard";

export default function ReportsPage() {
  const items = useExperiments();
  return (
    <PageShell title="Reports" subtitle="Generate a professional academic report from any saved experiment, then print or download it as PDF.">
      {items && items.length === 0 ? (
        <EmptyState title="No reports yet" text="Reports are generated automatically from saved experiments." action={<Link className="btn btn-primary" href="/templates">Start an experiment</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(items ?? []).map((e) => (
            <Link key={e.id} href={`/reports/${e.id}`} className="panel flex gap-4 p-4 hover:border-primary/40 hover:shadow-float">
              <div className="flex h-28 w-20 shrink-0 flex-col gap-1 rounded border border-slate-200 bg-white p-2 shadow-sm">
                <div className="h-1.5 w-10 rounded bg-slate-800" />
                <div className="h-1 w-14 rounded bg-slate-200" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {e.thumbnail ? <img src={e.thumbnail} alt="" className="mt-1 h-8 w-full rounded-sm object-cover" /> : <div className="mt-1 h-8 rounded-sm bg-slate-100" />}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-1 rounded bg-slate-100" style={{ width: `${90 - i * 12}%` }} />
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText size={14} className="text-primary" />
                  <span className="truncate text-sm font-semibold">{e.report?.reportTitle || e.title}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <StatusBadge status={e.status} /> {e.category} · {timeAgo(e.updatedAt)}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {e.timeline.length} timeline events · {e.dataRows.length} data rows · {e.charts.length} charts
                </div>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Download size={12} /> Open & export PDF
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
