/** Periodic table of all 118 elements with derived group/period and electron configuration. */

export type ElementCategory =
  | "alkali-metal"
  | "alkaline-earth"
  | "transition-metal"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "halogen"
  | "noble-gas"
  | "lanthanide"
  | "actinide";

export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  mass: number;
  category: ElementCategory;
  group: number | null; // null for f-block
  period: number;
  block: "s" | "p" | "d" | "f";
  state: "solid" | "liquid" | "gas" | "unknown";
  electronConfiguration: string;
  chemicalId?: string; // matching dispensable chemical
  reactions: string[];
}

// number,symbol,name,mass
const RAW = `1,H,Hydrogen,1.008;2,He,Helium,4.0026;3,Li,Lithium,6.94;4,Be,Beryllium,9.0122;5,B,Boron,10.81;6,C,Carbon,12.011;7,N,Nitrogen,14.007;8,O,Oxygen,15.999;9,F,Fluorine,18.998;10,Ne,Neon,20.18;11,Na,Sodium,22.99;12,Mg,Magnesium,24.305;13,Al,Aluminium,26.982;14,Si,Silicon,28.085;15,P,Phosphorus,30.974;16,S,Sulfur,32.06;17,Cl,Chlorine,35.45;18,Ar,Argon,39.948;19,K,Potassium,39.098;20,Ca,Calcium,40.078;21,Sc,Scandium,44.956;22,Ti,Titanium,47.867;23,V,Vanadium,50.942;24,Cr,Chromium,51.996;25,Mn,Manganese,54.938;26,Fe,Iron,55.845;27,Co,Cobalt,58.933;28,Ni,Nickel,58.693;29,Cu,Copper,63.546;30,Zn,Zinc,65.38;31,Ga,Gallium,69.723;32,Ge,Germanium,72.63;33,As,Arsenic,74.922;34,Se,Selenium,78.971;35,Br,Bromine,79.904;36,Kr,Krypton,83.798;37,Rb,Rubidium,85.468;38,Sr,Strontium,87.62;39,Y,Yttrium,88.906;40,Zr,Zirconium,91.224;41,Nb,Niobium,92.906;42,Mo,Molybdenum,95.95;43,Tc,Technetium,98;44,Ru,Ruthenium,101.07;45,Rh,Rhodium,102.91;46,Pd,Palladium,106.42;47,Ag,Silver,107.87;48,Cd,Cadmium,112.41;49,In,Indium,114.82;50,Sn,Tin,118.71;51,Sb,Antimony,121.76;52,Te,Tellurium,127.6;53,I,Iodine,126.9;54,Xe,Xenon,131.29;55,Cs,Caesium,132.91;56,Ba,Barium,137.33;57,La,Lanthanum,138.91;58,Ce,Cerium,140.12;59,Pr,Praseodymium,140.91;60,Nd,Neodymium,144.24;61,Pm,Promethium,145;62,Sm,Samarium,150.36;63,Eu,Europium,151.96;64,Gd,Gadolinium,157.25;65,Tb,Terbium,158.93;66,Dy,Dysprosium,162.5;67,Ho,Holmium,164.93;68,Er,Erbium,167.26;69,Tm,Thulium,168.93;70,Yb,Ytterbium,173.05;71,Lu,Lutetium,174.97;72,Hf,Hafnium,178.49;73,Ta,Tantalum,180.95;74,W,Tungsten,183.84;75,Re,Rhenium,186.21;76,Os,Osmium,190.23;77,Ir,Iridium,192.22;78,Pt,Platinum,195.08;79,Au,Gold,196.97;80,Hg,Mercury,200.59;81,Tl,Thallium,204.38;82,Pb,Lead,207.2;83,Bi,Bismuth,208.98;84,Po,Polonium,209;85,At,Astatine,210;86,Rn,Radon,222;87,Fr,Francium,223;88,Ra,Radium,226;89,Ac,Actinium,227;90,Th,Thorium,232.04;91,Pa,Protactinium,231.04;92,U,Uranium,238.03;93,Np,Neptunium,237;94,Pu,Plutonium,244;95,Am,Americium,243;96,Cm,Curium,247;97,Bk,Berkelium,247;98,Cf,Californium,251;99,Es,Einsteinium,252;100,Fm,Fermium,257;101,Md,Mendelevium,258;102,No,Nobelium,259;103,Lr,Lawrencium,266;104,Rf,Rutherfordium,267;105,Db,Dubnium,268;106,Sg,Seaborgium,269;107,Bh,Bohrium,270;108,Hs,Hassium,277;109,Mt,Meitnerium,278;110,Ds,Darmstadtium,281;111,Rg,Roentgenium,282;112,Cn,Copernicium,285;113,Nh,Nihonium,286;114,Fl,Flerovium,289;115,Mc,Moscovium,290;116,Lv,Livermorium,293;117,Ts,Tennessine,294;118,Og,Oganesson,294`;

const PERIOD_STARTS = [1, 3, 11, 19, 37, 55, 87, 119];
const NOBLE: Record<number, string> = { 2: "He", 10: "Ne", 18: "Ar", 36: "Kr", 54: "Xe", 86: "Rn" };
const ORBITALS: [string, number][] = [
  ["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2], ["3d", 10], ["4p", 6], ["5s", 2], ["4d", 10],
  ["5p", 6], ["6s", 2], ["4f", 14], ["5d", 10], ["6p", 6], ["7s", 2], ["5f", 14], ["6d", 10], ["7p", 6],
];
const EXCEPTIONS: Record<number, string> = {
  24: "[Ar] 3d⁵ 4s¹", 29: "[Ar] 3d¹⁰ 4s¹", 41: "[Kr] 4d⁴ 5s¹", 42: "[Kr] 4d⁵ 5s¹", 44: "[Kr] 4d⁷ 5s¹",
  45: "[Kr] 4d⁸ 5s¹", 46: "[Kr] 4d¹⁰", 47: "[Kr] 4d¹⁰ 5s¹", 57: "[Xe] 5d¹ 6s²", 58: "[Xe] 4f¹ 5d¹ 6s²",
  64: "[Xe] 4f⁷ 5d¹ 6s²", 78: "[Xe] 4f¹⁴ 5d⁹ 6s¹", 79: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹", 89: "[Rn] 6d¹ 7s²",
  90: "[Rn] 6d² 7s²", 91: "[Rn] 5f² 6d¹ 7s²", 92: "[Rn] 5f³ 6d¹ 7s²", 93: "[Rn] 5f⁴ 6d¹ 7s²",
  96: "[Rn] 5f⁷ 6d¹ 7s²", 103: "[Rn] 5f¹⁴ 7s² 7p¹",
};
const SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";
const sup = (n: number) => String(n).split("").map((d) => SUP[Number(d)]).join("");

function electronConfig(z: number): string {
  if (EXCEPTIONS[z]) return EXCEPTIONS[z];
  const cores = Object.keys(NOBLE).map(Number).filter((n) => n < z);
  const core = cores.length ? Math.max(...cores) : 0;
  let remaining = z;
  const filled: string[] = [];
  let count = 0;
  for (const [orb, cap] of ORBITALS) {
    if (remaining <= 0) break;
    const e = Math.min(cap, remaining);
    remaining -= e;
    count += e;
    if (count > core) filled.push(`${orb}${sup(e)}`);
  }
  // sort by shell for readability (noble-gas notation)
  filled.sort((a, b) => Number(a[0]) - Number(b[0]) || "spdf".indexOf(a[1]) - "spdf".indexOf(b[1]));
  return core ? `[${NOBLE[core]}] ${filled.join(" ")}` : filled.join(" ");
}

function position(z: number): { period: number; group: number | null; block: ElementData["block"] } {
  let period = 1;
  while (period < 7 && z >= PERIOD_STARTS[period]) period++;
  const idx = z - PERIOD_STARTS[period - 1]; // 0-based index within period
  if (period === 1) return { period, group: z === 1 ? 1 : 18, block: "s" };
  if (period <= 3) {
    if (idx < 2) return { period, group: idx + 1, block: "s" };
    return { period, group: idx + 11, block: "p" };
  }
  if (period <= 5) {
    if (idx < 2) return { period, group: idx + 1, block: "s" };
    if (idx < 12) return { period, group: idx + 1, block: "d" };
    return { period, group: idx + 1, block: "p" };
  }
  // periods 6 & 7 contain the f-block
  if (idx < 2) return { period, group: idx + 1, block: "s" };
  if (idx === 2) return { period, group: null, block: "f" }; // La / Ac shown in f-row
  if (idx < 17) return { period, group: null, block: "f" };
  const g = idx - 14;
  return { period, group: g + 1, block: g + 1 >= 13 ? "p" : "d" };
}

const METALLOIDS = new Set([5, 14, 32, 33, 51, 52]);
const NONMETALS = new Set([1, 6, 7, 8, 15, 16, 34]);
const HALOGENS = new Set([9, 17, 35, 53, 85, 117]);
const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86]);
const LIQUIDS = new Set([35, 80]);

function category(z: number, group: number | null, period: number): ElementCategory {
  if (z >= 57 && z <= 71) return "lanthanide";
  if (z >= 89 && z <= 103) return "actinide";
  if (group === 18) return "noble-gas";
  if (HALOGENS.has(z)) return "halogen";
  if (METALLOIDS.has(z)) return "metalloid";
  if (NONMETALS.has(z)) return "nonmetal";
  if (group === 1) return "alkali-metal";
  if (group === 2) return "alkaline-earth";
  if (group != null && group >= 3 && group <= 12) return "transition-metal";
  void period;
  return "post-transition";
}

const CHEM_MAP: Record<string, string> = { H: "h2", O: "o2", N: "n2", Cl: "cl2", Na: "na", Mg: "mg", Al: "al", Fe: "fe", Cu: "cu", Zn: "zn", S: "s", C: "c", I: "i2" };

const SPECIFIC_REACTIONS: Record<string, string[]> = {
  H: ["2H₂ + O₂ → 2H₂O (combustion, 'squeaky pop')", "H₂ + Cl₂ → 2HCl"],
  He: ["Chemically inert — no common reactions"],
  Li: ["2Li + 2H₂O → 2LiOH + H₂", "4Li + O₂ → 2Li₂O"],
  C: ["C + O₂ → CO₂", "C + 2CuO → 2Cu + CO₂ (reduction)"],
  N: ["N₂ + 3H₂ ⇌ 2NH₃ (Haber process)"],
  O: ["Supports combustion", "2Mg + O₂ → 2MgO"],
  F: ["Most reactive non-metal; F₂ + H₂ → 2HF"],
  Na: ["2Na + 2H₂O → 2NaOH + H₂ (violent)", "2Na + Cl₂ → 2NaCl"],
  Mg: ["Mg + 2HCl → MgCl₂ + H₂", "2Mg + O₂ → 2MgO (bright white flame)"],
  Al: ["2Al + 6HCl → 2AlCl₃ + 3H₂", "2Al + Fe₂O₃ → Al₂O₃ + 2Fe (thermite)"],
  Si: ["Si + O₂ → SiO₂"],
  P: ["P₄ + 5O₂ → P₄O₁₀"],
  S: ["S + O₂ → SO₂", "Fe + S → FeS"],
  Cl: ["Cl₂ + 2KI → 2KCl + I₂ (displacement)", "Bleaches damp litmus"],
  K: ["2K + 2H₂O → 2KOH + H₂ (lilac flame)"],
  Ca: ["Ca + 2H₂O → Ca(OH)₂ + H₂"],
  Fe: ["Fe + CuSO₄ → FeSO₄ + Cu", "4Fe + 3O₂ + xH₂O → rust"],
  Cu: ["Unreactive with dilute acids", "2Cu + O₂ → 2CuO (on heating)"],
  Zn: ["Zn + 2HCl → ZnCl₂ + H₂", "Zn + CuSO₄ → ZnSO₄ + Cu"],
  Br: ["Br₂ + 2KI → 2KBr + I₂"],
  Ag: ["Ag⁺ + Cl⁻ → AgCl↓ (white precipitate)"],
  I: ["I₂ + starch → blue-black complex"],
  Au: ["Very unreactive; dissolves only in aqua regia"],
  Hg: ["Liquid metal; forms amalgams"],
  Pb: ["Pb²⁺ + 2I⁻ → PbI₂↓ (yellow)"],
  U: ["Radioactive; used as nuclear fuel"],
};

const CATEGORY_REACTIONS: Record<ElementCategory, string[]> = {
  "alkali-metal": ["Reacts vigorously with water forming a hydroxide and H₂", "Forms ionic halides with halogens"],
  "alkaline-earth": ["Reacts with acids releasing H₂", "Burns in oxygen to form an oxide"],
  "transition-metal": ["Forms coloured ions and complexes", "Often acts as a catalyst"],
  "post-transition": ["Reacts with acids and forms amphoteric oxides"],
  metalloid: ["Semiconductor behaviour; forms covalent oxides"],
  nonmetal: ["Forms covalent compounds and acidic oxides"],
  halogen: ["More reactive halogens displace less reactive ones from salts", "Forms ionic halides with metals"],
  "noble-gas": ["Very unreactive (full valence shell)"],
  lanthanide: ["Reacts slowly with water; forms +3 ions"],
  actinide: ["Radioactive; forms multiple oxidation states"],
};

export const ELEMENTS: ElementData[] = RAW.split(";").map((row) => {
  const [n, symbol, name, mass] = row.split(",");
  const z = Number(n);
  const pos = position(z);
  const cat = category(z, pos.group, pos.period);
  return {
    number: z,
    symbol,
    name,
    mass: Number(mass),
    category: cat,
    group: pos.group,
    period: pos.period,
    block: cat === "lanthanide" || cat === "actinide" ? "f" : pos.block,
    state: z > 103 ? "unknown" : GASES.has(z) ? "gas" : LIQUIDS.has(z) ? "liquid" : "solid",
    electronConfiguration: electronConfig(z),
    chemicalId: CHEM_MAP[symbol],
    reactions: SPECIFIC_REACTIONS[symbol] ?? CATEGORY_REACTIONS[cat],
  };
});

/** Grid coordinates (1-based column/row) in the standard 18-column layout, f-block in rows 9-10. */
export function gridPosition(e: ElementData): { col: number; row: number } {
  if (e.category === "lanthanide") return { col: 3 + (e.number - 57), row: 9 };
  if (e.category === "actinide") return { col: 3 + (e.number - 89), row: 10 };
  return { col: e.group ?? 3, row: e.period };
}

export const CATEGORY_COLORS: Record<ElementCategory, { bg: string; fg: string; label: string }> = {
  "alkali-metal": { bg: "#fee2e2", fg: "#991b1b", label: "Alkali metal" },
  "alkaline-earth": { bg: "#ffedd5", fg: "#9a3412", label: "Alkaline earth" },
  "transition-metal": { bg: "#fef9c3", fg: "#854d0e", label: "Transition metal" },
  "post-transition": { bg: "#dcfce7", fg: "#166534", label: "Post-transition" },
  metalloid: { bg: "#ccfbf1", fg: "#115e59", label: "Metalloid" },
  nonmetal: { bg: "#dbeafe", fg: "#1e40af", label: "Non-metal" },
  halogen: { bg: "#e0e7ff", fg: "#3730a3", label: "Halogen" },
  "noble-gas": { bg: "#f3e8ff", fg: "#6b21a8", label: "Noble gas" },
  lanthanide: { bg: "#fce7f3", fg: "#9d174d", label: "Lanthanide" },
  actinide: { bg: "#fae8ff", fg: "#86198f", label: "Actinide" },
};
