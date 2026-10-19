import { defineMotion } from "../kinds.ts";

// motion of pixel_art_cute: nothing eases; things appear in steps, like the cat walks.
export const motion = defineMotion({ rise: false, transitions: false, focus: "ring", banner: "bar", links: "underline", breathe: { on: false, seconds: 4 }, screens: false, top: { after: 300 } });
