import type { ComponentDefinition } from "@/lib/engine/types";
import { componentAt, componentBelow, localPoint } from "@/lib/engine/geometry";
import { P, bool, containerReadings, containerSimulate, heaterPower, num, probeTemperature } from "./helpers";

const G = "Thermodynamics";
const R = 8.314;

export const THERMO_DEFINITIONS: ComponentDefinition[] = [
  {
    type: "heater",
    label: "Immersion heater",
    category: "physics",
    group: G,
    description: "Electric heater with fixed power. Immerse in a liquid or place under a vessel.",
    size: { width: 30, height: 150 },
    visual: { archetype: "heater" },
    roles: ["heater"],
    properties: [P.toggle("on", "Power on", "Controls"), P.number("power", "Power", "W", 1, 2000, 1, "Controls")],
    defaults: { on: false, power: 100 },
    readings: (c) => [{ key: "heaterPower", label: "Power", value: bool(c, "on") ? num(c, "power", 100) : 0, unit: "W", precision: 0 }],
    simulate: (c, w) => (bool(c, "on") ? { state: { energy: ((c.state.energy as number) ?? 0) + num(c, "power", 100) * w.dt } } : undefined),
  },
  {
    type: "calorimeter",
    label: "Calorimeter",
    category: "physics",
    group: G,
    description: "Insulated vessel for measuring heat transfer (Q = mcΔT).",
    size: { width: 120, height: 130 },
    visual: { archetype: "calorimeter" },
    roles: ["container"],
    properties: [P.capacity(1000), P.slider("insulation", "Insulation", 0, 1, 0.05, "", "Specification")],
    defaults: { capacity: 400, insulation: 0.92 },
    emptyMass: 250,
    simulate: containerSimulate,
    readings: (c) => containerReadings(c),
    actions: [{ id: "empty", label: "Empty calorimeter" }],
  },
  {
    type: "temperature-sensor",
    label: "Temperature sensor",
    category: "physics",
    group: G,
    description: "Digital probe for logging temperature (place tip in liquid or gas chamber).",
    size: { width: 20, height: 150 },
    visual: { archetype: "tempsensor" },
    roles: ["sensor"],
    properties: [],
    defaults: {},
    readings: (c, w) => [{ key: "temperature", label: "Temperature", value: probeTemperature(c, w, 0.5, 0.95), unit: "°C", precision: 2 }],
  },
  {
    type: "gas-chamber",
    label: "Gas chamber",
    category: "physics",
    group: G,
    description: "Piston-sealed ideal gas: PV = nRT. Heat it or change its volume.",
    size: { width: 120, height: 170 },
    visual: { archetype: "gaschamber" },
    roles: ["mechanics", "sensor"],
    properties: [P.number("moles", "Amount of gas n", "mol", 0.001, 10, 0.001, "Gas"), P.slider("volume", "Volume V", 0.1, 5, 0.05, "L", "Gas"), P.number("initialTemperature", "Initial temperature", "°C", -50, 300, 1, "Gas")],
    defaults: { moles: 0.05, volume: 1.2, initialTemperature: 25 },
    initialState: (c) => ({ temperature: num(c, "initialTemperature", 25) }),
    simulate: (c, w) => {
      let T = (c.state.temperature as number) ?? num(c, "initialTemperature", 25);
      const below = componentBelow(w, localPoint(c, 0.5, 1), 230, (x) => x.type === "bunsen-burner" || x.type === "hot-plate" || x.type === "heater", c.id);
      const inside = [...w.byId.values()].find((h) => h.type === "heater" && componentAt(w, localPoint(h, 0.5, 0.9), (x) => x.id === c.id));
      const heatCap = num(c, "moles", 0.05) * 20.8 + 150; // gas + chamber walls (J/K)
      const power = (below ? heaterPower(below, T) : 0) + (inside ? heaterPower(inside, T) : 0);
      T += (power * 0.25 * w.dt) / heatCap;
      T += (w.env.ambientTemperature - T) * Math.min(1, 0.004 * w.dt);
      return { state: { temperature: T } };
    },
    readings: (c) => {
      const T = ((c.state.temperature as number) ?? num(c, "initialTemperature", 25)) + 273.15;
      const V = num(c, "volume", 1.2);
      const n = num(c, "moles", 0.05);
      return [
        { key: "pressure", label: "Pressure", value: (n * R * T) / V, unit: "kPa", precision: 2 },
        { key: "gasVolume", label: "Volume", value: V, unit: "L", precision: 2 },
        { key: "temperature", label: "Temperature", value: T - 273.15, unit: "°C", precision: 1 },
      ];
    },
  },
  {
    type: "pressure-sensor",
    label: "Pressure sensor",
    category: "physics",
    group: G,
    description: "Reads the pressure of the gas chamber it is attached to (overlapping).",
    size: { width: 60, height: 60 },
    visual: { archetype: "device", variant: "pressure" },
    roles: ["sensor"],
    properties: [],
    defaults: {},
    readings: (c, w) => {
      const p = localPoint(c, 0.5, 0.5);
      const chamber = [...w.byId.values()].find((x) => x.type === "gas-chamber" && Math.abs(localPoint(x, 0.5, 0.5).x - p.x) < x.dimensions.width / 2 + 40 && Math.abs(localPoint(x, 0.5, 0.5).y - p.y) < x.dimensions.height / 2 + 40);
      if (!chamber) return [{ key: "pressure", label: "Pressure", value: w.env.pressure, unit: "kPa", precision: 2 }];
      const T = ((chamber.state.temperature as number) ?? 25) + 273.15;
      return [{ key: "pressure", label: "Pressure", value: (num(chamber, "moles", 0.05) * R * T) / num(chamber, "volume", 1.2), unit: "kPa", precision: 2 }];
    },
  },
];

