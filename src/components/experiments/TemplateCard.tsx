"use client";
import Link from "next/link";
import { Atom, Clock, FlaskConical } from "lucide-react";
import type { ExperimentTemplate } from "@/lib/templates";
import { getDefinition } from "@/lib/engine/registry";
import "@/lib/catalog";
import { LabIcon } from "@/components/lab/LabIcon";

export function TemplateCard({ t }: { t: ExperimentTemplate }) {
  const types = [...new Set(t.components.map((c) => c.type))].slice(0, 5);
  const Icon = t.category === "chemistry" ? FlaskConical : Atom;
  return (
    <Link href={`/lab?template=${t.id}`} className="panel group flex flex-col p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-float">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.category === "chemistry" ? "bg-primary-50 text-primary" : "bg-secondary-50 text-secondary-600"}`}>
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink group-hover:text-primary">{t.name}</div>
          <div className="text-[11px] text-slate-500">{t.topic}</div>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-slate-600">{t.description}</p>
      <div className="mt-3 flex items-center gap-1 text-slate-400">
        {types.map((ty) => {
          const d = getDefinition(ty);
          return d ? <LabIcon key={ty} archetype={d.visual.archetype} variant={d.visual.variant} size={22} /> : null;
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
        <span className="chip">{t.level}</span>
        <span className="inline-flex items-center gap-1">
          <Clock size={11} /> {t.duration}
        </span>
        <span className="ml-auto font-semibold text-primary opacity-0 transition group-hover:opacity-100">Start →</span>
      </div>
    </Link>
  );
}
