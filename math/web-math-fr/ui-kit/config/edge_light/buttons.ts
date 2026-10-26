import { defineButtons } from "../kinds.ts";

// buttons of edge_light: pills; the primary is filled with the brand colour and its contour lights up
// under the pointer and while pressed; the plain one is an outline in ink. the fields are explained in
// base/buttons.ts.
export const buttons = defineButtons({
  shape: "pill",
  padding: [10, 24],
  compact: [6, 14],
  motion: "none",
  plain: {
    rest: { border: 1, edge: "foreground", fill: "transparent", ink: "foreground" },
    hover: { border: 1, edge: "foreground", fill: "transparent", ink: "foreground" },
    pressed: { border: 1, edge: "foreground", fill: "foreground", ink: "background" },
  },
  primary: {
    rest: { border: 1, edge: "primary", fill: "primary", ink: "primary-foreground" },
    hover: { border: 1, edge: "primary", fill: "primary", ink: "primary-foreground" },
    pressed: { border: 1, edge: "selected", fill: "selected", ink: "primary-foreground" },
    weight: 500,
  },
  glow: { on: "hover", hover: true, colour: "glow", blur: 14 },
  glass: { on: true, tint: 70, blur: 12 },
  disabled: 0.4,
  extraCss: "",
});
