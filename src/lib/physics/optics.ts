/**
 * 2D geometric-optics ray tracer. Emitters (lasers, light sources) cast rays that interact with
 * thin lenses, mirrors, refracting polygons (prisms, glass blocks) and screens.
 * World units are millimetres.
 */
import type { ComponentDefinition, LabComponent, OpticsSolution, Reading, RaySegment, Vec2 } from "@/lib/engine/types";

type Getter = (type: string) => ComponentDefinition | undefined;

const MAX_DEPTH = 24;
const MAX_LEN = 4000;

const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const mul = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;
const cross = (a: Vec2, b: Vec2) => a.x * b.y - a.y * b.x;
const norm = (a: Vec2): Vec2 => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
const deg = (r: number) => (r * 180) / Math.PI;

export function centerOf(c: LabComponent): Vec2 {
  return { x: c.position.x + c.dimensions.width / 2, y: c.position.y + c.dimensions.height / 2 };
}

/** Local → world transform helpers for a component (rotation about its centre). */
export function frame(c: LabComponent) {
  const th = (c.rotation * Math.PI) / 180;
  const n = { x: Math.cos(th), y: Math.sin(th) }; // local +x
  const u = { x: -Math.sin(th), y: Math.cos(th) }; // local +y
  const C = centerOf(c);
  const toWorld = (lx: number, ly: number): Vec2 => add(C, add(mul(n, lx), mul(u, ly)));
  return { C, n, u, toWorld };
}

const WAVELENGTH_COLORS: [number, string][] = [
  [680, "#ef4444"],
  [610, "#f97316"],
  [580, "#eab308"],
  [530, "#22c55e"],
  [470, "#3b82f6"],
  [420, "#8b5cf6"],
];

function colorFor(wavelengths: number[]): string {
  if (wavelengths.length > 1) return "#fffbe6";
  const w = wavelengths[0];
  let best = WAVELENGTH_COLORS[0];
  for (const c of WAVELENGTH_COLORS) if (Math.abs(c[0] - w) < Math.abs(best[0] - w)) best = c;
  return best[1];
}

const LASER_WAVELENGTHS: Record<string, number[]> = {
  red: [650],
  green: [532],
  blue: [450],
  violet: [405],
  white: WAVELENGTH_COLORS.map((c) => c[0]),
};

interface Surface {
  comp: LabComponent;
  kind: "lens" | "mirror" | "screen" | "edge";
  a: Vec2;
  b: Vec2;
  normal: Vec2; // for edges: outward normal
  poly?: string; // polygon owner id
}

interface Ray {
  o: Vec2;
  d: Vec2;
  wl: number[];
  intensity: number;
  inside: string | null; // polygon id the ray is travelling in
}

function polygonLocal(c: LabComponent, shape: string): Vec2[] {
  const w = c.dimensions.width;
  const h = c.dimensions.height;
  if (shape === "prism") return [{ x: 0, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }];
  return [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }];
}

function refractiveIndex(base: number, wl: number): number {
  // Cauchy-like dispersion around 550 nm
  return base + 0.012 * ((550 / wl) ** 2 - 1) * (base - 1) * 4;
}

export function traceOptics(components: LabComponent[], getDef: Getter): OpticsSolution {
  const rays: RaySegment[] = [];
  const readings: Record<string, Reading[]> = {};
  const screenHits: Record<string, { y: number; color: string }[]> = {};
  const surfaces: Surface[] = [];
  const emitters: LabComponent[] = [];

  for (const c of components) {
    const def = getDef(c.type);
    if (!def) continue;
    const arch = def.visual.archetype;
    const f = frame(c);
    const h = c.dimensions.height;
    if (def.roles.includes("light-emitter")) {
      if (c.properties.on !== false) emitters.push(c);
      continue;
    }
    if (!def.roles.includes("optical")) continue;
    if (arch === "lens" || arch === "mirror" || arch === "screen") {
      surfaces.push({ comp: c, kind: arch, a: f.toWorld(0, -h / 2), b: f.toWorld(0, h / 2), normal: f.n });
    } else if (arch === "prism" || arch === "glass-block") {
      const pts = polygonLocal(c, arch === "prism" ? "prism" : "block").map((p) => f.toWorld(p.x, p.y));
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        const b = pts[(i + 1) % pts.length];
        const e = sub(b, a);
        // outward normal for clockwise screen-space polygon
        let nrm = norm({ x: e.y, y: -e.x });
        const mid = mul(add(a, b), 0.5);
        if (dot(nrm, sub(mid, f.C)) < 0) nrm = mul(nrm, -1);
        surfaces.push({ comp: c, kind: "edge", a, b, normal: nrm, poly: c.id });
      }
    }
  }

  const firstHitRecorded = new Set<string>();

  const trace = (ray: Ray, depth: number) => {
    if (depth > MAX_DEPTH || ray.intensity < 0.03) return;
    let best: { t: number; s: Surface } | null = null;
    for (const s of surfaces) {
      const e = sub(s.b, s.a);
      const den = cross(ray.d, e);
      if (Math.abs(den) < 1e-9) continue;
      const w = sub(s.a, ray.o);
      const t = cross(w, e) / den;
      const k = cross(w, ray.d) / den;
      if (t > 0.01 && k >= 0 && k <= 1 && (!best || t < best.t)) best = { t, s };
    }
    const color = colorFor(ray.wl);
    if (!best) {
      rays.push({ from: ray.o, to: add(ray.o, mul(ray.d, MAX_LEN)), color, intensity: ray.intensity });
      return;
    }
    const hit = add(ray.o, mul(ray.d, best.t));
    rays.push({ from: ray.o, to: hit, color, intensity: ray.intensity });
    const s = best.s;
    const c = s.comp;
    const f = frame(c);

    if (s.kind === "screen") {
      const y = dot(sub(hit, f.C), f.u);
      (screenHits[c.id] ??= []).push({ y, color });
      return;
    }

    if (s.kind === "lens") {
      const focal = (Number(c.properties.focalLength) || 10) * 10 * (getDef(c.type)?.visual.variant === "concave" ? -1 : 1);
      const y = dot(sub(hit, f.C), f.u);
      const dx = dot(ray.d, f.n);
      const dy = dot(ray.d, f.u);
      const sgn = dx >= 0 ? 1 : -1;
      const slope = dy / Math.abs(dx || 1e-6) - y / focal;
      const d = norm(add(mul(f.n, sgn), mul(f.u, slope)));
      trace({ ...ray, o: hit, d, intensity: ray.intensity * 0.96 }, depth + 1);
      return;
    }

    if (s.kind === "mirror") {
      const n = f.n;
      let d = norm(sub(ray.d, mul(n, 2 * dot(ray.d, n))));
      const kind = String(c.properties.mirrorType ?? "plane");
      if (kind !== "plane") {
        const focal = (Number(c.properties.focalLength) || 10) * 10 * (kind === "convex" ? -1 : 1);
        const y = dot(sub(hit, f.C), f.u);
        const dx = dot(d, n);
        const sgn = dx >= 0 ? 1 : -1;
        const slope = dot(d, f.u) / Math.abs(dx || 1e-6) - y / focal;
        d = norm(add(mul(n, sgn), mul(f.u, slope)));
      }
      if (!firstHitRecorded.has(c.id)) {
        firstHitRecorded.add(c.id);
        const inc = deg(Math.acos(Math.min(1, Math.abs(dot(ray.d, n)))));
        readings[c.id] = [
          { key: "incidenceAngle", label: "Angle of incidence", value: inc, unit: "°", precision: 1 },
          { key: "reflectionAngle", label: "Angle of reflection", value: inc, unit: "°", precision: 1 },
        ];
      }
      trace({ ...ray, o: hit, d, intensity: ray.intensity * 0.92 }, depth + 1);
      return;
    }

    // refracting polygon edge
    const base = Number(c.properties.refractiveIndex) || 1.5;
    const entering = dot(ray.d, s.normal) < 0;
    const wls = ray.wl.length > 1 ? ray.wl.map((w) => [w]) : [ray.wl];
    for (const wl of wls) {
      const nGlass = refractiveIndex(base, wl[0]);
      const n1 = entering ? 1 : nGlass;
      const n2 = entering ? nGlass : 1;
      const N = entering ? s.normal : mul(s.normal, -1); // points against incoming ray
      const cosi = -dot(N, ray.d);
      const eta = n1 / n2;
      const k = 1 - eta * eta * (1 - cosi * cosi);
      const inc = deg(Math.acos(Math.min(1, Math.abs(cosi))));
      const share = ray.intensity / (wls.length > 1 ? 1.4 : 1);
      if (k < 0) {
        const d = norm(sub(ray.d, mul(N, -2 * cosi)));
        trace({ o: hit, d, wl, intensity: share * 0.95, inside: ray.inside }, depth + 1);
      } else {
        const d = norm(add(mul(ray.d, eta), mul(N, eta * cosi - Math.sqrt(k))));
        const ref = deg(Math.acos(Math.min(1, Math.abs(dot(d, N)))));
        if (entering && !firstHitRecorded.has(c.id)) {
          firstHitRecorded.add(c.id);
          readings[c.id] = [
            { key: "incidenceAngle", label: "Angle of incidence", value: inc, unit: "°", precision: 1 },
            { key: "refractionAngle", label: "Angle of refraction", value: ref, unit: "°", precision: 1 },
            { key: "refractiveIndex", label: "Refractive index", value: base, unit: "", precision: 2 },
          ];
        }
        trace({ o: hit, d, wl, intensity: share * 0.9, inside: entering ? c.id : null }, depth + 1);
      }
    }
  };

  for (const e of emitters) {
    const f = frame(e);
    const origin = f.toWorld(e.dimensions.width / 2, 0);
    const def = getDef(e.type)!;
    const wl = LASER_WAVELENGTHS[String(e.properties.color ?? "red")] ?? [650];
    if (def.visual.archetype === "laser") {
      trace({ o: origin, d: f.n, wl, intensity: 1, inside: null }, 0);
    } else {
      const count = Math.max(1, Math.min(15, Number(e.properties.rays) || 5));
      const spread = ((Number(e.properties.spread) || 20) * Math.PI) / 180;
      const pointSource = e.properties.beam === "divergent";
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        if (pointSource) {
          const a = t * spread;
          const d = norm(add(mul(f.n, Math.cos(a)), mul(f.u, Math.sin(a))));
          trace({ o: origin, d, wl: LASER_WAVELENGTHS.white, intensity: 0.8, inside: null }, 0);
        } else {
          const o = f.toWorld(e.dimensions.width / 2, t * e.dimensions.height * 0.8);
          trace({ o, d: f.n, wl: LASER_WAVELENGTHS.white, intensity: 0.8, inside: null }, 0);
        }
      }
    }
  }

  // Lens measurements (thin-lens equation) relative to the nearest emitter on the optical axis
  for (const s of surfaces) {
    if (s.kind !== "lens") continue;
    const c = s.comp;
    const f = frame(c);
    const focal = (Number(c.properties.focalLength) || 10) * (getDef(c.type)?.visual.variant === "concave" ? -1 : 1);
    let u: number | null = null;
    for (const e of emitters) {
      const rel = sub(centerOf(e), f.C);
      const along = Math.abs(dot(rel, f.n));
      const off = Math.abs(dot(rel, f.u));
      if (off < c.dimensions.height && (u == null || along < u)) u = along / 10;
    }
    const r: Reading[] = [{ key: "focalLength", label: "Focal length", value: focal, unit: "cm", precision: 1 }];
    if (u != null && u > 0) {
      r.push({ key: "objectDistance", label: "Object distance", value: u, unit: "cm", precision: 1 });
      if (Math.abs(u - focal) > 1e-6) {
        const v = 1 / (1 / focal - 1 / u);
        r.push({ key: "imageDistance", label: "Image distance", value: v, unit: "cm", precision: 1 });
        r.push({ key: "magnification", label: "Magnification", value: -v / u, unit: "×", precision: 2 });
      }
    }
    readings[c.id] = r;
  }

  for (const [id, hits] of Object.entries(screenHits)) {
    const ys = hits.map((h) => h.y);
    const spot = ys.length ? Math.max(...ys) - Math.min(...ys) : 0;
    readings[id] = [
      { key: "raysOnScreen", label: "Rays on screen", value: hits.length, unit: "", precision: 0 },
      { key: "spotSize", label: "Spot size", value: spot, unit: "mm", precision: 1 },
    ];
  }

  return { rays, readings, screenHits };
}
