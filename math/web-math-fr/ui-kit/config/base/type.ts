import { defineType } from "../kinds.ts";

// fonts, and two small marks. sizes, weights and colours of text are NOT here: see text.ts.
export const type = defineType({
  // the three font stacks. text.ts picks one of them by name ("body", "heading", "label").
  // a stack is a css font-family list: the first font that is available is used.
  // Geist and Geist Mono are loaded by the kit itself; the rest are fallbacks.
  fonts: {
    body: '"Geist Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    heading: '"Geist Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    label: '"Geist Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },

  // a mark added to every heading
  //   "none"
  //   "rule"      thin line under the heading
  //   "bar"       short bar at the left in the primary colour
  //   "number"    running number before it: 01, 02, 03
  headingMark: "none",

  // the small section label on panels (WHAT GOES IN, RUN, ...)
  //   "plain"     text only
  //   "dot"       a dot before the text in the primary colour
  //   "hidden"    not shown at all
  labelStyle: "dot",
});
