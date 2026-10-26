/**
 * the case (the design) in use. a visitor chooses among the shipped cases with the theme switch:
 * the word is kept in local storage and the page loads itself again under it. in development
 * the kit page's select also writes a word into config/case.ts through the dev server, which
 * rebuilds the sheets; the page then loads itself again.
 */
import { CASE_KEY } from "../../config/shipped.ts";

/** the page's local storage, where a browser has one */
const store = () => (globalThis as { localStorage?: { setItem(k: string, v: string): void; removeItem(k: string): void } }).localStorage;

export const CASE_ROUTE = "/__kit/case";

/** a visitor's choice of case: kept, and the page loaded again under it */
export function chooseCase(name: string): void {
  try {
    store()?.setItem(CASE_KEY, name);
  } catch {
    return;
  }
  (globalThis as { location?: { reload(): void } }).location?.reload();
}

/** a case's folder name as a label: "edge_light" reads "Edge light". */
export function caseLabel(name: string): string {
  const words = name.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** the labels of the cases, by name, for a select. */
export function caseLabels(names: readonly string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, caseLabel(n)]));
}

/** only a dev server answers; a test run has none and must never reach one */
const env = (import.meta as { env?: Record<string, string | boolean | undefined> }).env;
export const CASE_SELECT_SHOWN = env?.DEV === true && env.MODE !== "test";

export async function pickCase(name: string): Promise<void> {
  if (!CASE_SELECT_SHOWN) return;
  // the word in case.ts holds only while no choice of the switch is kept
  try {
    store()?.removeItem(CASE_KEY);
  } catch {
    // no storage: nothing kept to clear
  }
  const answer = await fetch(CASE_ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ case: name }) });
  if (answer.ok) (globalThis as { location?: { reload(): void } }).location?.reload();
}
