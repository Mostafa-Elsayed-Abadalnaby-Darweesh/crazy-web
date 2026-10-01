import { registerComponents } from "@/lib/engine/registry";
import { CHEMISTRY_DEFINITIONS } from "./chemistry";
import { ELECTRICITY_DEFINITIONS } from "./electricity";
import { MECHANICS_DEFINITIONS } from "./mechanics";
import { OPTICS_DEFINITIONS } from "./optics";
import { THERMO_DEFINITIONS } from "./thermo";

let registered = false;

/** Registers every built-in component definition. Safe to call repeatedly. */
export function ensureCatalog() {
  if (registered) return;
  registered = true;
  registerComponents([...CHEMISTRY_DEFINITIONS, ...ELECTRICITY_DEFINITIONS, ...MECHANICS_DEFINITIONS, ...OPTICS_DEFINITIONS, ...THERMO_DEFINITIONS]);
}

ensureCatalog();

export { getDefinition, allDefinitions, libraryGroups } from "@/lib/engine/registry";
