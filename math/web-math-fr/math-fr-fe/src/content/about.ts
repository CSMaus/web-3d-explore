/**
 * the about page. the owner writes this; the site lays it out. sections in
 * order, each a heading and paragraphs.
 */
export type Section = { title: string; body: string[] };

export const ABOUT: { intro: string[]; sections: Section[] } = {
  intro: ["This page is being written."],
  sections: [],
};
