/**
 * a theme is every value the site's look is built from, in one object. the
 * product ships with exactly one, written into the stylesheet's tokens by the
 * ship script; nothing in the product reads a theme at run time. the builder
 * page, which exists only in development, edits one live and saves versions
 * as files.
 */

export type Colours = {
  ground: string;
  ink: string;
  muted: string;
  edge: string;
  leaf: string;
  sky: string;
  violet: string;
  rose: string;
  warn: string;
};

export type Theme = {
  name: string;
  /** "dark" or "light": what the browser is told, for form controls and scrollbars */
  scheme: "dark" | "light";
  colours: Colours;
  fonts: { body: string; mono: string };
  /** a multiplier on every size on the page, 1 is as designed */
  scale: number;
  /** line height of running text */
  leading: number;
  /** letter spacing of running text, in em */
  tracking: number;
  /** corner radius of panels and buttons, in px */
  corner: number;
  /** width of every border, in px */
  edge: number;
  /** a multiplier on every gap and padding, 1 is as designed */
  density: number;
  /** the rise-and-fade of sections as they enter */
  motion: boolean;
};

export const COLOUR_NAMES = ["ground", "ink", "muted", "edge", "leaf", "sky", "violet", "rose", "warn"] as const;

export const COLOUR_ROLES: Record<keyof Colours, string> = {
  ground: "The page behind everything",
  ink: "Text and lines",
  muted: "Secondary text and labels",
  edge: "Borders and grid lines",
  leaf: "The accent: headings, the run button, the first plot series",
  sky: "Section labels, rings, the second plot series",
  violet: "A third plot series",
  rose: "The second class of dots, the fourth plot series",
  warn: "Warnings and a run that blew up",
};

/** the site as designed: the values in styles.css today. */
export const DEFAULT: Theme = {
  name: "default",
  scheme: "dark",
  colours: {
    ground: "#0e1116",
    ink: "#e8e8ea",
    muted: "#7c828c",
    edge: "#23262c",
    leaf: "#a5e3a0",
    sky: "#8fd3e8",
    violet: "#b49be8",
    rose: "#c75ab0",
    warn: "#ff6b6b",
  },
  fonts: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
  },
  scale: 1,
  leading: 1.5,
  tracking: 0,
  corner: 4,
  edge: 1,
  density: 1,
  motion: true,
};

/** font stacks worth trying, all of them installed on the reader's machine rather than fetched. */
export const FONT_STACKS: { label: string; body?: string; mono?: string }[] = [
  { label: "System sans", body: DEFAULT.fonts.body },
  { label: "Humanist sans", body: 'Seravek, "Gill Sans Nova", Ubuntu, Calibri, "DejaVu Sans", source-sans-pro, sans-serif' },
  { label: "Geometric sans", body: 'Avenir, Montserrat, Corbel, "URW Gothic", source-sans-pro, sans-serif' },
  { label: "Old-style serif", body: '"Iowan Old Style", "Palatino Linotype", "URW Palladio L", P052, serif' },
  { label: "Transitional serif", body: 'Charter, "Bitstream Charter", "Sitka Text", Cambria, serif' },
  { label: "Slab serif", body: 'Rockwell, "Rockwell Nova", "Roboto Slab", "DejaVu Serif", "Sitka Small", serif' },
  { label: "Didone serif", body: 'Didot, "Bodoni MT", "Noto Serif Display", "URW Palladio L", P052, Sylfaen, serif' },
  { label: "System mono", mono: DEFAULT.fonts.mono },
  { label: "Classic mono", mono: '"Courier New", Courier, "Nimbus Mono PS", monospace' },
  { label: "Humanist mono", mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Source Code Pro", monospace' },
];

/** what a theme sets on the root element. every key is a css custom property the stylesheet reads. */
export function variables(t: Theme): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of COLOUR_NAMES) out[`--color-${k}`] = t.colours[k];
  out["--font-body"] = t.fonts.body;
  out["--font-mono"] = t.fonts.mono;
  out["--type-scale"] = String(t.scale);
  out["--leading"] = String(t.leading);
  out["--tracking"] = `${t.tracking}em`;
  out["--corner"] = `${t.corner}px`;
  out["--edge-width"] = `${t.edge}px`;
  out["--spacing"] = `${0.25 * t.density}rem`;
  return out;
}

/** the two blocks of the stylesheet a theme owns, as text. this is what shipping writes. */
export function tokensCss(t: Theme): { theme: string; root: string } {
  const colours = COLOUR_NAMES.map((k) => `  --color-${k}: ${t.colours[k]};`).join("\n");
  const theme = `@theme {\n${colours}\n  --font-mono: ${t.fonts.mono};\n}`;
  const root = [
    ":root {",
    `  color-scheme: ${t.scheme};`,
    "  --accent: var(--color-leaf);",
    `  --font-body: ${t.fonts.body};`,
    `  --type-scale: ${t.scale};`,
    `  --leading: ${t.leading};`,
    `  --tracking: ${t.tracking}em;`,
    `  --corner: ${t.corner}px;`,
    `  --edge-width: ${t.edge}px;`,
    `  --spacing: ${0.25 * t.density}rem;`,
    `  --motion: ${t.motion ? 1 : 0};`,
    "}",
  ].join("\n");
  return { theme, root };
}

/** the stylesheet with its two token blocks replaced by a theme's. the rest of the file is untouched. */
export function shipInto(css: string, t: Theme): string {
  const blocks = tokensCss(t);
  const themed = css.replace(/@theme \{[^}]*\}/, blocks.theme);
  return themed.replace(/:root \{[^}]*\}/, blocks.root);
}

const HEX = /^#[0-9a-f]{6}$/i;

/** a saved theme's name is also its file name, so it is kept to letters, digits and hyphens. */
export function validName(name: unknown): name is string {
  return typeof name === "string" && /^[a-z0-9][a-z0-9-]{0,39}$/.test(name);
}

/** a theme read from a file or a request, checked field by field; null when anything is off. */
export function parseTheme(raw: unknown): Theme | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (!validName(r.name)) return null;
  if (r.scheme !== "dark" && r.scheme !== "light") return null;
  const c = r.colours as Record<string, unknown> | undefined;
  if (!c || typeof c !== "object") return null;
  const colours = {} as Colours;
  for (const k of COLOUR_NAMES) {
    if (typeof c[k] !== "string" || !HEX.test(c[k] as string)) return null;
    colours[k] = (c[k] as string).toLowerCase();
  }
  const f = r.fonts as Record<string, unknown> | undefined;
  if (!f || typeof f.body !== "string" || typeof f.mono !== "string") return null;
  if (f.body.length > 300 || f.mono.length > 300 || /[{};]/.test(f.body + f.mono)) return null;
  const num = (k: string, lo: number, hi: number) => {
    const v = r[k];
    return typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null;
  };
  const scale = num("scale", 0.5, 2);
  const leading = num("leading", 1, 2.4);
  const tracking = num("tracking", -0.1, 0.3);
  const corner = num("corner", 0, 40);
  const edge = num("edge", 0, 6);
  const density = num("density", 0.5, 2);
  if ([scale, leading, tracking, corner, edge, density].some((v) => v === null)) return null;
  if (typeof r.motion !== "boolean") return null;
  return {
    name: r.name,
    scheme: r.scheme,
    colours,
    fonts: { body: f.body, mono: f.mono },
    scale: scale as number,
    leading: leading as number,
    tracking: tracking as number,
    corner: corner as number,
    edge: edge as number,
    density: density as number,
    motion: r.motion,
  };
}
