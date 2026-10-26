import { defineFractal } from "../kinds.ts";
import { fractal as base } from "../base/fractal.ts";

// the fractal of pixel_art_cute: square steps in the brand colour, thicker lines.
export const fractal = defineFractal({ ...base, colour: "primary", stroke: 2, step: 44, bend: 0.4 });
