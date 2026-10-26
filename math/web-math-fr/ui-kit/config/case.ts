import type { CaseName } from "./cases.ts";

// the case in use: the one the theme sheet is built from, the one /kit and Storybook show,
// the one the site ships. one word; the names are the keys in cases.ts. the mode a visitor
// starts in (light or dark) is `default` in the case's colours.ts.
export const CASE: CaseName = "old_code";
