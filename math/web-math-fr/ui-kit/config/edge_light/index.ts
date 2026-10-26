// the "edge_light" case: a light page in a frame, one gold light, fractal figures with a
// light running along their edges. gathers the thirteen scripts beside this file; the
// ones that differ little from base import base and change a few fields.
import { defineTheme } from "../kinds.ts";
import { buttons } from "./buttons.ts";
import { PALETTE, PALETTES, PALETTE_NAMES, colours } from "./colours.ts";
import { figures } from "./figures.ts";
import { fractal } from "./fractal.ts";
import { inputs } from "./inputs.ts";
import { motion } from "./motion.ts";
import { page } from "./page.ts";
import { panels } from "./panels.ts";
import { plots } from "./plots.ts";
import { sliders } from "./sliders.ts";
import { tabs } from "./tabs.ts";
import { text } from "./text.ts";
import { topbar } from "./topbar.ts";
import { type } from "./type.ts";

export const theme = defineTheme({ colours, palettes: PALETTES, palette: PALETTE, paletteNames: PALETTE_NAMES, type, text, page, topbar, buttons, tabs, sliders, inputs, panels, plots, figures, motion, fractal });
