/**
 * Declarative reaction database. The mixture engine matches these rules against the
 * contents of a container, so adding a new reaction never requires engine changes.
 */

import type { EffectType } from "@/lib/engine/types";

export interface ReactionTerm {
  id: string;
  n: number; // stoichiometric coefficient
}

export interface ReactionRule {
  id: string;
  reactants: ReactionTerm[];
  products: ReactionTerm[];
  type: string;
  deltaH: number; // kJ per mol of reaction (extent)
  /** Rate constant (s⁻¹, scaled by concentration & temperature). Omitted → instantaneous. */
  rate?: number;
  catalyst?: string;
  minTemperature?: number;
  observations: string[];
  /** Audio-visual effect played when the reaction starts. */
  effect?: EffectType;
}

export const REACTIONS: ReactionRule[] = [
  // Neutralisation
  { id: "hcl-naoh", reactants: [{ id: "hcl", n: 1 }, { id: "naoh", n: 1 }], products: [{ id: "nacl", n: 1 }, { id: "h2o", n: 1 }], type: "Neutralisation (acid–base)", deltaH: -57.1, observations: ["Solution warms up (exothermic)", "pH moves towards 7"] },
  { id: "hcl-koh", reactants: [{ id: "hcl", n: 1 }, { id: "koh", n: 1 }], products: [{ id: "kcl", n: 1 }, { id: "h2o", n: 1 }], type: "Neutralisation (acid–base)", deltaH: -57.1, observations: ["Solution warms up (exothermic)"] },
  { id: "h2so4-naoh", reactants: [{ id: "h2so4", n: 1 }, { id: "naoh", n: 2 }], products: [{ id: "na2so4", n: 1 }, { id: "h2o", n: 2 }], type: "Neutralisation (acid–base)", deltaH: -114.2, observations: ["Solution warms up (exothermic)"] },
  { id: "h2so4-koh", reactants: [{ id: "h2so4", n: 1 }, { id: "koh", n: 2 }], products: [{ id: "k2so4", n: 1 }, { id: "h2o", n: 2 }], type: "Neutralisation (acid–base)", deltaH: -114.2, observations: ["Solution warms up (exothermic)"] },
  { id: "hno3-naoh", reactants: [{ id: "hno3", n: 1 }, { id: "naoh", n: 1 }], products: [{ id: "nano3", n: 1 }, { id: "h2o", n: 1 }], type: "Neutralisation (acid–base)", deltaH: -57.3, observations: ["Solution warms up (exothermic)"] },
  { id: "hno3-koh", reactants: [{ id: "hno3", n: 1 }, { id: "koh", n: 1 }], products: [{ id: "kno3", n: 1 }, { id: "h2o", n: 1 }], type: "Neutralisation (acid–base)", deltaH: -57.3, observations: ["Solution warms up (exothermic)"] },
  { id: "ch3cooh-naoh", reactants: [{ id: "ch3cooh", n: 1 }, { id: "naoh", n: 1 }], products: [{ id: "ch3coona", n: 1 }, { id: "h2o", n: 1 }], type: "Neutralisation (weak acid–strong base)", deltaH: -55.9, observations: ["Slight temperature rise", "Buffer region forms"] },
  { id: "hcl-nh3", reactants: [{ id: "hcl", n: 1 }, { id: "nh3", n: 1 }], products: [{ id: "nh4cl", n: 1 }], type: "Neutralisation (strong acid–weak base)", deltaH: -52.2, observations: ["Solution warms up"] },
  { id: "hcl-caoh2", reactants: [{ id: "hcl", n: 2 }, { id: "caoh2", n: 1 }], products: [{ id: "cacl2", n: 1 }, { id: "h2o", n: 2 }], type: "Neutralisation (acid–base)", deltaH: -114.2, observations: ["Solution warms up"] },
  { id: "h2so4-cuo", reactants: [{ id: "h2so4", n: 1 }, { id: "cuo", n: 1 }], products: [{ id: "cuso4", n: 1 }, { id: "h2o", n: 1 }], type: "Acid + metal oxide (salt preparation)", deltaH: -64, rate: 0.02, minTemperature: 45, observations: ["Black solid dissolves", "Solution turns blue"] },

  // Precipitation
  { id: "agno3-nacl", reactants: [{ id: "agno3", n: 1 }, { id: "nacl", n: 1 }], products: [{ id: "agcl", n: 1 }, { id: "nano3", n: 1 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -65.5, observations: ["White precipitate of AgCl forms"] },
  { id: "agno3-kcl", reactants: [{ id: "agno3", n: 1 }, { id: "kcl", n: 1 }], products: [{ id: "agcl", n: 1 }, { id: "kno3", n: 1 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -65.5, observations: ["White precipitate of AgCl forms"] },
  { id: "agno3-hcl", reactants: [{ id: "agno3", n: 1 }, { id: "hcl", n: 1 }], products: [{ id: "agcl", n: 1 }, { id: "hno3-aq", n: 1 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -65.5, observations: ["White precipitate of AgCl forms"] },
  { id: "bacl2-h2so4", reactants: [{ id: "bacl2", n: 1 }, { id: "h2so4", n: 1 }], products: [{ id: "baso4", n: 1 }, { id: "hcl", n: 2 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -19, observations: ["Dense white precipitate of BaSO₄"] },
  { id: "bacl2-na2so4", reactants: [{ id: "bacl2", n: 1 }, { id: "na2so4", n: 1 }], products: [{ id: "baso4", n: 1 }, { id: "nacl", n: 2 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -19, observations: ["Dense white precipitate of BaSO₄"] },
  { id: "pbno32-ki", reactants: [{ id: "pbno32", n: 1 }, { id: "ki", n: 2 }], products: [{ id: "pbi2", n: 1 }, { id: "kno3", n: 2 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -48, observations: ["Bright yellow precipitate of PbI₂"] },
  { id: "cuso4-naoh", reactants: [{ id: "cuso4", n: 1 }, { id: "naoh", n: 2 }], products: [{ id: "cuoh2", n: 1 }, { id: "na2so4", n: 1 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -45, observations: ["Pale blue precipitate of Cu(OH)₂", "Blue colour of solution fades"] },
  { id: "fecl3-naoh", reactants: [{ id: "fecl3", n: 1 }, { id: "naoh", n: 3 }], products: [{ id: "feoh3", n: 1 }, { id: "nacl", n: 3 }], type: "Precipitation (double displacement)", effect: "precipitate", deltaH: -40, observations: ["Rust-brown precipitate of Fe(OH)₃"] },

  // Metals + acids (gas evolution, kinetic)
  { id: "mg-hcl", reactants: [{ id: "mg", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "mgcl2", n: 1 }, { id: "h2", n: 1 }], type: "Single displacement (redox)", deltaH: -462, rate: 0.08, observations: ["Vigorous fizzing — hydrogen gas", "Magnesium dissolves", "Solution becomes warm"] },
  { id: "zn-hcl", reactants: [{ id: "zn", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "zncl2", n: 1 }, { id: "h2", n: 1 }], type: "Single displacement (redox)", deltaH: -153.9, rate: 0.015, observations: ["Steady bubbling — hydrogen gas", "Zinc slowly dissolves"] },
  { id: "zn-h2so4", reactants: [{ id: "zn", n: 1 }, { id: "h2so4", n: 1 }], products: [{ id: "znso4", n: 1 }, { id: "h2", n: 1 }], type: "Single displacement (redox)", deltaH: -153.9, rate: 0.015, observations: ["Bubbling — hydrogen gas"] },
  { id: "al-hcl", reactants: [{ id: "al", n: 2 }, { id: "hcl", n: 6 }], products: [{ id: "alcl3", n: 2 }, { id: "h2", n: 3 }], type: "Single displacement (redox)", deltaH: -1049, rate: 0.006, observations: ["Slow start, then vigorous fizzing"] },
  { id: "fe-hcl", reactants: [{ id: "fe", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "fecl2", n: 1 }, { id: "h2", n: 1 }], type: "Single displacement (redox)", deltaH: -87, rate: 0.004, observations: ["Slow bubbling", "Solution turns pale green"] },
  { id: "na-h2o", reactants: [{ id: "na", n: 2 }, { id: "h2o", n: 2 }], products: [{ id: "naoh", n: 2 }, { id: "h2", n: 1 }], type: "Alkali metal + water (redox)", deltaH: -368, rate: 0.25, effect: "sizzle", observations: ["Sodium fizzes violently and melts into a ball", "Hydrogen may ignite", "Solution becomes strongly alkaline"] },

  // Carbonates + acids
  { id: "caco3-hcl", reactants: [{ id: "caco3", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "cacl2", n: 1 }, { id: "h2o", n: 1 }, { id: "co2", n: 1 }], type: "Acid + carbonate", deltaH: -15.2, rate: 0.03, observations: ["Effervescence — CO₂ gas", "Marble chips shrink"] },
  { id: "na2co3-hcl", reactants: [{ id: "na2co3", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "nacl", n: 2 }, { id: "h2o", n: 1 }, { id: "co2", n: 1 }], type: "Acid + carbonate", deltaH: -27.6, observations: ["Effervescence — CO₂ gas"] },
  { id: "nahco3-hcl", reactants: [{ id: "nahco3", n: 1 }, { id: "hcl", n: 1 }], products: [{ id: "nacl", n: 1 }, { id: "h2o", n: 1 }, { id: "co2", n: 1 }], type: "Acid + hydrogencarbonate", deltaH: 12.3, observations: ["Fizzing — CO₂ gas", "Solution cools slightly (endothermic)"] },
  { id: "nahco3-ch3cooh", reactants: [{ id: "nahco3", n: 1 }, { id: "ch3cooh", n: 1 }], products: [{ id: "ch3coona", n: 1 }, { id: "h2o", n: 1 }, { id: "co2", n: 1 }], type: "Acid + hydrogencarbonate", deltaH: 16, observations: ["Foaming — CO₂ gas", "Solution cools (endothermic)"] },

  // Displacement of metals from salts
  { id: "zn-cuso4", reactants: [{ id: "zn", n: 1 }, { id: "cuso4", n: 1 }], products: [{ id: "znso4", n: 1 }, { id: "cu", n: 1 }], type: "Metal displacement (redox)", deltaH: -217, rate: 0.01, observations: ["Reddish-brown copper deposits", "Blue colour fades"] },
  { id: "fe-cuso4", reactants: [{ id: "fe", n: 1 }, { id: "cuso4", n: 1 }], products: [{ id: "feso4", n: 1 }, { id: "cu", n: 1 }], type: "Metal displacement (redox)", deltaH: -153, rate: 0.006, observations: ["Copper coats the iron", "Solution turns green"] },
  { id: "mg-cuso4", reactants: [{ id: "mg", n: 1 }, { id: "cuso4", n: 1 }], products: [{ id: "mgso4", n: 1 }, { id: "cu", n: 1 }], type: "Metal displacement (redox)", deltaH: -390, rate: 0.03, observations: ["Copper deposits rapidly", "Mixture heats up"] },

  // Decomposition / gas preparation
  { id: "h2o2-decomp", reactants: [{ id: "h2o2", n: 2 }], products: [{ id: "h2o", n: 2 }, { id: "o2", n: 1 }], catalyst: "mno2", type: "Catalytic decomposition", deltaH: -196, rate: 0.05, observations: ["Rapid effervescence — oxygen gas", "Glowing splint would relight"] },
  { id: "nh4cl-naoh", reactants: [{ id: "nh4cl", n: 1 }, { id: "naoh", n: 1 }], products: [{ id: "nacl", n: 1 }, { id: "h2o", n: 1 }, { id: "nh3g", n: 1 }], type: "Gas preparation (ammonia)", deltaH: 30, rate: 0.02, minTemperature: 35, observations: ["Pungent smell of ammonia", "Damp red litmus turns blue"] },
  { id: "thiosulfate-hcl", reactants: [{ id: "na2s2o3", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "nacl", n: 2 }, { id: "s-ppt", n: 1 }, { id: "so2", n: 1 }, { id: "h2o", n: 1 }], type: "Precipitation / redox (reaction rate)", effect: "precipitate", deltaH: -30, rate: 0.01, observations: ["Solution slowly turns cloudy pale yellow", "Cross beneath flask disappears"] },

  // Hazardous combination (educational warning)
  { id: "naocl-hcl", reactants: [{ id: "naocl", n: 1 }, { id: "hcl", n: 2 }], products: [{ id: "nacl", n: 1 }, { id: "cl2", n: 1 }, { id: "h2o", n: 1 }], type: "Redox — toxic gas release", deltaH: -80, effect: "smoke", observations: ["Greenish-yellow chlorine gas released (TOXIC)"] },
  { id: "kmno4-h2o2", reactants: [{ id: "kmno4", n: 2 }, { id: "h2o2", n: 5 }, { id: "h2so4", n: 3 }], products: [{ id: "k2so4", n: 1 }, { id: "mnso4", n: 2 }, { id: "o2", n: 5 }, { id: "h2o", n: 8 }], type: "Redox titration", deltaH: -300, observations: ["Purple colour disappears", "Oxygen bubbles"] },
];
