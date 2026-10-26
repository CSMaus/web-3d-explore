import type { CaseName } from "./cases.ts";

// the case a first visit gets, before a visitor chooses another with the switch (shipped.ts lists
// the choices); the one theme.css is built from, the one /kit and Storybook show. one word; the
// names are the keys in cases.ts. the mode a visitor starts in (light or dark) is `default` in the
// case's colours.ts.
export const CASE: CaseName = "edge_light";
