import { defineText } from "../kinds.ts";
import { text as from } from "../edge_light/text.ts";

// text of pixel_art_cute: starts from edge_light and sets the sizes a pixel face wants
// (whole pixels, no letter spacing, no tracking tricks). the fields are explained at the
// top of base/text.ts.
export const text = defineText({
  styles: {
    ...from.styles,
    display: { ...from.styles.display, font: "heading", size: 40, weight: 400, leading: 1.3, tracking: 0, case: "upper" },
    lede: { ...from.styles.lede, font: "body", size: 20, leading: 1.5, tracking: 0 },
    body: { ...from.styles.body, font: "body", size: 17, leading: 1.6, tracking: 0 },
    heading1: { ...from.styles.heading1, font: "heading", size: 20, weight: 400, leading: 1.4, tracking: 0, case: "upper" },
    heading2: { ...from.styles.heading2, font: "heading", size: 14, weight: 400, leading: 1.4, tracking: 0, case: "upper" },
    heading3: { ...from.styles.heading3, font: "heading", size: 11, weight: 400, leading: 1.4, tracking: 0, case: "upper" },
    label: { ...from.styles.label, font: "label", size: 12, tracking: 0, case: "upper" },
    tag: { ...from.styles.tag, font: "label", size: 12, tracking: 0, case: "upper" },
    caption: { ...from.styles.caption, font: "body", size: 14, tracking: 0 },
    verdict: { ...from.styles.verdict, font: "body", size: 16 },
    readout: { ...from.styles.readout, font: "label", size: 12 },
    readoutValue: { ...from.styles.readoutValue, font: "label", size: 12 },
    brand: { ...from.styles.brand, font: "heading", size: 12, tracking: 0, case: "upper" },
    nav: { ...from.styles.nav, font: "label", size: 13, tracking: 0, case: "upper" },
    button: { ...from.styles.button, font: "label", size: 13, weight: 700, tracking: 0, case: "upper" },
    search: { ...from.styles.search, font: "label", size: 13, tracking: 0 },
    key: { ...from.styles.key, font: "label", size: 11 },
    panelHead: { ...from.styles.panelHead, font: "label", size: 13 },
    strip: { ...from.styles.strip, font: "label", size: 12, tracking: 0, case: "upper" },
    field: { ...from.styles.field, font: "body", size: 14 },
    fieldValue: { ...from.styles.fieldValue, font: "label", size: 13 },
    banner: { ...from.styles.banner, font: "body", size: 14 },
    skip: { ...from.styles.skip, font: "label", size: 13, radius: 0 },
    counter: { ...from.styles.counter, font: "label", size: 12, tracking: 0 },
    share: { ...from.styles.share, font: "label", size: 12, tracking: 0 },
    cardTitle: { ...from.styles.cardTitle, font: "heading", size: 12, weight: 400, leading: 1.5, case: "upper" },
    cardText: { ...from.styles.cardText, font: "body", size: 15 },
    note: { ...from.styles.note, font: "label", size: 12, tracking: 0, radius: 0 },
  },
  readout: "table",
  numbers: "right",
});
