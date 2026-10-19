// the "base" case: the look of the maths site. gathers the thirteen scripts beside this file.
import { defineTheme } from "../kinds.ts";
import { buttons } from "./buttons.ts";
import { colours } from "./colours.ts";
import { figures } from "./figures.ts";
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

export const theme = defineTheme({ colours, type, text, page, topbar, buttons, tabs, sliders, inputs, panels, plots, figures, motion });
