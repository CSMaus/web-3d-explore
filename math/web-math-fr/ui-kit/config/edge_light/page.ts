import { definePage } from "../kinds.ts";

// the page of edge_light: wide, generous gutters, a soft gradient.
export const page = definePage({
  // maximum width of the content, in px
  width: 1400,
  // empty space at the left and right edge, in px
  gutter: 48,
  // multiplies every gap and padding. 1 = as designed
  density: 1,
  // what is drawn behind the page: "plain" | "gradient" | "grain" | "grid" | "vignette" | "waves"| "gradient" | "grain" | "grid" | "vignette"
  background: "waves",
  // space under each block of the hero, in px: eyebrow, title, lede, buttons; tagGap between the tags
  hero: { afterEyebrow: 28, afterTitle: 28, afterLede: 36, afterActions: 28, tagGap: 24 },
});
