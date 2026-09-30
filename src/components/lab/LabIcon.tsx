/** Compact line icons for every renderer archetype, used in the library and menus. */
const S = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const LIQ = "#93c5fd";

const ICONS: Record<string, (v?: string) => React.ReactNode> = {
  beaker: () => (
    <>
      <path d="M11 20h18v-.1" fill={LIQ} opacity=".5" />
      <path d="M10 8h20M12 8v24a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" {...S} />
      <path d="M12.5 21h15v11a1.5 1.5 0 0 1-1.5 1.5H14a1.5 1.5 0 0 1-1.5-1.5z" fill={LIQ} opacity=".6" />
      <path d="M22 14h4M22 18h4" {...S} strokeWidth={1} />
    </>
  ),
  testtube: () => (
    <>
      <path d="M16 5h8M17 5v26a3 3 0 0 0 6 0V5" {...S} />
      <path d="M17.6 20h4.8v11a2.4 2.4 0 0 1-4.8 0z" fill={LIQ} opacity=".7" />
    </>
  ),
  flask: () => (
    <>
      <path d="M17 5h6M18 5v10a10 10 0 1 0 4 0V5" {...S} />
      <path d="M11.3 25a8.7 8.7 0 0 0 17.4 0z" fill={LIQ} opacity=".6" />
    </>
  ),
  erlenmeyer: () => (
    <>
      <path d="M16 5h8M17 5v11L9 33a1.5 1.5 0 0 0 1.4 2h19.2a1.5 1.5 0 0 0 1.4-2L23 16V5" {...S} />
      <path d="M12.3 26h15.4l3 7H9.3z" fill={LIQ} opacity=".6" />
    </>
  ),
  volumetric: () => (
    <>
      <path d="M18 4h4M18.5 4v18a8 8 0 1 0 3 0V4M17 12h6" {...S} />
      <path d="M13 29a7 7 0 0 0 14 0z" fill={LIQ} opacity=".6" />
    </>
  ),
  roundbottom: () => (
    <>
      <path d="M17 5h6M18 5v9a11 11 0 1 0 4 0V5" {...S} />
      <path d="M9.5 25a10.5 10.5 0 0 0 21 0z" fill={LIQ} opacity=".6" />
    </>
  ),
  cylinder: () => (
    <>
      <path d="M14 4h12M16 4v28M24 4v28M12 35h16M14 32h12" {...S} />
      <path d="M16.5 18h7v14h-7z" fill={LIQ} opacity=".6" />
      <path d="M16 10h3M16 14h3M16 22h3M16 26h3" {...S} strokeWidth={1} />
    </>
  ),
  burette: () => (
    <>
      <path d="M18 2v28M22 2v28M18 30l2 3 2-3M17 30h6M20 33v4" {...S} />
      <path d="M18.5 10h3v20h-3z" fill={LIQ} opacity=".6" />
    </>
  ),
  pipette: () => (
    <>
      <path d="M20 2v10M17 12h6v10h-6zM20 22v15" {...S} />
      <path d="M17.5 15h5v7h-5z" fill={LIQ} opacity=".6" />
    </>
  ),
  dropper: () => (
    <>
      <rect x="16" y="3" width="8" height="10" rx="4" fill="#fca5a5" stroke="currentColor" strokeWidth={1.6} />
      <path d="M17 13h6l-2 20h-2z" {...S} />
      <circle cx="20" cy="37" r="1.4" fill={LIQ} />
    </>
  ),
  funnel: () => <path d="M6 8h28L22 22v12h-4V22z" {...S} />,
  sepfunnel: () => (
    <>
      <path d="M18 3h4M18.5 3v4C10 10 10 24 18.5 28v4h3v-4C30 24 30 10 21.5 7V3M16 31h8M20 32v6" {...S} />
      <path d="M12.5 18c1 4 3 7 6 9h3c3-2 5-5 6-9z" fill={LIQ} opacity=".6" />
    </>
  ),
  dish: (v) =>
    v === "watch" ? (
      <path d="M6 18q14 12 28 0" {...S} />
    ) : v === "evaporating" ? (
      <>
        <path d="M6 16h28q-2 14-14 14T6 16zM6 16l-2-2" {...S} />
      </>
    ) : (
      <>
        <rect x="5" y="16" width="30" height="9" rx="2" {...S} />
        <path d="M7 20h26" {...S} strokeWidth={1} />
      </>
    ),
  crucible: () => <path d="M10 12h20l-3 20H13zM9 10h22" {...S} />,
  mortar: () => (
    <>
      <path d="M7 18h26q-2 14-13 14T7 18z" {...S} />
      <path d="M22 20l8-14" {...S} strokeWidth={3} />
    </>
  ),
  rack: () => (
    <>
      <path d="M4 16h32M4 30h32M6 16v18M34 16v18" {...S} />
      <path d="M12 8v18M20 8v18M28 8v18" {...S} strokeWidth={1.2} />
    </>
  ),
  clamp: () => <path d="M4 20h20M24 14v12M24 14h8v12h-8M32 17h4M32 23h4" {...S} />,
  stand: () => <path d="M14 36V4M6 36h26M14 12h14M26 9v6" {...S} />,
  tripod: () => <path d="M6 12h28M10 12l-4 24M30 12l4 24M20 12v24" {...S} />,
  gauze: () => (
    <>
      <rect x="4" y="16" width="32" height="8" {...S} />
      <path d="M8 16v8M12 16v8M16 16v8M20 16v8M24 16v8M28 16v8M32 16v8" {...S} strokeWidth={0.8} />
      <circle cx="20" cy="20" r="3" fill="#d6d3d1" />
    </>
  ),
  spatula: (v) => <path d={v === "scoop" ? "M4 22h20M24 22q6-6 12 0q-6 4-12 0" : "M4 20h22M26 17h10v6H26z"} {...S} />,
  thermometer: () => (
    <>
      <path d="M18 5a2 2 0 0 1 4 0v24a4 4 0 1 1-4 0z" {...S} />
      <path d="M20 14v17" stroke="#ef4444" strokeWidth={2} />
      <circle cx="20" cy="32" r="2.4" fill="#ef4444" />
    </>
  ),
  phmeter: () => (
    <>
      <rect x="15" y="4" width="20" height="16" rx="2" {...S} />
      <rect x="18" y="7" width="14" height="6" rx="1" fill="#99f6e4" />
      <path d="M8 10v26M15 12H8" {...S} />
      <text x="25" y="12.5" fontSize="5" textAnchor="middle" fill="#0f766e" fontWeight="700">pH</text>
    </>
  ),
  balance: () => (
    <>
      <path d="M4 26h32v8H4zM12 22h16M20 22v4" {...S} />
      <rect x="23" y="28" width="10" height="4" rx=".5" fill="#99f6e4" />
    </>
  ),
  hotplate: () => (
    <>
      <rect x="4" y="18" width="32" height="14" rx="2" {...S} />
      <path d="M6 18h28" stroke="#f97316" strokeWidth={3} />
      <circle cx="12" cy="26" r="2" {...S} />
      <circle cx="28" cy="26" r="2" {...S} />
    </>
  ),
  stirrer: () => (
    <>
      <rect x="4" y="20" width="32" height="12" rx="2" {...S} />
      <rect x="15" y="15" width="10" height="3" rx="1.5" fill="currentColor" />
      <circle cx="30" cy="26" r="2" {...S} />
    </>
  ),
  burner: () => (
    <>
      <path d="M17 36V16h6v20M11 36h18" {...S} />
      <path d="M20 4q5 6 0 11q-5-5 0-11z" fill="#60a5fa" />
    </>
  ),
  waterbath: () => (
    <>
      <rect x="4" y="12" width="32" height="22" rx="2" {...S} />
      <path d="M6 18h28v14H6z" fill={LIQ} opacity=".5" />
      <path d="M9 22q2-2 4 0t4 0t4 0" {...S} strokeWidth={1} />
    </>
  ),
  centrifuge: () => (
    <>
      <rect x="4" y="14" width="32" height="20" rx="4" {...S} />
      <circle cx="20" cy="24" r="6" {...S} />
      <path d="M20 18v12M14 24h12" {...S} strokeWidth={1} />
    </>
  ),
  electrolysis: () => (
    <>
      <path d="M8 12v22a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V12" {...S} />
      <path d="M8.6 22h22.8v12H8.6z" fill="#60a5fa" opacity=".5" />
      <path d="M15 6v26M25 6v26" stroke="#334155" strokeWidth={2.5} />
    </>
  ),
  battery: () => (
    <>
      <rect x="6" y="13" width="26" height="14" rx="2" {...S} />
      <rect x="32" y="17" width="3" height="6" fill="currentColor" />
      <path d="M11 20h4M13 18v4M24 20h4" {...S} />
    </>
  ),
  device: (v) => (
    <>
      <rect x="4" y="8" width="32" height="24" rx="3" {...S} />
      <rect x="8" y="12" width="24" height="9" rx="1" fill="#99f6e4" />
      <text x="20" y="19" fontSize="6" textAnchor="middle" fill="#0f766e" fontWeight="700">
        {v === "powersupply" ? "12.0V" : v === "multimeter" ? "DMM" : v === "force" ? "N" : v === "motion" ? ")))" : v === "pressure" ? "kPa" : "88.8"}
      </text>
      <circle cx="13" cy="27" r="2" {...S} />
      <circle cx="27" cy="27" r="2" {...S} />
    </>
  ),
  resistor: (v) => (
    <>
      <path d="M2 20h8M30 20h8" {...S} />
      <rect x="10" y="15" width="20" height="10" rx="2" fill="#fde68a" stroke="currentColor" strokeWidth={1.6} />
      <path d="M15 15v10M19 15v10M24 15v10" stroke="#b45309" strokeWidth={1.4} />
      {v === "variable" && <path d="M8 32L32 8M28 8h4v4" {...S} />}
    </>
  ),
  capacitor: () => <path d="M2 20h15M23 20h15M17 10v20M23 10v20" {...S} strokeWidth={2} />,
  inductor: () => <path d="M2 22h6q0-8 4-8t4 8q0-8 4-8t4 8q0-8 4-8t4 8h6" {...S} />,
  diode: () => <path d="M2 20h12M26 20h12M14 12v16l12-8zM26 12v16" {...S} />,
  led: () => (
    <>
      <path d="M13 22a7 7 0 0 1 14 0v6H13z" fill="#fca5a5" stroke="currentColor" strokeWidth={1.6} />
      <path d="M16 28v8M24 28v8M11 28h18" {...S} />
      <path d="M29 10l4-4M31 14l5-2" {...S} strokeWidth={1.2} />
    </>
  ),
  switch: () => (
    <>
      <path d="M2 24h8M30 24h8M12 24l16-10" {...S} />
      <circle cx="11" cy="24" r="2" {...S} />
      <circle cx="29" cy="24" r="2" {...S} />
    </>
  ),
  wire: () => <path d="M4 26q8-14 16 0t16 0" {...S} stroke="#dc2626" strokeWidth={2.4} />,
  bulb: () => (
    <>
      <path d="M13 17a7 7 0 1 1 14 0c0 3-2 5-3 7v3h-8v-3c-1-2-3-4-3-7z" fill="#fef9c3" stroke="currentColor" strokeWidth={1.6} />
      <path d="M16 30h8M17 33h6M18 18l2 3 2-3" {...S} strokeWidth={1.2} />
    </>
  ),
  motor: () => (
    <>
      <circle cx="20" cy="20" r="11" {...S} />
      <text x="20" y="24" fontSize="10" textAnchor="middle" fill="currentColor" fontWeight="700">M</text>
    </>
  ),
  meter: (v) => (
    <>
      <circle cx="20" cy="20" r="13" {...S} />
      <text x="20" y="25" fontSize="13" textAnchor="middle" fill="currentColor" fontWeight="700">{v ?? "A"}</text>
    </>
  ),
  oscilloscope: () => (
    <>
      <rect x="3" y="8" width="34" height="24" rx="2" {...S} />
      <rect x="6" y="11" width="20" height="16" fill="#064e3b" />
      <path d="M7 19q2.5-6 5 0t5 0t5 0t4 0" stroke="#34d399" strokeWidth={1.2} fill="none" />
    </>
  ),
  block: () => <rect x="8" y="12" width="24" height="18" rx="1" fill="#e2e8f0" stroke="currentColor" strokeWidth={1.6} />,
  incline: () => (
    <>
      <path d="M4 34h32V14z" {...S} />
      <rect x="17" y="16" width="8" height="6" transform="rotate(-32 21 19)" fill="#94a3b8" />
    </>
  ),
  pulley: () => (
    <>
      <circle cx="20" cy="9" r="5" {...S} />
      <path d="M15 9v14M25 9v20" {...S} />
      <rect x="12" y="23" width="6" height="7" fill="#94a3b8" />
      <rect x="22" y="29" width="6" height="7" fill="#94a3b8" />
    </>
  ),
  spring: () => <path d="M20 3v4l-6 3 12 3-12 3 12 3-12 3 12 3-6 3v4M16 35h8" {...S} />,
  pendulum: () => (
    <>
      <path d="M8 5h24M20 5l6 22" {...S} />
      <circle cx="27" cy="30" r="4" fill="#64748b" />
    </>
  ),
  mass: () => (
    <>
      <path d="M20 6v8" {...S} />
      <rect x="10" y="14" width="20" height="18" rx="2" fill="#94a3b8" stroke="currentColor" strokeWidth={1.6} />
      <text x="20" y="27" fontSize="7" textAnchor="middle" fill="#fff" fontWeight="700">kg</text>
    </>
  ),
  dropball: () => (
    <>
      <path d="M12 4h16M20 4v4" {...S} />
      <circle cx="20" cy="13" r="4" fill="#ef4444" />
      <path d="M20 20v10M17 27l3 3 3-3M8 36h24" {...S} strokeDasharray="2 2" />
    </>
  ),
  stopwatch: () => (
    <>
      <circle cx="20" cy="23" r="12" {...S} />
      <path d="M17 6h6M20 6v5M20 23l5-5" {...S} />
    </>
  ),
  ruler: (v) =>
    v === "micrometer" ? (
      <path d="M6 12v16h6V20h14v4h8v-8h-8v4" {...S} />
    ) : v === "vernier-caliper" ? (
      <path d="M4 14h32v6H4zM8 20v12h4V20M22 20v8h4v-8" {...S} />
    ) : (
      <>
        <rect x="3" y="15" width="34" height="10" {...S} />
        <path d="M7 15v4M11 15v3M15 15v4M19 15v3M23 15v4M27 15v3M31 15v4" {...S} strokeWidth={1} />
      </>
    ),
  laser: () => (
    <>
      <rect x="3" y="15" width="22" height="10" rx="2" fill="#334155" />
      <path d="M25 20h13" stroke="#ef4444" strokeWidth={2} />
    </>
  ),
  lightsource: () => (
    <>
      <rect x="4" y="12" width="16" height="16" rx="2" fill="#334155" />
      <path d="M20 16l16-6M20 20h16M20 24l16 6" stroke="#facc15" strokeWidth={1.4} />
    </>
  ),
  lens: (v) =>
    v === "concave" ? (
      <path d="M14 4h12q-5 16 0 32H14q5-16 0-32z" fill="#bae6fd" stroke="currentColor" strokeWidth={1.4} />
    ) : (
      <path d="M20 4q8 16 0 32q-8-16 0-32z" fill="#bae6fd" stroke="currentColor" strokeWidth={1.4} />
    ),
  mirror: () => (
    <>
      <path d="M18 4v32" stroke="#64748b" strokeWidth={3} />
      <path d="M21 6l4-2M21 12l4-2M21 18l4-2M21 24l4-2M21 30l4-2" {...S} strokeWidth={1} />
    </>
  ),
  prism: () => <path d="M20 6l14 26H6z" fill="#e0f2fe" stroke="currentColor" strokeWidth={1.6} />,
  "glass-block": () => <rect x="6" y="11" width="28" height="18" fill="#e0f2fe" stroke="currentColor" strokeWidth={1.6} />,
  screen: () => (
    <>
      <rect x="17" y="4" width="6" height="28" fill="#f8fafc" stroke="currentColor" strokeWidth={1.6} />
      <path d="M14 36h12M20 32v4" {...S} />
    </>
  ),
  bench: () => (
    <>
      <rect x="2" y="17" width="36" height="7" {...S} />
      <path d="M6 17v3M10 17v2M14 17v3M18 17v2M22 17v3M26 17v2M30 17v3M34 17v2" {...S} strokeWidth={1} />
    </>
  ),
  heater: () => (
    <>
      <path d="M17 4h6v12h-6z" {...S} />
      <path d="M18 16v16q2 4 4 0V16" stroke="#f97316" strokeWidth={2} fill="none" />
    </>
  ),
  calorimeter: () => (
    <>
      <rect x="8" y="10" width="24" height="26" rx="2" {...S} />
      <rect x="12" y="14" width="16" height="18" rx="1" fill={LIQ} opacity=".5" />
      <path d="M6 10h28" {...S} />
    </>
  ),
  tempsensor: () => (
    <>
      <rect x="15" y="3" width="10" height="10" rx="2" {...S} />
      <path d="M20 13v22" stroke="#475569" strokeWidth={2.4} />
    </>
  ),
  gaschamber: () => (
    <>
      <rect x="8" y="6" width="24" height="30" rx="2" {...S} />
      <path d="M8 14h24M20 2v12" stroke="#475569" strokeWidth={2.4} />
      <circle cx="15" cy="22" r="1.4" fill="#60a5fa" />
      <circle cx="24" cy="27" r="1.4" fill="#60a5fa" />
      <circle cx="18" cy="31" r="1.4" fill="#60a5fa" />
    </>
  ),
};

export function LabIcon({ archetype, variant, size = 32, className = "" }: { archetype: string; variant?: string; size?: number; className?: string }) {
  const render = ICONS[archetype] ?? ICONS.device;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} aria-hidden>
      {render(variant)}
    </svg>
  );
}
