import { defineFigures } from "../kinds.ts";
import { figures as from } from "../edge_light/figures.ts";

// old_code starts from edge_light; change the fields that differ here
export const figures = defineFigures({ ...from });
