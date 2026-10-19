import { defineTopBar } from "../kinds.ts";

// the bar at the top of every page.
// text of the wordmark: text.ts -> "brand". text of the links: text.ts -> "nav".
export const topbar = defineTopBar({
  // background of the bar
  //   "hairline"    see-through, blurred, thin line under it
  //   "solid"       card colour, thin line under it
  //   "floating"    a pill floating a little below the top edge
  //   "none"        no background, no line
  style: "hairline",

  // where things sit
  //   "left"        brand, then links, actions at the far right
  //   "centre"      everything in the middle
  //   "split"       brand left, links in the middle, actions right
  align: "split",

  // height in px
  height: 72,

  // the wordmark (M / Math) next to the round mark
  //   "shown"
  //   "hidden"      the round mark stays
  brand: "shown",

  // how the link of the current page is marked
  //   "colour"      the glow colour
  //   "underline"   line under it
  //   "dot"         small dot below it
  //   "glow"        a soft light on the hairline under it
  marker: "colour",
});
