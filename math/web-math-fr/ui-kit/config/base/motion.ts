import { defineMotion } from "../kinds.ts";

// what moves, plus a few behaviours.
export const motion = defineMotion({
  // true = sections slide up and fade in as they scroll into view. false = they are just there
  rise: true,

  // true = hover and colour changes are smooth. false = instant
  transitions: true,

  // what keyboard focus looks like (Tab key)
  //   "ring"        an outline in the ring colour around the element
  //   "underline"   line under the element
  //   "none"        nothing
  focus: "ring",

  // the cookie / consent notice
  //   "bar"         bar across the bottom of the screen
  //   "card"        card in the bottom right corner
  banner: "bar",

  // links inside text
  //   "underline"   foreground colour, underlined in the link colour
  //   "colour"      link colour, underline only on hover
  links: "colour",

  // every glow on the page (under the primary button, under the active link, on the figures)
  // slowly rising and falling
  //   on        true or false
  //   seconds   one rise and fall
  breathe: { on: false, seconds: 4 },

  // true = the page is full-height screens that snap one at a time, with a scene fixed behind
  // them (the <Screens> element). false = an ordinary scrolling page
  screens: false,

  // the button back to the top of the page: how far the page has scrolled, in px, before it shows
  top: { after: 300 },
});

