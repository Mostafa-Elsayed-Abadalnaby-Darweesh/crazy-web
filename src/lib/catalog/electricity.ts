import type { ComponentDefinition, LabComponent, Reading, WorldContext } from "@/lib/engine/types";
import { P, bool, num, str } from "./helpers";

const G = "Electricity";
const TWO: ComponentDefinition["terminals"] = [
  { id: "a", x: 0, y: 0.5, label: "A" },
  { id: "b", x: 1, y: 0.5, label: "B" },
];

const sol = (c: LabComponent, w: WorldContext) => w.circuit.elements[c.id] ?? { voltage: 0, current: 0, power: 0 };

const basicReadings = (c: LabComponent, w: WorldContext): Reading[] => {
  const s = sol(c, w);
  return [
    { key: "voltage", label: "Voltage", value: Math.abs(s.voltage), unit: "V", precision: 2 },
    { key: "current", label: "Current", value: Math.abs(s.current), unit: "A", precision: 3 },
    { key: "power", label: "Power", value: s.power, unit: "W", precision: 3 },
  ];
};

function def(d: Omit<ComponentDefinition, "category" | "group" | "roles"> & { roles?: ComponentDefinition["roles"] }): ComponentDefinition {
  return { category: "physics", group: G, roles: ["circuit"], terminals: TWO, ...d } as ComponentDefinition;
}

export const ELECTRICITY_DEFINITIONS: ComponentDefinition[] = [
  def({
    type: "battery",
    label: "Battery",
    description: "DC cell. Terminal A is positive (+).",
    size: { width: 90, height: 44 },
    visual: { archetype: "battery" },
    terminals: [
      { id: "pos", x: 0, y: 0.5, label: "+" },
      { id: "neg", x: 1, y: 0.5, label: "−" },
    ],
    circuit: { kind: "source", voltageKey: "voltage" },
    properties: [P.number("voltage", "EMF", "V", 0, 48, 0.5, "Electrical"), P.number("internalResistance", "Internal resistance", "Ω", 0.001, 10, 0.01, "Electrical")],
    defaults: { voltage: 6, internalResistance: 0.1 },
    readings: (c, w) => {
      const s = sol(c, w);
      return [
        { key: "voltage", label: "Terminal voltage", value: Math.abs(s.voltage), unit: "V", precision: 2 },
        { key: "current", label: "Current", value: Math.abs(s.current), unit: "A", precision: 3 },
      ];
    },
  }),
  def({
    type: "power-supply",
    label: "Power supply",
    alsoIn: [{ category: "chemistry", group: "Electrochemistry" }],
    description: "Variable DC/AC bench supply.",
    size: { width: 130, height: 80 },
    visual: { archetype: "device", variant: "powersupply" },
    terminals: [
      { id: "pos", x: 0.3, y: 1, label: "+" },
      { id: "neg", x: 0.7, y: 1, label: "−" },
    ],
    circuit: { kind: "source", voltageKey: "voltage", acKey: "mode", freqKey: "frequency", enabledKey: "on", internalR: 0.05 },
    properties: [
      P.toggle("on", "Output on", "Electrical"),
      P.slider("voltage", "Voltage", 0, 30, 0.1, "V", "Electrical"),
      P.select("mode", "Mode", [["DC", "DC"], ["AC", "AC (sine)"]], "Electrical"),
      P.number("frequency", "Frequency", "Hz", 0.1, 50, 0.1, "Electrical"),
    ],
    defaults: { on: true, voltage: 12, mode: "DC", frequency: 1 },
    readings: basicReadings,
  }),
  def({
    type: "resistor",
    label: "Resistor",
    description: "Fixed resistor obeying Ohm's law (V = IR).",
    size: { width: 100, height: 30 },
    visual: { archetype: "resistor" },
    circuit: { kind: "resistor", resistanceKey: "resistance" },
    properties: [P.number("resistance", "Resistance", "Ω", 0.1, 1e6, 1, "Electrical"), P.select("tolerance", "Tolerance", [["1", "±1%"], ["5", "±5%"], ["10", "±10%"]], "Electrical")],
    defaults: { resistance: 100, tolerance: "5" },
    readings: basicReadings,
  }),
  def({
    type: "variable-resistor",
    label: "Variable resistor",
    description: "Rheostat — slide to change resistance.",
    size: { width: 110, height: 40 },
    visual: { archetype: "resistor", variant: "variable" },
    circuit: { kind: "resistor", resistanceKey: "resistance" },
    properties: [P.slider("resistance", "Resistance", 1, 1000, 1, "Ω", "Electrical")],
    defaults: { resistance: 50 },
    readings: basicReadings,
  }),
  def({
    type: "capacitor",
    label: "Capacitor",
    description: "Stores charge (Q = CV). Charges exponentially through a resistor (τ = RC).",
    size: { width: 70, height: 44 },
    visual: { archetype: "capacitor" },
    circuit: { kind: "capacitor", capacitanceKey: "capacitance" },
    properties: [P.number("capacitance", "Capacitance", "µF", 0.1, 1e6, 1, "Electrical")],
    defaults: { capacitance: 10000 },
    simulate: (c, w) => ({ state: { vc: sol(c, w).voltage } }),
    readings: (c, w) => {
      const v = sol(c, w).voltage;
      return [
        { key: "voltage", label: "Voltage", value: Math.abs(v), unit: "V", precision: 3 },
        { key: "current", label: "Current", value: Math.abs(sol(c, w).current), unit: "A", precision: 4 },
        { key: "charge", label: "Charge", value: Math.abs(v) * num(c, "capacitance", 100), unit: "µC", precision: 1 },
      ];
    },
  }),
  def({
    type: "inductor",
    label: "Inductor",
    description: "Coil that opposes changes in current (V = L dI/dt).",
    size: { width: 100, height: 36 },
    visual: { archetype: "inductor" },
    circuit: { kind: "inductor", inductanceKey: "inductance" },
    properties: [P.number("inductance", "Inductance", "mH", 0.1, 100000, 1, "Electrical")],
    defaults: { inductance: 500 },
    simulate: (c, w) => ({ state: { il: sol(c, w).current } }),
    readings: basicReadings,
  }),
  def({
    type: "diode",
    label: "Diode",
    description: "Conducts only from anode (A) to cathode (B) once forward voltage is exceeded.",
    size: { width: 80, height: 30 },
    visual: { archetype: "diode" },
    circuit: { kind: "diode", forwardVoltageKey: "forwardVoltage" },
    properties: [P.number("forwardVoltage", "Forward voltage", "V", 0.1, 3, 0.05, "Electrical")],
    defaults: { forwardVoltage: 0.7 },
    readings: basicReadings,
  }),
  def({
    type: "led",
    label: "LED",
    description: "Light-emitting diode. Lights when forward current flows (A → B).",
    size: { width: 44, height: 64 },
    visual: { archetype: "led" },
    terminals: [
      { id: "a", x: 0.3, y: 1, label: "anode" },
      { id: "b", x: 0.7, y: 1, label: "cathode" },
    ],
    circuit: { kind: "diode", forwardVoltageKey: "forwardVoltage" },
    properties: [P.select("color", "Colour", [["red", "Red"], ["green", "Green"], ["blue", "Blue"], ["yellow", "Yellow"], ["white", "White"]], "Electrical"), P.number("forwardVoltage", "Forward voltage", "V", 1, 4, 0.1, "Electrical")],
    defaults: { color: "red", forwardVoltage: 2 },
    simulate: (c, w) => {
      const lit = sol(c, w).current > 0.001;
      return { state: { lit, brightness: Math.min(1, sol(c, w).current / 0.02) }, events: lit && !c.state.lit ? [{ kind: "observation", message: `${c.name} lights up` }] : [] };
    },
    readings: basicReadings,
  }),
  def({
    type: "switch",
    label: "Switch",
    description: "Opens or closes the circuit. Double-click to toggle.",
    size: { width: 90, height: 36 },
    visual: { archetype: "switch" },
    circuit: { kind: "switch", closedKey: "closed" },
    properties: [P.toggle("closed", "Closed", "Electrical")],
    defaults: { closed: false },
    actions: [{ id: "toggle", label: "Toggle switch" }],
    onAction: (a, c) => (a === "toggle" ? { properties: { closed: !bool(c, "closed") }, events: [{ kind: "action", message: `${c.name} ${bool(c, "closed") ? "opened" : "closed"}` }] } : undefined),
  }),
  def({
    type: "wire-segment",
    label: "Wire",
    description: "Conducting lead. You can also draw wires directly between terminals with the wire tool.",
    size: { width: 100, height: 12 },
    visual: { archetype: "wire" },
    circuit: { kind: "wire" },
    properties: [],
    defaults: {},
    keywords: ["lead", "cable", "connector"],
  }),
  def({
    type: "bulb",
    label: "Bulb",
    description: "Filament lamp; brightness depends on power dissipated.",
    size: { width: 60, height: 80 },
    visual: { archetype: "bulb" },
    terminals: [
      { id: "a", x: 0.3, y: 1, label: "A" },
      { id: "b", x: 0.7, y: 1, label: "B" },
    ],
    circuit: { kind: "resistor", resistanceKey: "resistance" },
    properties: [P.number("resistance", "Resistance", "Ω", 0.5, 1000, 0.5, "Electrical"), P.number("ratedPower", "Rated power", "W", 0.1, 100, 0.1, "Electrical")],
    defaults: { resistance: 12, ratedPower: 3 },
    simulate: (c, w) => {
      const b = Math.min(1.2, sol(c, w).power / num(c, "ratedPower", 3));
      const lit = b > 0.05;
      return { state: { brightness: b, lit }, events: lit && !c.state.lit ? [{ kind: "observation", message: `${c.name} lights up` }] : !lit && c.state.lit ? [{ kind: "observation", message: `${c.name} goes out` }] : [] };
    },
    readings: basicReadings,
  }),
  def({
    type: "motor",
    label: "Motor",
    description: "DC motor; speed is proportional to current.",
    size: { width: 80, height: 70 },
    visual: { archetype: "motor" },
    terminals: [
      { id: "a", x: 0.25, y: 1, label: "A" },
      { id: "b", x: 0.75, y: 1, label: "B" },
    ],
    circuit: { kind: "resistor", resistanceKey: "resistance" },
    properties: [P.number("resistance", "Winding resistance", "Ω", 0.5, 500, 0.5, "Electrical"), P.number("kv", "Speed constant", "rpm/A", 10, 5000, 10, "Electrical")],
    defaults: { resistance: 8, kv: 800 },
    simulate: (c, w) => {
      const rpm = sol(c, w).current * num(c, "kv", 800);
      return { state: { rpm, angle: (((c.state.angle as number) ?? 0) + rpm * 6 * w.dt) % 360 } };
    },
    readings: (c, w) => [...basicReadings(c, w), { key: "rpm", label: "Speed", value: (c.state.rpm as number) ?? 0, unit: "rpm", precision: 0 }],
  }),
  def({
    type: "ammeter",
    label: "Ammeter",
    alsoIn: [{ category: "chemistry", group: "Electrochemistry" }],
    description: "Measures current — connect in series.",
    size: { width: 80, height: 80 },
    visual: { archetype: "meter", variant: "A" },
    roles: ["circuit", "sensor"],
    circuit: { kind: "ammeter" },
    properties: [P.select("range", "Range", [["0.1", "100 mA"], ["1", "1 A"], ["10", "10 A"]], "Display")],
    defaults: { range: "10" },
    readings: (c, w) => [{ key: "current", label: "Current", value: Math.abs(sol(c, w).current), unit: "A", precision: 3 }],
  }),
  def({
    type: "voltmeter",
    label: "Voltmeter",
    description: "Measures potential difference — connect in parallel.",
    size: { width: 80, height: 80 },
    visual: { archetype: "meter", variant: "V" },
    roles: ["circuit", "sensor"],
    circuit: { kind: "voltmeter" },
    properties: [P.select("range", "Range", [["2", "2 V"], ["20", "20 V"], ["200", "200 V"]], "Display")],
    defaults: { range: "20" },
    readings: (c, w) => [{ key: "voltage", label: "Voltage", value: Math.abs(sol(c, w).voltage), unit: "V", precision: 2 }],
  }),
  def({
    type: "multimeter",
    label: "Multimeter",
    description: "Digital multimeter: voltage (parallel) or current (series) mode.",
    size: { width: 90, height: 130 },
    visual: { archetype: "device", variant: "multimeter" },
    terminals: [
      { id: "a", x: 0.3, y: 1, label: "COM" },
      { id: "b", x: 0.7, y: 1, label: "VΩA" },
    ],
    roles: ["circuit", "sensor"],
    circuit: { kind: "multimeter" },
    properties: [P.select("mode", "Mode", [["voltage", "Voltage (V)"], ["current", "Current (A)"]], "Display")],
    defaults: { mode: "voltage" },
    readings: (c, w) =>
      str(c, "mode") === "current"
        ? [{ key: "current", label: "Current", value: Math.abs(sol(c, w).current), unit: "A", precision: 3 }]
        : [{ key: "voltage", label: "Voltage", value: Math.abs(sol(c, w).voltage), unit: "V", precision: 3 }],
  }),
  def({
    type: "oscilloscope",
    label: "Oscilloscope",
    description: "Plots voltage against time. Connect across a component.",
    size: { width: 190, height: 130 },
    visual: { archetype: "oscilloscope" },
    terminals: [
      { id: "a", x: 0.35, y: 1, label: "CH1" },
      { id: "b", x: 0.65, y: 1, label: "GND" },
    ],
    roles: ["circuit", "sensor"],
    circuit: { kind: "voltmeter" },
    properties: [P.select("voltsPerDiv", "Volts/div", [["0.5", "0.5 V"], ["1", "1 V"], ["2", "2 V"], ["5", "5 V"], ["10", "10 V"]], "Display"), P.select("timePerDiv", "Time/div", [["0.1", "0.1 s"], ["0.5", "0.5 s"], ["1", "1 s"]], "Display")],
    defaults: { voltsPerDiv: "5", timePerDiv: "0.5" },
    simulate: (c, w) => {
      const hist = ((c.state.trace as number[]) ?? []).slice(-199);
      hist.push(sol(c, w).voltage);
      return { state: { trace: hist } };
    },
    readings: (c, w) => [{ key: "voltage", label: "CH1 voltage", value: sol(c, w).voltage, unit: "V", precision: 2 }],
  }),
];
