import { defineColours, type Colours, type Hues } from "../kinds.ts";

// the palettes of pixel_art_cute, by short name, chosen the same way as in edge_light
// (VITE_KIT_PALETTE, or the select in development). the first is the green peach
// palette from samples/theme-green-peach.jpg, with its lights once for the light page and once for the dark.
//   T_GP   green peach: lychee ground, sky cloud panels, cupid pink primary, veranda blue secondary

// one palette: its hues for the light page and for the dark page

const LIGHT = {
  background: "#edecdb",
  card: "#f5f4e8",
  foreground: "#2b3a3a",
  "muted-foreground": "#6f7f80",
  border: "#a7bcbd",
} as const;

const DARK = {
  background: "#1f2a2b",
  card: "#283536",
  foreground: "#edecdb",
  "muted-foreground": "#a7bcbd",
  border: "#3b4b4c",
} as const;

const palette = (light: Hues, dark: Hues): Colours => defineColours({ default: "dark", light: { ...LIGHT, ...light }, dark: { ...DARK, ...dark } });

export const PALETTES: Record<string, Colours> = {
  T_GP: palette(
    {
      primary: "#e6748e",
      secondary: "#6bb1ad",
      chart: ["#e6748e", "#6bb1ad", "#a7bcbd", "#e5a9a9", "#edecdb"],
      selected: "#6bb1ad",
      destructive: "#c9566a",
    },
    {
      primary: "#e6748e",
      secondary: "#6bb1ad",
      chart: ["#e6748e", "#6bb1ad", "#a7bcbd", "#e5a9a9", "#edecdb"],
      destructive: "#c9566a",
      selected: "#6bb1ad",
    },
  ),
};

export const PALETTE_NAMES: Record<string, string> = {
  T_GP: "Green peach",
};

const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_KIT_PALETTE;
const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_KIT_PALETTE;
export const PALETTE = PALETTES[fromNode || fromVite || ""] ? fromNode || fromVite || "T_GP" : "T_GP";

export const colours = PALETTES[PALETTE];
