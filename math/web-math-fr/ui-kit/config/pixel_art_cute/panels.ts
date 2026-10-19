import { definePanels } from "../kinds.ts";

// panels of pixel_art_cute: a two-pixel border, square corners, the panel colour.
export const panels = definePanels({ style: "bordered", padding: 16, corner: 0, border: 2, heading: "inside", extraCss: "" });
