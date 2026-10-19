import { defineSliders } from "../kinds.ts";
import { sliders as base } from "../base/sliders.ts";

// sliders of edge_light: a thin track and an upright bar for the thumb.
export const sliders = defineSliders({ ...base, track: 2, thumb: "bar", thumbSize: 12, colour: "chart-4" });
