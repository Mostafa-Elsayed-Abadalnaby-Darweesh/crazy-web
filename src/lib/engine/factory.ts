import { nanoid } from "nanoid";
import type { LabComponent, PropValue, Vec2 } from "./types";
import { getDefinition } from "./registry";
import { emptyMixture } from "@/lib/chemistry/mixture";

export const uid = (prefix = "") => `${prefix}${nanoid(8)}`;

function nextName(label: string, existing: LabComponent[]): string {
  const re = new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (\\d+)$`);
  let max = 0;
  for (const c of existing) {
    const m = c.name.match(re);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${label} ${String(max + 1).padStart(2, "0")}`;
}

/** Create a new component instance from its registered definition. */
export function createComponent(
  type: string,
  position: Vec2,
  existing: LabComponent[] = [],
  overrides: { properties?: Record<string, PropValue>; name?: string; rotation?: number; width?: number; height?: number } = {},
): LabComponent | null {
  const def = getDefinition(type);
  if (!def) return null;
  const c: LabComponent = {
    id: `${type}-${nanoid(6)}`,
    type,
    category: def.category,
    name: overrides.name ?? nextName(def.label, existing),
    position: { x: Math.round(position.x), y: Math.round(position.y) },
    rotation: overrides.rotation ?? 0,
    dimensions: { width: overrides.width ?? def.size.width, height: overrides.height ?? def.size.height },
    properties: { ...def.defaults, ...(overrides.properties ?? {}) },
    connections: [],
    state: {},
  };
  c.state = initialStateFor(c);
  return c;
}

export function initialStateFor(c: LabComponent): LabComponent["state"] {
  const def = getDefinition(c.type);
  const state: LabComponent["state"] = { ...(def?.initialState?.(c) ?? {}) };
  if (def?.roles.includes("container")) state.mixture = emptyMixture();
  return state;
}
