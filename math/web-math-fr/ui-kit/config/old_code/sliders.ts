import { defineSliders } from "../kinds.ts";
import { sliders as from } from "../edge_light/sliders.ts";

// old_code starts from edge_light; change the fields that differ here
export const sliders = defineSliders({ ...from, colour: "primary" });
