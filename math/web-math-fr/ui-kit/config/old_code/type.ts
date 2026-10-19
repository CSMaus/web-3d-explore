import { defineType } from "../kinds.ts";
import { type as from } from "../edge_light/type.ts";

// old_code starts from edge_light; change the fields that differ here
export const type = defineType({ ...from });
