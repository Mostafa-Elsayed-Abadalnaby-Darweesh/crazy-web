"use client";
import { Arc, Circle, Group, Line, Rect, Shape, Text, Arrow } from "react-konva";
import { DARK, FONT, Knob, METAL, MONO, Readout, type Renderer, fmt, findReading } from "./common";

const LED_COLORS: Record<string, string> = { red: "#ef4444", green: "#22c55e", blue: "#3b82f6", yellow: "#eab308", white: "#f8fafc" };

const leads = (w: number, h: number, inset: number) => (
  <>
    <Line points={[0, h / 2, inset, h / 2]} stroke="#64748b" strokeWidth={2} />
    <Line points={[w - inset, h / 2, w, h / 2]} stroke="#64748b" strokeWidth={2} />
  </>
);

function deviceScreen(variant: string | undefined, text: string, w: number, h: number) {
  return <Readout x={w * 0.1} y={h * 0.12} width={w * 0.8} height={Math.min(22, h * 0.3)} fontSize={Math.min(12, h * 0.16)} text={text} />;
}

export const PHYSICS: Record<string, Renderer> = {
  battery: (ctx) => {
    const { w, h, c } = ctx;
    return (
      <Group>
        <Rect x={6} y={4} width={w - 12} height={h - 8} cornerRadius={6} fill="#1f2937" />
        <Rect x={6} y={4} width={(w - 12) * 0.35} height={h - 8} cornerRadius={[6, 0, 0, 6]} fill="#f59e0b" />
        <Rect x={0} y={h / 2 - 6} width={7} height={12} cornerRadius={2} fill={METAL} />
        <Text x={10} y={h / 2 - 7} text="+" fontSize={14} fontStyle="bold" fill="#1f2937" />
        <Text x={w * 0.42} y={h / 2 - 6} width={w * 0.5} text={`${Number(c.properties.voltage).toFixed(1)} V`} fontSize={11} fontStyle="bold" fill="#f8fafc" fontFamily={FONT} align="center" />
        <Text x={w - 16} y={h / 2 - 7} text="−" fontSize={14} fontStyle="bold" fill="#f8fafc" />
      </Group>
    );
  },
  resistor: (ctx) => {
    const { w, h, c } = ctx;
    const variable = c.type === "variable-resistor";
    const R = Number(c.properties.resistance);
    const bodyH = Math.min(h * 0.6, 18);
    const t = variable ? (R - 1) / 999 : 0;
    return (
      <Group>
        {leads(w, h, w * 0.18)}
        <Rect x={w * 0.18} y={h / 2 - bodyH / 2} width={w * 0.64} height={bodyH} cornerRadius={bodyH / 2} fill={variable ? "#e2e8f0" : "#e8c07d"} stroke="#92400e" strokeWidth={variable ? 0 : 0.8} />
        {!variable &&
          ["#a16207", "#1f2937", "#b91c1c", "#d4af37"].map((col, i) => <Rect key={i} x={w * (0.28 + i * 0.12)} y={h / 2 - bodyH / 2} width={4} height={bodyH} fill={col} />)}
        {variable && (
          <>
            {Array.from({ length: 14 }).map((_, i) => (
              <Line key={i} points={[w * 0.2 + i * ((w * 0.6) / 13), h / 2 - bodyH / 2 + 2, w * 0.2 + i * ((w * 0.6) / 13), h / 2 + bodyH / 2 - 2]} stroke="#b45309" strokeWidth={1.2} />
            ))}
            <Rect x={w * 0.18 + t * w * 0.6} y={h / 2 - bodyH / 2 - 7} width={8} height={bodyH + 10} cornerRadius={2} fill="#2563eb" />
          </>
        )}
        <Text x={0} y={h / 2 + bodyH / 2 + 2} width={w} align="center" text={`${R >= 1000 ? (R / 1000).toFixed(1) + " kΩ" : R + " Ω"}`} fontSize={9} fill="#475569" fontFamily={MONO} />
      </Group>
    );
  },
  capacitor: (ctx) => {
    const { w, h, c } = ctx;
    const v = findReading(ctx, "voltage");
    return (
      <Group>
        {leads(w, h, w * 0.44)}
        <Rect x={w * 0.42} y={4} width={4} height={h - 8} fill="#1e40af" />
        <Rect x={w * 0.54} y={4} width={4} height={h - 8} fill="#1e40af" />
        <Text x={0} y={h - 2} width={w} align="center" text={`${c.properties.capacitance} µF · ${v ? v.value.toFixed(2) : "0.00"} V`} fontSize={8} fill="#475569" fontFamily={MONO} />
      </Group>
    );
  },
  inductor: ({ w, h, c }) => (
    <Group>
      {leads(w, h, w * 0.15)}
      <Shape
        sceneFunc={(ctx, s) => {
          ctx.beginPath();
          const n = 5;
          const seg = (w * 0.7) / n;
          ctx.moveTo(w * 0.15, h / 2);
          for (let i = 0; i < n; i++) ctx.arc(w * 0.15 + seg * (i + 0.5), h / 2, seg / 2, Math.PI, 0, false);
          ctx.strokeShape(s);
        }}
        stroke="#b45309"
        strokeWidth={2.2}
      />
      <Text x={0} y={h - 8} width={w} align="center" text={`${c.properties.inductance} mH`} fontSize={8} fill="#475569" fontFamily={MONO} />
    </Group>
  ),
  diode: (ctx) => {
    const { w, h } = ctx;
    const on = (ctx.circuit?.current ?? 0) > 1e-4;
    return (
      <Group>
        {leads(w, h, w * 0.35)}
        <Line points={[w * 0.35, h * 0.2, w * 0.35, h * 0.8, w * 0.62, h / 2]} closed fill={on ? "#1e40af" : "#334155"} />
        <Rect x={w * 0.62} y={h * 0.2} width={3} height={h * 0.6} fill="#334155" />
      </Group>
    );
  },
  led: (ctx) => {
    const { w, h, c } = ctx;
    const col = LED_COLORS[String(c.properties.color)] ?? "#ef4444";
    const current = ctx.c.state.blown ? 0 : (ctx.circuit?.current ?? 0);
    const b = Math.max(0, Math.min(1, current / 0.02));
    const lit = current > 0.001;
    return (
      <Group>
        <Line points={[w * 0.3, h * 0.55, w * 0.3, h]} stroke={METAL} strokeWidth={2} />
        <Line points={[w * 0.7, h * 0.55, w * 0.7, h * 0.92]} stroke={METAL} strokeWidth={2} />
        {lit && <Circle x={w / 2} y={h * 0.32} radius={w * 0.55 + b * 10} fill={col} opacity={0.18 + b * 0.25} />}
        <Shape
          sceneFunc={(cx, s) => {
            cx.beginPath();
            cx.moveTo(w * 0.15, h * 0.55);
            cx.lineTo(w * 0.15, h * 0.3);
            cx.arc(w / 2, h * 0.3, w * 0.35, Math.PI, 0, false);
            cx.lineTo(w * 0.85, h * 0.55);
            cx.closePath();
            cx.fillStrokeShape(s);
          }}
          fill={ctx.c.state.blown ? "#57534e" : col}
          opacity={lit ? 0.95 : 0.45}
          stroke="#475569"
          strokeWidth={1}
          shadowColor={col}
          shadowBlur={lit ? 20 * b + 6 : 0}
        />
        <Rect x={w * 0.1} y={h * 0.53} width={w * 0.8} height={4} fill={col} opacity={0.7} />
      </Group>
    );
  },
  switch: ({ w, h, c }) => {
    const closed = c.properties.closed === true;
    return (
      <Group>
        <Rect x={4} y={h * 0.55} width={w - 8} height={h * 0.4} cornerRadius={3} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
        <Line points={[0, h / 2, w * 0.2, h / 2]} stroke="#64748b" strokeWidth={2} />
        <Line points={[w * 0.8, h / 2, w, h / 2]} stroke="#64748b" strokeWidth={2} />
        <Circle x={w * 0.22} y={h / 2} radius={4} fill={DARK} />
        <Circle x={w * 0.78} y={h / 2} radius={4} fill={DARK} />
        <Line points={closed ? [w * 0.22, h / 2, w * 0.78, h / 2] : [w * 0.22, h / 2, w * 0.7, h * 0.02]} stroke={closed ? "#16a34a" : "#dc2626"} strokeWidth={3.5} lineCap="round" />
        <Text x={0} y={h * 0.66} width={w} align="center" text={closed ? "CLOSED" : "OPEN"} fontSize={8} fontStyle="bold" fill={closed ? "#15803d" : "#b91c1c"} fontFamily={FONT} />
      </Group>
    );
  },
  wire: ({ w, h }) => <Line points={[0, h / 2, w * 0.3, h * 0.1, w * 0.7, h * 0.9, w, h / 2]} tension={0.5} stroke="#dc2626" strokeWidth={3} lineCap="round" />,
  bulb: (ctx) => {
    const { w, h } = ctx;
    const p = ctx.circuit?.power ?? 0;
    const rated = Number(ctx.c.properties.ratedPower) || 3;
    const blown = Boolean(ctx.c.state.blown);
    const b = blown ? 0 : Math.max(0, Math.min(1.2, p / rated));
    const glow = b > 0.03;
    const r = w * 0.42;
    return (
      <Group>
        {glow && <Circle x={w / 2} y={r + 2} radius={r + 10 + b * 24} fill="#fde047" opacity={0.12 + b * 0.25} />}
        <Circle x={w / 2} y={r + 2} radius={r} fill={glow ? `rgba(254,240,138,${0.45 + b * 0.5})` : "rgba(241,245,249,0.8)"} stroke="#94a3b8" strokeWidth={1.2} shadowColor="#facc15" shadowBlur={glow ? 30 * b : 0} />
        <Line points={blown ? [w * 0.4, r * 1.6, w * 0.42, r * 0.9, w * 0.47, r * 1.15] : [w * 0.4, r * 1.6, w * 0.42, r * 0.9, w * 0.5, r * 1.2, w * 0.58, r * 0.9, w * 0.6, r * 1.6]} stroke={glow ? "#f97316" : "#64748b"} strokeWidth={1.2} />
        {blown && <Circle x={w / 2} y={r + 2} radius={r} fill="rgba(71,85,105,0.25)" />}
        <Rect x={w * 0.3} y={r * 1.9} width={w * 0.4} height={h - r * 1.9 - 8} fill="#a8a29e" cornerRadius={2} />
        <Line points={[w * 0.3, h - 8, w * 0.3, h]} stroke={METAL} strokeWidth={2} />
        <Line points={[w * 0.7, h - 8, w * 0.7, h]} stroke={METAL} strokeWidth={2} />
      </Group>
    );
  },
  motor: (ctx) => {
    const { w, h, c } = ctx;
    const angle = Number(c.state.angle ?? 0);
    return (
      <Group>
        <Rect x={4} y={4} width={w - 8} height={h - 16} cornerRadius={8} fill="#64748b" />
        <Circle x={w / 2} y={(h - 12) / 2 + 2} radius={Math.min(w, h) * 0.26} fill="#e2e8f0" stroke="#334155" strokeWidth={1} />
        <Group x={w / 2} y={(h - 12) / 2 + 2} rotation={angle}>
          <Rect x={-2} y={-Math.min(w, h) * 0.24} width={4} height={Math.min(w, h) * 0.48} fill="#dc2626" />
        </Group>
        <Text x={4} y={6} text="M" fontStyle="bold" fontSize={11} fill="#f8fafc" />
        <Line points={[w * 0.25, h - 12, w * 0.25, h]} stroke={METAL} strokeWidth={2} />
        <Line points={[w * 0.75, h - 12, w * 0.75, h]} stroke={METAL} strokeWidth={2} />
      </Group>
    );
  },
  meter: (ctx) => {
    const { w, h, c } = ctx;
    const isA = c.type === "ammeter";
    const r = findReading(ctx, isA ? "current" : "voltage");
    const range = Number(c.properties.range) || 10;
    const frac = r ? Math.max(0, Math.min(1, Math.abs(r.value) / range)) : 0;
    const R = Math.min(w, h) / 2 - 3;
    const ang = -150 + frac * 120;
    return (
      <Group>
        <Circle x={w / 2} y={h / 2} radius={R} fill="#f8fafc" stroke={isA ? "#2563eb" : "#0d9488"} strokeWidth={3} />
        <Arc x={w / 2} y={h / 2 + 4} innerRadius={R * 0.62} outerRadius={R * 0.66} angle={120} rotation={-150} fill="#94a3b8" />
        <Line points={[w / 2, h / 2 + 4, w / 2 + Math.cos((ang * Math.PI) / 180) * R * 0.7, h / 2 + 4 + Math.sin((ang * Math.PI) / 180) * R * 0.7]} stroke="#dc2626" strokeWidth={1.6} lineCap="round" />
        <Text x={0} y={h / 2 - 2} width={w} align="center" text={isA ? "A" : "V"} fontSize={13} fontStyle="bold" fill={isA ? "#2563eb" : "#0d9488"} />
        <Readout x={w * 0.2} y={h * 0.66} width={w * 0.6} height={13} fontSize={9} text={r ? `${r.value.toFixed(isA ? 3 : 2)}` : "0.00"} />
      </Group>
    );
  },
  oscilloscope: (ctx) => {
    const { w, h, c } = ctx;
    const trace = (c.state.trace as number[] | undefined) ?? [];
    const vdiv = Number(c.properties.voltsPerDiv) || 5;
    const sx = w * 0.06;
    const sy = h * 0.1;
    const sw = w * 0.66;
    const sh = h * 0.62;
    const pts = trace.flatMap((v, i) => [sx + (i / 199) * sw, sy + sh / 2 - Math.max(-sh / 2, Math.min(sh / 2, (v / (vdiv * 4)) * (sh / 2)))]);
    return (
      <Group>
        <Rect width={w} height={h - 10} cornerRadius={6} fill="#cbd5e1" stroke="#64748b" strokeWidth={1.2} />
        <Rect x={sx} y={sy} width={sw} height={sh} fill="#022c22" cornerRadius={2} />
        {Array.from({ length: 9 }).map((_, i) => (
          <Line key={`v${i}`} points={[sx + (i * sw) / 8, sy, sx + (i * sw) / 8, sy + sh]} stroke="rgba(52,211,153,0.15)" strokeWidth={0.6} />
        ))}
        {Array.from({ length: 7 }).map((_, i) => (
          <Line key={`h${i}`} points={[sx, sy + (i * sh) / 6, sx + sw, sy + (i * sh) / 6]} stroke="rgba(52,211,153,0.15)" strokeWidth={0.6} />
        ))}
        {pts.length > 3 && <Line points={pts} stroke="#34d399" strokeWidth={1.4} shadowColor="#34d399" shadowBlur={4} />}
        <Text x={sx + sw + 8} y={sy} text={`CH1\n${vdiv} V/div\n${c.properties.timePerDiv} s/div`} fontSize={8} fill="#1e293b" fontFamily={MONO} lineHeight={1.4} />
        <Knob x={w * 0.84} y={h * 0.58} r={6} on />
        <Knob x={w * 0.84} y={h * 0.78} r={5} />
        <Line points={[w * 0.35, h - 10, w * 0.35, h]} stroke={METAL} strokeWidth={2} />
        <Line points={[w * 0.65, h - 10, w * 0.65, h]} stroke={METAL} strokeWidth={2} />
      </Group>
    );
  },
  device: (ctx) => {
    const { w, h, c } = ctx;
    const v = ctx.c.type;
    const variant = v === "power-supply" ? "powersupply" : v === "multimeter" ? "multimeter" : v;
    const primary = ctx.readings[0];
    if (variant === "powersupply") {
      const on = c.properties.on !== false;
      return (
        <Group>
          <Rect width={w} height={h - 8} cornerRadius={6} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.2} />
          <Readout x={w * 0.08} y={h * 0.1} width={w * 0.55} height={20} fontSize={12} text={on ? `${Number(c.properties.voltage).toFixed(1)} V ${c.properties.mode}` : "OFF"} color={on ? "#fca5a5" : "#475569"} />
          <Readout x={w * 0.08} y={h * 0.4} width={w * 0.55} height={14} fontSize={9} text={`${(Math.abs(ctx.circuit?.current ?? 0)).toFixed(3)} A`} />
          <Knob x={w * 0.8} y={h * 0.26} r={8} on={on} />
          <Circle x={w * 0.3} y={h * 0.72} radius={6} fill="#dc2626" stroke="#7f1d1d" strokeWidth={1} />
          <Circle x={w * 0.7} y={h * 0.72} radius={6} fill="#1f2937" stroke="#000" strokeWidth={1} />
          <Line points={[w * 0.3, h * 0.78, w * 0.3, h]} stroke={METAL} strokeWidth={2} />
          <Line points={[w * 0.7, h * 0.78, w * 0.7, h]} stroke={METAL} strokeWidth={2} />
        </Group>
      );
    }
    if (variant === "multimeter") {
      return (
        <Group>
          <Rect width={w} height={h - 8} cornerRadius={8} fill="#facc15" stroke="#a16207" strokeWidth={1.2} />
          <Rect x={w * 0.08} y={h * 0.06} width={w * 0.84} height={h * 0.8} cornerRadius={6} fill="#1f2937" />
          <Readout x={w * 0.14} y={h * 0.12} width={w * 0.72} height={22} fontSize={12} text={fmt(primary)} bg="#d9f99d" color="#1a2e05" />
          <Circle x={w / 2} y={h * 0.55} radius={w * 0.2} fill="#374151" stroke="#9ca3af" strokeWidth={1} />
          <Line points={[w / 2, h * 0.55, w / 2 + (c.properties.mode === "current" ? w * 0.14 : -w * 0.14), h * 0.42]} stroke="#f8fafc" strokeWidth={2} />
          <Circle x={w * 0.3} y={h * 0.8} radius={4} fill="#111827" stroke="#9ca3af" strokeWidth={1} />
          <Circle x={w * 0.7} y={h * 0.8} radius={4} fill="#dc2626" stroke="#9ca3af" strokeWidth={1} />
          <Line points={[w * 0.3, h * 0.84, w * 0.3, h]} stroke={METAL} strokeWidth={2} />
          <Line points={[w * 0.7, h * 0.84, w * 0.7, h]} stroke={METAL} strokeWidth={2} />
        </Group>
      );
    }
    if (variant === "motion-sensor") {
      return (
        <Group>
          <Rect width={w} height={h} cornerRadius={6} fill="#1e293b" />
          <Circle x={w * 0.72} y={h / 2} radius={h * 0.32} fill="#475569" stroke="#94a3b8" strokeWidth={1} />
          {[0, 1, 2].map((i) => (
            <Arc key={i} x={w} y={h / 2} innerRadius={6 + i * 6} outerRadius={7.2 + i * 6} angle={70} rotation={-35} fill="rgba(94,234,212,0.7)" />
          ))}
          <Readout x={2} y={h + 2} width={w} height={14} fontSize={9} text={fmt(primary)} />
        </Group>
      );
    }
    if (variant === "pressure-sensor") {
      return (
        <Group>
          <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) / 2 - 2} fill="#f8fafc" stroke="#475569" strokeWidth={2.5} />
          <Line points={[w / 2, h / 2, w / 2 + Math.cos(((-220 + Math.min(1, (primary?.value ?? 0) / 400) * 260) * Math.PI) / 180) * w * 0.35, h / 2 + Math.sin(((-220 + Math.min(1, (primary?.value ?? 0) / 400) * 260) * Math.PI) / 180) * w * 0.35]} stroke="#dc2626" strokeWidth={1.6} />
          <Readout x={w * 0.1} y={h * 0.62} width={w * 0.8} height={12} fontSize={8} text={primary ? `${primary.value.toFixed(1)} kPa` : "--"} />
        </Group>
      );
    }
    // force sensor & generic devices
    return (
      <Group>
        <Rect width={w} height={h} cornerRadius={6} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.2} />
        {deviceScreen(variant, fmt(primary), w, h)}
        {v === "force-sensor" && <Line points={[w / 2, h, w / 2, h + 10]} stroke="#475569" strokeWidth={2} />}
        {v === "force-sensor" && <Arc x={w / 2} y={h + 14} innerRadius={3} outerRadius={5} angle={220} rotation={-20} fill="#475569" />}
      </Group>
    );
  },

  /* ---------------- mechanics ---------------- */
  block: (ctx) => {
    const { w, h, c } = ctx;
    const F = Number(c.properties.appliedForce) || 0;
    return (
      <Group>
        <Rect x={0} y={0} width={w} height={h} cornerRadius={3} fill="#cbd5e1" stroke="#475569" strokeWidth={1.4} />
        <Rect x={0} y={0} width={w} height={h * 0.18} cornerRadius={[3, 3, 0, 0]} fill="#e2e8f0" />
        <Text x={0} y={h / 2 - 6} width={w} align="center" text={`${c.properties.mass} kg`} fontSize={11} fontStyle="bold" fill="#1e293b" fontFamily={FONT} />
        {F !== 0 && <Arrow points={F > 0 ? [-Math.min(60, 10 + Math.abs(F) * 3), h / 2, -2, h / 2] : [w + Math.min(60, 10 + Math.abs(F) * 3), h / 2, w + 2, h / 2]} stroke="#dc2626" fill="#dc2626" strokeWidth={2.5} pointerLength={7} pointerWidth={7} />}
        {F !== 0 && <Text x={F > 0 ? -60 : w + 8} y={h / 2 - 18} text={`F = ${F} N`} fontSize={9} fill="#dc2626" fontFamily={MONO} />}
      </Group>
    );
  },
  incline: (ctx) => {
    const { w, h, c } = ctx;
    const th = (Number(c.properties.angle) * Math.PI) / 180;
    const rise = Math.min(h - 4, w * Math.tan(th));
    const run = rise / Math.tan(th || 1e-6);
    const x0 = w - Math.min(w, run);
    const L = Number(c.properties.length) || 1.5;
    const s = Number(c.state.s ?? 0);
    const f = Math.min(1, s / L);
    const topX = x0;
    const topY = h - rise;
    const px = topX + (w - topX) * f;
    const py = topY + rise * f;
    const ang = (Math.atan2(rise, w - topX) * 180) / Math.PI;
    return (
      <Group>
        <Line points={[topX, topY, w, h, topX, h]} closed fill="#d6d3d1" stroke="#78716c" strokeWidth={1.4} />
        <Line points={[0, h, w, h]} stroke="#78716c" strokeWidth={2} />
        <Arc x={w} y={h} innerRadius={24} outerRadius={25} angle={ang} rotation={180} fill="#dc2626" />
        <Text x={w - 60} y={h - 18} text={`${c.properties.angle}°`} fontSize={10} fill="#dc2626" fontFamily={MONO} />
        <Group x={px} y={py} rotation={ang}>
          <Rect x={-2} y={-22} width={30} height={22} cornerRadius={2} fill="#2563eb" stroke="#1e3a8a" strokeWidth={1} />
          <Text x={-2} y={-16} width={30} align="center" text={`${c.properties.mass}kg`} fontSize={7} fill="#fff" />
        </Group>
        <Text x={topX} y={h + 4} text={`μ = ${c.properties.friction}`} fontSize={9} fill="#475569" fontFamily={MONO} />
      </Group>
    );
  },
  pulley: (ctx) => {
    const { w, h, c } = ctx;
    const y = Number(c.state.y ?? 0);
    const off = y * 125;
    const R = w * 0.18;
    const cx = w / 2;
    const cy = R + 12;
    const baseL = h * 0.45;
    const lY = cy + baseL + off;
    const rY = cy + baseL - off;
    return (
      <Group>
        <Rect x={w * 0.2} y={0} width={w * 0.6} height={8} fill="#475569" />
        <Line points={[cx, 8, cx, cy]} stroke="#475569" strokeWidth={3} />
        <Circle x={cx} y={cy} radius={R} fill="#e2e8f0" stroke="#475569" strokeWidth={2} />
        <Circle x={cx} y={cy} radius={3} fill="#475569" />
        <Line points={[cx - R, cy, cx - R, lY]} stroke="#78716c" strokeWidth={1.4} />
        <Line points={[cx + R, cy, cx + R, rY]} stroke="#78716c" strokeWidth={1.4} />
        <Rect x={cx - R - 14} y={lY} width={28} height={30} cornerRadius={2} fill="#64748b" />
        <Text x={cx - R - 14} y={lY + 10} width={28} align="center" text={`${c.properties.mass1}`} fontSize={8} fill="#fff" />
        <Rect x={cx + R - 14} y={rY} width={28} height={30} cornerRadius={2} fill="#94a3b8" />
        <Text x={cx + R - 14} y={rY + 10} width={28} align="center" text={`${c.properties.mass2}`} fontSize={8} fill="#fff" />
        <Line points={[0, h, w, h]} stroke="#a8a29e" strokeWidth={2} />
      </Group>
    );
  },
  spring: (ctx) => {
    const { w, h, c } = ctx;
    const x = Number(c.state.x ?? 0);
    const rest = h * 0.45;
    const len = Math.max(20, Math.min(h * 1.6, rest + x * 300));
    const coils = 12;
    const pts: number[] = [w / 2, 6, w / 2, 14];
    for (let i = 0; i <= coils; i++) pts.push(i % 2 ? w * 0.18 : w * 0.82, 14 + ((len - 20) * i) / coils);
    pts.push(w / 2, len, w / 2, len + 6);
    const load = findReading(ctx, "load")?.value ?? Number(c.properties.load);
    return (
      <Group>
        <Rect x={-10} y={0} width={w + 20} height={6} fill="#475569" />
        <Line points={pts} stroke="#64748b" strokeWidth={1.6} lineJoin="round" />
        <Arc x={w / 2} y={len + 10} innerRadius={3} outerRadius={4.5} angle={260} rotation={-40} fill="#475569" />
        {Number(c.properties.load) > 0 && (
          <Group y={len + 14}>
            <Rect x={w / 2 - 14} y={0} width={28} height={22} cornerRadius={2} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
            <Text x={w / 2 - 14} y={7} width={28} align="center" text={`${Math.round(Number(c.properties.load) * 1000)} g`} fontSize={7} fill="#fff" />
          </Group>
        )}
        <Readout x={w + 6} y={8} width={60} text={`${(x * 100).toFixed(1)} cm`} />
        <Text x={w + 6} y={28} text={`k=${c.properties.springConstant} N/m\nload ${load.toFixed(2)} kg`} fontSize={8} fill="#475569" fontFamily={MONO} lineHeight={1.3} />
      </Group>
    );
  },
  pendulum: (ctx) => {
    const { w, h, c } = ctx;
    const th = Number(c.state.theta ?? (Number(c.properties.amplitude) * Math.PI) / 180);
    const L = h - 40;
    const px = w / 2;
    const py = 14;
    const bx = px + Math.sin(th) * L;
    const by = py + Math.cos(th) * L;
    const r = 8 + Math.min(12, Number(c.properties.bobMass) * 20);
    const T = findReading(ctx, "measuredPeriod") ?? findReading(ctx, "period");
    return (
      <Group>
        <Rect x={w * 0.15} y={0} width={w * 0.7} height={10} cornerRadius={2} fill="#475569" />
        <Arc x={px} y={py} innerRadius={L * 0.25} outerRadius={L * 0.25 + 1} angle={80} rotation={50} fill="#cbd5e1" />
        <Line points={[px, py, px, py + L]} stroke="#e2e8f0" strokeWidth={1} dash={[4, 4]} />
        <Line points={[px, py, bx, by]} stroke="#334155" strokeWidth={1.4} />
        <Circle x={px} y={py} radius={3} fill="#1e293b" />
        <Circle x={bx} y={by} radius={r} fill="#64748b" stroke="#334155" strokeWidth={1.2} />
        <Circle x={bx - r * 0.3} y={by - r * 0.3} radius={r * 0.3} fill="rgba(255,255,255,0.4)" />
        <Readout x={4} y={h - 18} width={96} text={`T ${T ? T.value.toFixed(3) : "--"} s`} />
        <Text x={w - 70} y={h - 16} text={`L = ${c.properties.length} m`} fontSize={9} fill="#475569" fontFamily={MONO} />
      </Group>
    );
  },
  mass: ({ w, h, c }) => (
    <Group>
      <Line points={[w / 2, -8, w / 2, 2]} stroke="#475569" strokeWidth={2} />
      <Rect x={0} y={0} width={w} height={h} cornerRadius={3} fill="#94a3b8" stroke="#475569" strokeWidth={1.2} />
      <Rect x={0} y={h * 0.45} width={w} height={2} fill="#64748b" />
      <Text x={0} y={h / 2 - 5} width={w} align="center" text={Number(c.properties.mass) >= 1 ? `${c.properties.mass} kg` : `${Math.round(Number(c.properties.mass) * 1000)} g`} fontSize={9} fontStyle="bold" fill="#fff" fontFamily={FONT} />
    </Group>
  ),
  dropball: (ctx) => {
    const { w, h, c } = ctx;
    const H = Number(c.properties.height) || 1.5;
    const s = Number(c.state.s ?? 0);
    const f = Math.min(1, s / H);
    const top = 20;
    const bottom = h - 18;
    const by = top + (bottom - top) * f;
    return (
      <Group>
        <Rect x={0} y={0} width={w} height={10} fill="#475569" />
        <Rect x={w / 2 - 6} y={10} width={12} height={8} fill="#64748b" />
        <Rect x={w - 10} y={top} width={6} height={bottom - top} fill="#fef3c7" stroke="#d97706" strokeWidth={0.8} />
        {Array.from({ length: 11 }).map((_, i) => (
          <Line key={i} points={[w - 10, top + (i * (bottom - top)) / 10, w - (i % 5 ? 7 : 4), top + (i * (bottom - top)) / 10]} stroke="#92400e" strokeWidth={0.8} />
        ))}
        <Circle x={w / 2 - 6} y={by} radius={9} fill="#ef4444" stroke="#991b1b" strokeWidth={1} />
        <Rect x={0} y={h - 10} width={w} height={10} cornerRadius={2} fill="#a8a29e" />
        <Text x={2} y={h - 9} text={`${H} m`} fontSize={8} fill="#1c1917" fontFamily={MONO} />
      </Group>
    );
  },
  stopwatch: (ctx) => {
    const { w, h } = ctx;
    const r = findReading(ctx, "time");
    const R = Math.min(w, h - 12) / 2;
    const t = r?.value ?? 0;
    const a = ((t % 60) / 60) * 360 - 90;
    return (
      <Group>
        <Rect x={w / 2 - 5} y={0} width={10} height={8} fill="#475569" />
        <Circle x={w / 2} y={12 + R} radius={R} fill="#f8fafc" stroke="#1e293b" strokeWidth={3} />
        <Line points={[w / 2, 12 + R, w / 2 + Math.cos((a * Math.PI) / 180) * R * 0.75, 12 + R + Math.sin((a * Math.PI) / 180) * R * 0.75]} stroke="#dc2626" strokeWidth={1.5} />
        <Readout x={w / 2 - R * 0.75} y={12 + R * 1.2} width={R * 1.5} height={12} fontSize={8} text={t.toFixed(2)} />
      </Group>
    );
  },
  ruler: (ctx) => {
    const { w, h, c } = ctx;
    const r = findReading(ctx, "length");
    if (c.type === "micrometer") {
      return (
        <Group>
          <Shape sceneFunc={(cx, s) => { cx.beginPath(); cx.moveTo(10, h * 0.2); cx.lineTo(10, h * 0.8); cx.quadraticCurveTo(10, h, w * 0.3, h); cx.lineTo(w * 0.45, h); cx.lineTo(w * 0.45, h * 0.6); cx.lineTo(w * 0.3, h * 0.6); cx.lineTo(w * 0.3, h * 0.2); cx.closePath(); cx.fillStrokeShape(s); }} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
          <Rect x={w * 0.45} y={h * 0.3} width={w * 0.3} height={h * 0.25} fill="#e2e8f0" stroke="#475569" strokeWidth={1} />
          <Rect x={w * 0.75} y={h * 0.22} width={w * 0.22} height={h * 0.4} cornerRadius={3} fill="#cbd5e1" stroke="#475569" strokeWidth={1} />
          <Readout x={w * 0.35} y={0} width={w * 0.5} height={13} fontSize={8} text={fmt(r)} />
        </Group>
      );
    }
    if (c.type === "vernier-caliper") {
      return (
        <Group>
          <Rect x={0} y={h * 0.15} width={w} height={h * 0.22} fill="#e2e8f0" stroke="#475569" strokeWidth={1} />
          {Array.from({ length: 40 }).map((_, i) => (
            <Line key={i} points={[10 + i * ((w - 20) / 40), h * 0.15, 10 + i * ((w - 20) / 40), h * 0.15 + (i % 5 ? 4 : 8)]} stroke="#334155" strokeWidth={0.6} />
          ))}
          <Rect x={0} y={h * 0.15} width={14} height={h * 0.8} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
          <Rect x={w * 0.32} y={h * 0.1} width={w * 0.2} height={h * 0.35} fill="#cbd5e1" stroke="#475569" strokeWidth={1} />
          <Rect x={w * 0.32} y={h * 0.15} width={14} height={h * 0.8} fill="#94a3b8" stroke="#475569" strokeWidth={1} />
          <Readout x={w * 0.56} y={h * 0.55} width={w * 0.4} height={14} fontSize={9} text={fmt(r)} />
        </Group>
      );
    }
    return (
      <Group>
        <Rect width={w} height={h} fill="#fde68a" stroke="#b45309" strokeWidth={1} />
        {Array.from({ length: 101 }).map((_, i) => (
          <Line key={i} points={[4 + (i * (w - 8)) / 100, 0, 4 + (i * (w - 8)) / 100, i % 10 === 0 ? h * 0.5 : i % 5 === 0 ? h * 0.35 : h * 0.2]} stroke="#78350f" strokeWidth={0.6} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <Text key={`n${i}`} x={4 + (i * (w - 8)) / 10 - 8} y={h * 0.55} width={16} align="center" text={String(i * 10)} fontSize={7} fill="#78350f" fontFamily={MONO} />
        ))}
      </Group>
    );
  },

  /* ---------------- optics ---------------- */
  laser: ({ w, h, c }) => {
    const on = c.properties.on !== false;
    const col = { red: "#ef4444", green: "#22c55e", blue: "#3b82f6", violet: "#8b5cf6", white: "#f8fafc" }[String(c.properties.color)] ?? "#ef4444";
    return (
      <Group>
        <Rect width={w} height={h} cornerRadius={4} fill="#1e293b" />
        <Rect x={w * 0.08} y={h * 0.25} width={w * 0.35} height={h * 0.5} cornerRadius={2} fill="#334155" />
        <Rect x={w - 10} y={h * 0.3} width={10} height={h * 0.4} fill="#64748b" />
        <Circle x={w * 0.12} y={h * 0.5} radius={3} fill={on ? "#22c55e" : "#475569"} />
        {on && <Circle x={w} y={h / 2} radius={4} fill={col} shadowColor={col} shadowBlur={12} />}
        <Text x={w * 0.48} y={h / 2 - 5} text="LASER" fontSize={8} fontStyle="bold" fill="#facc15" fontFamily={FONT} />
      </Group>
    );
  },
  lightsource: ({ w, h, c }) => {
    const on = c.properties.on !== false;
    return (
      <Group>
        <Rect width={w * 0.8} height={h} cornerRadius={6} fill="#334155" />
        <Rect x={w * 0.8} y={h * 0.2} width={w * 0.2} height={h * 0.6} cornerRadius={2} fill={on ? "#fef08a" : "#64748b"} shadowColor="#facc15" shadowBlur={on ? 20 : 0} />
        <Text x={0} y={h / 2 - 6} width={w * 0.8} align="center" text="F" fontSize={14} fontStyle="bold" fill="#fde047" />
      </Group>
    );
  },
  lens: ({ w, h, c }) => {
    const concave = c.type === "concave-lens";
    return (
      <Group>
        <Shape
          sceneFunc={(cx, s) => {
            cx.beginPath();
            if (concave) {
              cx.moveTo(0, 0);
              cx.lineTo(w, 0);
              cx.quadraticCurveTo(w * 0.5, h / 2, w, h);
              cx.lineTo(0, h);
              cx.quadraticCurveTo(w * 0.5, h / 2, 0, 0);
            } else {
              cx.moveTo(w / 2, 0);
              cx.quadraticCurveTo(w * 1.3, h / 2, w / 2, h);
              cx.quadraticCurveTo(-w * 0.3, h / 2, w / 2, 0);
            }
            cx.closePath();
            cx.fillStrokeShape(s);
          }}
          fill="rgba(186,230,253,0.55)"
          stroke="#0284c7"
          strokeWidth={1.2}
        />
        <Text x={w + 4} y={h / 2 - 5} text={`f=${concave ? "−" : ""}${c.properties.focalLength} cm`} fontSize={8} fill="#0369a1" fontFamily={MONO} />
      </Group>
    );
  },
  mirror: ({ w, h }) => (
    <Group>
      <Rect x={w / 2 - 2} y={0} width={4} height={h} fill="#cbd5e1" stroke="#475569" strokeWidth={0.8} />
      {Array.from({ length: Math.floor(h / 10) }).map((_, i) => (
        <Line key={i} points={[w / 2 + 2, i * 10 + 4, w, i * 10 - 2]} stroke="#94a3b8" strokeWidth={0.8} />
      ))}
    </Group>
  ),
  prism: ({ w, h, c }) => (
    <Group>
      <Line points={[w / 2, 0, w, h, 0, h]} closed fill="rgba(186,230,253,0.45)" stroke="#0284c7" strokeWidth={1.4} />
      <Text x={0} y={h + 2} width={w} align="center" text={`n = ${c.properties.refractiveIndex}`} fontSize={8} fill="#0369a1" fontFamily={MONO} />
    </Group>
  ),
  "glass-block": ({ w, h, c }) => (
    <Group>
      <Rect width={w} height={h} fill="rgba(186,230,253,0.45)" stroke="#0284c7" strokeWidth={1.4} />
      <Text x={4} y={h - 12} text={`n = ${c.properties.refractiveIndex}`} fontSize={8} fill="#0369a1" fontFamily={MONO} />
    </Group>
  ),
  screen: ({ w, h, screenHits }) => (
    <Group>
      <Rect width={w} height={h} fill="#f8fafc" stroke="#475569" strokeWidth={1.2} />
      {(screenHits ?? []).map((hit, i) => (
        <Circle key={i} x={w / 2} y={h / 2 + hit.y} radius={3} fill={hit.color === "#fffbe6" ? "#facc15" : hit.color} opacity={0.85} shadowColor={hit.color} shadowBlur={6} />
      ))}
    </Group>
  ),
  bench: ({ w, h }) => (
    <Group>
      <Rect width={w} height={h} cornerRadius={3} fill="#e2e8f0" stroke="#64748b" strokeWidth={1.2} />
      {Array.from({ length: Math.floor(w / 10) + 1 }).map((_, i) => (
        <Line key={i} points={[i * 10, 0, i * 10, i % 10 === 0 ? h * 0.5 : i % 5 === 0 ? h * 0.35 : h * 0.2]} stroke="#475569" strokeWidth={0.6} />
      ))}
      {Array.from({ length: Math.floor(w / 100) + 1 }).map((_, i) => (
        <Text key={`t${i}`} x={i * 100 + 2} y={h * 0.55} text={`${i * 10} cm`} fontSize={8} fill="#334155" fontFamily={MONO} />
      ))}
    </Group>
  ),
};
