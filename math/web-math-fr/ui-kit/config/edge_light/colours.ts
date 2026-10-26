import { defineColours, type Colours, type Hues } from "../kinds.ts";

// the palettes of edge_light, by short name. the one in use is chosen by the
// environment: VITE_KIT_PALETTE=T_WP (in the site's .env, or before the theme
// command). unset, T_GD. every other script of this case refers to the colours
// by name and gets the palette in use.
//
// a palette is two sets of lights, one for the light page and one for the dark page,
// over the greys of each mode. each light is one job: primary (tags, focus, links),
// secondary (tints), chart (the plotted lines), destructive (errors), selected (what is chosen),
// glow (the light of buttons and of the bar), value (slider values and readouts).
// selected, glow and value fall back to the primary when left out.
//   T_GD   the base: warm grey ground, near-black ink, an orange light
//   T_WP   warm peach: peach and coral
//   T_AG   apricot and green
//   T_GP   green peach: pink and veranda blue

// the greys of the light page and of the dark page, shared by every palette
const LIGHT = {
  // page background
  background: "#cfcfcf",
  // the letters on a primary-filled button: dark on the brand colour in both modes
  "primary-foreground": "#141414",
  // background of panels and cards
  card: "#dadad9",
  // main text colour, and lines
  foreground: "#141414",
  // secondary text: lede, card text, bar links when not active
  "muted-foreground": "#5e6066",
  // borders, rules, the hairline under the bar, card edges
  border: "#b2b1af",
} as const;

const DARK = {
  background: "#141311",
  "primary-foreground": "#141311",
  card: "#1d1b18",
  foreground: "#f1ede4",
  "muted-foreground": "#9a948a",
  border: "#2d2a26",
} as const;

// the light of each topic, by topic number (0 complex numbers, 1 fractals, 2 chaos, 3 networks,
// 4 tokens, 5 the primes aside): its name and its turning figure glow in it. warm hues only:
// amber, orange, copper, deep orange, peach, caramel.
const TOPICS_LIGHT: Hues["chart"] = ["#a8661a", "#c0551f", "#9c4a1c", "#b35a12", "#b0623a", "#8f6224"];
const TOPICS_DARK: Hues["chart"] = ["#f2b35e", "#ff8a5c", "#e0763f", "#f59a4a", "#f5a97f", "#d9a066"];

// one palette: its lights for the light page and for the dark page; "dark" is the mode a visitor starts in
const palette = (light: Hues, dark: Hues): Colours =>
  defineColours({ default: "dark", light: { ...LIGHT, topics: TOPICS_LIGHT, ...light }, dark: { ...DARK, topics: TOPICS_DARK, ...dark } });

export const PALETTES: Record<string, Colours> = {
  T_GD: palette(
    // the light page
    {
      // tags, the dot before a card title, the pressed primary button; first plotted line by convention
      primary: "#E98D5C",
      // the tint behind a hovered row in the registry elements; second plotted line by convention
      secondary: "#FC9360",
      // colours of lines in a plot, in order
      chart: ["#E98D5C", "#FF7E61", "#7a7f88", "#B36F50", "#c93b3b"],
      // errors, warnings, the destructive button
      destructive: "#c93b3b",
      // what is current or chosen (active tab, page title): the second light, so it differs from the primary
      selected: "#BA5B41",
      // the light: the glow of buttons, the glow under the active link in the bar, the figures' travelling light
      glow: "#FC9360",
      // numbers: the value beside a slider, the numbers of a readout
      value: "#D66C47",
    },
    // the dark page
    {
      // tags, the dot before a card title, the pressed primary button; first plotted line by convention
      primary: "#E98D5C",
      // the tint behind a hovered row in the registry elements; second plotted line by convention
      secondary: "#FFA566",
      // colours of lines in a plot, in order
      chart: ["#E98D5C", "#D1735E", "#7a7f88", "#F7A883", "#AB5C44"],
      // errors, warnings, the destructive button
      destructive: "#D64322",
      // what is current or chosen (active tab, page title): the second light, so it differs from the primary
      selected: "#FFB3A3",
      // the light: the glow of buttons, the glow under the active link in the bar, the figures' travelling light
      glow: "#E98D5C",
      // numbers: the value beside a slider, the numbers of a readout
      value: "#f0c9a6",
    },
  ),
  T_WP: palette(
    { primary: "#ee7863", secondary: "#f2772f", chart: ["#ee7863", "#f2772f", "#7a7f88", "#f58893", "#fac2bc"], destructive: "#f2772f", selected: "#f2772f" },
    { primary: "#ee7863", secondary: "#f2772f", chart: ["#ee7863", "#f2772f", "#7a7f88", "#f58893", "#fac2bc"], destructive: "#f2772f", selected: "#f2772f" },
  ),
  T_AG: palette(
    { primary: "#f09367", secondary: "#69662c", chart: ["#f09367", "#69662c", "#c98271", "#fcd38c", "#c2cca8"], destructive: "#c98271", selected: "#69662c" },
    { primary: "#f09367", secondary: "#69662c", chart: ["#f09367", "#69662c", "#c98271", "#fcd38c", "#c2cca8"], destructive: "#c98271", selected: "#69662c" },
  ),
  T_GP: palette(
    { primary: "#e6748e", secondary: "#6bb1ad", chart: ["#e6748e", "#6bb1ad", "#a7bcbd", "#e5a9a9", "#edecdb"], destructive: "#c9566a", selected: "#6bb1ad" },
    { primary: "#e6748e", secondary: "#6bb1ad", chart: ["#e6748e", "#6bb1ad", "#a7bcbd", "#e5a9a9", "#edecdb"], destructive: "#c9566a", selected: "#6bb1ad" },
  ),
};

export const PALETTE_NAMES: Record<string, string> = {
  T_GD: "Gold",
  T_WP: "Warm peach",
  T_AG: "Apricot and green",
  T_GP: "Green peach",
};

const fromNode = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITE_KIT_PALETTE;
const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_KIT_PALETTE;
export const PALETTE = fromNode || fromVite || "T_GD";

export const colours = PALETTES[PALETTE] ?? PALETTES.T_GD;
