/**
 * an application piece: the thing in the world first, then the one part the
 * topic's idea enters, written to the site's writing standard. sections carry
 * a heading and paragraphs; a figure key names an interactive figure the page
 * renders at that point; sources are the citations the facts rest on.
 */
export type Source = { label: string; url: string };

export type Section = {
  heading: string;
  paragraphs: string[];
  /** the key of an interactive figure to show under this section, if any */
  figure?: string;
};

export type Piece = {
  id: string;
  topic: "fractals" | "chaos" | "complex" | "networks" | "tokens";
  question: string;
  /** one line under the question */
  lede: string;
  sections: Section[];
  /** what the piece does not claim, and which parts are practice against research */
  limits: string[];
  sources: Source[];
};
