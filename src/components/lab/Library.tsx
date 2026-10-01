"use client";
import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Atom, ChevronDown, ChevronRight, FlaskConical, Grid3x3, Search, Wrench } from "lucide-react";
import { libraryGroups, allDefinitions } from "@/lib/engine/registry";
import type { ComponentDefinition, LabMode } from "@/lib/engine/types";
import { CHEMICALS, CHEM_CATEGORIES, prettyFormula, type Chemical, type ChemCategory } from "@/lib/chemistry/chemicals";
import { ELEMENTS, CATEGORY_COLORS, type ElementData } from "@/lib/chemistry/periodicTable";
import { useLab } from "@/store/labStore";
import { canvasApi } from "@/lib/canvasRegistry";
import { LabIcon } from "./LabIcon";
import { ElementDetails, PeriodicTableGrid } from "./PeriodicTable";
import { Modal } from "@/components/ui/Modal";

export type DragData = { kind: "equipment"; type: string; label: string; archetype: string; variant?: string } | { kind: "chemical"; id: string; label: string; formula: string };

const HAZARD_DOT: Record<string, string> = { safe: "bg-emerald-500", caution: "bg-amber-500", danger: "bg-red-500" };

function EquipmentItem({ def }: { def: ComponentDefinition }) {
  const addComponent = useLab((s) => s.addComponent);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `equip:${def.type}:${def.group}`,
    data: { kind: "equipment", type: def.type, label: def.label, archetype: def.visual.archetype, variant: def.visual.variant } satisfies DragData,
  });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={() => {
        const c = canvasApi()?.center();
        if (c) addComponent(def.type, c);
      }}
      title={`${def.label} — ${def.description}\nDrag onto the bench or double-click to add.`}
      className={`group flex flex-col items-center gap-1 rounded-md border border-transparent px-1 py-2 text-center transition hover:border-slate-200 hover:bg-white hover:shadow-panel ${isDragging ? "opacity-40" : ""}`}
    >
      <LabIcon archetype={def.visual.archetype} variant={def.visual.variant} size={30} className="text-slate-600 group-hover:text-primary" />
      <span className="line-clamp-2 text-[10.5px] leading-tight text-slate-600">{def.label}</span>
    </button>
  );
}

function ChemicalItem({ chem, expanded, onToggle }: { chem: Chemical; expanded: boolean; onToggle: () => void }) {
  const selection = useLab((s) => s.selection);
  const components = useLab((s) => s.components);
  const addChemicalTo = useLab((s) => s.addChemicalTo);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `chem:${chem.id}`,
    data: { kind: "chemical", id: chem.id, label: chem.name, formula: chem.formula } satisfies DragData,
  });
  const target = components.find((c) => selection.includes(c.id) && c.state.mixture);
  return (
    <div className={`rounded-md border ${expanded ? "border-slate-200 bg-white shadow-panel" : "border-transparent"} ${isDragging ? "opacity-40" : ""}`}>
      <div ref={setNodeRef} {...listeners} {...attributes} className="flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 hover:bg-white active:cursor-grabbing" onClick={onToggle}>
        <span className="flex h-7 min-w-[44px] items-center justify-center rounded bg-slate-100 px-1 font-mono text-[10.5px] font-semibold text-slate-700" style={chem.color ? { background: chem.color + "33", color: "#0f172a" } : {}}>
          {prettyFormula(chem.formula).slice(0, 9)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-slate-700">{chem.name}</span>
        <span className={`h-2 w-2 shrink-0 rounded-full ${HAZARD_DOT[chem.hazard.level]}`} title={`Hazard: ${chem.hazard.level}`} />
      </div>
      {expanded && (
        <div className="space-y-2 px-2.5 pb-2.5 pt-1 text-[11px]">
          <p className="text-slate-500">{chem.description}</p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1">
            <dt className="text-slate-400">Formula</dt>
            <dd className="font-mono">{prettyFormula(chem.formula)}</dd>
            <dt className="text-slate-400">State</dt>
            <dd>{chem.state}</dd>
            <dt className="text-slate-400">Molar mass</dt>
            <dd>{chem.molarMass} g/mol</dd>
            <dt className="text-slate-400">Density</dt>
            <dd>{chem.density} g/mL</dd>
            {chem.defaultConcentration != null && (
              <>
                <dt className="text-slate-400">Stock conc.</dt>
                <dd>{chem.defaultConcentration} mol/L</dd>
              </>
            )}
            <dt className="text-slate-400">Temperature</dt>
            <dd>25 °C</dd>
          </dl>
          <div className={`rounded px-2 py-1 ${chem.hazard.level === "danger" ? "bg-red-50 text-red-700" : chem.hazard.level === "caution" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            <b className="uppercase">{chem.hazard.level}</b> {chem.hazard.pictograms.length ? `· ${chem.hazard.pictograms.join(", ")}` : ""}
            <div>{chem.hazard.statement}</div>
          </div>
          <button className="btn btn-primary btn-sm w-full" disabled={!target} onClick={() => target && addChemicalTo(target.id, chem.id)}>
            {target ? `Add to ${target.name}` : "Select a container to add"}
          </button>
        </div>
      )}
    </div>
  );
}

function ElementTile({ e, onClick }: { e: ElementData; onClick: () => void }) {
  const col = CATEGORY_COLORS[e.category];
  const draggable = useDraggable({
    id: `el:${e.number}`,
    data: e.chemicalId ? ({ kind: "chemical", id: e.chemicalId, label: e.name, formula: e.symbol } satisfies DragData) : undefined,
    disabled: !e.chemicalId,
  });
  return (
    <button
      ref={draggable.setNodeRef}
      {...(e.chemicalId ? draggable.listeners : {})}
      {...draggable.attributes}
      onClick={onClick}
      title={e.name}
      className="flex aspect-square flex-col items-center justify-center rounded border border-transparent leading-none hover:border-primary"
      style={{ background: col.bg, color: col.fg }}
    >
      <span className="text-[8px]">{e.number}</span>
      <span className="text-[13px] font-bold">{e.symbol}</span>
    </button>
  );
}

export function Library({ mode }: { mode: LabMode }) {
  const [tab, setTab] = useState<"equipment" | "chemicals" | "elements">("equipment");
  const [q, setQ] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<ChemCategory | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [element, setElement] = useState<ElementData | null>(null);
  const [tableOpen, setTableOpen] = useState(false);
  const selection = useLab((s) => s.selection);
  const components = useLab((s) => s.components);
  const addChemicalTo = useLab((s) => s.addChemicalTo);
  const dropChemical = useLab((s) => s.dropChemical);

  const term = q.trim().toLowerCase();
  const groups = useMemo(() => {
    if (!term) return libraryGroups(mode);
    const hits = allDefinitions().filter((d) => d.label.toLowerCase().includes(term) || d.group.toLowerCase().includes(term) || d.keywords?.some((k) => k.includes(term)));
    return hits.length ? [{ group: `Results (${hits.length})`, items: hits }] : [];
  }, [mode, term]);
  const chems = useMemo(
    () => CHEMICALS.filter((c) => (filter === "all" || c.categories.includes(filter)) && (!term || c.name.toLowerCase().includes(term) || c.formula.toLowerCase().includes(term))),
    [filter, term],
  );
  const elements = useMemo(() => ELEMENTS.filter((e) => !term || e.name.toLowerCase().includes(term) || e.symbol.toLowerCase() === term || String(e.number) === term), [term]);

  const applyElement = (chemId: string) => {
    const target = components.find((c) => selection.includes(c.id) && c.state.mixture);
    if (target) addChemicalTo(target.id, chemId);
    else {
      const c = canvasApi()?.center();
      if (c) dropChemical(chemId, c);
    }
  };

  const TABS = [
    { id: "equipment" as const, label: "Equipment", icon: Wrench },
    { id: "chemicals" as const, label: "Chemicals", icon: FlaskConical },
    { id: "elements" as const, label: "Elements", icon: Atom },
  ];

  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-slate-200 bg-slate-50/70">
      <div className="space-y-2 border-b border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Laboratory Library</span>
          <span className="chip">{mode === "chemistry" ? "Chemistry" : "Physics"}</span>
        </div>
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search equipment, chemicals, elements..." className="input h-8 pl-8 text-[12px]" />
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-0.5">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center justify-center gap-1 rounded px-1 py-1 text-[11px] font-medium transition ${tab === t.id ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {tab === "equipment" && (
          <>
            {groups.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No equipment matches “{q}”.</div>}
            {groups.map(({ group, items }) => (
              <div key={group} className="mb-1">
                <button className="flex w-full items-center gap-1 rounded px-1.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-100" onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}>
                  {collapsed[group] ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                  <span className="flex-1">{group}</span>
                  <span className="font-normal text-slate-400">{items.length}</span>
                </button>
                {!collapsed[group] && (
                  <div className="grid grid-cols-3 gap-0.5">
                    {items.map((d) => (
                      <EquipmentItem key={`${group}-${d.type}`} def={d} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <p className="px-2 pb-2 pt-3 text-[10.5px] text-slate-400">Drag items onto the bench · double-click to add at the centre.</p>
          </>
        )}

        {tab === "chemicals" && (
          <>
            <div className="mb-2 flex flex-wrap gap-1">
              {[{ id: "all" as const, label: "All" }, ...CHEM_CATEGORIES].map((c) => (
                <button key={c.id} onClick={() => setFilter(c.id)} className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${filter === c.id ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="space-y-0.5">
              {chems.map((c) => (
                <ChemicalItem key={c.id} chem={c} expanded={expanded === c.id} onToggle={() => setExpanded(expanded === c.id ? null : c.id)} />
              ))}
              {chems.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No chemicals found.</div>}
            </div>
            <p className="px-2 pb-2 pt-3 text-[10.5px] text-slate-400">Drop a chemical onto a vessel to add it (default 50 mL of stock solution or 2 g of solid). Dropping on empty bench creates a new beaker.</p>
          </>
        )}

        {tab === "elements" && (
          <>
            <button className="btn btn-sm mb-2 w-full" onClick={() => setTableOpen(true)}>
              <Grid3x3 size={13} /> Open full periodic table
            </button>
            {element && (
              <div className="mb-2">
                <ElementDetails e={element} onAdd={applyElement} />
              </div>
            )}
            <div className="grid grid-cols-6 gap-1">
              {elements.map((e) => (
                <ElementTile key={e.number} e={e} onClick={() => setElement(e)} />
              ))}
            </div>
          </>
        )}
      </div>

      <Modal open={tableOpen} onClose={() => setTableOpen(false)} title="Periodic Table of the Elements" width={1020}>
        <div className="flex flex-col gap-4 xl:flex-row">
          <div className="overflow-x-auto">
            <PeriodicTableGrid cell={38} onSelect={setElement} selected={element?.number} />
          </div>
          <div className="w-full shrink-0 xl:w-72">{element ? <ElementDetails e={element} onAdd={(id) => { applyElement(id); setTableOpen(false); }} /> : <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-400">Select an element to see its properties.</div>}</div>
        </div>
      </Modal>
    </aside>
  );
}
