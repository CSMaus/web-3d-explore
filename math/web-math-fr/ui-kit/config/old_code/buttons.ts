import { defineButtons } from "../kinds.ts";
import { buttons as from } from "../edge_light/buttons.ts";

// old_code starts from edge_light; change the fields that differ here
export const buttons = defineButtons({ ...from });
