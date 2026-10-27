import { defineType } from "../kinds.ts";

// fonts of pixel_art_cute: from Google Fonts (Open Font License). titles, numbers and labels are in
// DotGothic16, a face drawn on a pixel grid with ordinary letter and number shapes; Press Start 2P,
// Pixelify Sans and Silkscreen could not be read (the owner, 2026-10-27). running text is in a
// plain rounded face, since no pixel face reads well in paragraphs. sizes and colours are in text.ts.
export const type = defineType({
  // the three stacks the text styles refer to by name ("body", "heading", "label")
  fonts: {
    // running text: a rounded face that reads easily, variable weight, Latin and Cyrillic
    body: '"Nunito", "Geist Variable", sans-serif',
    // the pixel face that reads, for the display line, headings, card titles and large numbers
    heading: '"DotGothic16", "Nunito", sans-serif',
    // the same face for labels, buttons and the small numbers
    label: '"DotGothic16", "Geist Mono Variable", monospace',
  },
  // the stylesheets that bring them; removed if the fonts are installed another way
  imports: ["https://fonts.googleapis.com/css2?family=DotGothic16&family=Nunito:wght@400..700&display=swap"],
  // a mark added to every heading: "none" | "rule" | "bar" | "number"
  headingMark: "none",
  // the small section label on panels: "plain" | "dot" | "hidden"
  labelStyle: "plain",
});
