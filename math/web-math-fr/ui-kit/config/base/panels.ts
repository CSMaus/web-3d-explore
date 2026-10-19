import { definePanels } from "../kinds.ts";

// panels: the boxes a page is made of (WHAT GOES IN, RUN, WHAT CAME OUT, the Mandelbulb card).
export const panels = definePanels({
  // how a panel looks
  //   "bordered"    card colour with a border
  //   "flat"        slightly lighter than the page, no border
  //   "raised"      card colour with a shadow
  //   "inset"       darker, looks sunk into the page
  //   "rules"       no box; only a line above
  //   "glass"       frosted and see-through, with a light inner edge
  style: "bordered",

  // space inside the panel, in px
  padding: 20,

  // corner radius in px. also used by plots, and by buttons when buttons.ts -> shape is "rounded"
  corner: 16,

  // border width in px (for "bordered" and "rules")
  border: 1,

  // where the small label (WHAT GOES IN) sits
  //   "inside"      at the top, inside the panel
  //   "on-border"   cut into the top border
  //   "above"       above the panel, outside it
  heading: "inside",

  // raw css for anything the fields above do not cover
  extraCss: "",
});
