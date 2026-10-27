/**
 * the site's own settings: the name it goes by, the languages it offers and
 * the addresses that are not code. every value can be set from the environment
 * at build time, so a rename or a new donation address is no code change.
 */

import { KIT_CASE } from "@kit/index";

/** the wordmark in the bar and the page title. the owner has not settled it; the placeholder mirrors the design. */
export const BRAND: string = import.meta.env.VITE_BRAND || "M / Math";

/** where the donate button leads. empty means no button is shown, so no dead link ships. */
export const DONATE_URL: string = import.meta.env.VITE_DONATE_URL || "";

/** the palette of the Mandelbulb on the front page, one per case, by id from `lib/palettes`; chosen here, not on the page. */
const FRONT_PALETTES: Record<string, string> = { base: "ice", edge_light: "warm", pixel_art_cute: "pixel", old_code: "moss" };
export const FRONT_PALETTE = FRONT_PALETTES[KIT_CASE] ?? "ice";

/** the lights of the Mandelbulb on the front page, per case; a value left out is the Bulb's default. */
const FRONT_LIGHTS: Record<string, Partial<{ keyLight: number; fill: number; shine: number; glow: number; haze: number }>> = {
  edge_light: { keyLight: 0.1, fill: 0.23, shine: 0, glow: 1.44, haze: 2.43 },
  old_code: { fill: 1.5 },
};
export const FRONT_LIGHT_SET = FRONT_LIGHTS[KIT_CASE] ?? {};

/** the palette the play pages and their plots start in, by id from `lib/palettes`, for every case: one for the light page, one for the dark */
export const PLAY_PALETTES: Record<"light" | "dark", string> = { light: "paper", dark: "ice" };
export const PLAY_PALETTE = PLAY_PALETTES.dark;

/**
 * the layout of the front page. "scene" (2026-10-26): the words centred at the top of the first
 * screen and the Mandelbulb rising from under them, cut by the screen's edge, coming whole into
 * view as the page scrolls. "stage" (2026-10-25): the words low at the left and the Mandelbulb
 * at the right. under both the topics are the graph (components/TopicGraph.tsx); the straight
 * row tried on 2026-10-26 (components/TopicLine.tsx) is not used.
 */
export const FRONT_LAYOUT: "scene" | "stage" = "scene";

/** whether the Mandelbulb on the front page sits in a frame; none by default. */
export const FRONT_BULB_FRAMED = false;

/** the colour of the light that runs along the Mandelbulb's edges in the contour view, settled per case: blue where the Mandelbulb is Crystal ice */
const CONTOUR_LIGHTS: Record<string, string> = { base: "#9fe3ff", edge_light: "#ff6b5e", pixel_art_cute: "#a01c2c", old_code: "#0f5c4a" };
export const CONTOUR_LIGHT = CONTOUR_LIGHTS[KIT_CASE] ?? "#9fe3ff";

export type Language = { code: string; label: string; name: string };

/**
 * the languages the interface offers. adding one is a file under
 * src/locales/<code>/common.json, an import in i18n.ts, and a line here.
 */
export const LANGUAGES: Language[] = [
  { code: "en", label: "EN", name: "English" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "ko", label: "KO", name: "한국어" },
  { code: "fr", label: "FR", name: "Français" },
];

export const LANGUAGE_KEY = "mathfr_lang";

/**
 * the themes a visitor can choose in the bar, in order; the first is the one a first visit gets
 * (config/case.ts in the kit names the same). `case` is the kit's case, `sign` the small figure
 * beside the name, translated where it is shown (this file is read before the translations). a
 * theme listed here must be in the kit's config/shipped.ts.
 */
export const THEMES: { case: string; name: string; sign: "sun" | "prompt" | "flake" | "cat" }[] = [
  { case: "base", name: "Cool", sign: "flake" },
  { case: "edge_light", name: "Warm", sign: "sun" },
  { case: "old_code", name: "Green", sign: "prompt" },
  { case: "pixel_art_cute", name: "Pixel", sign: "cat" },
];

/** the cases whose front page carries the kitten asleep in the corner */
export const KITTEN_CASES: string[] = ["pixel_art_cute"];

/** the cases that have a dark page only: no light and dark switch, and the page always dark */
export const DARK_ONLY: string[] = ["pixel_art_cute"];
