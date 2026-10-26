import { defineButtons } from "../kinds.ts";

// buttons of pixel_art_cute: square, a two-pixel border, no glow; pressed swaps ink and
// ground. the fields are explained in base/buttons.ts.
export const buttons = defineButtons({
  shape: "square",
  padding: [10, 16],
  compact: [6, 10],
  motion: "none",
  plain: {
    rest: { border: 2, edge: "foreground", fill: "card", ink: "foreground" },
    hover: { border: 2, edge: "foreground", fill: "card", ink: "foreground" },
    pressed: { border: 2, edge: "foreground", fill: "foreground", ink: "background" },
  },
  primary: {
    rest: { border: 2, edge: "foreground", fill: "primary", ink: "foreground" },
    hover: { border: 2, edge: "foreground", fill: "primary", ink: "foreground" },
    pressed: { border: 2, edge: "foreground", fill: "foreground", ink: "primary" },
    weight: 700,
  },
  glow: { on: false, hover: false, colour: "primary", blur: 0 },
  glass: { on: true, tint: 70, blur: 12 },
  disabled: 0.4,
  extraCss: "",
});
