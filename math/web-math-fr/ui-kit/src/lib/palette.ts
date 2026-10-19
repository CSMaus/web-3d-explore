/**
 * the palette of a case that has several: the visitor's saved choice, else the
 * one the build named, written onto the html element as data-palette, which the
 * theme sheet follows. one key in local storage holds the choice.
 */
import { useSyncExternalStore } from "react";

export const PALETTE_KEY = "kit_palette";

function saved(): string | null {
  try {
    return localStorage.getItem(PALETTE_KEY);
  } catch {
    return null;
  }
}

/** the palette in force: the saved one if the case still has it, else the build's. */
export function readPalette(fallback: string, known: string[]): string {
  const s = saved();
  return s && known.includes(s) ? s : fallback;
}

export function applyPalette(name: string): void {
  document.documentElement.dataset.palette = name;
}

export function savePalette(name: string): void {
  try {
    localStorage.setItem(PALETTE_KEY, name);
  } catch {
    return;
  }
}

export function currentPalette(fallback: string): string {
  return document.documentElement.dataset.palette ?? fallback;
}

export function watchPalette(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-palette"] });
  return () => observer.disconnect();
}

export function usePalette(fallback: string): string {
  return useSyncExternalStore(watchPalette, () => currentPalette(fallback), () => fallback);
}

/** the palette and the one way to change it: applied to the page and saved, for any switch. */
export function usePaletteChoice(fallback: string): [string, (name: string) => void] {
  const palette = usePalette(fallback);
  const pick = (name: string) => {
    applyPalette(name);
    savePalette(name);
  };
  return [palette, pick];
}
