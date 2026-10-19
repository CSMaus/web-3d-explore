import { defineFigures } from "../kinds.ts";

// the figures of edge_light: plain thin edges as in base, a light running
// along them with a halo, breathing with the page. the fields are explained in
// base/figures.ts.
export const figures = defineFigures({
  stroke: 2,
  edge: "border",
  light: "glow",
  lightLength: 0.18,
  seconds: 6,
  glow: 4,
  relief: false,
  breathe: true,
});
