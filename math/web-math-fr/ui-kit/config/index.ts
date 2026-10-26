/**
 * the theme in use: the case a visitor chose with the switch (one of shipped.ts), else the case
 * named in case.ts, taken from cases.ts, unless the environment names another one
 * (VITE_KIT_CASE=base, before the theme command or the package build), the same way
 * VITE_KIT_PALETTE picks a palette. with the site's dev server running the sheets are regenerated
 * on save of any file in this folder; otherwise `npm run theme` regenerates src/theme.css and
 * src/themes.css.
 */
import { CASE as NAMED } from "./case.ts";
import { cases, type CaseName } from "./cases.ts";
import { CASE_KEY, SHIPPED } from "./shipped.ts";

const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_KIT_CASE;
const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_KIT_CASE;
const forced = fromNode || fromVite;

/** the case a visitor chose with the switch, when it is one the product ships */
function chosen(): CaseName | null {
  try {
    const word = (globalThis as { localStorage?: Storage }).localStorage?.getItem(CASE_KEY);
    return word && (SHIPPED as string[]).includes(word) ? (word as CaseName) : null;
  } catch {
    return null;
  }
}

export const CASE: CaseName = forced && forced in cases ? (forced as CaseName) : (chosen() ?? NAMED);
export const theme = cases[CASE];
export const CASE_NAMES = Object.keys(cases) as CaseName[];

/** a case's own light (its glow, else its primary) for a mode, as the theme switch shows it */
export function caseLight(name: CaseName, mode: "light" | "dark"): string {
  const c = cases[name].colours[mode];
  return c.glow ?? c.primary;
}
