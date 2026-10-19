import { defineText } from "../kinds.ts";
import { text as from } from "../edge_light/text.ts";

// old_code starts from edge_light; change the fields that differ here
export const text = defineText({ ...from });
