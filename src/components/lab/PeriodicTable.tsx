"use client";
import { useState } from "react";
import { ELEMENTS, CATEGORY_COLORS, gridPosition, type ElementData } from "@/lib/chemistry/periodicTable";

export function ElementDetails({ e, onAdd }: { e: ElementData; onAdd?: (chemId: string) => void }) {
  const col = CATEGORY_COLORS[e.category];
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg" style={{ background: col.bg, color: col.fg }}>
          <span className="text-[10px] font-semibold">{e.number}</span>
          <span className="text-2xl font-bold leading-none">{e.symbol}</span>
          <span className="text-[9px]">{e.mass}</span>
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold">{e.name}</div>
          <div className="text-xs" style={{ color: col.fg }}>{col.label}</div>
          <div className="mt-0.5 text-xs text-slate-500">State at 25 °C: {e.state}</div>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
        <dt className="text-slate-500">Atomic number</dt>
        <dd className="font-medium">{e.number}</dd>
        <dt className="text-slate-500">Atomic mass</dt>
        <dd className="font-medium">{e.mass} u</dd>
        <dt className="text-slate-500">Group</dt>
        <dd className="font-medium">{e.group ?? "f-block"}</dd>
        <dt className="text-slate-500">Period</dt>
        <dd className="font-medium">{e.period}</dd>
        <dt className="text-slate-500">Block</dt>
        <dd className="font-medium">{e.block}</dd>
        <dt className="text-slate-500">Configuration</dt>
        <dd className="font-mono text-[11px] font-medium">{e.electronConfiguration}</dd>
      </dl>
      <div className="mt-3">
        <div className="section-title mb-1">Common reactions</div>
        <ul className="space-y-1 text-xs text-slate-700">
          {e.reactions.map((r) => (
            <li key={r} className="rounded bg-slate-50 px-2 py-1 font-mono text-[11px]">{r}</li>
          ))}
        </ul>
      </div>
      {e.chemicalId && onAdd && (
        <button className="btn btn-primary btn-sm mt-3 w-full" onClick={() => onAdd(e.chemicalId!)}>
          Use {e.symbol} in experiment
        </button>
      )}
    </div>
  );
}

/** Full 18-column periodic table with the f-block below. */
export function PeriodicTableGrid({ onSelect, selected, cell = 38 }: { onSelect: (e: ElementData) => void; selected?: number; cell?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(18, ${cell}px)`, gridTemplateRows: `repeat(10, ${cell}px)` }}>
        {ELEMENTS.map((e) => {
          const pos = gridPosition(e);
          const col = CATEGORY_COLORS[e.category];
          const active = selected === e.number || hover === e.number;
          return (
            <button
              key={e.number}
              onClick={() => onSelect(e)}
              onMouseEnter={() => setHover(e.number)}
              onMouseLeave={() => setHover(null)}
              title={`${e.name} (${e.number})`}
              className={`flex flex-col items-center justify-center rounded-[4px] border text-center leading-none transition ${active ? "z-10 scale-110 border-primary shadow-float" : "border-transparent"}`}
              style={{ gridColumn: pos.col, gridRow: pos.row + (pos.row >= 9 ? 0 : 0), background: col.bg, color: col.fg }}
            >
              <span style={{ fontSize: cell * 0.2 }}>{e.number}</span>
              <span className="font-bold" style={{ fontSize: cell * 0.36 }}>{e.symbol}</span>
            </button>
          );
        })}
        <div style={{ gridColumn: "3 / span 1", gridRow: 6 }} className="flex items-center justify-center rounded-[4px] bg-pink-50 text-[9px] text-pink-700">57–71</div>
        <div style={{ gridColumn: "3 / span 1", gridRow: 7 }} className="flex items-center justify-center rounded-[4px] bg-fuchsia-50 text-[9px] text-fuchsia-700">89–103</div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(CATEGORY_COLORS).map(([k, v]) => (
          <span key={k} className="inline-flex items-center gap-1 text-[11px] text-slate-600">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: v.bg, border: `1px solid ${v.fg}33` }} /> {v.label}
          </span>
        ))}
      </div>
    </div>
  );
}
