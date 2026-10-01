"use client";
import type Konva from "konva";

/** Holds a reference to the live Konva stage so non-canvas code can take snapshots. */
let stage: Konva.Stage | null = null;

export function registerStage(s: Konva.Stage | null) {
  stage = s;
}

export function getStage() {
  return stage;
}

/** Snapshot of the workspace content (fitted to the components' bounding box). */
export function snapshotWorkspace(opts: { maxWidth?: number; mime?: string; quality?: number } = {}): string | undefined {
  if (!stage) return undefined;
  try {
    const layer = stage.findOne<Konva.Layer>("#content-layer");
    const bg = layer?.findOne(".bg");
    bg?.hide();
    const box = layer?.getClientRect({ skipShadow: true });
    bg?.show();
    const pad = 30;
    const rect = box && box.width > 0 ? { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } : undefined;
    const width = rect?.width ?? stage.width();
    const pixelRatio = Math.min(2, (opts.maxWidth ?? 1200) / Math.max(width, 1));
    const src = stage.toCanvas({ ...(rect ?? {}), pixelRatio });
    const out = document.createElement("canvas");
    out.width = src.width;
    out.height = src.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(src, 0, 0);
    return out.toDataURL(opts.mime ?? "image/png", opts.quality ?? 0.9);
  } catch {
    return undefined;
  }
}

export interface CanvasApi {
  toWorld: (clientX: number, clientY: number) => { x: number; y: number } | null;
  isInside: (clientX: number, clientY: number) => boolean;
  center: () => { x: number; y: number };
  fit: () => void;
}

let api: CanvasApi | null = null;
export function registerCanvasApi(a: CanvasApi | null) {
  api = a;
}
export function canvasApi() {
  return api;
}
