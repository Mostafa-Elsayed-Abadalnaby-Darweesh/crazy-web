"use client";
import { useEffect, useRef } from "react";
import type { Vec2, Viewport } from "@/lib/engine/types";

const SIZE = 22;

function niceStep(scale: number) {
  const target = 80 / scale; // aim for a labelled tick every ~80px
  const pow = Math.pow(10, Math.floor(Math.log10(target)));
  for (const m of [1, 2, 5, 10]) if (m * pow >= target) return m * pow;
  return 10 * pow;
}

/** Measurement rulers (mm) along the top and left edges of the workspace. */
export function Rulers({ viewport, width, height, pointer }: { viewport: Viewport; width: number; height: number; pointer: Vec2 | null }) {
  const top = useRef<HTMLCanvasElement>(null);
  const left = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const dpr = window.devicePixelRatio || 1;
    const step = niceStep(viewport.scale);
    const draw = (canvas: HTMLCanvasElement | null, horizontal: boolean) => {
      if (!canvas) return;
      const len = horizontal ? width - SIZE : height - SIZE;
      canvas.width = Math.max(1, len * dpr);
      canvas.height = SIZE * dpr;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, len, SIZE);
      ctx.strokeStyle = "#cbd5e1";
      ctx.fillStyle = "#64748b";
      ctx.font = "9px ui-monospace, monospace";
      const offset = horizontal ? viewport.x : viewport.y;
      const start = Math.floor(-offset / viewport.scale / step) * step;
      const end = (len - offset) / viewport.scale;
      for (let v = start; v <= end; v += step / 5) {
        const px = v * viewport.scale + offset;
        const major = Math.abs(v / step - Math.round(v / step)) < 1e-6;
        ctx.beginPath();
        if (horizontal) {
          ctx.moveTo(px + 0.5, SIZE);
          ctx.lineTo(px + 0.5, SIZE - (major ? 10 : 5));
        } else {
          ctx.moveTo(px + 0.5, 0);
          ctx.lineTo(px + 0.5, major ? 10 : 5);
        }
        ctx.stroke();
        if (major) ctx.fillText(String(Math.round(v)), px + 3, horizontal ? 10 : SIZE - 4);
      }
      const p = pointer ? (horizontal ? pointer.x : pointer.y) * viewport.scale + offset : null;
      if (p != null) {
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(p - 0.5, 0, 1.5, SIZE);
      }
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(0, horizontal ? SIZE - 0.5 : 0.5);
      ctx.lineTo(len, horizontal ? SIZE - 0.5 : 0.5);
      ctx.stroke();
    };
    draw(top.current, true);
    draw(left.current, false);
  }, [viewport, width, height, pointer]);

  return (
    <>
      <div className="absolute left-0 top-0 z-10 flex h-[22px] w-[22px] items-center justify-center border-b border-r border-slate-200 bg-slate-50 text-[8px] font-semibold text-slate-400">mm</div>
      <canvas ref={top} className="absolute top-0 z-10" style={{ left: SIZE, width: width - SIZE, height: SIZE }} />
      <canvas ref={left} className="absolute z-10 origin-top-left" style={{ left: SIZE, top: SIZE, width: height - SIZE, height: SIZE, transform: "rotate(90deg)" }} />
    </>
  );
}
