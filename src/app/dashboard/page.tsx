"use client";
import Link from "next/link";
import { Atom, BarChart3, CheckCircle2, FileText, FlaskConical, PenLine, Plus, Clock } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { useExperiments, timeAgo } from "@/hooks/useExperiments";
import { ExperimentCard, EmptyState } from "@/components/experiments/ExperimentCard";
import { TemplateCard } from "@/components/experiments/TemplateCard";
import { TEMPLATES } from "@/lib/templates";
import { useSettings } from "@/store/settingsStore";
import { ChartView } from "@/components/charts/ChartView";
import { deriveColumns } from "@/lib/engine/columns";
import type { Experiment } from "@/lib/engine/types";

function Stat({ icon: Icon, label, value, tone }: { icon: typeof FlaskConical; label: string; value: number; tone: string }) {
  return (
    <div className="panel flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={18} />
      </span>
      <div>
        <div className="text-2xl font-semibold leading-none text-ink">{value}</div>
        <div className="mt-1 text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const items = useExperiments();
  const name = useSettings((s) => s.profile.name);
  const list = items ?? [];
  const completed = list.filter((e) => e.status === "completed");
  const drafts = list.filter((e) => e.status === "draft");
  const withCharts = list.filter((e) => e.charts.some((c) => c.y.length) && e.dataRows.length) as (Experiment & { columnMeta?: Record<string, { label: string; unit: string }> })[];

  return (
    <PageShell
      title={`Welcome back, ${name}`}
      subtitle="Your experiments, reports and data at a glance."
      actions={
        <>
          <Link href="/lab?mode=physics" className="btn">
            <Atom size={14} /> New physics lab
          </Link>
          <Link href="/lab" className="btn btn-primary">
            <Plus size={14} /> New chemistry lab
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={FlaskConical} label="Saved experiments" value={list.length} tone="bg-primary-50 text-primary" />
        <Stat icon={CheckCircle2} label="Completed" value={completed.length} tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={PenLine} label="Drafts" value={drafts.length} tone="bg-amber-50 text-amber-600" />
        <Stat icon={FileText} label="Reports ready" value={list.filter((e) => e.dataRows.length || e.timeline.length > 2).length} tone="bg-violet-50 text-violet-600" />
        <Stat icon={BarChart3} label="Charts" value={list.reduce((a, e) => a + e.charts.length, 0)} tone="bg-secondary-50 text-secondary-600" />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent experiments</h2>
          <Link href="/experiments" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        {items && list.length === 0 ? (
          <EmptyState title="No experiments yet" text="Start from a template or open a blank workbench. Saved experiments appear here." action={<Link href="/templates" className="btn btn-primary">Browse templates</Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {list.slice(0, 4).map((e) => (
              <ExperimentCard key={e.id} e={e} />
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Charts</h2>
          {withCharts.length === 0 ? (
            <EmptyState title="No charts yet" text="Run an experiment to log data — its charts will show up here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {withCharts.slice(0, 4).map((e) => {
                const c = e.charts.find((x) => x.y.length)!;
                return (
                  <Link key={e.id} href={`/data?id=${e.id}`} className="panel p-3 hover:border-primary/40">
                    <div className="mb-1 truncate text-sm font-semibold">{c.title}</div>
                    <div className="mb-2 truncate text-xs text-slate-500">{e.title}</div>
                    <ChartView config={c} rows={e.dataRows} columns={deriveColumns(e.dataRows, e.columnMeta ?? {})} height={170} animate={false} />
                  </Link>
                );
              })}
            </div>
          )}
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold">Reports</h2>
          <div className="panel divide-y divide-slate-100">
            {list.slice(0, 6).map((e) => (
              <Link key={e.id} href={`/reports/${e.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <FileText size={16} className="text-slate-400" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{e.title}</div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock size={10} /> {timeAgo(e.updatedAt)}
                  </div>
                </div>
                <span className="text-xs font-medium text-primary">PDF</span>
              </Link>
            ))}
            {list.length === 0 && <div className="px-4 py-8 text-center text-xs text-slate-400">Reports are generated from saved experiments.</div>}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Suggested templates</h2>
          <Link href="/templates" className="text-sm text-primary hover:underline">
            All templates
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["acid-base-titration", "ohms-law", "precipitation", "lens-experiment"].map((id) => {
            const t = TEMPLATES.find((x) => x.id === id)!;
            return <TemplateCard key={t.id} t={t} />;
          })}
        </div>
      </section>
    </PageShell>
  );
}
