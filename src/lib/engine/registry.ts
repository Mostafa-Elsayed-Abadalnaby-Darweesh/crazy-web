import type { ComponentDefinition, LabMode } from "./types";

/**
 * Global component registry. Catalog modules register definitions at import time; the canvas,
 * library, properties panel and simulation engine all look components up here, so adding a new
 * piece of equipment is a matter of registering one more definition.
 */
const registry = new Map<string, ComponentDefinition>();

export function registerComponent(def: ComponentDefinition) {
  registry.set(def.type, def);
}

export function registerComponents(defs: ComponentDefinition[]) {
  defs.forEach(registerComponent);
}

export function getDefinition(type: string): ComponentDefinition | undefined {
  return registry.get(type);
}

export function allDefinitions(): ComponentDefinition[] {
  return [...registry.values()];
}

export function definitionsFor(mode: LabMode): ComponentDefinition[] {
  return allDefinitions().filter((d) => d.category === mode);
}

export function libraryGroups(mode: LabMode): { group: string; items: ComponentDefinition[] }[] {
  const groups = new Map<string, ComponentDefinition[]>();
  const push = (group: string, d: ComponentDefinition) => {
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(d);
  };
  for (const d of definitionsFor(mode)) push(d.group, d);
  for (const d of allDefinitions()) for (const extra of d.alsoIn ?? []) if (extra.category === mode) push(extra.group, d);
  return [...groups.entries()].map(([group, items]) => ({ group, items }));
}
