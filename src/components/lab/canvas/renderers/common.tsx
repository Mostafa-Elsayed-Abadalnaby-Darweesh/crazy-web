"use client";
import { Group, Rect, Text } from "react-konva";
import type { ElementSolution, LabComponent, Reading } from "@/lib/engine/types";

export interface RenderCtx {
  c: LabComponent;
  w: number;
  h: number;
  clock: number; // wall-clock seconds for cosmetic animation
  circuit?: ElementSolution;
  readings: Reading[];
  screenHits?: { y: number; color: string }[];
  running: boolean;
}

export type Renderer = (ctx: RenderCtx) => React.ReactNode;

export const FONT = "Inter, Segoe UI, system-ui, sans-serif";
export const MONO = "JetBrains Mono, SFMono-Regular, Consolas, monospace";
export const GLASS_STROKE = "#7c8ea3";
export const GLASS_FILL = "rgba(225,238,252,0.35)";
export const METAL = "#94a3b8";
export const DARK = "#334155";

export function fmt(r: Reading | undefined): string {
  if (!r) return "--";
  const p = r.precision ?? 2;
  const v = Math.abs(r.value) >= 1e5 ? r.value.toExponential(2) : r.value.toFixed(p);
  return `${v}${r.unit ? " " + r.unit : ""}`;
}

export function findReading(ctx: RenderCtx, key: string) {
  return ctx.readings.find((r) => r.key === key);
}

/** Small LCD-style digital readout. */
export function Readout({ x, y, width, text, height = 16, fontSize = 10, color = "#5eead4", bg = "#0f172a" }: { x: number; y: number; width: number; text: string; height?: number; fontSize?: number; color?: string; bg?: string }) {
  return (
    <Group x={x} y={y} listening={false}>
      <Rect width={width} height={height} cornerRadius={3} fill={bg} />
      <Text width={width} height={height} text={text} fontFamily={MONO} fontSize={fontSize} fill={color} align="center" verticalAlign="middle" wrap="none" ellipsis />
    </Group>
  );
}

export function Knob({ x, y, r = 5, on = false }: { x: number; y: number; r?: number; on?: boolean }) {
  return (
    <Group x={x} y={y} listening={false}>
      <Rect x={-r} y={-r} width={r * 2} height={r * 2} cornerRadius={r} fill="#e2e8f0" stroke="#64748b" strokeWidth={1} />
      <Rect x={-1} y={-r + 1} width={2} height={r} fill={on ? "#16a34a" : "#475569"} />
    </Group>
  );
}
