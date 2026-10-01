"use client";
import { HardHat, Glasses, Hand, Shirt, Wind, ShieldCheck, ShieldAlert, OctagonAlert, Info } from "lucide-react";
import { useLab } from "@/store/labStore";
import { overallLevel, recommendedPPE } from "@/lib/engine/safety";

const LEVEL = {
  safe: { label: "Safe", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: ShieldCheck },
  caution: { label: "Caution", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldAlert },
  danger: { label: "Danger", cls: "bg-red-50 text-red-700 border-red-200", icon: OctagonAlert },
};

const PPE_ICON: Record<string, typeof Glasses> = { "Safety goggles": Glasses, "Nitrile gloves": Hand, "Lab coat": Shirt, "Fume hood": Wind, "Face shield": HardHat };

export function SafetyPanel() {
  const safety = useLab((s) => s.safety);
  const select = useLab((s) => s.select);
  const level = overallLevel(safety);
  const L = LEVEL[level];
  const ppe = recommendedPPE(safety);
  return (
    <div className="space-y-4 p-4">
      <div className={`flex items-center gap-3 rounded-lg border p-3 ${L.cls}`}>
        <L.icon size={26} />
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">Current risk level</div>
          <div className="text-lg font-bold">{L.label}</div>
        </div>
      </div>

      <div>
        <div className="section-title mb-2">Warnings ({safety.length})</div>
        {safety.length === 0 && <p className="text-[12px] text-slate-400">No hazards detected in the current setup.</p>}
        <div className="space-y-1.5">
          {safety.map((f) => {
            const F = LEVEL[f.level];
            return (
              <button key={f.key} onClick={() => f.componentId && select([f.componentId])} className={`w-full rounded-md border p-2 text-left ${F.cls}`}>
                <div className="flex items-center gap-1.5 text-[12px] font-semibold">
                  <F.icon size={13} /> {f.title}
                  <span className="ml-auto rounded bg-white/60 px-1 text-[9px] uppercase">{F.label}</span>
                </div>
                <div className="mt-0.5 text-[11.5px] leading-snug">{f.message}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="section-title mb-2">Recommended PPE</div>
        <div className="grid grid-cols-2 gap-1.5">
          {ppe.map((p) => {
            const I = PPE_ICON[p] ?? ShieldCheck;
            return (
              <div key={p} className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 text-[11.5px] text-slate-700">
                <I size={14} className="text-primary" /> {p}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 rounded-md bg-slate-50 p-3 text-[11.5px] leading-snug text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
        <span>
          Virtual Lab is an <b>educational simulation</b>. Reactions and hazards are modelled for learning only. Never attempt hazardous experiments outside a properly supervised laboratory with the correct safety equipment.
        </span>
      </div>
    </div>
  );
}
