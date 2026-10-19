import { definePlots } from "../kinds.ts";

// plots of pixel_art_cute: a grid, whole-pixel lines, on the panel colour.
export const plots = definePlots({ grid: true, gridWeight: 1, axisWeight: 2, lineWeight: 2, dotSize: 4, background: "card", caption: "below", extraCss: "" });
