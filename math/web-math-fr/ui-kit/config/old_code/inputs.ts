import { defineInputs } from "../kinds.ts";
import { inputs as from } from "../edge_light/inputs.ts";

// old_code starts from edge_light; change the fields that differ here
export const inputs = defineInputs({ ...from });
