import type { CaseName } from "./cases.ts";

// the cases a visitor of the product can choose between, in the order the switch lists them. the
// one in case.ts is the one a first visit gets; it is listed here too. a case not listed here is
// not in the product's sheet, unless case.ts names it, which is how a case in the making is seen
// on the dev server.
export const SHIPPED: CaseName[] = ["base", "edge_light", "old_code", "pixel_art_cute"];

// the key in local storage that holds a visitor's choice
export const CASE_KEY = "kit_case";
