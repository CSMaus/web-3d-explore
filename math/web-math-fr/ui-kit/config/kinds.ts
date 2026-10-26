/**
 * the types every config script is written against. each choice is a union of
 * the allowed words, so an editor completes them and a wrong one fails to
 * compile. the `define*` helpers only carry the type; they return what they
 * are given. the config scripts of each case carry a comment per field saying
 * what it changes; this file is the list of what is allowed.
 */

export type Hex = `#${string}`;

/** the names of a palette: the standard design-token names, each one job */
export type Tone =
  | "background"
  | "card"
  | "foreground"
  | "muted-foreground"
  | "border"
  | "primary"
  | "secondary"
  | "selected"
  | "glow"
  | "value"
  | "destructive"
  | "primary-foreground"
  | "card-foreground"
  | "link"
  | "success"
  | "input"
  | "ring"
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5";

/**
 * a colour, wherever one is asked for: a palette name ("primary", or "chart-4" for
 * the fourth plotted colour), a palette name with a percentage ("primary/14" is the primary at 14 percent over
 * nothing, a tint), a hex value, or "transparent" for none. a palette name
 * follows the light or dark mode in use; a hex does not.
 */
export type Swatch = Tone | `${Tone}/${number}` | Hex | "transparent";

export type Case = "sentence" | "upper" | "lower";

export type Shape = "square" | "rounded" | "pill" | "underline";

export type Mode = "light" | "dark";

export type FontStack = string;

/** one palette: the greys, the hues (the coloured values), and the colours derived from them when left out */
export type Palette = {
  /** the page behind everything */
  background: Hex;
  /** the fill of panels and cards: the three boxes of a play page, the topic tiles, the search window */
  card: Hex;
  /** text and lines */
  foreground: Hex;
  /** secondary text: the lede, captions, slider names, links at rest */
  "muted-foreground": Hex;
  /** borders, rules, the slider track, the hairline under the top bar */
  border: Hex;
  /** the brand colour: tags, the dot before a card title, the pressed primary button; the first plotted line */
  primary: Hex;
  /** the second brand colour: the tint behind a hovered row in the registry elements; the second plotted line */
  secondary: Hex;
  /** the plotted lines, in order; the first two are primary and secondary by convention */
  chart: Hex[];
  /** something went wrong: the blew-up verdict, a warning, the destructive button */
  destructive: Hex;
  /** what is current or chosen: the active tab, the topic's name, the pressed chip; the primary when left out */
  selected?: Hex;
  /** the light: the contour of buttons, the marker under the active link in the bar, the figures' light; the primary when left out */
  glow?: Hex;
  /** numbers: the value beside a slider, the numbers of a readout; the primary when left out */
  value?: Hex;
  /** the letters on a filled primary button; the background when left out */
  "primary-foreground"?: Hex;
  /** the text inside a panel or card; the foreground when left out */
  "card-foreground"?: Hex;
  /** a text link; the primary when left out */
  link?: Hex;
  /** the good verdict, a passed check; the primary when left out */
  success?: Hex;
  /** the fill of a text field; none when left out */
  input?: Hex;
  /** the focus ring; the primary when left out */
  ring?: Hex;
  /** the light of each topic, by the topic's number (the first is topic 0): its name and its figure glow in it; the chart colours when left out */
  topics?: Hex[];
};

/** the greys of a palette: shared by every palette of a case, one set per mode */
export type Greys = Pick<Palette, "background" | "card" | "foreground" | "muted-foreground" | "border" | "primary-foreground" | "card-foreground" | "input">;

/** the hues of a palette, the coloured values as against the greys: what a case sets per palette */
export type Hues = Omit<Palette, keyof Greys>;

export type Colours = {
  /** the mode a visitor gets before choosing one */
  default: Mode;
  light: Palette;
  dark: Palette;
};

export type Type = {
  /** the three font stacks the text styles refer to by name */
  fonts: { body: FontStack; heading: FontStack; label: FontStack };
  /** stylesheets that bring the fonts, loaded at the top of the generated sheet; none for fonts the kit ships */
  imports?: string[];
  /** what marks a heading beyond its type */
  headingMark: "none" | "rule" | "bar" | "number";
  /** the small section label: plain, with a dot before it, or not shown */
  labelStyle: "plain" | "dot" | "hidden";
};

/** one kind of text: where it is used and exactly how it is set */
export type TextStyle = {
  /** where in the app this style appears; shown beside the sample on the kit page */
  used: string;
  /** one of the three named stacks in type.ts, or a font stack written out */
  font: "body" | "heading" | "label" | (string & {});
  /** in px */
  size: number;
  /** 100 to 900 */
  weight: number;
  /** line height as a multiple of the size */
  leading: number;
  /** letter spacing in em; negative tightens */
  tracking: number;
  /** extra space between words in em, on top of the font's own space; negative pulls words closer; leave out for none */
  words?: number;
  case: Case;
  colour: Swatch;
  /** a colour behind the text; leave out or "transparent" for none */
  background?: Swatch;
  /** vertical and horizontal, in px, around the text; leave out for none */
  padding?: [number, number];
  /** corner radius of the background, in px */
  radius?: number;
};

/** the kinds of text the kit's elements carry; each needs a style */
export const TEXT_SLOTS = [
  "display",
  "lede",
  "body",
  "heading1",
  "heading2",
  "heading3",
  "label",
  "tag",
  "caption",
  "verdict",
  "readout",
  "readoutValue",
  "brand",
  "nav",
  "button",
  "search",
  "key",
  "panelHead",
  "strip",
  "field",
  "fieldValue",
  "banner",
  "skip",
  "counter",
  "share",
  "cardTitle",
  "cardText",
] as const;

export type TextSlot = (typeof TEXT_SLOTS)[number];

export type Text = {
  /** every kind of text, by name; the fixed names are the kit's own, any further name becomes a style of its own */
  styles: Record<TextSlot, TextStyle> & Record<string, TextStyle>;
  /** a readout: name and number as loose pairs, or as table rows with rules between */
  readout: "pairs" | "table";
  /** where the number sits in a readout row */
  numbers: "right" | "inline";
};

export type Page = {
  /** the reading width, in px */
  width: number;
  /** side gutters, in px */
  gutter: number;
  /** a multiplier on every gap and padding */
  density: number;
  background: "plain" | "gradient" | "grain" | "grid" | "vignette" | "waves";
  /** the space under each block| "gradient" | "grain" | "grid" | "vignette";
  /** the space under each block of the front page hero, in px: eyebrow, title, lede, buttons; and the gap between the tags */
  hero: { afterEyebrow: number; afterTitle: number; afterLede: number; afterActions: number; tagGap: number };
};

export type TopBar = {
  style: "hairline" | "solid" | "floating" | "none";
  align: "left" | "centre" | "split";
  /** in px */
  height: number;
  /** the wordmark is shown or not; its type is the "brand" text style */
  brand: "shown" | "hidden";
  /** how the current page's link is marked; "glow" is a soft light on the hairline under it */
  marker: "colour" | "underline" | "dot" | "glow";
};

/** how a button looks in one state */
export type Look = {
  /** border width in px; 0 is no border */
  border: number;
  /** the border colour */
  edge: Swatch;
  /** the background */
  fill: Swatch;
  /** the text colour */
  ink: Swatch;
};

/** the three states every button has */
export type States = {
  /** as it sits on the page */
  rest: Look;
  /** under the pointer */
  hover: Look;
  /** while held down, and when it is the chosen one of a group */
  pressed: Look;
};

export type Buttons = {
  shape: Shape;
  /** vertical and horizontal, in px */
  padding: [number, number];
  /** the same for a small button inside a panel: Auto, Manual, Reset view, One step */
  compact: [number, number];
  /** what moves on hover besides the colours */
  motion: "none" | "lift" | "brighten";
  /** the ordinary button, the chips of a choice, the tabs */
  plain: States;
  /** the one primary button on a page, and where its shape or weight differs */
  primary: States & { shape?: Shape; weight?: number };
  /** the light on the primary button's contour: always (true), only under the pointer and while pressed ("hover"), or never (false); and whether the plain button's contour brightens the same way under the pointer (hover) */
  glow: { on: boolean | "hover"; hover: boolean; colour: Swatch; blur: number };
  /** the plain button frosted like the top bar: the page colour at `tint` per cent over what lies behind, blurred by `blur` px; the pressed state keeps its own fill */
  glass: { on: boolean; tint: number; blur: number };
  /** opacity of a disabled button, 0 to 1 */
  disabled: number;
  /** anything the knobs do not reach, as css for [data-slot="button"] */
  extraCss: string;
};

export type Tabs = {
  style: "chips" | "segmented" | "underline" | "links";
  /** in px */
  gap: number;
  extraCss: string;
};

export type Sliders = {
  /** in px */
  track: number;
  filled: boolean;
  thumb: "round" | "square" | "bar";
  /** in px */
  thumbSize: number;
  /** the colour of the filled track and the thumb */
  colour: Swatch;
  value: "right" | "inline" | "above";
  extraCss: string;
};

export type Inputs = {
  style: "box" | "underline" | "filled";
  /** in px */
  height: number;
  /** in px */
  border: number;
  extraCss: string;
};

export type Panels = {
  /** "glass" is frosted and see-through, with a light inner edge */
  style: "bordered" | "flat" | "raised" | "inset" | "rules" | "glass";
  /** in px */
  padding: number;
  /** in px */
  corner: number;
  /** in px */
  border: number;
  heading: "inside" | "on-border" | "above";
  extraCss: string;
};

export type Plots = {
  grid: boolean;
  /** in px */
  gridWeight: number;
  axisWeight: number;
  lineWeight: number;
  dotSize: number;
  /** the plot's own background, against the panel: the card colour, the page colour, or darker than the page */
  background: "card" | "background" | "sunk";
  caption: "below" | "above";
  extraCss: string;
};

/** the line figures: a fractal drawn as thin edges with a light travelling along them */
export type Figures = {
  /** width of the edge in px */
  stroke: number;
  /** colour of the edge at rest */
  edge: Swatch;
  /** colour of the travelling light */
  light: Swatch;
  /** length of the light as a fraction of the whole path, 0 to 1 */
  lightLength: number;
  /** seconds for one lap of the light */
  seconds: number;
  /** blur of the light's halo in px; 0 for none */
  glow: number;
  /** the edge drawn as relief: a lighter line above it and a darker one below */
  relief: boolean;
  /** the light's strength rising and falling with the page's breathing */
  breathe: boolean;
  /** the large turning figures of the topics: a light always walking along them, slowly; leave out for 0.35 and 16 */
  solid?: {
    /** length of the lit stretch as a fraction of the figure's walking line, 0 to 1 */
    lightLength: number;
    /** seconds for one lap of the light */
    seconds: number;
  };
  /** the small drawings on page tiles: a light always walking along them, slowly; leave out for 0.28 and 12 */
  tile?: {
    /** length of the lit stretch as a fraction of the whole drawing, 0 to 1 */
    lightLength: number;
    /** seconds for one lap of the light; under the pointer it runs at `seconds` above */
    seconds: number;
  };
};

/** the fractal that grows across the page behind the content, from the top-right corner, around every element with the class fractal-obstacle */
export type Fractal = {
  /** shown or not */
  on: boolean;
  /** what grows: "flowsnake" is the Gosper curve drawn outward from the top-right corner, broken where it would cross an obstacle; "branches" is a random branching growth that turns around obstacles */
  shape: "flowsnake" | "branches";
  /** colour of the lines */
  colour: Swatch;
  /** width of a line, in px */
  stroke: number;
  /** opacity of the whole layer, 0 to 1 */
  opacity: number;
  /** opacity of the whole layer on the light page, 0 to 1, when the colour needs more there to be seen; leave out for the same as `opacity` */
  lightOpacity?: number;
  /** how much the lines differ in opacity, 0 to 1: 0 all alike; 1 the faintest of them invisible */
  vary: number;
  /** how far the lines drift in opacity over time, 0 to 1: 0 still; 1 down to nothing and back */
  drift: number;
  /** about how long one drift down and back takes, in seconds; each layer of lines a little faster or slower */
  driftTime: number;
  /** the distance between two waves that sweep out from the top-right corner, showing the fractal as they pass and hiding it after, in px; 0 for no waves */
  wave: number;
  /** how long a wave takes to travel that distance, in seconds: higher is slower */
  waveTime: number;
  /** how much of the fractal stays between two waves, 0 to 1: 0 is nothing */
  waveLow: number;
  /** length of one segment, in px */
  step: number;
  /** how many segments grow each frame */
  speed: number;
  /** how long the lines of each frame take to fade in, in ms; 0 for none */
  fade: number;
  /** how unevenly it grows, 0 to 1: 0 is one even front from the corner; higher lets some lines out of the corner run ahead of others */
  chaos: number;
  /** the chance that a tip forks at each step, 0 to 1 */
  branch: number;
  /** how much a branch may bend at each step, in radians */
  bend: number;
  /** true: the fractal keeps clear of every element with the class fractal-obstacle; false: it runs behind them all */
  avoid: boolean;
  /** the space kept clear around an obstacle, in px */
  gap: number;
  /** how densely the page is filled: segments per million square px of page, so a long page fills as fully as a short one */
  density: number;
};

export type Motion = {
  /** sections rising in as they enter */
  rise: boolean;
  /** hover and colour transitions */
  transitions: boolean;
  focus: "ring" | "underline" | "none";
  banner: "bar" | "card";
  links: "underline" | "colour";
  /** every glow on the page slowly rising and falling; seconds per cycle */
  breathe: { on: boolean; seconds: number };
  /** full-height screens that snap one at a time, with a fixed scene behind them */
  screens: boolean;
  /** the button back to the top of the page: how far the page has scrolled, in px, before it shows */
  top: { after: number };
};

export type Theme = {
  colours: Colours;
  /** the case's other palettes by short name, when it has several; each is written into the sheet and chosen on the page */
  palettes?: Record<string, Colours>;
  /** the short name of the palette in use, when the case has several */
  palette?: string;
  /** the readable name of each palette, for a switch */
  paletteNames?: Record<string, string>;
  type: Type;
  text: Text;
  page: Page;
  topbar: TopBar;
  buttons: Buttons; 
  tabs: Tabs;
  sliders: Sliders;
  inputs: Inputs;
  panels: Panels;
  plots: Plots;
  figures: Figures;
  motion: Motion;
  fractal: Fractal;
};

export const defineColours = (c: Colours) => c;
export const defineType = (t: Type) => t;
export const defineText = (t: Text) => t;
export const definePage = (p: Page) => p;
export const defineTopBar = (t: TopBar) => t;
export const defineButtons = (b: Buttons) => b;
export const defineTabs = (t: Tabs) => t;
export const defineSliders = (s: Sliders) => s;
export const defineInputs = (i: Inputs) => i;
export const definePanels = (p: Panels) => p;
export const definePlots = (p: Plots) => p;
export const defineFigures = (f: Figures) => f;
export const defineMotion = (m: Motion) => m;
export const defineFractal = (f: Fractal) => f;
export const defineTheme = (t: Theme) => t;
