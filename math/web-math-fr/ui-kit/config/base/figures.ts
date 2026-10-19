import { defineFigures } from "../kinds.ts";

// line figures: a fractal drawn as thin edges with a light running along them
// (the <EdgeFigure> element: snowflake, triangle, squares, dragon).
export const figures = defineFigures({
  // width of the edge in px
  stroke: 2,
  // colour of the edge at rest. a palette name, a tint "foreground/30", a hex, or "transparent"
  edge: "border",
  // colour of the light that runs along the edge
  light: "glow",
  // length of the light as a fraction of the whole figure: 0.15 = 15% of the path
  lightLength: 0.15,
  // seconds for the light to go once round the figure
  seconds: 8,
  // blur of the light's halo in px. 0 = no halo
  glow: 4,
  // true = the edge is drawn as relief: a lighter line above it and a darker one below
  relief: false,
  // true = the light's strength rises and falls with the page's breathing (motion.ts -> breathe)
  breathe: false,
});
