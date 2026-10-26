import { defineText } from "../kinds.ts";
import { text as from } from "../edge_light/text.ts";

// old_code starts from edge_light; change the fields that differ here.
// the case reads as a console, so its titles and the paragraphs under them are set in the code
// font: the titles (the front page's display line, the heads of the pages and topics, the band
// and section headings) larger and heavier, the paragraphs (the lede and the intro) plain and a
// little smaller, since the monospace runs wider; the two match without being the same
export const text = defineText({
  ...from,
  styles: {
    ...from.styles,
    display: { ...from.styles.display, font: "label", size: 72, weight: 600, leading: 1.02, tracking: -0.045 },
    heading1: { ...from.styles.heading1, font: "label", weight: 600, tracking: -0.01 },
    heading2: { ...from.styles.heading2, font: "label", weight: 600 },
    heading3: { ...from.styles.heading3, font: "label", weight: 600 },
    cardTitle: { ...from.styles.cardTitle, font: "label", weight: 600 },
    lede: { ...from.styles.lede, font: "label", size: 16, leading: 1.65 },
    intro: { ...from.styles.intro, font: "label", size: 15, leading: 1.65 },
  },
});
