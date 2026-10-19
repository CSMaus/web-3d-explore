import { definePanels } from "../kinds.ts";

// panels of edge_light: frosted glass with a large corner; the hero panel and the
// cards take this. the fields are explained in base/panels.ts.
export const panels = definePanels({
  style: "glass",
  padding: 28,
  corner: 28,
  border: 1,
  heading: "inside",
  extraCss: "",
});
