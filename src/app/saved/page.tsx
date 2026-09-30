"use client";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { useExperiments } from "@/hooks/useExperiments";
import { ExperimentCard, EmptyState } from "@/components/experiments/ExperimentCard";
import type { Experiment } from "@/lib/engine/types";

function Group({ title, list }: { title: string; list: Experiment[] }) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-lg font-semibold">
        {title} <span className="text-sm font-normal text-slate-400">({list.length})</span>
      </h2>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((e) => (
            <ExperimentCard key={e.id} e={e} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Nothing saved yet.</p>
      )}
    </section>
  );
}

export default function SavedLabs() {
  const items = useExperiments();
  const list = items ?? [];
  return (
    <PageShell title="Saved Labs" subtitle="Workbench setups saved in this browser, grouped by laboratory.">
      {items && list.length === 0 ? (
        <EmptyState title="No saved labs" text="Press Save in the workspace to keep a lab setup here." action={<Link className="btn btn-primary" href="/lab">Open the workspace</Link>} />
      ) : (
        <>
          <Group title="Chemistry labs" list={list.filter((e) => e.category === "chemistry")} />
          <Group title="Physics labs" list={list.filter((e) => e.category === "physics")} />
        </>
      )}
    </PageShell>
  );
}
