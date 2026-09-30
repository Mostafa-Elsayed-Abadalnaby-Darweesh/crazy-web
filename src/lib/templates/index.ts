/**
 * Experiment templates are pure data: a list of components (by registered type), their initial
 * contents, wires, chart presets and notebook text. Nothing here is special-cased by the engine.
 */
import type { ChartKind, LabMode, NotebookSections, PropValue } from "@/lib/engine/types";
import type { AddAmount } from "@/lib/chemistry/mixture";

export interface TemplateComponent {
  ref: string;
  type: string;
  x: number;
  y: number;
  name?: string;
  rotation?: number;
  width?: number;
  height?: number;
  props?: Record<string, PropValue>;
  fill?: { chem: string; amount: AddAmount }[];
  temperature?: number;
}

export interface ExperimentTemplate {
  id: string;
  name: string;
  category: LabMode;
  topic: string;
  level: "Introductory" | "Intermediate" | "Advanced";
  duration: string;
  description: string;
  components: TemplateComponent[];
  wires?: [string, string, string, string][];
  charts?: { title: string; kind: ChartKind; x: string; y: string[] }[];
  steps: string[];
  notebook: Partial<NotebookSections>;
  logInterval?: number;
}

export const TEMPLATES: ExperimentTemplate[] = [
  /* ============================ CHEMISTRY ============================ */
  {
    id: "acid-base-titration",
    name: "Acid–Base Titration",
    category: "chemistry",
    topic: "Volumetric analysis",
    level: "Intermediate",
    duration: "20 min",
    description: "Titrate 25 mL of 0.1 M HCl with 0.1 M NaOH using phenolphthalein and a pH meter to find the equivalence point.",
    components: [
      { ref: "stand", type: "retort-stand", x: 250, y: 290, height: 480 },
      { ref: "clamp", type: "clamp", x: 310, y: 400 },
      { ref: "burette", type: "burette", x: 395, y: 300, props: { flowRate: 0.4 }, fill: [{ chem: "naoh", amount: { volumeMl: 50, concentration: 0.1 } }] },
      { ref: "flask", type: "erlenmeyer-flask", x: 357, y: 620, fill: [{ chem: "hcl", amount: { volumeMl: 25, concentration: 0.1 } }, { chem: "phenolphthalein", amount: { volumeMl: 1 } }] },
      { ref: "stirrer", type: "magnetic-stirrer", x: 347, y: 750, props: { on: true } },
      { ref: "ph", type: "ph-meter", x: 415, y: 583 },
    ],
    charts: [
      { title: "Titration curve", kind: "line", x: "volumeDelivered", y: ["ph"] },
      { title: "pH vs time", kind: "area", x: "t", y: ["ph"] },
    ],
    steps: ["Press Run Experiment.", "Open the burette stopcock (select the burette → Stopcock open).", "Watch the pH rise and the indicator turn pink near 25 mL.", "Close the stopcock after the colour change and record the end-point volume."],
    notebook: {
      objective: "To determine the concentration of hydrochloric acid by titration against standard 0.100 M sodium hydroxide.",
      theory: "HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l). At the equivalence point n(HCl) = n(NaOH). Phenolphthalein changes from colourless to pink between pH 8.2 and 10.",
      hypothesis: "The equivalence point will occur after approximately 25.0 mL of NaOH has been added, at pH ≈ 7.",
    },
  },
  {
    id: "reaction-rate",
    name: "Reaction Rate Experiment",
    category: "chemistry",
    topic: "Kinetics",
    level: "Intermediate",
    duration: "15 min",
    description: "Sodium thiosulfate reacts with hydrochloric acid producing a sulfur precipitate. Measure how quickly the solution turns cloudy and how temperature affects the rate.",
    components: [
      { ref: "flask", type: "erlenmeyer-flask", x: 380, y: 610, fill: [{ chem: "na2s2o3", amount: { volumeMl: 50, concentration: 0.2 } }] },
      { ref: "plate", type: "hot-plate", x: 365, y: 740, props: { heat: false, setTemperature: 40 } },
      { ref: "acid", type: "beaker", x: 600, y: 630, name: "Acid beaker", fill: [{ chem: "hcl", amount: { volumeMl: 10, concentration: 2 } }] },
      { ref: "cyl", type: "graduated-cylinder", x: 780, y: 560 },
      { ref: "thermo", type: "thermometer", x: 440, y: 560 },
      { ref: "watch", type: "stopwatch", x: 180, y: 640 },
    ],
    charts: [{ title: "Turbidity vs time", kind: "line", x: "t", y: ["turbidity"] }],
    steps: ["Press Run Experiment.", "Right-click the acid beaker → Pour into → Erlenmeyer flask.", "Observe the solution becoming cloudy; the turbidity is logged automatically.", "Reset, switch on the hot plate (40 °C) and repeat to compare rates."],
    notebook: {
      objective: "To investigate how temperature affects the rate of reaction between sodium thiosulfate and hydrochloric acid.",
      theory: "Na₂S₂O₃ + 2HCl → 2NaCl + S↓ + SO₂ + H₂O. Rate increases with temperature because more particles exceed the activation energy (≈ doubling every 10 °C).",
      hypothesis: "Increasing the temperature will shorten the time taken for the solution to become opaque.",
    },
  },
  {
    id: "ph-measurement",
    name: "pH Measurement",
    category: "chemistry",
    topic: "Acids & bases",
    level: "Introductory",
    duration: "10 min",
    description: "Compare the pH of strong and weak acids, a neutral salt and a strong base using universal indicator and a pH meter.",
    components: [
      { ref: "b1", type: "beaker", x: 180, y: 640, name: "HCl 0.1 M", fill: [{ chem: "hcl", amount: { volumeMl: 50, concentration: 0.1 } }, { chem: "universal-indicator", amount: { volumeMl: 1 } }] },
      { ref: "b2", type: "beaker", x: 320, y: 640, name: "CH₃COOH 0.1 M", fill: [{ chem: "ch3cooh", amount: { volumeMl: 50, concentration: 0.1 } }, { chem: "universal-indicator", amount: { volumeMl: 1 } }] },
      { ref: "b3", type: "beaker", x: 460, y: 640, name: "NaCl 0.1 M", fill: [{ chem: "h2o", amount: { volumeMl: 50 } }, { chem: "nacl", amount: { massG: 0.29 } }, { chem: "universal-indicator", amount: { volumeMl: 1 } }] },
      { ref: "b4", type: "beaker", x: 600, y: 640, name: "NH₃ 0.1 M", fill: [{ chem: "nh3", amount: { volumeMl: 50, concentration: 0.1 } }, { chem: "universal-indicator", amount: { volumeMl: 1 } }] },
      { ref: "b5", type: "beaker", x: 740, y: 640, name: "NaOH 0.1 M", fill: [{ chem: "naoh", amount: { volumeMl: 50, concentration: 0.1 } }, { chem: "universal-indicator", amount: { volumeMl: 1 } }] },
      { ref: "ph", type: "ph-meter", x: 212, y: 600 },
    ],
    steps: ["Drag the pH meter so its electrode dips into each beaker in turn.", "Press Capture in the Measurements tab for each reading.", "Compare the indicator colours with the measured pH values."],
    notebook: {
      objective: "To measure and compare the pH of common laboratory solutions.",
      theory: "pH = −log₁₀[H⁺]. Strong acids dissociate fully; weak acids only partially (Ka ≪ 1). Universal indicator shows a continuous colour change across pH 0–14.",
    },
  },
  {
    id: "electrolysis",
    name: "Electrolysis of Copper Sulfate",
    category: "chemistry",
    topic: "Electrochemistry",
    level: "Intermediate",
    duration: "15 min",
    description: "Pass a current through copper(II) sulfate solution. Copper deposits at the cathode and oxygen is released at the anode (Faraday's laws).",
    components: [
      { ref: "cell", type: "electrolysis-cell", x: 420, y: 600, fill: [{ chem: "cuso4", amount: { volumeMl: 200, concentration: 0.5 } }] },
      { ref: "psu", type: "power-supply", x: 160, y: 440, props: { voltage: 6 } },
      { ref: "am", type: "ammeter", x: 700, y: 440 },
    ],
    wires: [
      ["psu", "pos", "cell", "anode"],
      ["cell", "cathode", "am", "a"],
      ["am", "b", "psu", "neg"],
    ],
    charts: [{ title: "Gas & copper vs time", kind: "line", x: "t", y: ["anodeGas", "copperDeposited"] }],
    steps: ["Press Run Experiment.", "Observe the current and the products forming at each electrode.", "Change the supply voltage and compare the rate of copper deposition."],
    notebook: {
      objective: "To electrolyse copper(II) sulfate solution and relate the mass of copper deposited to the charge passed.",
      theory: "Cathode: Cu²⁺ + 2e⁻ → Cu. Anode: 2H₂O → O₂ + 4H⁺ + 4e⁻. Mass deposited m = (Q/F)·(M/z), where Q = It and F = 96 485 C/mol.",
    },
  },
  {
    id: "salt-preparation",
    name: "Salt Preparation (CuSO₄)",
    category: "chemistry",
    topic: "Synthesis",
    level: "Intermediate",
    duration: "25 min",
    description: "Prepare copper(II) sulfate by reacting copper(II) oxide with warm dilute sulfuric acid, then evaporate to crystallise.",
    components: [
      { ref: "beaker", type: "beaker", x: 300, y: 630, fill: [{ chem: "h2so4", amount: { volumeMl: 50, concentration: 1 } }, { chem: "cuo", amount: { massG: 3 } }] },
      { ref: "plate", type: "hot-plate", x: 280, y: 740, props: { heat: true, setTemperature: 70, stir: true } },
      { ref: "thermo", type: "thermometer", x: 360, y: 575 },
      { ref: "funnel", type: "funnel", x: 620, y: 520 },
      { ref: "dish", type: "evaporating-dish", x: 605, y: 610 },
      { ref: "tripod", type: "tripod", x: 600, y: 650 },
      { ref: "burner", type: "bunsen-burner", x: 630, y: 640, props: { lit: false } },
    ],
    charts: [{ title: "Temperature vs time", kind: "line", x: "t", y: ["temperature"] }],
    steps: ["Press Run — the hot plate warms the acid above 45 °C and the black CuO dissolves.", "When the solution is blue, pour it through the funnel into the evaporating dish.", "Light the Bunsen burner to evaporate the water and form crystals."],
    notebook: {
      objective: "To prepare a pure, dry sample of hydrated copper(II) sulfate.",
      theory: "CuO(s) + H₂SO₄(aq) → CuSO₄(aq) + H₂O(l). Excess base is filtered off, and the filtrate is evaporated to its crystallisation point.",
    },
  },
  {
    id: "precipitation",
    name: "Precipitation Reactions",
    category: "chemistry",
    topic: "Qualitative analysis",
    level: "Introductory",
    duration: "10 min",
    description: "Test for halide, sulfate and iodide ions by forming coloured precipitates: AgCl (white), BaSO₄ (white) and PbI₂ (yellow).",
    components: [
      { ref: "rack", type: "test-tube-rack", x: 260, y: 700 },
      { ref: "t1", type: "test-tube", x: 290, y: 600, name: "AgNO₃ tube", fill: [{ chem: "agno3", amount: { volumeMl: 8, concentration: 0.1 } }] },
      { ref: "t2", type: "test-tube", x: 337, y: 600, name: "BaCl₂ tube", fill: [{ chem: "bacl2", amount: { volumeMl: 8, concentration: 0.1 } }] },
      { ref: "t3", type: "test-tube", x: 384, y: 600, name: "Pb(NO₃)₂ tube", fill: [{ chem: "pbno32", amount: { volumeMl: 8, concentration: 0.1 } }] },
      { ref: "d1", type: "dropper", x: 294, y: 470, name: "NaCl dropper", fill: [{ chem: "nacl", amount: { massG: 0.18 } }, { chem: "h2o", amount: { volumeMl: 3 } }] },
      { ref: "d2", type: "dropper", x: 341, y: 470, name: "Na₂SO₄ dropper", fill: [{ chem: "na2so4", amount: { volumeMl: 3, concentration: 0.5 } }] },
      { ref: "d3", type: "dropper", x: 388, y: 470, name: "KI dropper", fill: [{ chem: "ki", amount: { volumeMl: 3, concentration: 0.5 } }] },
    ],
    steps: ["Select each dropper and click 'Add drop(s)' (set drops per press to 10).", "Observe the precipitate colour in each test tube.", "Record observations in the notebook."],
    notebook: {
      objective: "To identify ions in solution using precipitation reactions.",
      theory: "Ag⁺ + Cl⁻ → AgCl↓ (white); Ba²⁺ + SO₄²⁻ → BaSO₄↓ (white); Pb²⁺ + 2I⁻ → PbI₂↓ (bright yellow).",
    },
  },
  {
    id: "gas-preparation",
    name: "Gas Preparation (Oxygen)",
    category: "chemistry",
    topic: "Gases",
    level: "Introductory",
    duration: "10 min",
    description: "Catalytic decomposition of hydrogen peroxide with manganese(IV) oxide. Track the volume of oxygen evolved over time.",
    components: [
      { ref: "flask", type: "erlenmeyer-flask", x: 360, y: 620, fill: [{ chem: "h2o2", amount: { volumeMl: 50, concentration: 1 } }, { chem: "mno2", amount: { massG: 0.5 } }] },
      { ref: "cyl", type: "graduated-cylinder", x: 600, y: 570 },
      { ref: "watch", type: "stopwatch", x: 180, y: 660 },
      { ref: "thermo", type: "thermometer", x: 420, y: 560 },
    ],
    charts: [{ title: "Oxygen volume vs time", kind: "line", x: "t", y: ["gasVolume"] }],
    logInterval: 1,
    steps: ["Press Run Experiment — the reaction starts immediately.", "Watch the gas volume column in the data table.", "Try doubling the H₂O₂ concentration and compare the initial rate."],
    notebook: {
      objective: "To prepare oxygen and measure the rate of decomposition of hydrogen peroxide.",
      theory: "2H₂O₂(aq) → 2H₂O(l) + O₂(g), catalysed by MnO₂. The catalyst provides an alternative pathway with lower activation energy and is not consumed.",
    },
  },
  {
    id: "calorimetry",
    name: "Calorimetry (Enthalpy of Neutralisation)",
    category: "chemistry",
    topic: "Thermochemistry",
    level: "Advanced",
    duration: "15 min",
    description: "Mix 50 mL of 1 M HCl with 50 mL of 1 M NaOH in an insulated calorimeter and use ΔT to calculate the enthalpy of neutralisation.",
    components: [
      { ref: "cal", type: "calorimeter", x: 330, y: 620, fill: [{ chem: "hcl", amount: { volumeMl: 50, concentration: 1 } }] },
      { ref: "base", type: "beaker", x: 580, y: 640, name: "NaOH beaker", fill: [{ chem: "naoh", amount: { volumeMl: 50, concentration: 1 } }] },
      { ref: "thermo", type: "thermometer", x: 400, y: 580 },
      { ref: "watch", type: "stopwatch", x: 160, y: 660 },
    ],
    charts: [{ title: "Temperature vs time", kind: "line", x: "t", y: ["temperature"] }],
    logInterval: 1,
    steps: ["Press Run and record the starting temperature for ~10 s.", "Right-click the NaOH beaker → Pour into → Calorimeter.", "Record the maximum temperature and compute ΔH = −mcΔT / n."],
    notebook: {
      objective: "To determine the molar enthalpy of neutralisation of HCl by NaOH.",
      theory: "q = mcΔT; ΔH = −q/n(H₂O). Expected ΔH ≈ −57 kJ/mol for strong acid–strong base.",
      calculations: "q = (100 g)(4.18 J g⁻¹ K⁻¹)(ΔT)\nn = 0.050 mol\nΔH = −q / n",
    },
  },

  /* ============================ PHYSICS ============================ */
  {
    id: "ohms-law",
    name: "Ohm's Law",
    category: "physics",
    topic: "Electricity",
    level: "Introductory",
    duration: "15 min",
    description: "Vary the supply voltage across a 100 Ω resistor and measure current to verify V = IR.",
    components: [
      { ref: "psu", type: "power-supply", x: 180, y: 300, props: { voltage: 5 } },
      { ref: "am", type: "ammeter", x: 460, y: 280 },
      { ref: "r", type: "resistor", x: 620, y: 480, props: { resistance: 100 } },
      { ref: "vm", type: "voltmeter", x: 630, y: 600 },
      { ref: "sw", type: "switch", x: 260, y: 520, props: { closed: true } },
    ],
    wires: [
      ["psu", "pos", "am", "a"],
      ["am", "b", "r", "a"],
      ["r", "b", "sw", "b"],
      ["sw", "a", "psu", "neg"],
      ["vm", "a", "r", "a"],
      ["vm", "b", "r", "b"],
    ],
    charts: [{ title: "Current vs voltage", kind: "scatter", x: "voltage", y: ["current"] }],
    logInterval: 1,
    steps: ["Press Run Experiment.", "Select the power supply and change the voltage in 1 V steps (data is logged every second).", "Plot current against voltage — the gradient is 1/R."],
    notebook: {
      objective: "To verify Ohm's law for a fixed resistor.",
      theory: "V = IR. For an ohmic conductor at constant temperature, current is directly proportional to potential difference.",
      hypothesis: "A graph of I against V will be a straight line through the origin with gradient 0.01 A/V.",
    },
  },
  {
    id: "hookes-law",
    name: "Hooke's Law",
    category: "physics",
    topic: "Mechanics",
    level: "Introductory",
    duration: "15 min",
    description: "Load a spring with increasing mass and measure its extension to find the spring constant.",
    components: [
      { ref: "stand", type: "retort-stand", x: 300, y: 440 },
      { ref: "spring", type: "spring", x: 395, y: 360, props: { springConstant: 40, load: 0.05 } },
      { ref: "ruler", type: "meter-ruler", x: 470, y: 450, rotation: 90, props: { objectSize: 1.2 } },
      { ref: "m1", type: "mass", x: 720, y: 730, props: { mass: 0.1 } },
      { ref: "m2", type: "mass", x: 780, y: 730, props: { mass: 0.2 } },
      { ref: "fs", type: "force-sensor", x: 385, y: 300 },
    ],
    charts: [{ title: "Force vs extension", kind: "scatter", x: "extension", y: ["force"] }],
    logInterval: 1,
    steps: ["Press Run Experiment and let the spring settle.", "Increase the load in the spring's properties (or drag a slotted mass under the hook).", "Capture a measurement after each change; the gradient of F against x is k."],
    notebook: {
      objective: "To determine the spring constant of a spring using Hooke's law.",
      theory: "F = kx within the limit of proportionality, where F = mg is the applied load.",
    },
  },
  {
    id: "simple-pendulum",
    name: "Simple Pendulum",
    category: "physics",
    topic: "Oscillations",
    level: "Introductory",
    duration: "10 min",
    description: "Measure the period of a pendulum and investigate how it depends on length.",
    components: [
      { ref: "p", type: "pendulum", x: 360, y: 320, props: { length: 1, amplitude: 12 } },
      { ref: "watch", type: "stopwatch", x: 680, y: 600 },
    ],
    charts: [{ title: "Angle vs time", kind: "line", x: "t", y: ["angle"] }],
    logInterval: 0.1,
    steps: ["Press Run Experiment.", "Read the measured period from the pendulum's readings.", "Change the length and repeat; plot T² against L to find g."],
    notebook: {
      objective: "To measure the acceleration due to gravity using a simple pendulum.",
      theory: "For small oscillations T = 2π√(L/g), so T² = (4π²/g)·L.",
    },
  },
  {
    id: "newtons-second-law",
    name: "Newton's Second Law",
    category: "physics",
    topic: "Dynamics",
    level: "Introductory",
    duration: "10 min",
    description: "Apply a constant force to a block and measure its acceleration with a motion sensor (F = ma).",
    components: [
      { ref: "sensor", type: "motion-sensor", x: 120, y: 700 },
      { ref: "block", type: "block", x: 240, y: 700, props: { mass: 2, appliedForce: 8, friction: 0.1 } },
      { ref: "watch", type: "stopwatch", x: 820, y: 640 },
    ],
    charts: [{ title: "Velocity vs time", kind: "line", x: "t", y: ["velocity"] }],
    logInterval: 0.2,
    steps: ["Press Run Experiment.", "Observe the velocity–time graph; its gradient is the acceleration.", "Reset and change the force or mass to test a = F/m."],
    notebook: {
      objective: "To verify that acceleration is proportional to net force and inversely proportional to mass.",
      theory: "F_net = ma, where F_net = F_applied − μmg.",
    },
  },
  {
    id: "series-circuit",
    name: "Series Circuit",
    category: "physics",
    topic: "Electricity",
    level: "Introductory",
    duration: "10 min",
    description: "Two bulbs in series with a battery, a switch and an ammeter. The same current flows through each component.",
    components: [
      { ref: "bat", type: "battery", x: 200, y: 560, props: { voltage: 6 } },
      { ref: "sw", type: "switch", x: 380, y: 340 },
      { ref: "b1", type: "bulb", x: 560, y: 320 },
      { ref: "b2", type: "bulb", x: 700, y: 320 },
      { ref: "am", type: "ammeter", x: 560, y: 560 },
    ],
    wires: [
      ["bat", "pos", "sw", "a"],
      ["sw", "b", "b1", "a"],
      ["b1", "b", "b2", "a"],
      ["b2", "b", "am", "b"],
      ["am", "a", "bat", "neg"],
    ],
    steps: ["Close the switch (double-click it or use the properties panel).", "Note the current and the bulb brightness.", "Add a third bulb in series and compare."],
    notebook: {
      objective: "To investigate current and voltage in a series circuit.",
      theory: "In series: I is the same everywhere, V_total = V₁ + V₂, R_total = R₁ + R₂.",
    },
  },
  {
    id: "parallel-circuit",
    name: "Parallel Circuit",
    category: "physics",
    topic: "Electricity",
    level: "Introductory",
    duration: "10 min",
    description: "Two bulbs in parallel branches. Each branch receives the full supply voltage.",
    components: [
      { ref: "bat", type: "battery", x: 160, y: 520, props: { voltage: 6 } },
      { ref: "sw", type: "switch", x: 320, y: 300, props: { closed: true } },
      { ref: "am", type: "ammeter", x: 180, y: 300 },
      { ref: "b1", type: "bulb", x: 560, y: 260 },
      { ref: "b2", type: "bulb", x: 560, y: 470 },
    ],
    wires: [
      ["bat", "pos", "am", "a"],
      ["am", "b", "sw", "a"],
      ["sw", "b", "b1", "a"],
      ["sw", "b", "b2", "a"],
      ["b1", "b", "bat", "neg"],
      ["b2", "b", "bat", "neg"],
    ],
    steps: ["Run the experiment.", "Compare the total current with the series circuit.", "Remove one bulb's wire — the other stays lit."],
    notebook: {
      objective: "To investigate current and voltage in a parallel circuit.",
      theory: "In parallel: V is the same across each branch, I_total = I₁ + I₂, 1/R_total = 1/R₁ + 1/R₂.",
    },
  },
  {
    id: "lens-experiment",
    name: "Convex Lens Experiment",
    category: "physics",
    topic: "Optics",
    level: "Intermediate",
    duration: "15 min",
    description: "Use a light source, a convex lens (f = 10 cm) and a screen on an optical bench to verify the thin-lens equation.",
    components: [
      { ref: "bench", type: "optical-bench", x: 120, y: 520 },
      { ref: "src", type: "light-source", x: 150, y: 405, props: { beam: "divergent", rays: 9, spread: 14 } },
      { ref: "lens", type: "convex-lens", x: 427, y: 380, props: { focalLength: 10 } },
      { ref: "screen", type: "screen", x: 600, y: 370 },
    ],
    steps: ["Read the object and image distances from the lens readings.", "Drag the screen until the spot size is smallest — this is the image position.", "Move the lens and repeat; verify 1/f = 1/u + 1/v."],
    notebook: {
      objective: "To determine the focal length of a convex lens.",
      theory: "Thin-lens equation 1/f = 1/u + 1/v (real-is-positive). Magnification m = −v/u.",
    },
  },
  {
    id: "refraction",
    name: "Refraction Experiment",
    category: "physics",
    topic: "Optics",
    level: "Introductory",
    duration: "10 min",
    description: "Shine a laser into a glass block and measure angles of incidence and refraction to verify Snell's law. A prism shows dispersion of white light.",
    components: [
      { ref: "laser", type: "laser", x: 396, y: 236, rotation: 35 },
      { ref: "block", type: "glass-block", x: 580, y: 400, props: { refractiveIndex: 1.5 } },
      { ref: "wlaser", type: "laser", x: 150, y: 620, props: { color: "white" }, rotation: -8 },
      { ref: "prism", type: "prism", x: 380, y: 520 },
      { ref: "screen", type: "screen", x: 760, y: 460 },
    ],
    steps: ["Read the angles of incidence and refraction from the glass block's readings.", "Rotate the laser (select it and use the rotation handle) to change the angle.", "Verify n = sin i / sin r."],
    notebook: {
      objective: "To verify Snell's law and determine the refractive index of glass.",
      theory: "n₁ sin θ₁ = n₂ sin θ₂. White light is dispersed by a prism because n depends on wavelength.",
    },
  },
  {
    id: "free-fall",
    name: "Free Fall Experiment",
    category: "physics",
    topic: "Kinematics",
    level: "Introductory",
    duration: "5 min",
    description: "Drop a ball from 1.5 m and record distance and velocity against time to measure g.",
    components: [
      { ref: "ball", type: "drop-ball", x: 420, y: 420, props: { height: 1.5 } },
      { ref: "sensor", type: "motion-sensor", x: 420, y: 350, rotation: 90 },
      { ref: "watch", type: "stopwatch", x: 620, y: 660 },
    ],
    charts: [{ title: "Distance vs time", kind: "line", x: "t", y: ["distance"] }, { title: "Velocity vs time", kind: "line", x: "t", y: ["velocity"] }],
    logInterval: 0.05,
    steps: ["Press Run Experiment — the ball is released.", "Use the velocity–time graph gradient to determine g.", "Change the gravity property to simulate the Moon (1.62 m/s²)."],
    notebook: {
      objective: "To measure the acceleration due to gravity by free fall.",
      theory: "s = ½gt², v = gt. The gradient of v against t equals g.",
    },
  },
];

export function getTemplate(id: string) {
  return TEMPLATES.find((t) => t.id === id);
}
