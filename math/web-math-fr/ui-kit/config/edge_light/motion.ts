import { defineMotion } from "../kinds.ts";

// motion of edge_light: everything glows breathes over four seconds, and the page
// is a stack of full-height screens. the fields are explained in base/motion.ts.
export const motion = defineMotion({
  rise: true,
  transitions: true,
  focus: "ring",
  banner: "card",
  links: "underline",
  breathe: { on: true, seconds: 4 },
  screens: true,
  top: { after: 300 },
});
