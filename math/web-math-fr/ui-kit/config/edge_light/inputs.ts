import { defineInputs } from "../kinds.ts";
import { inputs as base } from "../base/inputs.ts";

// inputs of edge_light: only a line under the field.
export const inputs = defineInputs({ ...base, style: "underline", height: 44 });
