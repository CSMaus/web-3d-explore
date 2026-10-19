// every design the kit carries, by name. one folder per case, each with the same
// thirteen scripts. to add a case: copy a folder, give it a name, add a line here.
// a case can start from another one: import that case's script and spread it,
// changing only the fields that differ, for example
//   export const buttons = defineButtons({ ...base, shape: "square" });
import { theme as base } from "./base/index.ts";
import { theme as edge_light } from "./edge_light/index.ts";
import { theme as old_code } from "./old_code/index.ts";
import { theme as pixel_art_cute } from "./pixel_art_cute/index.ts";

export const cases = { base, edge_light, pixel_art_cute, old_code };

export type CaseName = keyof typeof cases;
