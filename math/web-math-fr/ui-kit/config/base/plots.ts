import { definePlots } from "../kinds.ts";

// plots and pictures on the play pages.
// text of the caption under a plot: text.ts -> "caption".
export const plots = definePlots({
  // true = grid lines behind the plot, false = none
  grid: true,

  // line widths in px
  gridWeight: 1, // the grid
  axisWeight: 1, // the axes
  lineWeight: 2, // a plotted curve

  // size of a plotted point, in px
  dotSize: 4,

  // background of the plot itself
  //   "card"        same as the panel it sits in
  //   "background"  the page colour
  //   "sunk"        darker than both
  background: "card",

  // where the caption goes
  //   "below"
  //   "above"
  caption: "below",

  // raw css for anything the fields above do not cover
  extraCss: "",
});
