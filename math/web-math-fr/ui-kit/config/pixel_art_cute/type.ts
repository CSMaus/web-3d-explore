import { defineType } from "../kinds.ts";

// fonts of pixel_art_cute: pixel faces from Google Fonts (Open Font License). sizes,
// weights and colours are in text.ts.
export const type = defineType({
  // the three stacks the text styles refer to by name ("body", "heading", "label")
  fonts: {
    // readable pixel face for running text, variable weight, Latin and Cyrillic
    body: '"Pixelify Sans", "Geist Variable", sans-serif',
    // the eight-bit face, for the display line and headings only
    heading: '"Press Start 2P", "Pixelify Sans", monospace',
    // the compact one for labels, buttons and numbers
    label: '"Silkscreen", "Geist Mono Variable", monospace',
  },
  // the stylesheets that bring them; removed if the fonts are installed another way
  imports: ["https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap"],
  // a mark added to every heading: "none" | "rule" | "bar" | "number"
  headingMark: "none",
  // the small section label on panels: "plain" | "dot" | "hidden"
  labelStyle: "plain",
});
