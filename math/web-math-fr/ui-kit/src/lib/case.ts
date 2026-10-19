/**
 * the case (the design) in use, chosen in development from the theme select of
 * the bar and of the kit page. the word is written into config/case.ts through
 * the dev server, which rebuilds the sheet; the page then loads itself again.
 * the product ships the word in case.ts and has no select.
 */

export const CASE_ROUTE = "/__kit/case";

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
  const answer = await fetch(CASE_ROUTE, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ case: name }) });
  if (answer.ok) (globalThis as { location?: { reload(): void } }).location?.reload();
}
