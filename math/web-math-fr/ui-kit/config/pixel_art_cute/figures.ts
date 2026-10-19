import { defineFigures } from "../kinds.ts";

// figures of pixel_art_cute: a flat two-pixel edge and a short light hopping along it, no halo.
export const figures = defineFigures({ stroke: 2, edge: "foreground", light: "primary", lightLength: 0.08, seconds: 6, glow: 0, relief: false, breathe: false });
