import { create } from "zustand";
import { PALETTES, paletteOf, type Palette } from "@/lib/palettes";
import { PLAY_PALETTE, PLAY_PALETTES } from "@/lib/site";

/**
 * the palette of the play pages, and the palettes the owner adds on the
 * Mandelbulb page while building one. the added ones and the choice live in the
 * browser, so they survive a reload; a palette that is kept goes into
 * lib/palettes.ts by hand and becomes part of the code.
 */
const SAVED_KEY = "mathfr_palettes";
const CHOICE_KEY = "mathfr_play_palette";

function readSaved(): Palette[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as Palette[]) : [];
  } catch {
    return [];
  }
}

function readChoice(): string | null {
  try {
    return localStorage.getItem(CHOICE_KEY);
  } catch {
    return null;
  }
}

/** in development, the palettes added in the browser go to the dev server, which writes them into palettes.own.json */
function handOver(saved: Palette[]) {
  if (!import.meta.env.DEV || import.meta.env.MODE === "test" || saved.length === 0) return;
  fetch("/__palettes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(saved) }).catch(() => undefined);
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

type Look = {
  palette: Palette;
  saved: Palette[];
  all: () => Palette[];
  setPalette: (id: string) => void;
  addPalette: (palette: Palette) => void;
  /** the page's mode changed: a reader who has not chosen a palette gets the one for that mode */
  follow: (mode: "light" | "dark") => void;
};

export const useLook = create<Look>((set, get) => {
  const saved = readSaved().filter((p) => !PALETTES.some((q) => q.id === p.id));
  handOver(readSaved());
  const all = () => [...PALETTES, ...get().saved];
  const start = [...PALETTES, ...saved].find((p) => p.id === readChoice()) ?? paletteOf(PLAY_PALETTE);
  return {
    palette: start,
    saved,
    all,
    follow: (mode) => {
      if (readChoice()) return;
      const wanted = paletteOf(PLAY_PALETTES[mode]);
      if (get().palette.id !== wanted.id) set({ palette: wanted });
    },
    setPalette: (id) => {
      const found = all().find((p) => p.id === id) ?? paletteOf(PLAY_PALETTE);
      remember(CHOICE_KEY, found.id);
      set({ palette: found });
    },
    addPalette: (palette) => {
      const next = [...get().saved.filter((p) => p.id !== palette.id), palette];
      remember(SAVED_KEY, JSON.stringify(next));
      remember(CHOICE_KEY, palette.id);
      handOver(next);
      set({ saved: next, palette });
    },
  };
});
