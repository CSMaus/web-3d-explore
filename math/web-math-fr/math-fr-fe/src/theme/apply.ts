import { DEFAULT, variables, type Theme } from "@/theme/theme";

/** put a theme on a document, live. the builder calls this on its own page and on the page it previews. */
export function applyTheme(doc: Document, t: Theme): void {
  const root = doc.documentElement;
  for (const [k, v] of Object.entries(variables(t))) root.style.setProperty(k, v);
  root.style.colorScheme = t.scheme;
  root.classList.toggle("still", !t.motion);
}

/** take a theme off a document, so the stylesheet's own values show again. */
export function clearTheme(doc: Document): void {
  const root = doc.documentElement;
  for (const k of Object.keys(variables(DEFAULT))) root.style.removeProperty(k);
  root.style.colorScheme = "";
  root.classList.remove("still");
}
