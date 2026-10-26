import { defineColours, type Colours, type Hex, type Hues } from "../kinds.ts";

// the palettes of old_code, by short name: the phosphors of the old monitors, chosen the
// same way as in edge_light (VITE_KIT_PALETTE, or the select in development). a console
// starts dark; the light mode is the paper the console printed on.
//   T_GN   green phosphor (P1), the 1970s and 80s video terminal
//   T_AM   amber phosphor (P3), the early 80s monochrome monitor
//   T_WH   white phosphor, the cold late 80s workstation

// one palette: its hues for the light page and for the dark page

const DARK = {
  background: "#0b0f0c",
  card: "#111713",
  foreground: "#d8e6d0",
  "muted-foreground": "#7f8f7a",
  border: "#223026",
} as const;

// the light page of each phosphor is the same screen by day, in the phosphor's own hue, so it
// reads as the dark one with the lights on: cool green-grey for the green, warm paper for the
// amber, cool grey-blue for the white
const PAPER = {
  background: "#efeadb",
  card: "#f7f3e6",
  foreground: "#1d2a1f",
  "muted-foreground": "#4a5547",
  border: "#b9b19a",
} as const;

const DAY_GREEN = {
  background: "#e6ede7",
  card: "#f2f6f2",
  foreground: "#0b1a10",
  "muted-foreground": "#3f5545",
  border: "#b4c6b8",
} as const;

const DAY_WHITE = {
  background: "#e7ebef",
  card: "#f3f5f8",
  foreground: "#121820",
  "muted-foreground": "#46505c",
  border: "#b7c0cb",
} as const;

type Greys = Record<"background" | "card" | "foreground" | "muted-foreground" | "border", `#${string}`>;

// the light of each topic, by topic number (0 complex numbers, 1 fractals, 2 chaos, 3 networks,
// 4 tokens, 5 the primes aside): its name and its turning figure glow in it. every topic keeps the
// palette's own light (its glow, else its primary), a very little lighter or darker, so the
// topics are told apart without leaving the phosphor's colour.
const SHADES = [0, 0.1, -0.08, 0.18, -0.15, 0.05];

/** a colour moved a little towards white (above zero) or black (below zero), its hue kept */
function shade(hex: Hex, k: number): Hex {
  const n = parseInt(hex.slice(1), 16);
  const part = (v: number) => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(part);
  return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

const topics = (h: Hues): Hex[] => SHADES.map((k) => shade(h.glow ?? h.primary, k));

const palette = (light: Hues, dark: Hues, day: Greys = PAPER): Colours =>
  defineColours({ default: "dark", light: { ...day, topics: topics(light), ...light }, dark: { ...DARK, topics: topics(dark), ...dark } });

export const PALETTES: Record<string, Colours> = {
  T_GN: palette(
    {
      primary: "#0f8a3a",
      secondary: "#0a6b2c",
      // the light that walks the figures and glows under buttons: a clear phosphor green, as on the dark page
      glow: "#12b04a",
      chart: ["#0f8a3a", "#0a6b2c", "#5f6b5c", "#2f9452", "#a8352a"],
      destructive: "#a8352a",
    },
    {
      primary: "#33ff66",
      secondary: "#00c853",
      chart: ["#33ff66", "#00c853", "#7f8f7a", "#b4ffc8", "#ff5f56"],
      destructive: "#ff5f56",
    },
    DAY_GREEN,
  ),
  T_AM: palette(
    {
      primary: "#8a5c00",
      secondary: "#a63f05",
      chart: ["#8a5c00", "#a63f05", "#6f6a5c", "#b58a1a", "#a8352a"],
      destructive: "#a8352a",
    },
    {
      primary: "#ffb000",
      secondary: "#ff6a00",
      chart: ["#ffb000", "#ff6a00", "#8f8a7a", "#ffd870", "#ff5f56"],
      destructive: "#ff5f56",
    },
  ),
  T_WH: palette(
    {
      primary: "#2f4a6b",
      secondary: "#4b6f99",
      chart: ["#2f4a6b", "#4b6f99", "#6f7a84", "#8aa0b8", "#a8352a"],
      destructive: "#a8352a",
    },
    {
      primary: "#e8f4ff",
      secondary: "#9ecbff",
      chart: ["#e8f4ff", "#9ecbff", "#7f8a94", "#c7d6e2", "#ff5f56"],
      destructive: "#ff5f56",
    },
    DAY_WHITE,
  ),
};

export const PALETTE_NAMES: Record<string, string> = {
  T_GN: "Green phosphor",
  T_AM: "Amber phosphor",
  T_WH: "White phosphor",
};

const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_KIT_PALETTE;
const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_KIT_PALETTE;
export const PALETTE = PALETTES[fromNode || fromVite || ""] ? fromNode || fromVite || "T_GN" : "T_GN";

export const colours = PALETTES[PALETTE];
