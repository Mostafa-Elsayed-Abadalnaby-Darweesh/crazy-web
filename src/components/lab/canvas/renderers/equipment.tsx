"use client";
import { Circle, Ellipse, Group, Line, Rect, Shape, Text } from "react-konva";
import { DARK, FONT, Knob, METAL, MONO, Readout, type Renderer, fmt, findReading } from "./common";

const flame = (clock: number, size: number, blue: boolean, key = 0, tint?: string) => {
  const flick = 1 + Math.sin(clock * 18 + key) * 0.06 + Math.sin(clock * 31) * 0.04;
  const hgt = size * flick;
  return (
    <Group listening={false}>
      <Shape
        sceneFunc={(ctx, s) => {
          ctx.beginPath();
          ctx.moveTo(-size * 0.28, 0);
          ctx.quadraticCurveTo(-size * 0.3, -hgt * 0.6, 0, -hgt);
          ctx.quadraticCurveTo(size * 0.3, -hgt * 0.6, size * 0.28, 0);
          ctx.closePath();
          ctx.fillStrokeShape(s);
        }}
        fill={tint ?? (blue ? "rgba(96,165,250,0.75)" : "rgba(251,146,60,0.85)")}
        opacity={tint ? 0.9 : 1}
        shadowColor={tint ?? (blue ? "#60a5fa" : "#f97316")}
        shadowBlur={12}
      />
      <Shape
        sceneFunc={(ctx, s) => {
          ctx.beginPath();
          ctx.moveTo(-size * 0.12, 0);
          ctx.quadraticCurveTo(0, -hgt * 0.6, size * 0.12, 0);
          ctx.closePath();
          ctx.fillStrokeShape(s);
        }}
        fill={blue ? "#1d4ed8" : "#fde047"}
      />
    </Group>
  );
};

function flameTint(c: { state: Record<string, unknown> }) {
  const ft = c.state.flameTest as { color: string; at: number } | undefined;
  return ft && Date.now() - ft.at < 900 ? ft.color : undefined;
}

export const EQUIPMENT: Record<string, Renderer> = {
  splint: ({ w, h, c, clock }) => {
    const cond = String(c.properties.condition);
    return (
      <Group>
        <Rect x={w * 0.25} y={0} width={w * 0.5} height={h} cornerRadius={1} fill="#d6b27c" stroke="#a16207" strokeWidth={0.6} />
        <Rect x={w * 0.25} y={h - 12} width={w * 0.5} height={12} fill={cond === "out" ? "#1c1917" : "#292524"} />
        {cond === "glowing" && <Circle x={w / 2} y={h - 2} radius={3.5} fill="#f97316" shadowColor="#f97316" shadowBlur={14} opacity={0.75 + Math.sin(clock * 6) * 0.25} />}
        {cond === "burning" && (
          <Group x={w / 2} y={h - 1}>
            {flame(clock, 20, false, 3)}
          </Group>
        )}
      </Group>
    );
  },
  loop: ({ w, h, c }) => {
    const sample = c.state.sample as string | null | undefined;
    return (
      <Group>
        <Rect x={w * 0.2} y={0} width={w * 0.6} height={h * 0.45} cornerRadius={3} fill="#1e3a8a" />
        <Line points={[w / 2, h * 0.45, w / 2, h - 7]} stroke="#9ca3af" strokeWidth={1.4} />
        <Circle x={w / 2} y={h - 4} radius={3.5} stroke="#9ca3af" strokeWidth={1.4} fill={sample && sample !== "none" ? "#f8fafc" : undefined} />
      </Group>
    );
  },
  stand: ({ w, h }) => (
    <Group>
      <Rect x={0} y={h - 16} width={w} height={16} cornerRadius={3} fill="#475569" />
      <Rect x={w * 0.22} y={0} width={7} height={h - 14} cornerRadius={3} fill={METAL} stroke="#64748b" strokeWidth={0.8} />
    </Group>
  ),
  clamp: ({ w, h }) => (
    <Group>
      <Rect x={0} y={h / 2 - 3} width={w * 0.75} height={6} fill={METAL} stroke="#64748b" strokeWidth={0.8} />
      <Rect x={0} y={h / 2 - 8} width={12} height={16} cornerRadius={2} fill="#475569" />
      <Rect x={w * 0.72} y={0} width={w * 0.28} height={h * 0.3} cornerRadius={2} fill="#f59e0b" />
      <Rect x={w * 0.72} y={h * 0.7} width={w * 0.28} height={h * 0.3} cornerRadius={2} fill="#f59e0b" />
    </Group>
  ),
  tripod: ({ w, h }) => (
    <Group>
      <Rect x={0} y={0} width={w} height={6} cornerRadius={2} fill="#52525b" />
      <Line points={[8, 4, 0, h]} stroke="#52525b" strokeWidth={4} lineCap="round" />
      <Line points={[w - 8, 4, w, h]} stroke="#52525b" strokeWidth={4} lineCap="round" />
      <Line points={[w / 2, 4, w / 2, h]} stroke="#71717a" strokeWidth={3} lineCap="round" />
    </Group>
  ),
  gauze: ({ w, h }) => (
    <Group>
      <Rect width={w} height={h} fill="#a1a1aa" cornerRadius={1} />
      {Array.from({ length: Math.floor(w / 6) }).map((_, i) => (
        <Line key={i} points={[i * 6, 0, i * 6, h]} stroke="#71717a" strokeWidth={0.6} />
      ))}
      <Rect x={w * 0.3} y={1} width={w * 0.4} height={h - 2} cornerRadius={2} fill="#e7e5e4" />
    </Group>
  ),
  rack: ({ w, h }) => (
    <Group>
      <Rect x={0} y={h * 0.2} width={w} height={10} cornerRadius={2} fill="#d6a86a" stroke="#a16207" strokeWidth={1} />
      <Rect x={0} y={h - 12} width={w} height={12} cornerRadius={2} fill="#d6a86a" stroke="#a16207" strokeWidth={1} />
      <Rect x={2} y={h * 0.2} width={8} height={h * 0.8} fill="#c08a4a" />
      <Rect x={w - 10} y={h * 0.2} width={8} height={h * 0.8} fill="#c08a4a" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Ellipse key={i} x={30 + i * ((w - 60) / 4)} y={h * 0.2 + 5} radiusX={9} radiusY={3} fill="#78350f" />
      ))}
    </Group>
  ),
  spatula: ({ w, h, c }) => (
    <Group>
      <Rect x={0} y={h / 2 - 2} width={w * 0.62} height={4} cornerRadius={2} fill="#78716c" />
      {c.type === "scoopula" ? (
        <Shape sceneFunc={(ctx, s) => { ctx.beginPath(); ctx.moveTo(w * 0.6, h / 2 - 3); ctx.quadraticCurveTo(w, -2, w, h / 2); ctx.quadraticCurveTo(w, h + 2, w * 0.6, h / 2 + 3); ctx.closePath(); ctx.fillStrokeShape(s); }} fill="#d4d4d8" stroke="#71717a" strokeWidth={1} />
      ) : (
        <Rect x={w * 0.6} y={1} width={w * 0.4} height={h - 2} cornerRadius={h / 2} fill="#d4d4d8" stroke="#71717a" strokeWidth={1} />
      )}
    </Group>
  ),
  thermometer: (ctx) => {
    const { w, h } = ctx;
    const r = findReading(ctx, "temperature");
    const celsius = r ? (r.unit === "K" ? r.value - 273.15 : r.unit === "°F" ? ((r.value - 32) * 5) / 9 : r.value) : 25;
    const frac = Math.max(0.02, Math.min(1, (celsius + 10) / 120));
    const top = 6;
    const bottom = h - w - 2;
    return (
      <Group>
        <Rect x={w * 0.2} y={0} width={w * 0.6} height={h - w * 0.6} cornerRadius={w * 0.3} fill="rgba(241,245,249,0.9)" stroke="#94a3b8" strokeWidth={1} />
        <Circle x={w / 2} y={h - w / 2} radius={w / 2} fill="#ef4444" stroke="#b91c1c" strokeWidth={1} />
        <Rect x={w / 2 - 1.3} y={bottom - frac * (bottom - top)} width={2.6} height={frac * (bottom - top) + w} fill="#ef4444" />
        {Array.from({ length: 12 }).map((_, i) => (
          <Line key={i} points={[w * 0.72, top + (i * (bottom - top)) / 11, w * 0.9, top + (i * (bottom - top)) / 11]} stroke="#64748b" strokeWidth={0.6} />
        ))}
        <Readout x={w + 4} y={h * 0.25} width={52} text={fmt(r)} />
      </Group>
    );
  },
  phmeter: (ctx) => {
    const { w, h } = ctx;
    const r = findReading(ctx, "ph");
    return (
      <Group>
        <Line points={[w * 0.12, h * 0.25, w * 0.12, h * 0.98]} stroke="#1e293b" strokeWidth={5} lineCap="round" />
        <Rect x={w * 0.12 - 3.5} y={h * 0.88} width={7} height={h * 0.1} cornerRadius={3} fill="#e0f2fe" stroke="#475569" strokeWidth={0.8} />
        <Line points={[w * 0.12, h * 0.25, w * 0.12, h * 0.15, w * 0.32, h * 0.15]} stroke="#1e293b" strokeWidth={2} />
        <Rect x={w * 0.3} y={0} width={w * 0.7} height={h * 0.45} cornerRadius={6} fill="#f8fafc" stroke="#64748b" strokeWidth={1.2} />
        <Readout x={w * 0.36} y={h * 0.06} width={w * 0.58} height={h * 0.16} fontSize={12} text={r ? r.value.toFixed(r.precision ?? 2) : "---"} />
        <Text x={w * 0.36} y={h * 0.26} text="pH" fontStyle="bold" fontSize={10} fill="#0f766e" fontFamily={FONT} />
        <Knob x={w * 0.82} y={h * 0.34} r={4} on={Boolean(r)} />
      </Group>
    );
  },
  balance: (ctx) => {
    const { w, h, c } = ctx;
    const r = findReading(ctx, "mass");
    const analytical = c.type === "analytical-balance";
    return (
      <Group>
        {analytical && <Rect x={w * 0.06} y={-h * 0.02} width={w * 0.88} height={h * 0.62} cornerRadius={4} fill="rgba(224,242,254,0.25)" stroke="#94a3b8" strokeWidth={1} dash={[4, 3]} />}
        <Rect x={w * 0.2} y={h * (analytical ? 0.5 : 0.1)} width={w * 0.6} height={4} cornerRadius={2} fill="#cbd5e1" stroke="#64748b" strokeWidth={0.8} />
        <Rect x={w * 0.46} y={h * (analytical ? 0.5 : 0.1) + 4} width={w * 0.08} height={h * 0.08} fill="#94a3b8" />
        <Rect x={0} y={h * (analytical ? 0.6 : 0.3)} width={w} height={h * (analytical ? 0.4 : 0.7)} cornerRadius={5} fill="#f1f5f9" stroke="#64748b" strokeWidth={1.2} />
        <Readout x={w * 0.35} y={h * (analytical ? 0.68 : 0.46)} width={w * 0.58} height={16} fontSize={11} text={r ? `${r.value.toFixed(r.precision ?? 2)} g` : "0.00 g"} />
        <Text x={w * 0.05} y={h * (analytical ? 0.72 : 0.52)} text="TARE" fontSize={7} fill="#475569" fontFamily={FONT} />
      </Group>
    );
  },
  hotplate: (ctx) => {
    const { w, h, c } = ctx;
    const heat = c.properties.heat === true;
    const stir = c.properties.stir === true;
    return (
      <Group>
        <Rect x={0} y={10} width={w} height={h - 10} cornerRadius={4} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.2} />
        <Rect x={w * 0.06} y={0} width={w * 0.88} height={11} cornerRadius={2} fill={heat ? "#f97316" : "#94a3b8"} shadowColor="#f97316" shadowBlur={heat ? 14 : 0} />
        <Knob x={w * 0.14} y={h * 0.62} on={heat} />
        <Knob x={w * 0.86} y={h * 0.62} on={stir} />
        <Readout x={w * 0.28} y={h * 0.42} width={w * 0.44} text={`${heat ? c.properties.setTemperature : "--"} °C${stir ? " ⟳" : ""}`} />
      </Group>
    );
  },
  stirrer: (ctx) => {
    const { w, h, c, clock } = ctx;
    const on = c.properties.on === true;
    return (
      <Group>
        <Rect x={0} y={6} width={w} height={h - 6} cornerRadius={4} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.2} />
        <Rect x={w * 0.08} y={0} width={w * 0.84} height={7} cornerRadius={2} fill="#cbd5e1" />
        <Knob x={w * 0.85} y={h * 0.6} on={on} />
        <Group x={w * 0.4} y={h * 0.6} rotation={on ? (clock * 720) % 360 : 0}>
          <Rect x={-9} y={-2} width={18} height={4} cornerRadius={2} fill="#475569" />
        </Group>
        <Text x={w * 0.05} y={h * 0.45} text={on ? `${c.properties.speed} rpm` : "OFF"} fontSize={8} fill="#475569" fontFamily={MONO} />
      </Group>
    );
  },
  burner: (ctx) => {
    const { w, h, c, clock } = ctx;
    const lit = c.properties.lit === true;
    const size = { low: 28, medium: 44, high: 62 }[String(c.properties.flame)] ?? 44;
    return (
      <Group>
        <Rect x={w * 0.36} y={h * 0.18} width={w * 0.28} height={h * 0.72} fill={METAL} stroke="#64748b" strokeWidth={1} />
        <Rect x={w * 0.3} y={h * 0.62} width={w * 0.4} height={8} fill="#475569" />
        <Rect x={0} y={h - 10} width={w} height={10} cornerRadius={3} fill={DARK} />
        <Rect x={w - 2} y={h - 8} width={8} height={4} fill="#f59e0b" />
        {lit && (
          <Group x={w / 2} y={h * 0.18}>
            {flame(clock, size, c.properties.airHole === true, 0, flameTint(c))}
          </Group>
        )}
      </Group>
    );
  },
  waterbath: (ctx) => {
    const { w, h, c, clock } = ctx;
    const r = findReading(ctx, "bathTemperature");
    const on = c.properties.on === true;
    return (
      <Group>
        <Rect x={0} y={0} width={w} height={h} cornerRadius={6} fill="#f1f5f9" stroke="#64748b" strokeWidth={1.4} />
        <Rect x={6} y={h * 0.18} width={w - 12} height={h * 0.62} fill="rgba(147,197,253,0.55)" />
        <Line points={Array.from({ length: 20 }).flatMap((_, i) => [6 + (i * (w - 12)) / 19, h * 0.18 + Math.sin(clock * 3 + i) * 1.2])} stroke="#60a5fa" strokeWidth={1} />
        <Rect x={0} y={h * 0.82} width={w} height={h * 0.18} cornerRadius={[0, 0, 6, 6]} fill="#cbd5e1" />
        <Readout x={w * 0.55} y={h * 0.845} width={w * 0.4} height={14} text={`${r ? r.value.toFixed(1) : "--"} °C`} color={on ? "#fdba74" : "#5eead4"} />
        <Knob x={w * 0.1} y={h * 0.91} on={on} r={4} />
      </Group>
    );
  },
  centrifuge: (ctx) => {
    const { w, h, c } = ctx;
    const spinning = Number(c.state.spinRemaining ?? 0) > 0;
    return (
      <Group>
        <Rect x={0} y={h * 0.2} width={w} height={h * 0.8} cornerRadius={10} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.2} />
        <Ellipse x={w / 2} y={h * 0.25} radiusX={w * 0.42} radiusY={h * 0.14} fill="#cbd5e1" stroke="#64748b" strokeWidth={1} />
        <Group x={w / 2} y={h * 0.25} scaleY={0.33} rotation={0}>
          <Group rotation={Number(c.state.angle ?? 0)}>
            <Rect x={-w * 0.3} y={-3} width={w * 0.6} height={6} fill="#475569" />
            <Rect x={-3} y={-w * 0.3} width={6} height={w * 0.6} fill="#475569" />
          </Group>
        </Group>
        <Readout x={w * 0.3} y={h * 0.62} width={w * 0.4} text={spinning ? `${Number(c.state.spinRemaining).toFixed(0)} s` : "READY"} />
      </Group>
    );
  },
  heater: (ctx) => {
    const { w, h, c } = ctx;
    const on = c.properties.on === true;
    return (
      <Group>
        <Rect x={w * 0.2} y={0} width={w * 0.6} height={h * 0.2} cornerRadius={3} fill="#1e293b" />
        <Line points={[w * 0.3, h * 0.2, w * 0.3, h * 0.95, w * 0.7, h * 0.95, w * 0.7, h * 0.2]} stroke={on ? "#f97316" : "#71717a"} strokeWidth={4} lineJoin="round" shadowColor="#f97316" shadowBlur={on ? 12 : 0} />
        <Circle x={w / 2} y={h * 0.1} radius={3} fill={on ? "#ef4444" : "#475569"} />
      </Group>
    );
  },
  tempsensor: (ctx) => {
    const { w, h } = ctx;
    const r = findReading(ctx, "temperature");
    return (
      <Group>
        <Rect x={0} y={0} width={w} height={h * 0.18} cornerRadius={3} fill="#1e293b" />
        <Rect x={w / 2 - 2} y={h * 0.18} width={4} height={h * 0.82} cornerRadius={2} fill="#9ca3af" stroke="#6b7280" strokeWidth={0.6} />
        <Readout x={w + 4} y={2} width={56} text={fmt(r)} />
      </Group>
    );
  },
  gaschamber: (ctx) => {
    const { w, h, c, clock } = ctx;
    const V = Number(c.properties.volume) || 1.2;
    const frac = Math.max(0.12, Math.min(1, V / 5));
    const top = 14 + (1 - frac) * (h - 30);
    const T = Number(c.state.temperature ?? 25) + 273.15;
    const speed = Math.sqrt(T / 298) * 30;
    const p = findReading(ctx, "pressure");
    const n = Math.min(26, Math.max(4, Math.round((Number(c.properties.moles) || 0.05) * 200)));
    const hot = Math.min(1, Math.max(0, (T - 298) / 200));
    return (
      <Group>
        <Rect x={4} y={10} width={w - 8} height={h - 12} cornerRadius={4} fill="rgba(226,232,240,0.5)" stroke="#64748b" strokeWidth={1.6} />
        <Group clipX={6} clipY={top + 6} clipWidth={w - 12} clipHeight={h - top - 10}>
          <Rect x={6} y={top} width={w - 12} height={h - top} fill={`rgba(${Math.round(147 + hot * 100)},${Math.round(197 - hot * 80)},${Math.round(253 - hot * 150)},0.25)`} />
          {Array.from({ length: n }).map((_, i) => {
            const bw = w - 18;
            const bh = h - top - 16;
            const px = ((i * 37 + clock * speed * (1 + (i % 3) * 0.3)) % (2 * bw)) - bw;
            const py = ((i * 53 + clock * speed * (1 + (i % 4) * 0.25)) % (2 * bh)) - bh;
            return <Circle key={i} x={9 + Math.abs(px)} y={top + 8 + Math.abs(py)} radius={2} fill="#2563eb" />;
          })}
        </Group>
        <Rect x={6} y={top} width={w - 12} height={7} fill="#475569" />
        <Rect x={w / 2 - 3} y={0} width={6} height={top} fill="#64748b" />
        <Readout x={w * 0.15} y={h - 22} width={w * 0.7} text={p ? `${p.value.toFixed(1)} kPa` : "--"} />
      </Group>
    );
  },
};

