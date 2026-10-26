import { defineFractal } from "../kinds.ts";
import { fractal as from } from "../edge_light/fractal.ts";

// old_code starts from edge_light; change the fields that differ here
export const fractal = defineFractal({ ...from });
