import { definePage } from "../kinds.ts";

// the page as a whole.
export const page = definePage({
  // maximum width of the content, in px. wider screens get empty space at the sides
  width: 1280,

  // empty space at the left and right edge, in px
  gutter: 32,

  // multiplies every gap and padding on the page. 1 = as designed, 0.8 = tighter, 1.2 = airier
  density: 1,

  // what is drawn behind the page
  //   "plain"       the background colour only
  //   "gradient"    light wash of the secondary at the top, fading to the background
  //   "grain"       fine noise texture
  //   "grid"        faint grid lines every 32px
  //   "vignette"    slightly lighter at the top centre
  //   "waves"       soft lighter and darker patches at four different periods down the whole page,
  //                 so they never line up and keep changing while scrolling
  background: "plain",

  // space under each block of the front page hero, in px: the small line above the title,
  // the title, the paragraph under it, the buttons (the tags follow); tagGap is the space
  // between the tags themselves
  hero: { afterEyebrow: 32, afterTitle: 32, afterLede: 32, afterActions: 40, tagGap: 24 },
});
