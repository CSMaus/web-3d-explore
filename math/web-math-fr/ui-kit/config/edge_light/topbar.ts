import { defineTopBar } from "../kinds.ts";

// the bar of edge_light: a hairline, the brand far left, links grouped, a gold glow
// on the hairline under the active link.
export const topbar = defineTopBar({
  // "hairline" | "solid" | "floating" | "none"
  style: "hairline",
  // "left" | "centre" | "split"
  align: "split",
  // height in px
  height: 72,
  // "shown" | "hidden"
  brand: "shown",
  // "colour" | "underline" | "dot" | "glow"
  marker: "glow",
});
