"use client";
import { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { ElementDetails, PeriodicTableGrid } from "@/components/lab/PeriodicTable";
import { ELEMENTS, type ElementData } from "@/lib/chemistry/periodicTable";

const SHORTCUTS: [string, string][] = [
  ["Delete / Backspace", "Delete selected objects or wire"],
  ["Ctrl + Z", "Undo"],
  ["Ctrl + Y / Ctrl + Shift + Z", "Redo"],
  ["Ctrl + C / Ctrl + V", "Copy / paste"],
  ["Ctrl + D", "Duplicate"],
  ["Ctrl + S", "Save experiment"],
  ["Ctrl + A", "Select all"],
  ["Ctrl + G / Ctrl + Shift + G", "Group / ungroup"],
  ["Ctrl + L", "Lock / unlock"],
  ["Ctrl + K", "Global search"],
  ["R / Shift + R", "Rotate 90° / −15°"],
  ["Arrow keys (+ Shift)", "Nudge 1 mm (10 mm)"],
  ["Space + drag", "Pan canvas"],
  ["Mouse wheel", "Zoom (Shift + wheel pans)"],
  ["V / W / H", "Select / wire / pan tool"],
  ["F / 0", "Fit to screen / 100 % zoom"],
  ["Esc", "Clear selection"],
  ["Right click", "Context menu (duplicate, rotate, lock, pour, delete…)"],
  ["Double-click", "Toggle a switch · add library item at centre"],
];

const FAQ: [string, string][] = [
  ["How do I add chemicals to a vessel?", "Drag a chemical from the Chemicals tab onto a beaker or flask, or select the vessel and use “Add chemical” in the Properties panel to choose the exact volume, concentration or mass."],
  ["How do I pour from one vessel to another?", "Right-click a vessel → Pour into → target, or use the Pour section in its Properties. Burettes and separatory funnels dispense continuously into the vessel below when their stopcock is open."],
  ["How do I wire a circuit?", "Choose the Wire tool (W) or simply drag from any blue terminal dot to another. Wires snap to the nearest terminal. Click a wire and press Delete to remove it."],
  ["How is data logged?", "While the experiment runs, every sensor reading is logged at the interval chosen in the Measurements tab. Press Capture for a manual snapshot. Data can be edited, sorted, filtered and exported as CSV."],
  ["How do I produce a report?", "Press Export Report in the workspace. Customise the institution, logo, names and course, then Download PDF or Print."],
  ["Are the simulations accurate?", "They are educational models: stoichiometric reactions with simplified kinetics and thermochemistry, nodal circuit analysis, numerical mechanics and geometric optics. They are designed for learning, not for safety-critical decisions."],
];

export default function HelpPage() {
  const [el, setEl] = useState<ElementData>(ELEMENTS[5]);
  return (
    <PageShell title="Help Centre" subtitle="Everything you need to run experiments in Virtual Lab.">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="panel p-6 lg:col-span-2">
          <h2 className="mb-3 text-base font-semibold">Getting started</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Open the <Link className="text-primary" href="/lab">workspace</Link> or pick a <Link className="text-primary" href="/templates">template</Link>.</li>
            <li>Switch between the Chemistry and Physics labs from the toolbar.</li>
            <li>Drag equipment and chemicals from the Laboratory Library onto the bench.</li>
            <li>Select an object to edit its properties on the right; right-click for more actions.</li>
            <li>Press <b>Run Experiment</b>. Watch the timeline, live instruments, data table and charts update.</li>
            <li>Record your session, write up the notebook, then <b>Export Report</b> as PDF.</li>
          </ol>
          <h2 className="mb-3 mt-8 text-base font-semibold">Frequently asked questions</h2>
          <div className="divide-y divide-slate-100">
            {FAQ.map(([q, a]) => (
              <details key={q} className="py-3">
                <summary className="cursor-pointer text-sm font-medium text-ink">{q}</summary>
                <p className="mt-2 text-sm text-slate-600">{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section id="shortcuts" className="panel p-6">
          <h2 className="mb-3 text-base font-semibold">Keyboard shortcuts</h2>
          <table className="w-full text-sm">
            <tbody>
              {SHORTCUTS.map(([k, v]) => (
                <tr key={k} className="border-t border-slate-100 first:border-0">
                  <td className="py-1.5 pr-3">
                    <span className="kbd">{k}</span>
                  </td>
                  <td className="py-1.5 text-slate-600">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <section id="periodic-table" className="panel mt-6 p-6">
        <h2 className="mb-4 text-base font-semibold">Periodic table</h2>
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="overflow-x-auto">
            <PeriodicTableGrid cell={42} onSelect={setEl} selected={el.number} />
          </div>
          <div className="w-full xl:w-80">
            <ElementDetails e={el} />
          </div>
        </div>
      </section>
      <section className="panel mt-6 border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <b>Safety disclaimer.</b> Virtual Lab is an educational simulation. Hazard warnings, reactions and PPE advice are provided for learning. Never attempt hazardous experiments outside a properly equipped and supervised laboratory.
      </section>
    </PageShell>
  );
}
