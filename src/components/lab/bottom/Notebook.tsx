"use client";
import { Wand2 } from "lucide-react";
import { useLab } from "@/store/labStore";
import type { NotebookSections } from "@/lib/engine/types";
import { autoNotebook } from "@/lib/report/build";

export const NOTEBOOK_FIELDS: { key: keyof NotebookSections; label: string; hint: string }[] = [
  { key: "title", label: "Experiment Title", hint: "e.g. Determination of HCl concentration" },
  { key: "objective", label: "Objective", hint: "What are you trying to find out?" },
  { key: "theory", label: "Theory", hint: "Relevant equations and principles" },
  { key: "hypothesis", label: "Hypothesis", hint: "Your prediction" },
  { key: "materials", label: "Materials", hint: "Chemicals and components" },
  { key: "equipment", label: "Equipment", hint: "Apparatus used" },
  { key: "procedure", label: "Procedure", hint: "Numbered steps" },
  { key: "observations", label: "Observations", hint: "What did you see?" },
  { key: "measurements", label: "Measurements", hint: "Key readings" },
  { key: "results", label: "Results", hint: "Processed results" },
  { key: "calculations", label: "Calculations", hint: "Worked calculations" },
  { key: "charts", label: "Charts", hint: "Describe the graphs and trends" },
  { key: "discussion", label: "Discussion", hint: "Interpretation, sources of error" },
  { key: "conclusion", label: "Conclusion", hint: "Answer the objective" },
  { key: "safety", label: "Safety Notes", hint: "Hazards and precautions" },
];

export function Notebook() {
  const s = useLab();
  const fill = () => s.updateNotebook(autoNotebook({ ...s.toExperiment(), columnMeta: s.columnMeta }, s.notebook));
  return (
    <div className="scrollbar-thin h-full overflow-y-auto p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] text-slate-500">Your digital lab notebook. Sections feed directly into the generated report.</span>
        <button className="btn btn-secondary btn-sm" onClick={fill}>
          <Wand2 size={12} /> Auto-fill empty sections from experiment
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {NOTEBOOK_FIELDS.map((f) => (
          <label key={f.key} className={f.key === "title" ? "lg:col-span-2 xl:col-span-3" : ""}>
            <span className="label">{f.label}</span>
            {f.key === "title" ? (
              <input className="input" placeholder={f.hint} value={s.notebook.title} onChange={(e) => s.updateNotebook({ title: e.target.value })} />
            ) : (
              <textarea className="input min-h-[92px] resize-y text-[12.5px] leading-relaxed" placeholder={f.hint} value={s.notebook[f.key]} onChange={(e) => s.updateNotebook({ [f.key]: e.target.value })} />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
