/**
 * DC / transient circuit solver based on nodal analysis.
 *
 * Every two-terminal component is converted to a Norton equivalent (conductance + current
 * source). Capacitors and inductors use backward-Euler companion models so charging curves and
 * AC signals evolve over simulation time. Diodes/LEDs are solved iteratively.
 */
import type { CircuitSolution, ComponentDefinition, ElementSolution, LabComponent, Wire } from "@/lib/engine/types";

const G_MIN = 1e-9;
const R_SHORT = 1e-3;

type Getter = (type: string) => ComponentDefinition | undefined;

interface Element {
  id: string;
  a: number;
  b: number;
  g: number; // conductance a-b
  i: number; // current source from b into a (Norton): positive pushes current out of a externally
}

class UnionFind {
  parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }
  union(a: string, b: string) {
    this.parent.set(this.find(a), this.find(b));
  }
}

export const terminalKey = (componentId: string, terminal: string) => `${componentId}:${terminal}`;

function num(c: LabComponent, key: string | undefined, fallback: number): number {
  if (!key) return fallback;
  const v = c.properties[key];
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

export function solveCircuit(
  components: LabComponent[],
  wires: Wire[],
  getDef: Getter,
  time: number,
  dt: number,
): CircuitSolution {
  const circuitComps = components.filter((c) => getDef(c.type)?.circuit && (getDef(c.type)?.terminals?.length ?? 0) >= 2);
  const empty: CircuitSolution = { elements: {}, nodeVoltages: {}, closedLoops: 0 };
  if (!circuitComps.length || !wires.length) return empty;

  // 1. Build electrical nodes from wires (and ideal wire components)
  const uf = new UnionFind();
  for (const c of circuitComps) for (const t of getDef(c.type)!.terminals!) uf.find(terminalKey(c.id, t.id));
  for (const w of wires) uf.union(terminalKey(w.from.componentId, w.from.terminal), terminalKey(w.to.componentId, w.to.terminal));

  const nodeIndex = new Map<string, number>();
  const idx = (key: string) => {
    const root = uf.find(key);
    if (!nodeIndex.has(root)) nodeIndex.set(root, nodeIndex.size);
    return nodeIndex.get(root)!;
  };

  // Only analyse components with at least one wire attached
  const wired = new Set<string>();
  for (const w of wires) {
    wired.add(w.from.componentId);
    wired.add(w.to.componentId);
  }

  const diodeOn = new Map<string, boolean>();
  let solution: { v: number[]; elements: Element[] } | null = null;

  for (let iter = 0; iter < 12; iter++) {
    const elements: Element[] = [];
    for (const c of circuitComps) {
      if (!wired.has(c.id)) continue;
      const def = getDef(c.type)!;
      const [ta, tb] = def.terminals!;
      const a = idx(terminalKey(c.id, ta.id));
      const b = idx(terminalKey(c.id, tb.id));
      const model = def.circuit!;
      if (c.state.blown) {
        // a burnt-out filament or LED is an open circuit
        elements.push({ id: c.id, a, b, g: G_MIN, i: 0 });
        continue;
      }
      switch (model.kind) {
        case "source": {
          const enabled = model.enabledKey ? c.properties[model.enabledKey] !== false : true;
          let v = num(c, model.voltageKey, 0);
          if (model.acKey && c.properties[model.acKey] === "AC") {
            const f = num(c, model.freqKey, 50);
            v = v * Math.sin(2 * Math.PI * f * time);
          }
          const r = Math.max(model.internalR ?? num(c, "internalResistance", 0.05), 1e-3);
          // terminal a = "+" ; Norton: current v/r injected into a
          elements.push({ id: c.id, a, b, g: 1 / r, i: enabled ? v / r : 0 });
          break;
        }
        case "resistor": {
          const fromState = model.stateKey ? c.state[model.stateKey] : undefined;
          const R = Math.max(typeof fromState === "number" ? fromState : model.fixed ?? num(c, model.resistanceKey, 100), 1e-3);
          elements.push({ id: c.id, a, b, g: 1 / R, i: 0 });
          break;
        }
        case "switch":
          if (c.properties[model.closedKey] === true) elements.push({ id: c.id, a, b, g: 1 / R_SHORT, i: 0 });
          else elements.push({ id: c.id, a, b, g: G_MIN, i: 0 });
          break;
        case "wire":
          elements.push({ id: c.id, a, b, g: 1 / R_SHORT, i: 0 });
          break;
        case "ammeter":
          elements.push({ id: c.id, a, b, g: 1 / 0.01, i: 0 });
          break;
        case "voltmeter":
          elements.push({ id: c.id, a, b, g: 1e-7, i: 0 });
          break;
        case "multimeter": {
          const mode = c.properties.mode;
          elements.push({ id: c.id, a, b, g: mode === "current" ? 100 : 1e-7, i: 0 });
          break;
        }
        case "diode": {
          const vf = model.forwardVoltage ?? num(c, model.forwardVoltageKey, 0.7);
          const on = diodeOn.get(c.id) ?? false;
          if (on) {
            const ron = 1;
            // Vf source + Ron from anode (a) to cathode (b): i = (vd - Vf)/Ron
            elements.push({ id: c.id, a, b, g: 1 / ron, i: vf / ron });
          } else {
            elements.push({ id: c.id, a, b, g: G_MIN * 10, i: 0 });
          }
          break;
        }
        case "capacitor": {
          const C = Math.max(num(c, model.capacitanceKey, 100) * 1e-6, 1e-12);
          const vPrev = typeof c.state.vc === "number" ? (c.state.vc as number) : 0;
          const geq = dt > 0 ? C / dt : G_MIN;
          // companion: i = geq*(v - vPrev) → Norton current source geq*vPrev into a
          elements.push({ id: c.id, a, b, g: geq, i: geq * vPrev });
          break;
        }
        case "inductor": {
          const L = Math.max(num(c, model.inductanceKey, 10) * 1e-3, 1e-9);
          const iPrev = typeof c.state.il === "number" ? (c.state.il as number) : 0;
          const geq = dt > 0 ? dt / L : 1 / R_SHORT;
          elements.push({ id: c.id, a, b, g: geq, i: -iPrev });
          break;
        }
      }
    }

    const n = nodeIndex.size;
    const G: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
    const I: number[] = new Array(n).fill(0);
    for (let k = 0; k < n; k++) G[k][k] += G_MIN;
    for (const e of elements) {
      G[e.a][e.a] += e.g;
      G[e.b][e.b] += e.g;
      G[e.a][e.b] -= e.g;
      G[e.b][e.a] -= e.g;
      I[e.a] += e.i;
      I[e.b] -= e.i;
    }
    const v = gaussianSolve(G, I);
    solution = { v, elements };

    // update diode states
    let changed = false;
    for (const e of elements) {
      const c = circuitComps.find((x) => x.id === e.id)!;
      const model = getDef(c.type)!.circuit!;
      if (model.kind !== "diode") continue;
      const vf = model.forwardVoltage ?? num(c, model.forwardVoltageKey, 0.7);
      const vd = v[e.a] - v[e.b];
      const on = diodeOn.get(c.id) ?? false;
      const current = e.g * vd - e.i;
      const nowOn = on ? current > 0 : vd > vf;
      if (nowOn !== on) {
        diodeOn.set(c.id, nowOn);
        changed = true;
      }
    }
    if (!changed) break;
  }

  if (!solution) return empty;
  const { v, elements } = solution;
  const result: Record<string, ElementSolution> = {};
  for (const e of elements) {
    const vd = v[e.a] - v[e.b];
    // Current flowing through the element from a to b (internal)
    const c = circuitComps.find((x) => x.id === e.id)!;
    const model = getDef(c.type)!.circuit!;
    let current = e.g * vd - e.i;
    if (model.kind === "source") current = -current; // report delivered current (out of + terminal)
    const power = Math.abs(vd * current);
    result[e.id] = { voltage: vd, current: Math.abs(current) < 1e-9 ? 0 : current, power };
  }
  const nodeVoltages: Record<string, number> = {};
  for (const c of circuitComps) {
    for (const t of getDef(c.type)!.terminals!) {
      const key = terminalKey(c.id, t.id);
      nodeVoltages[key] = v[idx(key)] ?? 0;
    }
  }
  const closedLoops = Object.values(result).filter((r) => Math.abs(r.current) > 1e-6).length;
  return { elements: result, nodeVoltages, closedLoops };
}

function gaussianSolve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    if (Math.abs(M[pivot][col]) < 1e-18) continue;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / M[col][col];
      if (f === 0) continue;
      for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
    }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-18 ? 0 : row[n] / row[i]));
}
