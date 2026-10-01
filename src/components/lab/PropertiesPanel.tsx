"use client";
import { useEffect, useMemo, useState } from "react";
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignEndVertical,
  Beaker,
  Gauge,
  Lock,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Unlock,
  Zap,
} from "lucide-react";
import { useLab } from "@/store/labStore";
import { getDefinition } from "@/lib/engine/registry";
import type { LabComponent, Mixture, PropertySchema, Reading } from "@/lib/engine/types";
import { CHEMICALS, getChemical, prettyFormula } from "@/lib/chemistry/chemicals";
import { computePH, concentrationOf, mixtureAppearance } from "@/lib/chemistry/mixture";
import { indicatorName } from "@/lib/chemistry/indicators";
import { LabIcon } from "./LabIcon";
import { SafetyPanel } from "./SafetyPanel";

function fmtReading(r: Reading) {
  const p = r.precision ?? 2;
  return `${Math.abs(r.value) >= 1e5 ? r.value.toExponential(2) : r.value.toFixed(p)}${r.unit ? " " + r.unit : ""}`;
}

function Section({ title, icon: Icon, children, right }: { title: string; icon?: typeof Gauge; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-3">
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-slate-400" />}
        <h3 className="section-title flex-1">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function NumberField({ value, onCommit, unit, step, min, max, disabled }: { value: number; onCommit: (v: number) => void; unit?: string; step?: number; min?: number; max?: number; disabled?: boolean }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(Number.isFinite(value) ? Number(value.toFixed(6)) : "")), [value]);
  const commit = () => {
    const v = Number(text);
    if (Number.isFinite(v)) onCommit(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)));
    else setText(String(value));
  };
  return (
    <div className="flex items-center rounded-md border border-slate-200 bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-100">
      <input disabled={disabled} className="w-full min-w-0 rounded-md bg-transparent px-2 py-1 text-[13px] outline-none" value={text} step={step} inputMode="decimal" onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
      {unit && <span className="pr-2 text-[11px] text-slate-400">{unit}</span>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-primary" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}

function PropertyControl({ c, p }: { c: LabComponent; p: PropertySchema }) {
  const setProperty = useLab((s) => s.setProperty);
  const v = c.properties[p.key];
  switch (p.kind) {
    case "toggle":
      return (
        <div className="flex items-center justify-between py-1">
          <span className="text-[13px] text-slate-700">{p.label}</span>
          <Toggle checked={v === true} onChange={(b) => setProperty(c.id, p.key, b)} />
        </div>
      );
    case "select":
      return (
        <label className="block py-1">
          <span className="label">{p.label}</span>
          <select className="input py-1 text-[13px]" value={String(v)} onChange={(e) => setProperty(c.id, p.key, e.target.value)}>
            {p.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    case "slider":
      return (
        <div className="py-1">
          <div className="flex items-center justify-between">
            <span className="label mb-0">{p.label}</span>
            <span className="font-mono text-[11px] text-slate-600">
              {Number(v)}
              {p.unit ? ` ${p.unit}` : ""}
            </span>
          </div>
          <input type="range" className="w-full" min={p.min} max={p.max} step={p.step} value={Number(v)} onChange={(e) => setProperty(c.id, p.key, Number(e.target.value))} />
        </div>
      );
    case "text":
      return (
        <label className="block py-1">
          <span className="label">{p.label}</span>
          <input className="input py-1 text-[13px]" value={String(v ?? "")} onChange={(e) => setProperty(c.id, p.key, e.target.value)} />
        </label>
      );
    default:
      return (
        <label className="block py-1">
          <span className="label">{p.label}</span>
          <NumberField value={Number(v)} unit={p.unit} step={p.step} min={p.min} max={p.max} onCommit={(n) => setProperty(c.id, p.key, n)} />
        </label>
      );
  }
}

function ContentsSection({ c }: { c: LabComponent }) {
  const s = useLab();
  const mix = c.state.mixture as Mixture;
  const capacity = Number(c.properties.capacity) || 100;
  const [chem, setChem] = useState("hcl");
  const ch = getChemical(chem);
  const [vol, setVol] = useState(25);
  const [conc, setConc] = useState(1);
  const [mass, setMass] = useState(2);
  const [pourTarget, setPourTarget] = useState("");
  const [pourVol, setPourVol] = useState(10);
  useEffect(() => {
    if (ch?.defaultConcentration) setConc(ch.defaultConcentration);
  }, [ch]);
  useEffect(() => {
    if (s.chemPickerFor === c.id) {
      document.getElementById("chem-picker")?.scrollIntoView({ behavior: "smooth", block: "center" });
      (document.getElementById("chem-picker") as HTMLSelectElement | null)?.focus();
      s.openChemPicker(null);
    }
  }, [s.chemPickerFor, c.id, s]);
  const ph = computePH(mix);
  const app = mixtureAppearance(mix);
  const containers = s.components.filter((x) => x.id !== c.id && getDefinition(x.type)?.roles.includes("container"));
  const species = Object.entries(mix.species);
  const solids = Object.entries(mix.solids);
  const gases = Object.entries(mix.gases).filter(([, n]) => n > 1e-7);

  return (
    <>
      <Section title="Contents" icon={Beaker}>
        <div className="mb-2 flex items-center gap-3">
          <div className="relative h-16 w-10 overflow-hidden rounded-b-lg border-2 border-t-0 border-slate-300 bg-slate-50">
            <div className="absolute bottom-0 left-0 right-0" style={{ height: `${Math.min(100, (mix.volumeMl / capacity) * 100)}%`, background: app.liquid }} />
            {app.solid && <div className="absolute bottom-0 left-0 right-0 h-1.5" style={{ background: app.solid }} />}
          </div>
          <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-1 text-[12px]">
            <span className="text-slate-500">Capacity</span>
            <span className="font-medium">{capacity} mL</span>
            <span className="text-slate-500">Current volume</span>
            <span className="font-medium">{mix.volumeMl.toFixed(1)} mL</span>
            <span className="text-slate-500">Temperature</span>
            <span className="font-medium">{mix.temperature.toFixed(1)} °C</span>
            <span className="text-slate-500">pH</span>
            <span className="font-medium">{ph == null ? "—" : ph.toFixed(2)}</span>
          </div>
        </div>
        <label className="block py-1">
          <div className="flex items-center justify-between">
            <span className="label mb-0">Temperature</span>
            <span className="font-mono text-[11px]">{mix.temperature.toFixed(1)} °C</span>
          </div>
          <input type="range" min={0} max={100} step={0.5} className="w-full" value={mix.temperature} onChange={(e) => s.setContainerTemperature(c.id, Number(e.target.value))} />
        </label>
        {(species.length > 0 || solids.length > 0 || mix.indicators.length > 0) && (
          <table className="mt-1 w-full text-[12px]">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wide text-slate-400">
                <th className="py-1 font-semibold">Chemical</th>
                <th className="py-1 text-right font-semibold">Amount</th>
                <th className="py-1 text-right font-semibold">Conc.</th>
              </tr>
            </thead>
            <tbody>
              {species.map(([id, n]) => (
                <tr key={id} className="border-t border-slate-100">
                  <td className="py-1">{prettyFormula(getChemical(id)?.formula ?? id)}</td>
                  <td className="py-1 text-right font-mono">{(n * 1000).toFixed(2)} mmol</td>
                  <td className="py-1 text-right font-mono">{concentrationOf(mix, id).toFixed(3)} M</td>
                </tr>
              ))}
              {solids.map(([id, n]) => (
                <tr key={id} className="border-t border-slate-100">
                  <td className="py-1">{prettyFormula(getChemical(id)?.formula ?? id)} (s)</td>
                  <td className="py-1 text-right font-mono">{(n * (getChemical(id)?.molarMass ?? 0)).toFixed(3)} g</td>
                  <td className="py-1 text-right text-slate-400">solid</td>
                </tr>
              ))}
              {mix.indicators.map((i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="py-1" colSpan={3}>
                    Indicator: {indicatorName(i)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {gases.length > 0 && (
          <div className="mt-2 rounded bg-sky-50 px-2 py-1 text-[11px] text-sky-800">
            Gas evolved: {gases.map(([id, n]) => `${prettyFormula(getChemical(id)?.formula ?? id)} ${(n * 24000).toFixed(1)} mL`).join(", ")}
          </div>
        )}
        <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="section-title">Add chemical</div>
          <select id="chem-picker" className="input py-1 text-[12px]" value={chem} onChange={(e) => setChem(e.target.value)}>
            {CHEMICALS.filter((x) => x.form !== "gas").map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} ({prettyFormula(x.formula)})
              </option>
            ))}
          </select>
          {ch?.form === "solid" ? (
            <NumberField value={mass} unit="g" onCommit={setMass} min={0} />
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              <NumberField value={vol} unit="mL" onCommit={setVol} min={0} />
              {ch?.form === "solution" && <NumberField value={conc} unit="mol/L" onCommit={setConc} min={0} />}
            </div>
          )}
          <button
            className="btn btn-primary btn-sm w-full"
            onClick={() => s.addChemicalTo(c.id, chem, ch?.form === "solid" ? { massG: mass } : ch?.form === "solution" ? { volumeMl: vol, concentration: conc } : { volumeMl: vol })}
          >
            Add to {c.name}
          </button>
        </div>
        {containers.length > 0 && (
          <div className="mt-2 space-y-1.5 rounded-md border border-slate-200 p-2">
            <div className="section-title">Pour</div>
            <select className="input py-1 text-[12px]" value={pourTarget} onChange={(e) => setPourTarget(e.target.value)}>
              <option value="">Select target vessel…</option>
              {containers.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            <div className="flex gap-1.5">
              <NumberField value={pourVol} unit="mL" onCommit={setPourVol} min={0} />
              <button className="btn btn-sm shrink-0" disabled={!pourTarget} onClick={() => s.pour(c.id, pourTarget, pourVol)}>
                Pour
              </button>
              <button className="btn btn-sm shrink-0" disabled={!pourTarget} onClick={() => s.pour(c.id, pourTarget)}>
                All
              </button>
            </div>
          </div>
        )}
      </Section>
      <ReactionSection mix={mix} />
    </>
  );
}

function ReactionSection({ mix }: { mix: Mixture }) {
  const r = mix.lastReaction ?? mix.reactions[mix.reactions.length - 1];
  if (!r) return null;
  return (
    <Section title="Reaction" icon={Zap}>
      <div className="rounded-md bg-gradient-to-br from-primary-50 to-secondary-50 p-2.5">
        <div className="font-mono text-[12.5px] font-semibold text-ink">{r.equation}</div>
        <div className="mt-1 text-[11px] text-primary-700">{r.type}</div>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-y-1 text-[12px]">
        <dt className="text-slate-500">Products</dt>
        <dd>{r.products.map((p) => prettyFormula(getChemical(p)?.formula ?? p)).join(", ")}</dd>
        <dt className="text-slate-500">Extent</dt>
        <dd>{(r.extent * 1000).toFixed(2)} mmol</dd>
        <dt className="text-slate-500">Temperature change</dt>
        <dd className={r.deltaT >= 0 ? "text-orange-600" : "text-sky-600"}>
          {r.deltaT >= 0 ? "+" : ""}
          {r.deltaT.toFixed(2)} °C
        </dd>
        <dt className="text-slate-500">pH now</dt>
        <dd>{computePH(mix)?.toFixed(2) ?? "—"}</dd>
        <dt className="text-slate-500">Status</dt>
        <dd>{r.completed === false ? "In progress" : "Complete"}</dd>
      </dl>
      <ul className="mt-2 space-y-1">
        {r.observations.map((o) => (
          <li key={o} className="flex gap-1.5 text-[12px] text-slate-700">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
            {o}
          </li>
        ))}
      </ul>
      {mix.reactions.length > 1 && <div className="mt-2 text-[11px] text-slate-400">{mix.reactions.length} reactions occurred in this vessel.</div>}
    </Section>
  );
}

function ComponentProperties({ c }: { c: LabComponent }) {
  const s = useLab();
  const def = getDefinition(c.type);
  const readings = s.liveReadings.filter((r) => r.componentId === c.id).map((r) => r.reading);
  const el = s.circuit.elements[c.id];
  const groups = useMemo(() => {
    const m = new Map<string, PropertySchema[]>();
    for (const p of def?.properties ?? []) {
      const g = p.group ?? "Properties";
      if (!m.has(g)) m.set(g, []);
      m.get(g)!.push(p);
    }
    return [...m.entries()];
  }, [def]);
  const [name, setName] = useState(c.name);
  useEffect(() => setName(c.name), [c.name]);

  if (!def) return null;
  return (
    <>
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
          <LabIcon archetype={def.visual.archetype} variant={def.visual.variant} size={30} />
        </div>
        <div className="min-w-0 flex-1">
          <input className="w-full rounded border border-transparent px-1 py-0.5 text-sm font-semibold text-ink hover:border-slate-200 focus:border-primary focus:outline-none" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name.trim() && name !== c.name && s.renameComponent(c.id, name.trim())} onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()} />
          <div className="px-1 text-[11px] text-slate-500">
            {def.label} · {def.group}
          </div>
        </div>
        <button className="icon-btn" title={c.locked ? "Unlock" : "Lock"} onClick={() => s.toggleLockSelection()}>
          {c.locked ? <Lock size={15} /> : <Unlock size={15} />}
        </button>
        <button className="icon-btn text-red-500 hover:bg-red-50" title="Delete" disabled={c.locked} onClick={() => s.deleteSelection()}>
          <Trash2 size={15} />
        </button>
      </div>
      <p className="border-b border-slate-100 px-4 py-2 text-[11.5px] leading-snug text-slate-500">{def.description}</p>
      {Boolean(c.state.onFire || c.state.burning) && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-3">
          <div className="text-[12.5px] font-semibold text-red-700">{c.state.onFire ? "🔥 The contents are on fire" : "Magnesium is burning"}</div>
          <button className="btn btn-sm mt-2 w-full border-red-300 text-red-700 hover:bg-red-100" onClick={() => s.extinguish(c.id)}>
            Cover vessel to smother the flames
          </button>
        </div>
      )}

      {readings.length > 0 && (
        <Section title="Live readings" icon={Gauge}>
          <div className="grid grid-cols-2 gap-1.5">
            {readings.map((r) => (
              <div key={r.key + r.label} className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5">
                <div className="truncate text-[10px] uppercase tracking-wide text-slate-400">{r.label}</div>
                <div className="font-mono text-[13px] font-semibold text-ink">{fmtReading(r)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {el && (
        <Section title="Electrical" icon={Zap}>
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {[
              ["V", `${Math.abs(el.voltage).toFixed(2)} V`],
              ["I", `${Math.abs(el.current).toFixed(3)} A`],
              ["P", `${el.power.toFixed(3)} W`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-md bg-slate-50 px-1 py-1.5">
                <div className="text-[10px] text-slate-400">{k}</div>
                <div className="font-mono text-[12px] font-semibold">{v}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {def.actions && def.actions.length > 0 && (
        <Section title="Actions" icon={Zap}>
          <div className="flex flex-wrap gap-1.5">
            {def.actions.map((a) => (
              <button key={a.id} className="btn btn-sm" onClick={() => s.runComponentAction(c.id, a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        </Section>
      )}

      {groups.map(([g, props]) => (
        <Section key={g} title={g} icon={SlidersHorizontal}>
          {props.map((p) => (
            <PropertyControl key={p.key} c={c} p={p} />
          ))}
        </Section>
      ))}

      {c.state.mixture && <ContentsSection c={c} />}

      <Section title="Transform">
        <div className="grid grid-cols-2 gap-1.5">
          <label>
            <span className="label">X</span>
            <NumberField value={c.position.x} unit="mm" onCommit={(v) => s.moveComponents([{ id: c.id, position: { ...c.position, x: v } }])} disabled={c.locked} />
          </label>
          <label>
            <span className="label">Y</span>
            <NumberField value={c.position.y} unit="mm" onCommit={(v) => s.moveComponents([{ id: c.id, position: { ...c.position, y: v } }])} disabled={c.locked} />
          </label>
          <label>
            <span className="label">Width</span>
            <NumberField value={c.dimensions.width} unit="mm" min={8} onCommit={(v) => s.transformComponent(c.id, { position: c.position, rotation: c.rotation, width: v, height: c.dimensions.height })} disabled={c.locked} />
          </label>
          <label>
            <span className="label">Height</span>
            <NumberField value={c.dimensions.height} unit="mm" min={8} onCommit={(v) => s.transformComponent(c.id, { position: c.position, rotation: c.rotation, width: c.dimensions.width, height: v })} disabled={c.locked} />
          </label>
          <label className="col-span-2">
            <span className="label">Rotation</span>
            <NumberField value={c.rotation} unit="°" onCommit={(v) => s.transformComponent(c.id, { position: c.position, rotation: ((v % 360) + 360) % 360, width: c.dimensions.width, height: c.dimensions.height })} disabled={c.locked} />
          </label>
        </div>
        <div className="mt-2 font-mono text-[10px] text-slate-400">id: {c.id}</div>
      </Section>
    </>
  );
}

function MultiSelection() {
  const s = useLab();
  const sel = s.components.filter((c) => s.selection.includes(c.id));
  const align = (mode: "left" | "cx" | "right" | "top" | "cy" | "bottom") => {
    const x1 = Math.min(...sel.map((c) => c.position.x));
    const x2 = Math.max(...sel.map((c) => c.position.x + c.dimensions.width));
    const y1 = Math.min(...sel.map((c) => c.position.y));
    const y2 = Math.max(...sel.map((c) => c.position.y + c.dimensions.height));
    s.moveComponents(
      sel
        .filter((c) => !c.locked)
        .map((c) => {
          const p = { ...c.position };
          if (mode === "left") p.x = x1;
          if (mode === "right") p.x = x2 - c.dimensions.width;
          if (mode === "cx") p.x = (x1 + x2) / 2 - c.dimensions.width / 2;
          if (mode === "top") p.y = y1;
          if (mode === "bottom") p.y = y2 - c.dimensions.height;
          if (mode === "cy") p.y = (y1 + y2) / 2 - c.dimensions.height / 2;
          return { id: c.id, position: p };
        }),
    );
  };
  return (
    <>
      <Section title={`${sel.length} objects selected`}>
        <ul className="space-y-0.5 text-[12px] text-slate-600">
          {sel.map((c) => (
            <li key={c.id} className="truncate">
              • {c.name}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Align">
        <div className="flex flex-wrap gap-1">
          <button className="icon-btn" title="Align left" onClick={() => align("left")}><AlignStartVertical size={15} /></button>
          <button className="icon-btn" title="Align centre" onClick={() => align("cx")}><AlignCenterVertical size={15} /></button>
          <button className="icon-btn" title="Align right" onClick={() => align("right")}><AlignEndVertical size={15} /></button>
          <button className="icon-btn" title="Align top" onClick={() => align("top")}><AlignStartHorizontal size={15} /></button>
          <button className="icon-btn" title="Align middle" onClick={() => align("cy")}><AlignCenterHorizontal size={15} /></button>
          <button className="icon-btn" title="Align bottom (bench)" onClick={() => align("bottom")}><AlignEndHorizontal size={15} /></button>
        </div>
      </Section>
      <Section title="Arrange">
        <div className="flex flex-wrap gap-1.5">
          <button className="btn btn-sm" onClick={s.groupSelection}>Group</button>
          <button className="btn btn-sm" onClick={s.ungroupSelection}>Ungroup</button>
          <button className="btn btn-sm" onClick={s.toggleLockSelection}>Lock / unlock</button>
          <button className="btn btn-sm" onClick={s.duplicateSelection}>Duplicate</button>
          <button className="btn btn-danger btn-sm" onClick={s.deleteSelection}>Delete</button>
        </div>
      </Section>
    </>
  );
}

function ExperimentOverview() {
  const s = useLab();
  const sensors = s.liveReadings.filter((r) => {
    const c = s.components.find((x) => x.id === r.componentId);
    return c && getDefinition(c.type)?.roles.includes("sensor");
  });
  return (
    <>
      <Section title="Experiment">
        <dl className="grid grid-cols-2 gap-y-1 text-[12.5px]">
          <dt className="text-slate-500">Lab</dt>
          <dd className="font-medium capitalize">{s.mode}</dd>
          <dt className="text-slate-500">Components</dt>
          <dd className="font-medium">{s.components.length}</dd>
          <dt className="text-slate-500">Wires</dt>
          <dd className="font-medium">{s.wires.length}</dd>
          <dt className="text-slate-500">Simulation time</dt>
          <dd className="font-mono font-medium">{s.simTime.toFixed(1)} s</dd>
          <dt className="text-slate-500">Data rows</dt>
          <dd className="font-medium">{s.dataRows.length}</dd>
          <dt className="text-slate-500">Status</dt>
          <dd>
            <select className="rounded border border-slate-200 px-1 py-0.5 text-[12px]" value={s.status} onChange={(e) => s.setStatus(e.target.value as "draft" | "completed")}>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>
          </dd>
        </dl>
      </Section>
      <Section title="Environment" icon={SlidersHorizontal}>
        <label className="block py-1">
          <span className="label">Gravity</span>
          <NumberField value={s.env.gravity} unit="m/s²" onCommit={(v) => s.setEnv({ gravity: v })} min={0} max={50} />
        </label>
        <label className="block py-1">
          <span className="label">Ambient temperature</span>
          <NumberField value={s.env.ambientTemperature} unit="°C" onCommit={(v) => s.setEnv({ ambientTemperature: v })} min={-50} max={60} />
        </label>
        <label className="block py-1">
          <span className="label">Atmospheric pressure</span>
          <NumberField value={s.env.pressure} unit="kPa" onCommit={(v) => s.setEnv({ pressure: v })} min={0} max={1000} />
        </label>
      </Section>
      <Section title="Live sensors" icon={Gauge}>
        {sensors.length === 0 ? (
          <p className="text-[12px] text-slate-400">No sensors on the bench yet. Add a thermometer, pH meter, balance, meter or motion sensor.</p>
        ) : (
          <div className="space-y-1">
            {sensors.slice(0, 20).map((r, i) => (
              <button key={i} onClick={() => s.select([r.componentId])} className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[12px] hover:bg-slate-50">
                <span className="truncate text-slate-600">
                  {r.source} · {r.reading.label}
                </span>
                <span className="font-mono font-semibold">{fmtReading(r.reading)}</span>
              </button>
            ))}
          </div>
        )}
      </Section>
      <div className="px-4 py-3 text-[11.5px] text-slate-400">Select an object on the bench to edit its properties. Shift-click or drag a box to multi-select.</div>
    </>
  );
}

export function PropertiesPanel() {
  const [tab, setTab] = useState<"properties" | "safety">("properties");
  const s = useLab();
  const safetyLevel = s.safety.some((f) => f.level === "danger") ? "danger" : s.safety.some((f) => f.level === "caution") ? "caution" : "safe";
  const selected = s.selection.length === 1 ? s.components.find((c) => c.id === s.selection[0]) : undefined;
  const dot = { safe: "bg-emerald-500", caution: "bg-amber-500", danger: "bg-red-500 animate-pulse" }[safetyLevel];
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="grid grid-cols-2 border-b border-slate-200">
        <button onClick={() => setTab("properties")} className={`flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-medium ${tab === "properties" ? "border-b-2 border-primary text-primary" : "text-slate-500 hover:text-ink"}`}>
          <SlidersHorizontal size={13} /> Properties
        </button>
        <button onClick={() => setTab("safety")} className={`flex items-center justify-center gap-1.5 py-2.5 text-[12.5px] font-medium ${tab === "safety" ? "border-b-2 border-primary text-primary" : "text-slate-500 hover:text-ink"}`}>
          <ShieldAlert size={13} /> Safety <span className={`h-2 w-2 rounded-full ${dot}`} />
        </button>
      </div>
      <div className="scrollbar-thin flex-1 overflow-y-auto">
        {tab === "safety" ? <SafetyPanel /> : s.replayIndex != null ? <div className="p-4 text-sm text-slate-500">Replay mode is read-only. Exit replay from the Recording tab to edit.</div> : selected ? <ComponentProperties key={selected.id} c={selected} /> : s.selection.length > 1 ? <MultiSelection /> : <ExperimentOverview />}
      </div>
    </aside>
  );
}
