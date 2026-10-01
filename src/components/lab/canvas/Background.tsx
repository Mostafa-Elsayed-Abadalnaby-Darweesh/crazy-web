"use client";
import { Group, Line, Rect, Text } from "react-konva";
import type { LabMode, Viewport } from "@/lib/engine/types";

export const BENCH_Y = 770;

/** Static workspace backdrop: a lab bench (chemistry) or a blueprint table (physics) plus grid. */
export function Background({ mode, viewport, width, height, grid, gridSize }: { mode: LabMode; viewport: Viewport; width: number; height: number; grid: boolean; gridSize: number }) {
  const x1 = -viewport.x / viewport.scale;
  const y1 = -viewport.y / viewport.scale;
  const x2 = x1 + width / viewport.scale;
  const y2 = y1 + height / viewport.scale;
  const step = gridSize * (viewport.scale < 0.5 ? 5 : 1);
  const lines: React.ReactNode[] = [];
  if (grid) {
    const sx = Math.floor(x1 / step) * step;
    const sy = Math.floor(y1 / step) * step;
    for (let x = sx; x <= x2; x += step) {
      const major = Math.round(x / step) % 10 === 0;
      lines.push(<Line key={`gx${x}`} points={[x, y1, x, y2]} stroke={major ? "rgba(37,99,235,0.14)" : "rgba(100,116,139,0.08)"} strokeWidth={(major ? 1 : 0.6) / viewport.scale} />);
    }
    for (let y = sy; y <= y2; y += step) {
      const major = Math.round(y / step) % 10 === 0;
      lines.push(<Line key={`gy${y}`} points={[x1, y, x2, y]} stroke={major ? "rgba(37,99,235,0.14)" : "rgba(100,116,139,0.08)"} strokeWidth={(major ? 1 : 0.6) / viewport.scale} />);
    }
  }
  if (mode === "physics") {
    return (
      <Group listening={false}>
        <Rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#fbfdff" />
        <Rect x={40} y={120} width={1400} height={760} cornerRadius={14} fill="#f5f8fc" stroke="#dbe4ef" strokeWidth={2} shadowColor="#0f172a" shadowOpacity={0.05} shadowBlur={20} />
        {lines}
        <Text x={56} y={130} text="PHYSICS BENCH · 1 unit = 1 mm" fontSize={11} fill="#94a3b8" letterSpacing={1} />
      </Group>
    );
  }
  return (
    <Group listening={false}>
      <Rect x={x1} y={y1} width={x2 - x1} height={y2 - y1} fill="#ffffff" />
      <Rect x={x1} y={Math.min(y1, 0)} width={x2 - x1} height={BENCH_Y - Math.min(y1, 0)} fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 0, y: BENCH_Y }} fillLinearGradientColorStops={[0, "#f8fafc", 1, "#eef2f7"]} />
      {lines}
      <Rect x={x1} y={BENCH_Y} width={x2 - x1} height={26} fill="#dfe5ec" />
      <Line points={[x1, BENCH_Y, x2, BENCH_Y]} stroke="#b6c2d0" strokeWidth={1.5} />
      <Rect x={x1} y={BENCH_Y + 26} width={x2 - x1} height={30} fill="#cbd5e1" />
      <Rect x={x1} y={BENCH_Y + 56} width={x2 - x1} height={Math.max(0, y2 - BENCH_Y - 56)} fill="#f1f5f9" />
      {Array.from({ length: 12 }).map((_, i) => (
        <Rect key={i} x={i * 300 - 200} y={BENCH_Y + 70} width={280} height={180} cornerRadius={6} stroke="#dbe2ea" strokeWidth={1.5} />
      ))}
    </Group>
  );
}
