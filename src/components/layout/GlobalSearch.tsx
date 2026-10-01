"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Atom, FlaskConical, FileText, LayoutTemplate, Search, Wrench } from "lucide-react";
import "@/lib/catalog";
import { allDefinitions } from "@/lib/engine/registry";
import { CHEMICALS, prettyFormula } from "@/lib/chemistry/chemicals";
import { ELEMENTS } from "@/lib/chemistry/periodicTable";
import { TEMPLATES } from "@/lib/templates";
import { listExperiments } from "@/lib/storage/experiments";
import type { Experiment } from "@/lib/engine/types";

interface Result {
  id: string;
  group: string;
  label: string;
  hint: string;
  icon: typeof Search;
  go: () => void;
}

export function GlobalSearch({ onPickEquipment, onPickChemical }: { onPickEquipment?: (type: string) => void; onPickChemical?: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const ref = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) setExperiments(listExperiments());
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const m = (s: string) => s.toLowerCase().includes(term);
    const out: Result[] = [];
    for (const t of TEMPLATES) if (m(t.name) || m(t.topic)) out.push({ id: `t-${t.id}`, group: "Templates", label: t.name, hint: t.category, icon: LayoutTemplate, go: () => router.push(`/lab?template=${t.id}`) });
    for (const e of experiments) if (m(e.title)) out.push({ id: `e-${e.id}`, group: "Experiments", label: e.title, hint: e.category, icon: FileText, go: () => router.push(`/lab/${e.id}`) });
    for (const d of allDefinitions()) if (m(d.label) || d.keywords?.some(m)) out.push({ id: `d-${d.type}`, group: "Equipment", label: d.label, hint: d.group, icon: Wrench, go: () => (onPickEquipment ? onPickEquipment(d.type) : router.push(`/lab?add=${d.type}`)) });
    for (const c of CHEMICALS) if (m(c.name) || m(c.formula)) out.push({ id: `c-${c.id}`, group: "Chemicals", label: c.name, hint: prettyFormula(c.formula), icon: FlaskConical, go: () => (onPickChemical ? onPickChemical(c.id) : router.push(`/lab`)) });
    for (const el of ELEMENTS) if (m(el.name) || el.symbol.toLowerCase() === term) out.push({ id: `el-${el.number}`, group: "Elements", label: `${el.name} (${el.symbol})`, hint: `Z = ${el.number}`, icon: Atom, go: () => router.push(`/help#periodic-table`) });
    return out.slice(0, 24);
  }, [q, experiments, router, onPickEquipment, onPickChemical]);

  const pick = (r: Result) => {
    r.go();
    setQ("");
    setOpen(false);
    ref.current?.blur();
  };

  return (
    <div className="relative w-full max-w-[240px]">
      <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, results.length - 1));
          if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          if (e.key === "Enter" && results[active]) pick(results[active]);
          if (e.key === "Escape") ref.current?.blur();
        }}
        placeholder="Search experiments, equipment…"
        className="input h-8 pl-8 pr-12 text-[13px]"
      />
      <span className="kbd absolute right-2 top-1/2 -translate-y-1/2">Ctrl K</span>
      {open && results.length > 0 && (
        <div className="panel scrollbar-thin absolute left-0 right-0 top-10 z-[90] max-h-96 overflow-auto p-1 shadow-float">
          {results.map((r, i) => (
            <div key={r.id}>
              {(i === 0 || results[i - 1].group !== r.group) && <div className="section-title px-2 pb-1 pt-2">{r.group}</div>}
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(r)}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${i === active ? "bg-primary-50 text-primary" : "text-slate-700 hover:bg-slate-50"}`}
              >
                <r.icon size={14} className="shrink-0 text-slate-400" />
                <span className="flex-1 truncate">{r.label}</span>
                <span className="text-[11px] text-slate-400">{r.hint}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
