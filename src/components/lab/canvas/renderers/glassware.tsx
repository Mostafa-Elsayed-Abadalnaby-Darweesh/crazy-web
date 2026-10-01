"use client";
import { Circle, Group, Line, Rect, Shape, Text } from "react-konva";
import type { Context } from "konva/lib/Context";
import type { Mixture } from "@/lib/engine/types";
import { mixtureAppearance } from "@/lib/chemistry/mixture";
import { FONT, GLASS_FILL, GLASS_STROKE, type RenderCtx, type Renderer, Readout, fmt, findReading } from "./common";

type PathFn = (ctx: Context, w: number, h: number) => void;

function roundedBottom(ctx: Context, x1: number, x2: number, top: number, bottom: number, r: number) {
  ctx.moveTo(x1, top);
  ctx.lineTo(x1, bottom - r);
  ctx.quadraticCurveTo(x1, bottom, x1 + r, bottom);
  ctx.lineTo(x2 - r, bottom);
  ctx.quadraticCurveTo(x2, bottom, x2, bottom - r);
  ctx.lineTo(x2, top);
}

/** Outline/clip paths for each vessel shape (in local coordinates). */
const SHAPES: Record<string, { path: PathFn; liquid: (w: number, h: number) => [number, number]; open?: boolean }> = {
  beaker: {
    path: (ctx, w, h) => {
      ctx.moveTo(2, 2);
      ctx.lineTo(7, 6);
      roundedBottom(ctx, 7, w - 6, 6, h - 2, 7);
      ctx.lineTo(w - 3, 3);
    },
    liquid: (w, h) => [h - 2, 10],
    open: true,
  },
  testtube: {
    path: (ctx, w, h) => {
      const r = (w - 6) / 2;
      ctx.moveTo(1, 2);
      ctx.lineTo(3, 3);
      ctx.lineTo(3, h - r - 2);
      ctx.arc(w / 2, h - r - 2, r, Math.PI, 0, true);
      ctx.lineTo(w - 3, 3);
      ctx.lineTo(w - 1, 2);
    },
    liquid: (w, h) => [h - 2, 12],
    open: true,
  },
  erlenmeyer: {
    path: (ctx, w, h) => {
      const n1 = w * 0.37;
      const n2 = w * 0.63;
      const neck = h * 0.3;
      ctx.moveTo(n1 - 3, 1);
      ctx.lineTo(n1, 3);
      ctx.lineTo(n1, neck);
      ctx.lineTo(4, h - 8);
      ctx.quadraticCurveTo(2, h - 2, 9, h - 2);
      ctx.lineTo(w - 9, h - 2);
      ctx.quadraticCurveTo(w - 2, h - 2, w - 4, h - 8);
      ctx.lineTo(n2, neck);
      ctx.lineTo(n2, 3);
      ctx.lineTo(n2 + 3, 1);
    },
    liquid: (w, h) => [h - 2, h * 0.32],
    open: true,
  },
  flask: {
    path: (ctx, w, h) => {
      const n1 = w * 0.4;
      const n2 = w * 0.6;
      const r = Math.min(w / 2 - 3, h * 0.33);
      const cy = h - 2 - r * 0.92;
      const a = Math.asin(Math.min(1, (n2 - w / 2) / r));
      ctx.moveTo(n1 - 3, 1);
      ctx.lineTo(n1, 3);
      ctx.lineTo(n1, cy - r * Math.cos(a));
      ctx.arc(w / 2, cy, r, -Math.PI / 2 - a, Math.PI / 2 + 0.4, true);
      ctx.lineTo(w / 2 + r * Math.sin(0.4), h - 2);
      ctx.arc(w / 2, cy, r, Math.PI / 2 - 0.4, -Math.PI / 2 + a, true);
      ctx.lineTo(n2, 3);
      ctx.lineTo(n2 + 3, 1);
    },
    liquid: (w, h) => [h - 2, h - 2 - Math.min(w / 2 - 3, h * 0.33) * 1.9],
    open: true,
  },
  roundbottom: {
    path: (ctx, w, h) => {
      const n1 = w * 0.4;
      const n2 = w * 0.6;
      const r = Math.min(w / 2 - 3, h * 0.36);
      const cy = h - 2 - r;
      const a = Math.asin(Math.min(1, (n2 - w / 2) / r));
      ctx.moveTo(n1 - 3, 1);
      ctx.lineTo(n1, 3);
      ctx.lineTo(n1, cy - r * Math.cos(a));
      ctx.arc(w / 2, cy, r, -Math.PI / 2 - a, -Math.PI / 2 + a, true);
      ctx.lineTo(n2, 3);
      ctx.lineTo(n2 + 3, 1);
    },
    liquid: (w, h) => [h - 2, h - 2 - Math.min(w / 2 - 3, h * 0.36) * 1.9],
    open: true,
  },
  volumetric: {
    path: (ctx, w, h) => {
      const n1 = w * 0.43;
      const n2 = w * 0.57;
      const r = Math.min(w / 2 - 3, h * 0.22);
      const cy = h - 2 - r * 0.9;
      const a = Math.asin(Math.min(1, (n2 - w / 2) / r));
      ctx.moveTo(n1 - 3, 1);
      ctx.lineTo(n1, 3);
      ctx.lineTo(n1, cy - r * Math.cos(a));
      ctx.arc(w / 2, cy, r, -Math.PI / 2 - a, Math.PI / 2 + 0.45, true);
      ctx.lineTo(w / 2 + r * Math.sin(0.45), h - 2);
      ctx.arc(w / 2, cy, r, Math.PI / 2 - 0.45, -Math.PI / 2 + a, true);
      ctx.lineTo(n2, 3);
      ctx.lineTo(n2 + 3, 1);
    },
    liquid: (w, h) => [h - 2, h * 0.3],
    open: true,
  },
  cylinder: {
    path: (ctx, w, h) => {
      ctx.moveTo(w * 0.18, 2);
      ctx.lineTo(w * 0.22, 4);
      ctx.lineTo(w * 0.22, h - 12);
      ctx.lineTo(w * 0.78, h - 12);
      ctx.lineTo(w * 0.78, 4);
    },
    liquid: (w, h) => [h - 12, 14],
    open: true,
  },
  burette: {
    path: (ctx, w, h) => {
      ctx.moveTo(4, 0);
      ctx.lineTo(4, h * 0.86);
      ctx.lineTo(w / 2 - 2, h * 0.9);
      ctx.lineTo(w / 2 - 1, h);
      ctx.lineTo(w / 2 + 1, h);
      ctx.lineTo(w / 2 + 2, h * 0.9);
      ctx.lineTo(w - 4, h * 0.86);
      ctx.lineTo(w - 4, 0);
    },
    liquid: (w, h) => [h * 0.86, 8],
    open: true,
  },
  pipette: {
    path: (ctx, w, h) => {
      ctx.moveTo(w / 2 - 1.5, 0);
      ctx.lineTo(w / 2 - 1.5, h * 0.3);
      ctx.quadraticCurveTo(1, h * 0.32, 1, h * 0.4);
      ctx.lineTo(1, h * 0.52);
      ctx.quadraticCurveTo(1, h * 0.6, w / 2 - 1.5, h * 0.62);
      ctx.lineTo(w / 2 - 0.6, h);
      ctx.lineTo(w / 2 + 0.6, h);
      ctx.lineTo(w / 2 + 1.5, h * 0.62);
      ctx.quadraticCurveTo(w - 1, h * 0.6, w - 1, h * 0.52);
      ctx.lineTo(w - 1, h * 0.4);
      ctx.quadraticCurveTo(w - 1, h * 0.32, w / 2 + 1.5, h * 0.3);
      ctx.lineTo(w / 2 + 1.5, 0);
    },
    liquid: (w, h) => [h * 0.98, h * 0.2],
  },
  dropper: {
    path: (ctx, w, h) => {
      ctx.moveTo(w * 0.25, h * 0.32);
      ctx.lineTo(w / 2 - 1, h);
      ctx.lineTo(w / 2 + 1, h);
      ctx.lineTo(w * 0.75, h * 0.32);
    },
    liquid: (w, h) => [h * 0.98, h * 0.35],
  },
  sepfunnel: {
    path: (ctx, w, h) => {
      ctx.moveTo(w * 0.42, 0);
      ctx.lineTo(w * 0.42, h * 0.08);
      ctx.bezierCurveTo(0, h * 0.2, 0, h * 0.55, w * 0.46, h * 0.74);
      ctx.lineTo(w * 0.46, h * 0.84);
      ctx.lineTo(w * 0.49, h);
      ctx.lineTo(w * 0.51, h);
      ctx.lineTo(w * 0.54, h * 0.84);
      ctx.lineTo(w * 0.54, h * 0.74);
      ctx.bezierCurveTo(w, h * 0.55, w, h * 0.2, w * 0.58, h * 0.08);
      ctx.lineTo(w * 0.58, 0);
    },
    liquid: (w, h) => [h * 0.76, h * 0.12],
    open: true,
  },
  petri: {
    path: (ctx, w, h) => {
      roundedBottom(ctx, 2, w - 2, 2, h - 2, 4);
    },
    liquid: (w, h) => [h - 2, 6],
    open: true,
  },
  watch: {
    path: (ctx, w, h) => {
      ctx.moveTo(1, 2);
      ctx.quadraticCurveTo(w / 2, h * 1.6, w - 1, 2);
    },
    liquid: (w, h) => [h * 0.8, h * 0.25],
    open: true,
  },
  evaporating: {
    path: (ctx, w, h) => {
      ctx.moveTo(1, 4);
      ctx.lineTo(4, 5);
      ctx.bezierCurveTo(6, h + 2, w - 6, h + 2, w - 4, 5);
      ctx.lineTo(w - 1, 4);
    },
    liquid: (w, h) => [h - 2, 8],
    open: true,
  },
  crucible: {
    path: (ctx, w, h) => {
      ctx.moveTo(2, 3);
      ctx.lineTo(8, h - 2);
      ctx.lineTo(w - 8, h - 2);
      ctx.lineTo(w - 2, 3);
    },
    liquid: (w, h) => [h - 2, 8],
    open: true,
  },
};

function Bubbles({ w, top, bottom, clock, rate, count = 7, seed = 0 }: { w: number; top: number; bottom: number; clock: number; rate: number; count?: number; seed?: number }) {
  if (rate <= 0 || bottom - top < 4) return null;
  const n = Math.min(18, Math.max(3, Math.round(count * Math.min(3, rate * 4000))));
  return (
    <>
      {Array.from({ length: n }).map((_, i) => {
        const speed = 18 + ((i * 37 + seed) % 23);
        const phase = ((clock * speed + i * 29) % (bottom - top)) / (bottom - top);
        const x = w * 0.2 + ((i * 53 + seed * 7) % Math.max(1, Math.round(w * 0.6)));
        return <Circle key={i} x={x + Math.sin(clock * 3 + i) * 1.5} y={bottom - phase * (bottom - top)} radius={1 + ((i * 7) % 3) * 0.6} stroke="rgba(255,255,255,0.9)" strokeWidth={0.8} fill="rgba(255,255,255,0.35)" />;
      })}
    </>
  );
}

function Graduations({ w, top, bottom, capacity, x = w - 8, every = 5 }: { w: number; top: number; bottom: number; capacity: number; x?: number; every?: number }) {
  const lines = [];
  for (let i = 1; i <= every; i++) {
    const y = bottom - ((bottom - top) * i) / (every + 0.6);
    lines.push(<Line key={i} points={[x, y, x - (i % 2 ? 4 : 7), y]} stroke="#64748b" strokeWidth={0.8} />);
    if (i % 2 === 0 && w > 60) lines.push(<Text key={`t${i}`} x={x - 30} y={y - 4} width={22} align="right" text={String(Math.round((capacity * i) / (every + 0.6)))} fontSize={7} fill="#64748b" fontFamily={FONT} />);
  }
  return <>{lines}</>;
}

export function Vessel({ ctx, shape, showGrad = true }: { ctx: RenderCtx; shape: string; showGrad?: boolean }) {
  const { c, w, h, clock } = ctx;
  const s = SHAPES[shape] ?? SHAPES.beaker;
  const mix = c.state.mixture as Mixture | undefined;
  const capacity = Number(c.properties.capacity) || 100;
  const [bottom, top] = s.liquid(w, h);
  const frac = mix ? Math.min(1, mix.volumeMl / capacity) : 0;
  const level = bottom - frac * (bottom - top);
  const app = mix ? mixtureAppearance(mix) : null;
  const solidsH = app?.solid ? Math.max(2, Math.min((bottom - top) * 0.25, 3 + app.solidAmount * 10)) : 0;
  const gasRate = (c.state.gasRate as number) ?? 0;
  const stirring = Boolean(c.state.stirring);
  const clip = (context: Context) => {
    context.beginPath();
    s.path(context, w, h);
    if (s.open !== false) context.closePath();
  };
  return (
    <Group>
      <Group clipFunc={clip as never}>
        <Rect x={0} y={0} width={w} height={h} fill={GLASS_FILL} />
        {frac > 0 && app && (
          <>
            <Rect x={0} y={level} width={w} height={bottom - level + 4} fill={app.liquid} />
            <Line points={[0, level, w, level]} stroke="rgba(255,255,255,0.7)" strokeWidth={1.2} />
          </>
        )}
        {app?.solid && <Rect x={0} y={bottom - solidsH} width={w} height={solidsH + 4} fill={app.solid} opacity={0.95} />}
        {stirring && <Rect x={w / 2 - 8} y={bottom - 5} width={16} height={4} cornerRadius={2} fill="#f8fafc" stroke="#94a3b8" strokeWidth={0.6} rotation={0} scaleX={Math.cos(clock * 12)} offsetX={0} />}
        {frac > 0 && <Bubbles w={w} top={level} bottom={bottom - 2} clock={clock} rate={gasRate} seed={c.id.length} />}
        {Boolean(c.state.boiling) && <Bubbles w={w} top={level} bottom={bottom - 2} clock={clock * 1.4} rate={0.004} count={10} seed={3} />}
      </Group>
      <Shape
        sceneFunc={(context, shapeNode) => {
          context.beginPath();
          s.path(context, w, h);
          context.strokeShape(shapeNode);
        }}
        stroke={GLASS_STROKE}
        strokeWidth={1.6}
        lineJoin="round"
        lineCap="round"
      />
      <Line points={[w * 0.18, h * 0.25, w * 0.18, h * 0.7]} stroke="rgba(255,255,255,0.8)" strokeWidth={2} lineCap="round" listening={false} />
      {showGrad && <Graduations w={w} top={top} bottom={bottom} capacity={capacity} />}
    </Group>
  );
}

const vessel = (shape: string, grad = true): Renderer => {
  const VesselRenderer = (ctx: RenderCtx) => <Vessel ctx={ctx} shape={shape} showGrad={grad} />;
  return VesselRenderer;
};

export const GLASSWARE: Record<string, Renderer> = {
  beaker: vessel("beaker"),
  testtube: vessel("testtube", false),
  erlenmeyer: vessel("erlenmeyer"),
  flask: vessel("flask", false),
  roundbottom: vessel("roundbottom", false),
  volumetric: (ctx) => (
    <Group>
      <Vessel ctx={ctx} shape="volumetric" showGrad={false} />
      <Line points={[ctx.w * 0.4, ctx.h * 0.3, ctx.w * 0.6, ctx.h * 0.3]} stroke="#475569" strokeWidth={1} />
    </Group>
  ),
  cylinder: (ctx) => (
    <Group>
      <Vessel ctx={ctx} shape="cylinder" />
      <Rect x={2} y={ctx.h - 12} width={ctx.w - 4} height={10} cornerRadius={2} fill="#cbd5e1" stroke={GLASS_STROKE} strokeWidth={1} />
    </Group>
  ),
  burette: (ctx) => {
    const open = ctx.c.properties.open === true;
    const { w, h, clock } = ctx;
    const mix = ctx.c.state.mixture as Mixture | undefined;
    const app = mix ? mixtureAppearance(mix) : null;
    return (
      <Group>
        <Vessel ctx={ctx} shape="burette" showGrad={false} />
        {Array.from({ length: 11 }).map((_, i) => (
          <Line key={i} points={[w - 4, 8 + (i * (h * 0.86 - 8)) / 10, w - (i % 5 === 0 ? 11 : 8), 8 + (i * (h * 0.86 - 8)) / 10]} stroke="#64748b" strokeWidth={0.8} />
        ))}
        <Rect x={-6} y={h * 0.87} width={w + 12} height={6} cornerRadius={2} fill={open ? "#16a34a" : "#1e293b"} rotation={0} />
        <Rect x={w / 2 - 3} y={h * 0.855} width={6} height={12} cornerRadius={1} fill="#e2e8f0" stroke="#475569" strokeWidth={0.8} rotation={open ? 0 : 0} />
        {open && mix && mix.volumeMl > 0 && app && <Circle x={w / 2} y={h + 4 + ((clock * 60) % 30)} radius={1.8} fill={app.liquid} stroke="rgba(100,116,139,0.4)" strokeWidth={0.5} />}
      </Group>
    );
  },
  pipette: vessel("pipette", false),
  dropper: (ctx) => (
    <Group>
      <Vessel ctx={ctx} shape="dropper" showGrad={false} />
      <Rect x={ctx.w * 0.12} y={0} width={ctx.w * 0.76} height={ctx.h * 0.34} cornerRadius={[ctx.w * 0.38, ctx.w * 0.38, 3, 3]} fill="#ef4444" stroke="#b91c1c" strokeWidth={1} />
    </Group>
  ),
  sepfunnel: (ctx) => (
    <Group>
      <Vessel ctx={ctx} shape="sepfunnel" showGrad={false} />
      <Rect x={ctx.w * 0.3} y={ctx.h * 0.79} width={ctx.w * 0.4} height={5} cornerRadius={2} fill={ctx.c.properties.open ? "#16a34a" : "#1e293b"} />
      <Rect x={ctx.w * 0.4} y={-4} width={ctx.w * 0.2} height={6} cornerRadius={1} fill="#475569" />
    </Group>
  ),
  dish: (ctx) => {
    const v = ctx.c.type === "petri-dish" ? "petri" : ctx.c.type === "watch-glass" ? "watch" : "evaporating";
    return (
      <Group>
        {v === "evaporating" ? <Shape sceneFunc={(cx, sh) => { cx.beginPath(); SHAPES.evaporating.path(cx, ctx.w, ctx.h); cx.closePath(); cx.fillStrokeShape(sh); }} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1.4} /> : null}
        <Vessel ctx={ctx} shape={v} showGrad={false} />
      </Group>
    );
  },
  crucible: (ctx) => (
    <Group>
      <Shape sceneFunc={(cx, sh) => { cx.beginPath(); SHAPES.crucible.path(cx, ctx.w, ctx.h); cx.closePath(); cx.fillStrokeShape(sh); }} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.2} />
      <Vessel ctx={ctx} shape="crucible" showGrad={false} />
    </Group>
  ),
  funnel: ({ w, h }) => (
    <Group>
      <Line points={[2, 2, w - 2, 2, w * 0.56, h * 0.55, w * 0.56, h, w * 0.44, h, w * 0.44, h * 0.55]} closed fill={GLASS_FILL} stroke={GLASS_STROKE} strokeWidth={1.6} lineJoin="round" />
    </Group>
  ),
  mortar: (ctx) => {
    const { w, h } = ctx;
    return (
      <Group>
        <Shape sceneFunc={(cx, sh) => { cx.beginPath(); cx.moveTo(2, h * 0.35); cx.bezierCurveTo(4, h + 4, w - 4, h + 4, w - 2, h * 0.35); cx.closePath(); cx.fillStrokeShape(sh); }} fill="#f5f5f4" stroke="#a8a29e" strokeWidth={1.6} />
        <Rect x={w * 0.55} y={-4} width={9} height={h * 0.7} cornerRadius={4} fill="#e7e5e4" stroke="#a8a29e" strokeWidth={1} rotation={28} />
        {Object.keys((ctx.c.state.mixture as Mixture | undefined)?.solids ?? {}).length > 0 && <Rect x={w * 0.25} y={h * 0.6} width={w * 0.5} height={h * 0.15} cornerRadius={4} fill={ctx.c.state.ground ? "#e5e7eb" : "#cbd5e1"} />}
      </Group>
    );
  },
  electrolysis: (ctx) => {
    const { w, h, clock } = ctx;
    const I = Number(ctx.c.state.current ?? 0);
    const rate = I > 0.005 ? I * 0.02 : 0;
    const cathodeCu = ctx.c.state.cathodeProduct === "Cu";
    const dep = Number(ctx.c.state.copperDeposited ?? 0);
    const topBar = 14;
    return (
      <Group>
        <Group y={topBar}>
          <Vessel ctx={{ ...ctx, h: h - topBar }} shape="beaker" />
        </Group>
        <Rect x={4} y={0} width={w - 8} height={10} cornerRadius={2} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
        <Rect x={w * 0.3 - 4} y={4} width={8} height={h * 0.75} fill="#3f3f46" cornerRadius={1} />
        <Rect x={w * 0.7 - 4} y={4} width={8} height={h * 0.75} fill={cathodeCu && dep > 0.0005 ? "#b45309" : "#3f3f46"} cornerRadius={1} />
        <Text x={w * 0.3 - 6} y={-12} text="+" fontSize={12} fontStyle="bold" fill="#dc2626" />
        <Text x={w * 0.7 - 5} y={-12} text="−" fontSize={12} fontStyle="bold" fill="#1d4ed8" />
        {rate > 0 && (
          <>
            <Group x={w * 0.3 - 10}>
              <Bubbles w={20} top={h * 0.45} bottom={h * 0.85} clock={clock} rate={rate} seed={1} />
            </Group>
            {!cathodeCu && (
              <Group x={w * 0.7 - 10}>
                <Bubbles w={20} top={h * 0.45} bottom={h * 0.85} clock={clock * 1.3} rate={rate * 2} seed={5} />
              </Group>
            )}
          </>
        )}
      </Group>
    );
  },
  calorimeter: (ctx) => {
    const { w, h } = ctx;
    const t = findReading(ctx, "temperature");
    return (
      <Group>
        <Rect x={0} y={10} width={w} height={h - 10} cornerRadius={8} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.6} />
        <Group x={12} y={18}>
          <Vessel ctx={{ ...ctx, w: w - 24, h: h - 24 }} shape="beaker" showGrad={false} />
        </Group>
        <Rect x={-4} y={4} width={w + 8} height={10} cornerRadius={3} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={1} />
        <Line points={[w * 0.7, -10, w * 0.7, h - 20]} stroke="#64748b" strokeWidth={2} />
        <Readout x={w * 0.08} y={h - 28} width={w * 0.5} text={fmt(t)} />
      </Group>
    );
  },
};
