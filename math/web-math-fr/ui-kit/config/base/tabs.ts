import { defineTabs } from "../kinds.ts";

// tabs (Parts, Play, Mathematics, Applications) and the chips of a choice.
// colours of each state: buttons.ts -> plain. text: text.ts -> "button".
export const tabs = defineTabs({
  // how they look
  //   "chips"       each one a small button; the chosen one gets the "pressed" look
  //   "segmented"   one outlined bar cut into parts; the chosen part is filled
  //   "underline"   plain text, line under the chosen one
  //   "links"       plain text, the chosen one in the primary colour
  style: "chips",

  // space between them, in px
  gap: 6,

  // raw css for anything the fields above do not cover
  extraCss: "",
});
