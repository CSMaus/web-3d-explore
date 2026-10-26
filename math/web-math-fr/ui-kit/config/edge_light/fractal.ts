import { defineFractal } from "../kinds.ts";
import { fractal as base } from "../base/fractal.ts";

// the fractal of edge_light: as base, in its own glow.
// the light page is a mid grey and the glow an orange of nearly the same lightness, so at the
// base opacity the lines vanish there; the light page carries them stronger
export const fractal = defineFractal({ ...base, lightOpacity: 0.5 });
