"use client";
import { Circle, Group, Line, Shape, Text } from "react-konva";
import type { LabComponent, Mixture } from "@/lib/engine/types";
import type { LabEffect } from "@/store/labStore";
import { localPoint } from "@/lib/engine/geometry";
import { mixtureAppearance } from "@/lib/chemistry/mixture";

/** Deterministic pseudo-random in [0,1) so particles don't jump between frames. */
const rnd = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/** A flickering flame whose base sits at (0,0) and grows upwards. */
export function Flame({ size, color = "#fb923c", core = "#fde047", clock, seed = 0, opacity = 1 }: { size: number; color?: string; core?: string; clock: number; seed?: number; opacity?: number }) {
  const flick = 1 + Math.sin(clock * 17 + seed) * 0.08 + Math.sin(clock * 29 + seed * 3) * 0.05;
  const sway = Math.sin(clock * 5 + seed) * size * 0.08;
  const h = size * flick;
  return (
    <Group listening={false} opacity={opacity}>
      <Shape
        sceneFunc={(ctx, s) => {
          ctx.beginPath();
          ctx.moveTo(-size * 0.32, 0);
          ctx.bezierCurveTo(-size * 0.4, -h * 0.45, sway - size * 0.05, -h * 0.75, sway, -h);
          ctx.bezierCurveTo(sway + size * 0.05, -h * 0.75, size * 0.4, -h * 0.45, size * 0.32, 0);
          ctx.closePath();
          ctx.fillStrokeShape(s);
        }}
        fill={color}
        opacity={0.85}
        shadowColor={color}
        shadowBlur={size * 0.6}
      />
      <Shape
        sceneFunc={(ctx, s) => {
          ctx.beginPath();
          ctx.moveTo(-size * 0.14, 0);
          ctx.quadraticCurveTo(sway * 0.5, -h * 0.75, size * 0.14, 0);
          ctx.closePath();
          ctx.fillStrokeShape(s);
        }}
        fill={core}
      />
    </Group>
  );
}

function Wisps({ x, y, width, strength, clock, color = "255,255,255", seed = 0, count = 5, rise = 90 }: { x: number; y: number; width: number; strength: number; clock: number; color?: string; seed?: number; count?: number; rise?: number }) {
  if (strength <= 0.02) return null;
  return (
    <Group listening={false}>
      {Array.from({ length: count }).map((_, i) => {
        const period = 2.2 + rnd(i + seed) * 1.4;
        const phase = ((clock + rnd(i * 7 + seed) * period) % period) / period;
        const px = x + (rnd(i * 3 + seed) - 0.5) * width + Math.sin(clock * 1.3 + i) * 6 * phase;
        const py = y - phase * rise;
        const r = 5 + phase * 16;
        return <Circle key={i} x={px} y={py} radius={r} fill={`rgba(${color},${(0.35 * strength * (1 - phase)).toFixed(3)})`} />;
      })}
    </Group>
  );
}


/** Continuous effects driven by component state: steam, coloured gases, fires, burning metal, bubbling alkali metal. */
function Ambient({ c, clock }: { c: LabComponent; clock: number }) {
  const mix = c.state.mixture as Mixture | undefined;
  if (!mix) return null;
  const mouth = localPoint(c, 0.5, 0);
  const w = c.dimensions.width;
  const rates = (c.state.gasRates as Record<string, number> | undefined) ?? {};
  const out: React.ReactNode[] = [];
  const seed = c.id.length;

  // steam / vapour above hot liquids
  if (mix.volumeMl > 0.5 && mix.temperature > 55) {
    const s = Math.min(1, (mix.temperature - 55) / 45) * (c.state.boiling ? 1.4 : 1);
    out.push(<Wisps key="steam" x={mouth.x} y={mouth.y} width={w * 0.5} strength={s} clock={clock} seed={seed} count={c.state.boiling ? 8 : 5} />);
  }
  // coloured / visible gases escaping
  const gasColor: [string, string, number][] = [
    ["cl2", "190,220,90", 3000],
    ["so2", "230,230,230", 3000],
    ["nh3g", "235,240,245", 2000],
    ["co2", "245,248,250", 400],
  ];
  for (const [id, col, k] of gasColor) {
    const r = rates[id] ?? 0;
    if (r > 0) out.push(<Wisps key={id} x={mouth.x} y={mouth.y} width={w * 0.6} strength={Math.min(1, r * k)} clock={clock * 0.8} color={col} seed={seed + id.length} count={id === "cl2" ? 9 : 5} rise={id === "cl2" ? 60 : 80} />);
  }
  // burning liquid
  if (c.state.onFire) {
    out.push(
      <Group key="fire" x={mouth.x} y={mouth.y + 4}>
        {[-0.25, 0, 0.25].map((dx, i) => (
          <Group key={i} x={dx * w * 0.7}>
            <Flame size={34 + i * 6} color="#f97316" clock={clock} seed={i * 2.1 + seed} />
          </Group>
        ))}
      </Group>,
      <Wisps key="fire-smoke" x={mouth.x} y={mouth.y - 50} width={w * 0.6} strength={0.9} clock={clock} color="90,90,95" seed={seed + 11} count={6} rise={110} />,
    );
  }
  // magnesium burning: blinding white light
  if (c.state.burning === "mg") {
    const p = localPoint(c, 0.5, 0.6);
    const pulse = 0.85 + Math.sin(clock * 40) * 0.1 + rnd(Math.floor(clock * 30)) * 0.1;
    out.push(
      <Group key="mg" listening={false}>
        <Circle x={p.x} y={p.y} radius={90 * pulse} fillRadialGradientStartPoint={{ x: 0, y: 0 }} fillRadialGradientEndPoint={{ x: 0, y: 0 }} fillRadialGradientStartRadius={0} fillRadialGradientEndRadius={90 * pulse} fillRadialGradientColorStops={[0, "rgba(255,255,255,0.95)", 0.25, "rgba(240,246,255,0.7)", 1, "rgba(255,255,255,0)"]} />
        <Circle x={p.x} y={p.y} radius={10} fill="#ffffff" shadowColor="#ffffff" shadowBlur={40} />
        <Wisps x={p.x} y={p.y - 20} width={30} strength={1} clock={clock} color="250,250,250" seed={seed + 5} count={7} rise={120} />
      </Group>,
    );
  }
  // alkali metal skating on water with a small flame
  if ((mix.solids.na ?? 0) > 1e-6 && mix.volumeMl > 0.5) {
    const cap = Number(c.properties.capacity) || 100;
    const top = localPoint(c, 0.5, 1).y - Math.min(1, mix.volumeMl / cap) * c.dimensions.height * 0.85;
    const x = mouth.x + Math.sin(clock * 2.3 + seed) * w * 0.28;
    out.push(
      <Group key="na" x={x} y={top}>
        <Circle radius={4} fill="#e5e7eb" stroke="#9ca3af" strokeWidth={0.6} />
        <Group y={-3}>
          <Flame size={12} color="#fbbf24" core="#fff7ed" clock={clock * 1.5} seed={seed} />
        </Group>
      </Group>,
    );
  }
  return <>{out}</>;
}

/** One-shot effects (age-based animations). */
function OneShotFx({ e, byId, now }: { e: LabEffect; byId: Map<string, LabComponent>; now: number }) {
  const c = byId.get(e.componentId);
  if (!c) return null;
  const age = (now - e.at) / 1000;
  const mouth = localPoint(c, 0.5, 0);
  const center = localPoint(c, 0.5, 0.5);
  switch (e.type) {
    case "pop": {
      if (age > 0.9) return null;
      const t = age / 0.9;
      return (
        <Group x={mouth.x} y={mouth.y - 10} listening={false}>
          <Circle radius={10 + t * 45} stroke="#fb923c" strokeWidth={3 * (1 - t)} opacity={1 - t} />
          <Circle radius={6 + t * 20} fill="#fde68a" opacity={(1 - t) * 0.8} shadowColor="#f97316" shadowBlur={25} />
          <Text text="POP!" x={-18} y={-40 - t * 20} fontSize={16} fontStyle="bold" fill="#ea580c" opacity={1 - t} />
        </Group>
      );
    }
    case "flash":
    case "ignite": {
      const dur = e.type === "flash" ? 1.2 : 0.8;
      if (age > dur) return null;
      const t = age / dur;
      const col = e.type === "flash" ? "255,255,255" : "251,146,60";
      return <Circle x={center.x} y={mouth.y} radius={40 + t * 160} fill={`rgba(${col},${(0.7 * (1 - t)).toFixed(3)})`} shadowColor={`rgb(${col})`} shadowBlur={40} listening={false} />;
    }
    case "relight": {
      if (age > 1) return null;
      const t = age;
      return <Circle x={center.x} y={localPoint(c, 0.5, 1).y} radius={8 + t * 30} fill={`rgba(251,191,36,${(0.8 * (1 - t)).toFixed(3)})`} shadowColor="#f59e0b" shadowBlur={30} listening={false} />;
    }
    case "extinguish":
    case "smoke":
      if (age > 2.5) return null;
      return <Wisps x={mouth.x} y={mouth.y} width={c.dimensions.width * 0.5} strength={1 - age / 2.5} clock={age + 3} color="120,120,125" count={7} seed={e.id.length} rise={70} />;
    case "precipitate": {
      if (age > 3) return null;
      const w = c.dimensions.width * 0.6;
      const bottom = localPoint(c, 0.5, 0.95).y;
      const top = localPoint(c, 0.5, 0.45).y;
      const app = c.state.mixture ? mixtureAppearance(c.state.mixture as Mixture) : null;
      const col = app?.solid ?? "#f8fafc";
      return (
        <Group listening={false}>
          {Array.from({ length: 26 }).map((_, i) => {
            const fall = Math.min(1, (age / 3) * (0.6 + rnd(i) * 0.8));
            return <Circle key={i} x={center.x + (rnd(i * 5) - 0.5) * w} y={top + (bottom - top) * fall} radius={1.4 + rnd(i * 9) * 1.4} fill={col} stroke="rgba(100,116,139,0.5)" strokeWidth={0.4} opacity={1 - fall * 0.3} />;
          })}
        </Group>
      );
    }
    case "splash": {
      if (age > 0.6) return null;
      const t = age / 0.6;
      return (
        <Group x={mouth.x} y={localPoint(c, 0.5, 0.35).y} listening={false}>
          {Array.from({ length: 7 }).map((_, i) => {
            const a = -Math.PI / 2 + (i - 3) * 0.35;
            return <Circle key={i} x={Math.cos(a) * 20 * t} y={Math.sin(a) * 28 * t + 40 * t * t} radius={2} fill="rgba(147,197,253,0.9)" opacity={1 - t} />;
          })}
        </Group>
      );
    }
    case "pour": {
      if (age > 1.2 || !e.targetId) return null;
      const target = byId.get(e.targetId);
      if (!target) return null;
      const from = localPoint(c, 0.08, 0.02);
      const to = localPoint(target, 0.5, 0.25);
      const t = Math.min(1, age / 0.25);
      const fade = age > 0.9 ? 1 - (age - 0.9) / 0.3 : 1;
      const mid = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 40 };
      return (
        <Shape
          listening={false}
          opacity={fade}
          sceneFunc={(ctx, s) => {
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            const ex = from.x + (to.x - from.x) * t;
            const ey = from.y + (to.y - from.y) * t;
            ctx.quadraticCurveTo(mid.x, mid.y, ex, ey);
            ctx.strokeShape(s);
          }}
          stroke={e.color ?? "rgba(147,197,253,0.8)"}
          strokeWidth={4}
          lineCap="round"
        />
      );
    }
    case "spark": {
      if (age > 0.6) return null;
      const p = localPoint(c, 0, 0.5);
      return (
        <Group x={p.x} y={p.y} listening={false}>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = rnd(i + e.at) * Math.PI * 2;
            const r = 8 + age * 90 * (0.5 + rnd(i * 3));
            return <Line key={i} points={[Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6 + age * age * 60, Math.cos(a) * r, Math.sin(a) * r + age * age * 60]} stroke="#fde047" strokeWidth={2} shadowColor="#f59e0b" shadowBlur={8} opacity={1 - age / 0.6} />;
          })}
        </Group>
      );
    }
    case "burnout":
      if (age > 1.6) return null;
      return (
        <Group listening={false}>
          {age < 0.15 && <Circle x={center.x} y={localPoint(c, 0.5, 0.3).y} radius={40} fill="rgba(255,255,255,0.9)" shadowColor="#fde047" shadowBlur={40} />}
          <Wisps x={center.x} y={localPoint(c, 0.5, 0.2).y} width={20} strength={1 - age / 1.6} clock={age + 2} color="110,110,115" count={4} seed={3} rise={50} />
        </Group>
      );
    case "sizzle":
      return null; // the continuous alkali-metal flame is drawn by Ambient
    default:
      return null;
  }
}

export function EffectsLayer({ components, effects, clock }: { components: LabComponent[]; effects: LabEffect[]; clock: number }) {
  const now = Date.now();
  const byId = new Map(components.map((c) => [c.id, c]));
  return (
    <Group listening={false}>
      {components.map((c) => (
        <Ambient key={c.id} c={c} clock={clock} />
      ))}
      {effects.filter((e) => now - e.at < 3500).map((e) => (
        <OneShotFx key={e.id} e={e} byId={byId} now={now} />
      ))}
    </Group>
  );
}
