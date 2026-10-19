/**
 * the light or dark mode of a page: the visitor's saved choice, else the case's
 * default, written onto the html element as data-mode, which the theme sheet
 * follows. one key in local storage holds the choice.
 */
import { useSyncExternalStore } from "react";

export type Mode = "light" | "dark";

export const MODE_KEY = "kit_mode";

function saved(): Mode | null {
  try {
    const m = localStorage.getItem(MODE_KEY);
    return m === "light" || m === "dark" ? m : null;
  } catch {
    return null;
  }
}

/** the mode in force: the saved one, else the case's default. */
export function readMode(fallback: Mode): Mode {
  return saved() ?? fallback;
}

export function applyMode(mode: Mode): void {
  document.documentElement.dataset.mode = mode;
}

export function saveMode(mode: Mode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    return;
  }
}

export function currentMode(fallback: Mode): Mode {
  const m = document.documentElement.dataset.mode;
  return m === "light" || m === "dark" ? m : fallback;
}

/** calls back whenever the mode on the html element changes. */
export function watchMode(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
  return () => observer.disconnect();
}

/** the mode in force, kept current as it changes, for anything drawn differently in light and dark. */
export function useMode(fallback: Mode): Mode {
  return useSyncExternalStore(watchMode, () => currentMode(fallback), () => fallback);
}

/** the mode and the one way to change it: applied to the page and saved, for any switch. */
export function useModeChoice(fallback: Mode): [Mode, (m: Mode) => void] {
  const mode = useMode(fallback);
  const pick = (m: Mode) => {
    applyMode(m);
    saveMode(m);
  };
  return [mode, pick];
}
