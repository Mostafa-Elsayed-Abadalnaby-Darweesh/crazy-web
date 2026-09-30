import type {
  CircuitSolution,
  ComponentPatch,
  Environment,
  LabComponent,
  OpticsSolution,
  Reading,
  SimEvent,
  SimulateResult,
  Wire,
  WorldContext,
} from "./types";
import { getDefinition } from "./registry";
import { solveCircuit } from "@/lib/physics/circuit";
import { traceOptics } from "@/lib/physics/optics";

export const DEFAULT_ENV: Environment = { gravity: 9.81, ambientTemperature: 25, pressure: 101.3 };

export function buildWorld(components: LabComponent[], wires: Wire[], time: number, dt: number, env: Environment = DEFAULT_ENV): WorldContext {
  const circuit: CircuitSolution = solveCircuit(components, wires, getDefinition, time, dt);
  const optics: OpticsSolution = traceOptics(components, getDefinition);
  return { components, byId: new Map(components.map((c) => [c.id, c])), wires, time, dt, env, circuit, optics };
}

function applyPatch(c: LabComponent, p: Partial<ComponentPatch> | SimulateResult): LabComponent {
  return {
    ...c,
    state: p.state ? { ...c.state, ...p.state } : c.state,
    properties: p.properties ? { ...c.properties, ...p.properties } : c.properties,
    position: p.position ?? c.position,
  };
}

export interface StepResult {
  components: LabComponent[];
  events: { componentId: string; event: SimEvent }[];
  world: WorldContext;
}

/**
 * Advance the simulation by `dt` seconds. Components are processed sequentially against a working
 * copy so that cross-component effects (pouring, heating) are always applied to fresh state.
 */
export function stepSimulation(components: LabComponent[], wires: Wire[], time: number, dt: number, env: Environment = DEFAULT_ENV): StepResult {
  const world = buildWorld(components, wires, time, dt, env);
  const working = new Map(components.map((c) => [c.id, c]));
  world.byId = working;
  const events: StepResult["events"] = [];
  for (const original of components) {
    const c = working.get(original.id)!;
    const def = getDefinition(c.type);
    if (!def?.simulate) continue;
    const res = def.simulate(c, world);
    if (!res) continue;
    working.set(c.id, applyPatch(c, res));
    for (const p of res.patches ?? []) {
      const target = working.get(p.id);
      if (target) working.set(p.id, applyPatch(target, p));
    }
    for (const e of res.events ?? []) events.push({ componentId: c.id, event: e });
  }
  const next = components.map((c) => working.get(c.id)!);
  return { components: next, events, world };
}

/** Apply a user action (button in the properties panel) through the component's definition. */
export function runAction(components: LabComponent[], wires: Wire[], componentId: string, action: string, time: number, env: Environment = DEFAULT_ENV) {
  const world = buildWorld(components, wires, time, 0, env);
  const c = world.byId.get(componentId);
  const def = c ? getDefinition(c.type) : undefined;
  if (!c || !def?.onAction) return null;
  const res = def.onAction(action, c, world);
  if (!res) return null;
  const working = new Map(components.map((x) => [x.id, x]));
  working.set(c.id, applyPatch(c, res));
  for (const p of res.patches ?? []) {
    const t = working.get(p.id);
    if (t) working.set(p.id, applyPatch(t, p));
  }
  return { components: components.map((x) => working.get(x.id)!), events: res.events ?? [] };
}

export interface LiveReading {
  componentId: string;
  source: string;
  reading: Reading;
}

export function collectReadings(world: WorldContext): LiveReading[] {
  const out: LiveReading[] = [];
  for (const c of world.byId.values()) {
    const def = getDefinition(c.type);
    const list = [...(def?.readings?.(c, world) ?? []), ...(world.optics.readings[c.id] ?? [])];
    for (const r of list) if (Number.isFinite(r.value)) out.push({ componentId: c.id, source: c.name, reading: r });
  }
  return out;
}
