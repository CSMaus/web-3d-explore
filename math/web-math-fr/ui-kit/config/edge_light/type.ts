import { defineType } from "../kinds.ts";

// fonts of edge_light. headlines are set in capitals, tracked wide (see text.ts);
// the stack here is what draws them. sizes, weights and colours are in text.ts.
export const type = defineType({
  // the three stacks the text styles refer to by name ("body", "heading", "label").
  // a stack is a css font-family list: the first font that is available is used
  fonts: {
    body: 'Inter, "Geist Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    heading: '"Geist Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    label: '"Geist Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },

  // a mark added to every heading
  //   "none" | "rule" | "bar" | "number"
  headingMark: "none",

  // the small section label on panels
  //   "plain" | "dot" | "hidden"
  labelStyle: "plain",
});
