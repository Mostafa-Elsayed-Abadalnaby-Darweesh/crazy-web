import type { LabComponent, Vec2, WorldContext } from "./types";

export interface Bounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function boundsOf(c: LabComponent): Bounds {
  // Axis-aligned bounds of the rotated rectangle
  const { width: w, height: h } = c.dimensions;
  const cx = c.position.x + w / 2;
  const cy = c.position.y + h / 2;
  const th = (c.rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(th));
  const sin = Math.abs(Math.sin(th));
  const hw = (w * cos + h * sin) / 2;
  const hh = (w * sin + h * cos) / 2;
  return { x1: cx - hw, y1: cy - hh, x2: cx + hw, y2: cy + hh };
}

export function center(c: LabComponent): Vec2 {
  return { x: c.position.x + c.dimensions.width / 2, y: c.position.y + c.dimensions.height / 2 };
}

/** World position of a point given in relative (0..1) component coordinates. */
export function localPoint(c: LabComponent, rx: number, ry: number): Vec2 {
  const { width: w, height: h } = c.dimensions;
  const cx = c.position.x + w / 2;
  const cy = c.position.y + h / 2;
  const lx = (rx - 0.5) * w;
  const ly = (ry - 0.5) * h;
  const th = (c.rotation * Math.PI) / 180;
  return { x: cx + lx * Math.cos(th) - ly * Math.sin(th), y: cy + lx * Math.sin(th) + ly * Math.cos(th) };
}

export function contains(b: Bounds, p: Vec2, pad = 0): boolean {
  return p.x >= b.x1 - pad && p.x <= b.x2 + pad && p.y >= b.y1 - pad && p.y <= b.y2 + pad;
}

export function overlaps(a: Bounds, b: Bounds): boolean {
  return a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1;
}

export function overlapArea(a: Bounds, b: Bounds): number {
  const w = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);
  const h = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1);
  return w > 0 && h > 0 ? w * h : 0;
}

/** Find the component (matching `pred`) that contains point `p`; the smallest one wins. */
export function componentAt(world: WorldContext, p: Vec2, pred: (c: LabComponent) => boolean, excludeId?: string): LabComponent | undefined {
  let best: LabComponent | undefined;
  let bestArea = Infinity;
  for (const c of world.byId.values()) {
    if (c.id === excludeId || !pred(c)) continue;
    const b = boundsOf(c);
    if (contains(b, p)) {
      const area = (b.x2 - b.x1) * (b.y2 - b.y1);
      if (area < bestArea) {
        best = c;
        bestArea = area;
      }
    }
  }
  return best;
}

/** Find the nearest component (matching `pred`) directly below point `p` within `reach` mm. */
export function componentBelow(world: WorldContext, p: Vec2, reach: number, pred: (c: LabComponent) => boolean, excludeId?: string): LabComponent | undefined {
  let best: LabComponent | undefined;
  let bestDy = Infinity;
  for (const c of world.byId.values()) {
    if (c.id === excludeId || !pred(c)) continue;
    const b = boundsOf(c);
    if (p.x < b.x1 || p.x > b.x2) continue;
    const dy = b.y1 - p.y;
    if (dy >= -Math.min(40, (b.y2 - b.y1) * 0.8) && dy <= reach && dy < bestDy) {
      best = c;
      bestDy = dy;
    }
  }
  return best;
}
