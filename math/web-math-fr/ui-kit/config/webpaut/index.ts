// the "webpaut" case: the structure of old_code (edge_light's bones, mono headings) with the
// colours of base (dark by default, light kept), set denser for an inspection window full of
// panels, tables and canvases. every field that differs from old_code is named beside its value.
import { colours } from "../base/colours.ts";
import { defineButtons, defineInputs, definePage, definePanels, defineText, defineTheme, defineTopBar } from "../kinds.ts";
import { buttons as oldButtons } from "../old_code/buttons.ts";
import { figures } from "../old_code/figures.ts";
import { fractal } from "../old_code/fractal.ts";
import { inputs as oldInputs } from "../old_code/inputs.ts";
import { motion } from "../old_code/motion.ts";
import { page as oldPage } from "../old_code/page.ts";
import { panels as oldPanels } from "../old_code/panels.ts";
import { plots } from "../old_code/plots.ts";
import { sliders } from "../old_code/sliders.ts";
import { tabs } from "../old_code/tabs.ts";
import { text as oldText } from "../old_code/text.ts";
import { topbar as oldTopbar } from "../old_code/topbar.ts";
import { type } from "../old_code/type.ts";

// a flat page: no waves under data canvases
const page = definePage({ ...oldPage, background: "plain", gutter: 16, density: 0.85 });

// solid bordered panels (no blur over canvases), small corner, tight padding
const panels = definePanels({ ...oldPanels, style: "bordered", padding: 12, corner: 8 });

// rounded, not pill; no glow and no glass; smaller padding for dense toolbars
const buttons = defineButtons({
  ...oldButtons,
  shape: "rounded",
  padding: [7, 14],
  compact: [4, 10],
  glow: { ...oldButtons.glow, on: false, hover: false },
  glass: { ...oldButtons.glass, on: false },
});

// boxed inputs at a control height that matches the buttons
const inputs = defineInputs({ ...oldInputs, style: "box", height: 32 });

// a low bar: the inspection window needs the height for data
const topbar = defineTopBar({ ...oldTopbar, height: 48, marker: "underline" });

// smaller running text and button text; the mono label stays, in sentence case (dense panels read
// badly in capitals)
const text = defineText({
  ...oldText,
  styles: {
    ...oldText.styles,
    body: { ...oldText.styles.body, size: 14, leading: 1.45 },
    button: { ...oldText.styles.button, size: 12 },
    label: { ...oldText.styles.label, size: 12, case: "sentence", tracking: 0.02 },
    heading1: { ...oldText.styles.heading1, size: 20 },
    heading2: { ...oldText.styles.heading2, size: 16 },
    heading3: { ...oldText.styles.heading3, size: 14 },
  },
});

export const theme = defineTheme({ colours, type, text, page, topbar, buttons, tabs, sliders, inputs, panels, plots, figures, motion, fractal });
