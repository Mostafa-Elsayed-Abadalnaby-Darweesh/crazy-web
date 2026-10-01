"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { TEMPLATES } from "@/lib/templates";
import { TemplateCard } from "@/components/experiments/TemplateCard";

export default function TemplatesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<"all" | "chemistry" | "physics">("all");
  const list = TEMPLATES.filter((t) => (cat === "all" || t.category === cat) && (t.name + t.topic + t.description).toLowerCase().includes(q.toLowerCase()));
  const groups = (["chemistry", "physics"] as const).filter((c) => cat === "all" || cat === c);
  return (
    <PageShell title="Experiment Templates" subtitle="Ready-made experiments — selecting one places every required component on the workbench.">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative w-72">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-8" placeholder="Search templates…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {(["all", "chemistry", "physics"] as const).map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${cat === c ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600"}`}>
            {c}
          </button>
        ))}
      </div>
      {groups.map((g) => {
        const items = list.filter((t) => t.category === g);
        if (!items.length) return null;
        return (
          <section key={g} className="mb-10">
            <h2 className="mb-3 text-lg font-semibold capitalize">{g}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((t) => (
                <TemplateCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        );
      })}
    </PageShell>
  );
}
