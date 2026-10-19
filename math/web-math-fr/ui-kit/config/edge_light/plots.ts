import { definePlots } from "../kinds.ts";
import { plots as base } from "../base/plots.ts";

// plots of edge_light: on the page colour, no grid, thin lines.
export const plots = definePlots({ ...base, grid: false, background: "background", lineWeight: 1.5 });
