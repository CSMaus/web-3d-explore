import { definePlots } from "../kinds.ts";
import { plots as from } from "../edge_light/plots.ts";

// old_code starts from edge_light; change the fields that differ here
export const plots = definePlots({ ...from });
