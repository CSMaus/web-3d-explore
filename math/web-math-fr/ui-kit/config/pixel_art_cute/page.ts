import { definePage } from "../kinds.ts";

// page of pixel_art_cute: plain ground, a narrower measure that suits pixel type.
export const page = definePage({ width: 1200, gutter: 32, density: 1, background: "plain", hero: { afterEyebrow: 24, afterTitle: 24, afterLede: 24, afterActions: 32, tagGap: 16 } });
