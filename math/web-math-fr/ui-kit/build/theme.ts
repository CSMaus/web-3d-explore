/**
 * turns the config scripts into src/theme.css. run from ui-kit:
 *
 *   npm run theme
 *
 * the output is one stylesheet: the two palettes as custom properties, one
 * for each mode, chosen by data-mode on the html element; tailwind's theme
 * block so utilities can use them; one rule per text style; and one rule set
 * per element that writes the structural choices onto the elements' data-slot
 * attributes. every colour in an element rule is a variable, so switching the
 * mode switches the whole page without a second sheet.
 */
import { writeFileSync } from "node:fs";
import { CASE as KIT_CASE, theme } from "../config/index.ts";
import { TEXT_SLOTS, type Look, type Palette, type Swatch, type TextStyle, type Theme } from "../config/kinds.ts";

const px = (n: number) => `${n}px`;

/** a palette colour as the variable the sheet defines for it. */
const v = (tone: string) => `var(--c-${tone})`;

/** a swatch from the config as a css colour: a palette variable, a tint of one, a hex, or none. */
export function swatch(s: Swatch): string {
  if (s === "transparent") return "transparent";
  if (s.startsWith("#")) return s;
  const [tone, pct] = s.split("/");
  return pct ? `color-mix(in oklab, ${v(tone)} ${pct}%, transparent)` : v(tone);
}

/** a colour part way from one swatch to another, mixed by the browser so it follows the mode. */
export function mix(a: Swatch, b: Swatch, t: number): string {
  return `color-mix(in oklab, ${swatch(a)} ${Math.round((1 - t) * 100)}%, ${swatch(b)})`;
}

const CASE = { sentence: "none", upper: "uppercase", lower: "lowercase" } as const;

const FONT: Record<string, string> = { body: "var(--font-body)", heading: "var(--font-heading)", label: "var(--font-label)" };

function font(f: string) {
  return FONT[f] ?? f;
}

/** the declarations of one text style, with no selector. */
function styleRules(s: TextStyle, withColour = true): string {
  const lines = [
    `font-family: ${font(s.font)};`,
    `font-size: ${px(s.size)};`,
    `font-weight: ${s.weight};`,
    `line-height: ${s.leading};`,
    `letter-spacing: ${s.tracking}em;`,
    ...(s.words !== undefined ? [`word-spacing: ${s.words}em;`] : []),
    `text-transform: ${CASE[s.case]};`,
  ];
  if (withColour) lines.push(`color: ${swatch(s.colour)};`);
  if (s.background && s.background !== "transparent") lines.push(`background: ${swatch(s.background)};`);
  if (s.padding) lines.push(`padding: ${px(s.padding[0])} ${px(s.padding[1])};`);
  if (s.radius !== undefined) lines.push(`border-radius: ${px(s.radius)};`);
  return lines.join(" ");
}

/** the declarations of one button state. */
function look(l: Look): string {
  return `border-width: ${px(l.border)}; border-color: ${swatch(l.edge)}; background: ${swatch(l.fill)}; color: ${swatch(l.ink)};`;
}

/** where each named kind of text lives; a name not here becomes [data-text="name"]. */
const TEXT_WHERE: Record<string, string> = {
  display: `[data-slot="display"]`,
  lede: `[data-slot="lede"]`,
  body: `body`,
  heading1: `[data-slot="heading"][data-level="1"]`,
  heading2: `[data-slot="heading"][data-level="2"]`,
  heading3: `[data-slot="heading"][data-level="3"]`,
  label: `[data-slot="label"]`,
  tag: `[data-slot="tag"]`,
  caption: `[data-slot="caption"]`,
  verdict: `[data-slot="verdict"]`,
  readout: `[data-slot="readout"]`,
  readoutValue: `[data-slot="readout"] > dd`,
  brand: `[data-slot="topbar-brand"]`,
  nav: `[data-slot="topbar-link"]`,
  button: `[data-slot="button"], [data-slot="toggle-group-item"], [data-slot="tabs-trigger"]`,
  search: `[data-slot="search-button"]`,
  key: `[data-slot="key"]`,
  panelHead: `[data-slot="panel-head"]`,
  strip: `[data-slot="strip"]`,
  field: `[data-slot="field-name"]`,
  fieldValue: `[data-slot="field-value"]`,
  banner: `[data-slot="banner"]`,
  skip: `[data-slot="skip"]`,
  counter: `[data-slot="counter"]`,
  share: `[data-slot="share"]`,
  cardTitle: `[data-slot="icon-card-title"]`,
  cardText: `[data-slot="icon-card-text"]`,
};

/** one variable per palette colour; the optional ones fall back as kinds.ts says */
function paletteVars(p: Palette): string {
  const chart = [...p.chart, p.primary, p.secondary, p.destructive].slice(0, 5);
  return `  --c-background: ${p.background};
  --c-card: ${p.card};
  --c-foreground: ${p.foreground};
  --c-muted-foreground: ${p["muted-foreground"]};
  --c-border: ${p.border};
  --c-primary: ${p.primary};
  --c-secondary: ${p.secondary};
  --c-destructive: ${p.destructive};
  --c-selected: ${p.selected ?? p.primary};
  --c-glow: ${p.glow ?? p.primary};
  --c-value: ${p.value ?? p.primary};
  --c-primary-foreground: ${p["primary-foreground"] ?? p.background};
  --c-card-foreground: ${p["card-foreground"] ?? p.foreground};
  --c-link: ${p.link ?? p.primary};
  --c-success: ${p.success ?? p.primary};
  --c-input: ${p.input ?? "transparent"};
  --c-ring: ${p.ring ?? p.primary};
${chart.map((x, i) => `  --c-chart-${i + 1}: ${x};`).join("\n")}`;
}

function tokens(t: Theme): string {
  const c = t.colours;
  const s = t.text.styles;
  const radius = { square: 0, rounded: t.panels.corner, pill: 999, underline: 0 }[t.buttons.shape];
  return `:root {
  color-scheme: ${c.default};
${paletteVars(c[c.default])}
}

html[data-mode="light"] {
  color-scheme: light;
${paletteVars(c.light)}
}

html[data-mode="dark"] {
  color-scheme: dark;
${paletteVars(c.dark)}
}
${Object.entries(t.palettes ?? {})
  .map(
    ([name, p]) => `
html[data-palette="${name}"] {
  color-scheme: ${p.default};
${paletteVars(p[p.default])}
}

html[data-palette="${name}"][data-mode="light"] {
  color-scheme: light;
${paletteVars(p.light)}
}

html[data-palette="${name}"][data-mode="dark"] {
  color-scheme: dark;
${paletteVars(p.dark)}
}`,
  )
  .join("\n")}

:root {
  /* shadcn's names, so every component from its registry follows the theme */
  --background: ${v("background")};
  --foreground: ${v("foreground")};
  --card: ${v("card")};
  --card-foreground: ${v("card-foreground")};
  --popover: ${v("card")};
  --popover-foreground: ${v("card-foreground")};
  --primary: ${v("primary")};
  --primary-foreground: ${v("primary-foreground")};
  --secondary: ${v("secondary")};
  --secondary-foreground: ${v("foreground")};
  --muted: ${v("border")};
  --muted-foreground: ${v("muted-foreground")};
  --accent: ${mix("background", "secondary", 0.16)};
  --accent-foreground: ${v("foreground")};
  --destructive: ${v("destructive")};
  --border: ${v("border")};
  --input: ${v("border")};
  --ring: ${v("ring")};
  --chart-1: ${v("chart-1")};
  --chart-2: ${v("chart-2")};
  --chart-3: ${v("chart-3")};
  --chart-4: ${v("chart-4")};
  --chart-5: ${v("chart-5")};
  --radius: ${px(t.panels.corner)};

  /* the kit's own names */
  --page-width: ${px(t.page.width)};
  --page-gutter: ${px(t.page.gutter)};
  --spacing: ${0.25 * t.page.density}rem;
  --text-size: ${px(s.body.size)};
  --label-size: ${px(s.label.size)};
  --leading: ${s.body.leading};
  --weight-body: ${s.body.weight};
  --weight-heading: ${s.heading1.weight};
  --weight-label: ${s.label.weight};
  --tracking-body: ${s.body.tracking}em;
  --tracking-heading: ${s.heading1.tracking}em;
  --tracking-label: ${s.label.tracking}em;
  --heading-case: ${CASE[s.heading1.case]};
  --label-case: ${CASE[s.label.case]};
  --topbar-height: ${px(t.topbar.height)};
  --display-size: ${px(s.display.size)};
  --display-weight: ${s.display.weight};
  --display-tracking: ${s.display.tracking}em;
  --button-radius: ${px(radius)};
  --button-border: ${px(t.buttons.plain.rest.border)};
  --button-py: ${px(t.buttons.padding[0])};
  --button-px: ${px(t.buttons.padding[1])};
  --button-sm-py: ${px(t.buttons.compact[0])};
  --button-sm-px: ${px(t.buttons.compact[1])};
  --button-weight: ${s.button.weight};
  --button-case: ${CASE[s.button.case]};
  --button-tracking: ${s.button.tracking}em;
  --tab-gap: ${px(t.tabs.gap)};
  --slider-track: ${px(t.sliders.track)};
  --slider-thumb: ${px(t.sliders.thumbSize)};
  --input-height: ${px(t.inputs.height)};
  --input-border: ${px(t.inputs.border)};
  --panel-padding: ${px(t.panels.padding)};
  --panel-corner: ${px(t.panels.corner)};
  --panel-border: ${px(t.panels.border)};
  --plot-grid: ${px(t.plots.grid ? t.plots.gridWeight : 0)};
  --plot-axis: ${px(t.plots.axisWeight)};
  --plot-line: ${px(t.plots.lineWeight)};
  --plot-dot: ${px(t.plots.dotSize)};
  --verdict-size: ${px(s.verdict.size)};
  --caption-size: ${px(s.caption.size)};
  --figure-stroke: ${px(t.figures.stroke)};
  --figure-seconds: ${t.figures.seconds}s;
  --breathe-seconds: ${t.motion.breathe.seconds}s;
}

@theme inline {
  /* the palette colours the registry has no name for; the rest are the registry's own names above */
  --color-selected: ${v("selected")};
  --color-glow: ${v("glow")};
  --color-value: ${v("value")};
  --color-link: ${v("link")};
  --color-success: ${v("success")};
  --font-body: ${t.type.fonts.body};
  --font-heading: ${t.type.fonts.heading};
  --font-label: ${t.type.fonts.label};
  --font-mono: ${t.type.fonts.label};
}`;
}

/** one rule per kind of text. the button's colours come from its states, so its style carries none. */
function text(t: Theme): string {
  const out: string[] = [];
  for (const [name, style] of Object.entries(t.text.styles)) {
    const where = (TEXT_WHERE[name] ? `${TEXT_WHERE[name]}, ` : "") + `[data-text="${name}"]`;
    out.push(`${where} { ${styleRules(style, name !== "button")} }`);
  }
  const custom = Object.keys(t.text.styles).filter((k) => !(TEXT_SLOTS as readonly string[]).includes(k));
  if (custom.length) out.push(custom.map((k) => `span[data-text="${k}"]`).join(", ") + " { display: inline-block; }");
  return "\n" + out.join("\n");
}

function page(t: Theme): string {
  const backgrounds = {
    plain: "none",
    gradient: `linear-gradient(180deg, ${mix("background", "foreground", 0.06)} 0%, ${v("background")} 55%, ${mix("background", "foreground", 0.03)} 100%)`,
    grain: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
    grid: `linear-gradient(${mix("background", "border", 0.6)} 1px, transparent 1px), linear-gradient(90deg, ${mix("background", "border", 0.6)} 1px, transparent 1px)`,
    vignette: `radial-gradient(ellipse at 50% 0%, ${mix("background", "foreground", 0.05)} 0%, ${v("background")} 70%)`,
    // each patch fades to nothing inside its own tile (centre plus or minus seven tenths of its half-height stays within the tile), so the tiles meet with no edge
    waves: [
      `radial-gradient(ellipse 70% 42% at 18% 32%, ${mix("background", "foreground", 0.09)} 0%, transparent 70%)`,
      `radial-gradient(ellipse 55% 38% at 82% 58%, ${v("card")} 0%, transparent 70%)`,
      `radial-gradient(ellipse 80% 30% at 40% 74%, ${mix("background", "foreground", 0.06)} 0%, transparent 70%)`,
      `radial-gradient(ellipse 50% 45% at 70% 36%, ${mix("background", "card", 0.8)} 0%, transparent 70%)`,
    ].join(", "),
  };
  const repeat = { plain: "no-repeat", gradient: "no-repeat", grain: "repeat", grid: "repeat", vignette: "no-repeat", waves: "repeat-y" }[t.page.background];
  const size = { plain: "", gradient: "", grain: "", grid: "background-size: 32px 32px;", vignette: "", waves: "background-size: 100% 1500px, 100% 2100px, 100% 1800px, 100% 2600px;" }[t.page.background];
  return `
html {
  min-height: 100%;
  background: ${v("background")};
}

body {
  min-height: 100%;
  background-color: ${v("background")};
  background-image: ${backgrounds[t.page.background]};
  background-repeat: ${repeat};
  ${size}
}

[data-slot="page"] {
  max-width: var(--page-width);
  margin-inline: auto;
  padding-inline: var(--page-gutter);
}

[data-slot="heading"] {
  ${t.type.headingMark === "rule" ? `border-bottom: 1px solid ${v("border")}; padding-bottom: 0.35em;` : ""}
  ${t.type.headingMark === "bar" ? `border-left: 3px solid ${v("primary")}; padding-left: 0.6em;` : ""}
}
${t.type.headingMark === "number" ? `[data-slot="heading"]::before { content: counter(heading, decimal-leading-zero) "  "; counter-increment: heading; color: ${v("muted-foreground")}; }\nbody { counter-reset: heading; }` : ""}
[data-slot="heading"][data-tone="destructive"] { color: ${v("destructive")}; }

[data-slot="label"] {
  ${t.type.labelStyle === "hidden" ? "display: none;" : ""}
}
${t.type.labelStyle === "dot" ? `[data-slot="label"]::before { content: ""; display: inline-block; width: 0.5em; height: 0.5em; border-radius: 50%; background: ${v("primary")}; margin-right: 0.6em; vertical-align: middle; }` : ""}`;
}

function topbar(t: Theme): string {
  const styles = {
    hairline: `border-bottom: 1px solid ${v("border")}; background: color-mix(in oklab, ${v("background")} 70%, transparent); backdrop-filter: blur(12px);`,
    solid: `background: ${v("card")}; border-bottom: 1px solid ${v("border")};`,
    floating: `margin: 12px auto 0; width: min(var(--page-width), calc(100% - 2 * var(--page-gutter))); border: 1px solid ${v("border")}; border-radius: 999px; background: color-mix(in oklab, ${v("card")} 85%, transparent); backdrop-filter: blur(12px); box-shadow: 0 8px 30px rgba(0,0,0,0.25);`,
    none: "background: transparent; border: 0;",
  };
  const align = { left: "justify-content: flex-start; gap: 20px;", centre: "justify-content: center; gap: 20px;", split: "justify-content: space-between;" };
  const marker = {
    colour: `[data-slot="topbar-link"][data-active="true"] { color: ${v("glow")}; }`,
    underline: `[data-slot="topbar-link"][data-active="true"] { color: ${v("foreground")}; box-shadow: inset 0 -2px 0 ${v("glow")}; border-radius: 0; }`,
    dot: `[data-slot="topbar-link"] { position: relative; } [data-slot="topbar-link"][data-active="true"]::after { content: ""; position: absolute; left: 50%; bottom: -2px; width: 4px; height: 4px; margin-left: -2px; border-radius: 50%; background: ${v("glow")}; }`,
    glow: `[data-slot="topbar-link"] { position: relative; } [data-slot="topbar-link"][data-active="true"] { color: ${v("foreground")}; } [data-slot="topbar-link"][data-active="true"]::after { content: ""; position: absolute; left: 15%; right: 15%; bottom: calc((var(--topbar-height) - 100%) / -2 - 1px); height: 2px; border-radius: 2px; background: ${v("glow")}; box-shadow: 0 0 10px 2px ${v("glow")}, 0 0 24px 4px ${swatch("glow/50")}; animation: breathe var(--breathe-seconds) ease-in-out infinite; }`,
  };
  return `
[data-slot="topbar"] {
  position: fixed;
  inset-inline: 0;
  top: 0;
  z-index: 50;
  ${styles[t.topbar.style]}
}

[data-slot="topbar-inner"] {
  display: flex;
  align-items: center;
  height: var(--topbar-height);
  max-width: var(--page-width);
  margin-inline: auto;
  padding-inline: var(--page-gutter);
  ${align[t.topbar.align]}
}

[data-slot="topbar-brand"] {
  display: flex;
  align-items: center;
  gap: 10px;
  ${t.topbar.brand === "hidden" ? "visibility: hidden;" : ""}
}

[data-slot="brand-mark"] {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid ${v("border")};
  display: grid;
  place-items: center;
}

[data-slot="brand-mark"]::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${v("primary")};
}

[data-slot="topbar-links"] {
  display: flex;
  align-items: center;
  gap: 4px;
  ${t.topbar.align === "split" ? "flex: 1; justify-content: center;" : t.topbar.align === "left" ? "margin-left: 20px;" : ""}
}

[data-slot="topbar-actions"] {
  display: flex;
  align-items: center;
  gap: 12px;
  ${t.topbar.align === "left" ? "margin-left: auto;" : ""}
}

[data-slot="topbar-divider"] {
  width: 1px;
  height: 20px;
  background: ${v("border")};
  margin: 0 10px;
}

[data-slot="topbar-link"] {
  padding: 4px 12px;
  border-radius: var(--button-radius);
}

[data-slot="topbar-link"] {
  transition: color 0.25s ease, text-shadow 0.25s ease;
}

[data-slot="topbar-link"]:hover, [data-slot="topbar-link"][data-look="hover"] {
  color: ${mix("glow", "foreground", 0.15)};
  text-shadow:
    0 0 ${px(Math.round(t.buttons.glow.blur * 0.15))} ${v("glow")},
    0 0 ${px(Math.round(t.buttons.glow.blur * 0.6))} ${v("glow")},
    0 0 ${px(Math.round(t.buttons.glow.blur * 1.4))} ${swatch("glow/70")},
    0 0 ${px(Math.round(t.buttons.glow.blur * 2.8))} ${swatch("glow/40")};
}

${marker[t.topbar.marker]}

[data-slot="mode-switch"] {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 0;
  border-radius: var(--button-radius);
  background: transparent;
  color: ${v("muted-foreground")};
  font-family: var(--font-label);
  font-size: var(--label-size);
  cursor: pointer;
}

[data-slot="mode-switch"]:hover { color: ${v("foreground")}; }
[data-slot="mode-switch"] > span:first-child { width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid currentColor; box-shadow: inset -5px -5px 0 0 currentColor; }
html[data-mode="light"] [data-slot="mode-switch"] > span:first-child { box-shadow: inset 0 0 0 3px ${v("background")}, inset 0 0 0 8px currentColor; }`;
}

function buttons(t: Theme): string {
  const b = t.buttons;
  const primaryRadius = { square: "0", rounded: "var(--panel-corner)", pill: "999px", underline: "0" };
  const shape = (s: typeof b.shape) =>
    s === "underline" ? `border-top-width: 0; border-left-width: 0; border-right-width: 0; border-radius: 0; padding-inline: 2px;` : `border-radius: ${s === b.shape ? "var(--button-radius)" : primaryRadius[s]};`;
  const motion = {
    none: "",
    lift: `transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.25);`,
    brighten: `filter: brightness(1.08);`,
  }[b.motion];
  const plain = `[data-slot="button"][data-variant="outline"], [data-slot="button"][data-variant="secondary"], [data-slot="button"][data-variant="ghost"]`;
  const on = (base: string, suffix: string) => base.split(", ").map((x) => x + suffix).join(", ");
  const primary = `[data-slot="button"][data-variant="default"]`;
  const contour = (colour: string) =>
    `content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none; border: 1px solid ${colour}; box-shadow: 0 0 ${px(Math.round(b.glow.blur * 0.5))} 0 ${colour}, 0 0 ${px(b.glow.blur)} ${px(Math.round(b.glow.blur * 0.15))} ${mix(b.glow.colour, "transparent", 0.5)}, inset 0 0 ${px(Math.round(b.glow.blur * 0.4))} 0 ${mix(b.glow.colour, "transparent", 0.6)};`;
  const hoverGlow = b.glow.hover
    ? `
${plain} { position: relative; }
${on(plain, ":hover::after")}, ${on(plain, '[data-look="hover"]::after')} { ${contour(swatch(b.glow.colour))} }`
    : "";
  const lit = `${primary}:hover::after, ${primary}:active::after, ${primary}[data-look="hover"]::after, ${primary}[data-look="pressed"]::after, ${primary}[aria-pressed="true"]::after`;
  const glow = b.glow.on
    ? `
${primary} { position: relative; transition: text-shadow 0.25s ease; }
${b.glow.on === "hover" ? lit : `${primary}::after`} { ${contour(swatch(b.glow.colour))} }
${primary}:hover, ${primary}[data-look="hover"] { text-shadow: 0 0 ${px(Math.round(b.glow.blur * 0.3))} ${swatch(`${b.glow.colour}/70`)}, 0 0 ${px(Math.round(b.glow.blur * 0.9))} ${swatch(`${b.glow.colour}/40`)}; }`
    : "";
  return `
[data-slot="button"] {
  height: auto;
  padding: var(--button-py) var(--button-px);
  border-style: solid;
  box-shadow: none;
  ${shape(b.shape)}
}

${plain}, ${on(plain, '[data-look="rest"]')} { ${look(b.plain.rest)} }
${on(plain, ":hover")}, ${on(plain, '[data-look="hover"]')} { ${look(b.plain.hover)} ${motion} }
${b.glass.on ? `${plain}, ${on(plain, '[data-look="rest"]')}, ${on(plain, ":hover")}, ${on(plain, '[data-look="hover"]')} { ${frost(t)} }` : ""}
${on(plain, ":active")}, ${on(plain, '[aria-pressed="true"]')}, ${on(plain, '[data-look="pressed"]')} { ${look(b.plain.pressed)} transform: none; box-shadow: none; }
${b.glass.on && clearPressed(t) ? `${on(plain, ":active")}, ${on(plain, '[aria-pressed="true"]')}, ${on(plain, '[data-look="pressed"]')} { ${frost(t)} }` : ""}

${primary} {
  ${look(b.primary.rest)}
  ${b.primary.weight !== undefined ? `font-weight: ${b.primary.weight};` : ""}
  ${b.primary.shape ? shape(b.primary.shape) : ""}
}
${primary}:hover, ${primary}[data-look="hover"] { ${look(b.primary.hover)} ${motion} }
${primary}:active, ${primary}[aria-pressed="true"], ${primary}[data-look="pressed"] { ${look(b.primary.pressed)} transform: none; box-shadow: none; }
${glow}
${hoverGlow}

[data-slot="button"][data-variant="destructive"] {
  border-width: ${px(b.plain.rest.border)};
  border-color: ${v("destructive")};
  background: transparent;
  color: ${v("destructive")};
}

[data-slot="button"][data-variant="link"] {
  border: 0;
  padding-inline: 0;
  color: ${v("primary")};
}

[data-slot="button"][data-size="sm"] { padding: var(--button-sm-py) var(--button-sm-px); }

[data-slot="button"]:disabled {
  opacity: ${b.disabled};
}
${b.extraCss}`;
}

function tabs(t: Theme): string {
  const b = t.buttons;
  const items = [`[data-slot="toggle-group-item"]`, `[data-slot="tabs-trigger"]`];
  const on = (suffix: string) => items.map((i) => i + suffix).join(", ");
  const item = on("");
  const hover = on(":hover");
  const active = `${on('[data-state="on"]')}, ${on('[data-state="active"]')}, ${on('[aria-pressed="true"]')}`;
  const styles = {
    chips: `
[data-slot="toggle-group"], [data-slot="tabs-list"] { display: flex; flex-wrap: wrap; gap: var(--tab-gap); background: transparent; border: 0; padding: 0; height: auto; }
${item} { ${look(b.plain.rest)} border-style: solid; border-radius: var(--button-radius); padding: var(--button-py) var(--button-px); box-shadow: none; }
${hover} { ${look(b.plain.hover)} }
${active} { ${look(b.plain.pressed)} box-shadow: none; }
${b.glass.on ? `${item}, ${hover}${clearPressed(t) ? `, ${active}` : ""} { ${frost(t)} }` : ""}`,
    segmented: `
[data-slot="toggle-group"], [data-slot="tabs-list"] { display: inline-flex; gap: 0; border: ${px(Math.max(b.plain.rest.border, 1))} solid ${v("border")}; border-radius: var(--button-radius); padding: 2px; background: transparent; height: auto; }
${item} { background: transparent; border: 0; border-radius: calc(var(--button-radius) - 2px); color: ${swatch(b.plain.rest.ink)}; padding: var(--button-py) var(--button-px); }
${hover} { color: ${swatch(b.plain.hover.ink)}; }
${active} { background: ${mix("background", "foreground", 0.1)}; color: ${v("foreground")}; box-shadow: none; }`,
    underline: `
[data-slot="toggle-group"], [data-slot="tabs-list"] { display: flex; gap: calc(var(--tab-gap) * 2); border: 0; border-bottom: 1px solid ${v("border")}; border-radius: 0; padding: 0; background: transparent; height: auto; }
${item} { background: transparent; border: 0; border-bottom: 2px solid transparent; border-radius: 0; margin-bottom: -1px; color: ${swatch(b.plain.rest.ink)}; padding: var(--button-py) 2px; }
${hover} { color: ${swatch(b.plain.hover.ink)}; }
${active} { border-bottom-color: ${v("selected")}; color: ${v("foreground")}; background: transparent; box-shadow: none; }`,
    links: `
[data-slot="toggle-group"], [data-slot="tabs-list"] { display: flex; flex-wrap: wrap; gap: calc(var(--tab-gap) * 2); border: 0; padding: 0; background: transparent; height: auto; }
[data-slot="toggle-group"] { gap: var(--tab-gap) calc(var(--tab-gap) * 1.4); }
${item} { background: transparent; border: 0; border-radius: 0; color: ${swatch(b.plain.rest.ink)}; padding: 2px 0; }
${hover} { color: ${swatch(b.plain.hover.ink)}; }
${active} { color: ${v("selected")}; background: transparent; box-shadow: none; text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1.5px; }`,
  };
  return `
${item} {
  height: auto;
}
${styles[t.tabs.style]}
[data-text="tab"][aria-current="page"] { color: ${v("selected")}; border-color: ${v("selected")}; }
[data-text="crumb"]:hover { color: ${v("foreground")}; }
${t.tabs.extraCss}`;
}

function sliders(t: Theme): string {
  const s = t.sliders;
  const thumb = {
    round: `width: var(--slider-thumb); height: var(--slider-thumb); border-radius: 50%;`,
    square: `width: var(--slider-thumb); height: var(--slider-thumb); border-radius: 2px;`,
    bar: `width: 4px; height: calc(var(--slider-thumb) * 1.4); border-radius: 2px;`,
  };
  return `
[data-slot="slider-track"] {
  height: var(--slider-track);
  background: ${v("border")};
  border-radius: 999px;
}

[data-slot="slider-range"] {
  background: ${s.filled ? swatch(s.colour) : "transparent"};
}

[data-slot="slider-thumb"] {
  ${thumb[s.thumb]}
  background: ${swatch(s.colour)};
  border: 0;
  box-shadow: none;
}

[data-slot="slider-thumb"]:focus-visible {
  outline: 2px solid ${swatch(s.colour)};
  outline-offset: 2px;
}

[data-slot="field"] {
  display: grid;
  align-items: center;
  gap: 8px;
  ${s.value === "above" ? "grid-template-columns: 1fr; grid-template-areas: 'head' 'control';" : s.value === "inline" ? "grid-template-columns: auto 1fr; grid-template-areas: 'head control';" : "grid-template-columns: 86px minmax(0, 1fr) minmax(60px, auto); grid-template-areas: 'name control value';"}
}

[data-slot="field-name"] { grid-area: ${s.value === "right" ? "name" : "head"}; }
[data-slot="field-value"] { grid-area: ${s.value === "right" ? "value" : "head"}; ${s.value === "right" ? "" : "justify-self: end;"} text-align: right; }
[data-slot="field-control"] { grid-area: control; }
${s.extraCss}`;
}

function inputs(t: Theme): string {
  const styles = {
    box: `border: var(--input-border) solid ${v("border")}; border-radius: var(--button-radius); background: ${v("input")};`,
    underline: `border: 0; border-bottom: var(--input-border) solid ${v("border")}; border-radius: 0; background: ${v("input")}; padding-inline: 2px;`,
    filled: `border: 0; border-radius: var(--button-radius); background: ${mix("background", "foreground", 0.08)};`,
  };
  return `
[data-slot="input"] {
  height: var(--input-height);
  font-family: var(--font-label);
  font-size: calc(var(--label-size) + 1px);
  color: ${v("foreground")};
  box-shadow: none;
  ${styles[t.inputs.style]}
}

textarea[data-slot="input"] { height: auto; resize: vertical; }

[data-slot="input"]:focus-visible {
  border-color: ${v("primary")};
  box-shadow: none;
}
${t.inputs.extraCss}`;
}

function panels(t: Theme): string {
  const p = t.panels;
  const styles = {
    bordered: `border: var(--panel-border) solid ${v("border")}; background: ${v("card")}; box-shadow: none;`,
    flat: `border: 0; background: ${mix("background", "foreground", 0.035)}; box-shadow: none;`,
    raised: `border: 0; background: ${v("card")}; box-shadow: 0 10px 30px rgba(0,0,0,0.35), 0 1px 0 ${mix("background", "foreground", 0.08)} inset;`,
    inset: `border: 0; background: ${mix("background", "#000000", 0.25)}; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);`,
    rules: `border: 0; border-top: var(--panel-border) solid ${v("border")}; border-radius: 0; background: transparent; box-shadow: none;`,
    glass: `border: var(--panel-border) solid ${mix("background", "foreground", 0.16)}; background: color-mix(in oklab, ${v("card")} 55%, transparent); backdrop-filter: blur(18px); box-shadow: inset 0 1px 0 ${mix("background", "foreground", 0.3)}, 0 20px 50px rgba(0,0,0,0.12);`,
  };
  const heading = {
    inside: "",
    "on-border": `[data-slot="panel"] { position: relative; margin-top: 0.6em; } [data-slot="panel"] > [data-slot="label"] { position: absolute; top: -0.6em; left: calc(var(--panel-padding) - 6px); padding: 0 6px; background: ${p.style === "flat" ? mix("background", "foreground", 0.035) : v("card")}; }`,
    above: `[data-slot="panel"] { position: relative; margin-top: calc(var(--label-size) + 12px); } [data-slot="panel"] > [data-slot="label"] { position: absolute; left: 0; top: calc(-1 * var(--label-size) - 10px); }`,
  };
  return `
[data-slot="panel"], [data-slot="card"] {
  padding: var(--panel-padding);
  border-radius: var(--panel-corner);
  gap: 0;
  ${styles[p.style]}
}

[data-slot="card-header"], [data-slot="card-content"], [data-slot="card-footer"] {
  padding: 0;
}

[data-slot="panel"] > [data-slot="label"] + * {
  margin-top: 12px;
}

[data-slot="panel"][data-tone="primary"] {
  border-color: color-mix(in oklab, ${v("primary")} 40%, transparent);
}

[data-slot="panel"][data-tone="muted"] > [data-slot="label"] {
  color: ${v("muted-foreground")};
}

[data-slot="icon-card"] {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: var(--panel-padding);
  border-radius: var(--panel-corner);
  border: var(--panel-border) solid ${mix("background", "foreground", 0.18)};
  background: transparent;
}

[data-slot="icon-card-figure"] {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  padding: 10%;
}

[data-slot="icon-card-title"], [data-slot="icon-card-text"] { margin: 0; }
${heading[p.heading]}
${p.extraCss}`;
}

function plots(t: Theme): string {
  const background = { card: v("card"), background: v("background"), sunk: mix("background", "#000000", 0.3) };
  return `
[data-slot="figure"] {
  display: flex;
  flex-direction: ${t.plots.caption === "above" ? "column-reverse" : "column"};
}

[data-slot="plot"] {
  background: ${background[t.plots.background]};
  border: var(--panel-border) solid ${v("border")};
  border-radius: var(--panel-corner);
  overflow: hidden;
  /* the drawing keeps clear of the rounded corners: 0.3 of the radius is how far a corner's
     curve reaches in, so nothing drawn at the plot's edge is cut */
  padding: calc(var(--panel-corner) * 0.3);
}

[data-slot="caption"] {
  padding: 4px 4px 0;
  margin: 0;
}
${t.plots.extraCss}`;
}

function figures(t: Theme): string {
  const f = t.figures;
  const relief = f.relief
    ? `
[data-slot="edge-figure"] .edge-high { stroke: ${mix("background", "#ffffff", 0.55)}; stroke-width: var(--figure-stroke); transform: translate(-1px, -1px); }
[data-slot="edge-figure"] .edge-low { stroke: ${mix("background", "#000000", 0.35)}; stroke-width: var(--figure-stroke); transform: translate(1px, 1px); }`
    : `
[data-slot="edge-figure"] .edge-high, [data-slot="edge-figure"] .edge-low { display: none; }`;
  return `
[data-slot="edge-figure"] {
  width: 100%;
  height: 100%;
  overflow: visible;
}

[data-slot="edge-figure"] path {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

[data-slot="edge-figure"] .edge-base {
  stroke: ${swatch(f.edge)};
  stroke-width: var(--figure-stroke);
}
${relief}

/* the light: a short bright core, a longer tail fading behind it, and a wide faint halo, all
   on the same path and moving together; no blur filter, so it costs nothing per frame */
[data-slot="edge-figure"] .edge-core, [data-slot="edge-figure"] .edge-tail, [data-slot="edge-figure"] .edge-halo {
  stroke: ${swatch(f.light)};
  stroke-dashoffset: 0;
  animation: travel var(--figure-seconds) linear infinite${f.breathe && t.motion.breathe.on ? ", breathe var(--breathe-seconds) ease-in-out infinite" : ""};
}

[data-slot="edge-figure"] .edge-core {
  stroke-width: calc(var(--figure-stroke) * 0.8);
  stroke-dasharray: ${(f.lightLength * 0.35).toFixed(4)} ${(1 - f.lightLength * 0.35).toFixed(4)};
}

[data-slot="edge-figure"] .edge-tail {
  stroke-width: calc(var(--figure-stroke) * 1.3);
  stroke-dasharray: ${f.lightLength.toFixed(4)} ${(1 - f.lightLength).toFixed(4)};
  stroke-opacity: 0.45;
}

[data-slot="edge-figure"] .edge-halo {
  stroke-width: calc(var(--figure-stroke) + ${px(f.glow * 2)});
  stroke-dasharray: ${(f.lightLength * 0.6).toFixed(4)} ${(1 - f.lightLength * 0.6).toFixed(4)};
  stroke-opacity: ${f.glow > 0 ? 0.22 : 0};
}

${tileLight(f)}

@keyframes travel {
  to { stroke-dashoffset: -1; }
}`;
}

/**
 * the walking light of the tile drawings ([data-kind="line"]) and of the large turning figures
 * ([data-solid]): a longer stretch than on the other figures, going round slowly
 */
function tileLight(f: Theme["figures"]): string {
  const walk = (sel: string, { lightLength: l, seconds }: { lightLength: number; seconds: number }) => {
    const dash = (k: number) => `${(l * k).toFixed(4)} ${(1 - l * k).toFixed(4)}`;
    return `
[data-slot="edge-figure"]${sel} :is(.edge-core, .edge-tail, .edge-halo) { animation-duration: calc(${seconds}s * var(--walk-scale, 1)), var(--breathe-seconds); }
[data-slot="edge-figure"]${sel} .edge-core { stroke-dasharray: ${dash(0.5)}; }
[data-slot="edge-figure"]${sel} .edge-tail { stroke-dasharray: ${dash(1)}; stroke-opacity: 0.8; }
[data-slot="edge-figure"]${sel} .edge-halo { stroke-dasharray: ${dash(0.6)}; }`;
  };
  return walk('[data-kind="line"]', f.tile ?? { lightLength: 0.28, seconds: 12 }) + walk("[data-solid]", f.solid ?? { lightLength: 0.35, seconds: 16 });
}

function readouts(t: Theme): string {
  return `
[data-slot="verdict"] { margin: 0; min-height: 3lh; }
[data-slot="field-value"], [data-slot="readout"] > dd, [data-slot="caption"], [data-text="caption"], [data-slot="counter"] { font-variant-numeric: tabular-nums; }
[data-slot="field-value"] { white-space: nowrap; }
[data-slot="verdict"][data-good="true"] { color: ${v("success")}; }
[data-slot="verdict"][data-good="false"] { color: ${v("destructive")}; }

[data-slot="readout"] {
  display: grid;
  grid-template-columns: ${t.text.numbers === "inline" ? "auto auto" : "minmax(0, 1fr) minmax(0, 1fr)"};
  ${t.text.numbers === "inline" ? "justify-content: start;" : ""}
  column-gap: ${t.text.readout === "table" ? "0" : "16px"};
  row-gap: ${t.text.readout === "table" ? "0" : "4px"};
  margin: 0;
}

[data-slot="readout"] > dt, [data-slot="readout"] > dd {
  margin: 0;
  ${t.text.readout === "table" ? `padding: 5px 0; border-bottom: 1px solid ${v("border")};` : ""}
}

[data-slot="readout"] > dt {
  ${t.text.readout === "table" ? "padding-right: 16px;" : ""}
}

[data-slot="readout"] > dd {
  text-align: ${t.text.numbers === "inline" ? "left" : "right"};
}`;
}

function pieces(t: Theme): string {
  const b = t.buttons;
  return `
[data-slot="display"] { margin: 0; }
[data-slot="lede"] { margin: 0; }
[data-slot="tag"] { color: var(--tag-colour, ${swatch(t.text.styles.tag.colour)}); }

[data-slot="search-button"] {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  height: var(--input-height);
  padding: 0 14px;
  border: ${px(b.plain.rest.border)} solid ${swatch(b.plain.rest.edge)};
  border-radius: var(--button-radius);
  background: ${swatch(b.plain.rest.fill)};
  cursor: pointer;
}

[data-slot="search-button"]:hover {
  border-color: ${swatch(b.plain.hover.edge)};
  background: ${swatch(b.plain.hover.fill)};
  color: ${swatch(b.plain.hover.ink)};
}

[data-slot="key"] {
  border: 1px solid ${v("border")};
  border-radius: 4px;
  padding: 1px 5px;
}

[data-slot="language"] {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${v("muted-foreground")};
  font-family: var(--font-label);
  font-size: var(--label-size);
}

[data-slot="language"] > select {
  appearance: none;
  background: transparent;
  border: 0;
  color: inherit;
  font: inherit;
  padding: 4px 2px;
  cursor: pointer;
}

[data-slot="panel-head"] {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  margin-bottom: 14px;
  border-bottom: 1px solid ${v("border")};
}

[data-slot="panel-head"]::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${v("primary")};
}

[data-slot="panel-head"] > [data-slot="meta"] {
  margin-left: auto;
  color: ${v("muted-foreground")};
}

[data-slot="strip"] {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 0;
  border-top: 1px solid ${v("border")};
}

[data-slot="strip"] a {
  color: ${v("foreground")};
}

[data-slot="skip"] {
  position: absolute;
  left: 12px;
  top: -60px;
  z-index: 100;
}

[data-slot="skip"]:focus {
  top: 12px;
}

[data-slot="counter"] { margin: 0; }

[data-slot="share"] {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  padding: 4px 0;
  cursor: pointer;
}

[data-slot="share"]:hover { color: ${v("foreground")}; }

[data-slot="scroll-hint"] {
  display: inline-block;
  width: 18px;
  height: 28px;
  border: 1.5px solid ${v("foreground")};
  border-radius: 10px;
  position: relative;
  opacity: 0.8;
}

[data-slot="scroll-hint"]::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 6px;
  width: 3px;
  height: 6px;
  margin-left: -1.5px;
  border-radius: 2px;
  background: ${v("foreground")};
  animation: hint 1.8s ease-in-out infinite;
}

@keyframes hint {
  0%, 100% { transform: translateY(0); opacity: 1; }
  60% { transform: translateY(9px); opacity: 0.2; }
}

[data-slot="furniture"] {
  position: absolute;
  inset-inline: 0;
  bottom: 18px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  padding-inline: var(--page-gutter);
  pointer-events: none;
}

[data-slot="furniture"] > * { pointer-events: auto; }`;
}

/**
 * the front page hero as a stage that fits the first screen: the picture large at the
 * right, from under the bar to above the small controls, whole and up to the screen's
 * right edge; the words low at the left, kept clear of it; small controls at the lower
 * right. the title scales with the screen's width and height both, so the words fit a
 * short laptop screen. the title of two parts shows its second part in the muted
 * colour. as the first screen scrolls away the picture draws back and dims. on a
 * narrow screen the picture stands above the words.
 *
 * the same piece at the size of a page ("page") heads the pages of lists: the title
 * and the lede at the top, no picture behind, nothing filling the screen.
 *
 * a band is a section the width of the screen, its content in the page's column; the
 * second tone has the card colour, so bands in turn read as separate scenes. the colour
 * reaches the screen's edges through the border image, which leaves the layout alone;
 * pulling the band out with negative margins stopped the browser painting it. the
 * band's heading is set in the display style, smaller.
 */
function hero(t: Theme): string {
  const display = t.text.styles.display;
  const bar = t.topbar.height;
  return `
html, body { overflow-x: clip; }
[data-slot="hero"] { --hero-foot: clamp(28px, 7svh, 72px); position: relative; isolation: isolate; display: flex; flex-direction: column; justify-content: flex-end; min-height: calc(100svh - 8rem); padding-bottom: var(--hero-foot); }
[data-slot="hero-picture"] { position: absolute; z-index: -1; top: calc(${px(bar)} - 8rem + 12px); bottom: calc(var(--hero-foot) + 44px); right: calc(50% - 50vw); width: min(54vw, 980px); }
[data-slot="hero-text"] { position: relative; max-width: min(820px, 60%); }
[data-slot="hero"] [data-slot="display"] { font-size: clamp(40px, min(7vw, 11.5svh), ${px(display.size)}); text-wrap: balance; }
[data-slot="hero"] [data-slot="display"] > :last-child:not(:first-child) { color: ${v("muted-foreground")}; }
[data-slot="hero"] [data-slot="lede"] { max-width: 34ch; }
[data-slot="hero-aside"] { position: absolute; right: 0; bottom: var(--hero-foot); display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 20px; max-width: 36%; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-slot="hero"]:not([data-size="page"]) [data-slot="hero-picture"] { animation: hero-leave linear both; animation-timeline: view(); animation-range: exit 0% exit 90%; }
    @keyframes hero-leave { to { transform: scale(0.82) translateY(6%); opacity: 0.25; } }
  }
}
@media (max-width: 1023px) {
  [data-slot="hero"] { min-height: 0; padding-bottom: 48px; }
  [data-slot="hero-picture"] { position: relative; z-index: 0; top: auto; bottom: auto; right: auto; width: auto; height: min(58svh, 92vw); margin: -2rem calc(-1 * var(--page-gutter)) 8px; }
  [data-slot="hero-text"] { max-width: none; }
  [data-slot="hero-aside"] { position: static; justify-content: flex-start; max-width: none; margin-top: 28px; }
}
[data-slot="hero"][data-size="page"] { min-height: 0; justify-content: flex-start; padding: 32px 0 clamp(40px, 8svh, 80px); }
[data-slot="hero"][data-size="page"] [data-slot="hero-text"] { max-width: min(900px, 100%); }
[data-slot="hero"][data-size="page"] [data-slot="display"] { font-size: clamp(40px, min(6vw, 10svh), ${px(Math.round(display.size * 0.75))}); }
[data-slot="hero"][data-size="page"] [data-slot="lede"] { max-width: 46ch; }
[data-slot="hero"][data-size="page"] [data-slot="hero-picture"] { position: absolute; z-index: 0; top: 0; bottom: 0; right: 0; left: auto; width: min(30%, 280px); height: auto; margin: 0; animation: none; }
[data-slot="hero"][data-size="page"]:has([data-slot="hero-picture"]) [data-slot="hero-text"] { max-width: min(900px, 68%); }
@media (max-width: 1023px) {
  [data-slot="hero"][data-size="page"] [data-slot="hero-picture"] { position: relative; width: 160px; height: 160px; margin: 0 0 8px; }
  [data-slot="hero"][data-size="page"]:has([data-slot="hero-picture"]) [data-slot="hero-text"] { max-width: none; }
}
[data-slot="front-scene"] { --p: 0; position: relative; isolation: isolate; display: flex; flex-direction: column; align-items: center; text-align: center; }
[data-slot="scene-words"] { position: relative; z-index: 1; max-width: 1000px; padding-top: clamp(8px, 5svh, 48px); opacity: calc(1 - var(--p) * 1.3); transform: translateY(calc(var(--p) * -56px)); }
[data-slot="front-scene"] [data-slot="hero-eyebrow"] { display: flex; justify-content: center; margin-bottom: ${px(t.page.hero.afterEyebrow)}; }
[data-slot="front-scene"] [data-slot="display"] { font-size: clamp(40px, min(6.6vw, 9.5svh), ${px(display.size)}); text-wrap: balance; margin-bottom: ${px(t.page.hero.afterTitle)}; }
[data-slot="front-scene"] [data-slot="display"] > :last-child:not(:first-child) { color: ${v("muted-foreground")}; }
[data-slot="front-scene"] [data-slot="lede"] { max-width: 52ch; margin: 0 auto ${px(t.page.hero.afterLede)}; }
[data-slot="scene-picture"] { position: relative; z-index: 0; align-self: stretch; margin-inline: calc(50% - 50vw); margin-top: clamp(-48px, -4svh, -16px); height: min(90svh, 960px); transform-origin: 50% 0; transform: scale(calc(0.84 + var(--p) * 0.16)); }
[data-slot="scene-foot"] { position: relative; z-index: 1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 20px; margin-top: -40px; }
@media (max-width: 1023px) {
  [data-slot="scene-picture"] { height: min(70svh, 96vw); margin-top: 0; transform: none; }
  [data-slot="scene-words"] { opacity: 1; transform: none; }
  [data-slot="scene-foot"] { margin-top: 8px; }
}
[data-slot="band"] { position: relative; padding-block: clamp(56px, 11svh, 112px); }
[data-slot="band"][data-tone="card"] { border-image: linear-gradient(${v("card")} 0 0) fill 0 / / 0 100vmax; }
[data-slot="band"] [data-slot="heading"][data-level="2"] { ${styleRules(display)} font-size: clamp(30px, 4vw, ${px(Math.round(display.size * 0.62))}); line-height: 1.05; text-wrap: balance; }
[data-slot="hero"] [data-slot="hero-eyebrow"] { margin-bottom: ${px(t.page.hero.afterEyebrow)}; }
[data-slot="hero"] [data-slot="display"] { margin-bottom: ${px(t.page.hero.afterTitle)}; }
[data-slot="hero"] [data-slot="lede"] { margin-bottom: ${px(t.page.hero.afterLede)}; }
[data-slot="hero"] [data-slot="hero-actions"] { margin-bottom: ${px(t.page.hero.afterActions)}; }
[data-slot="hero"] [data-slot="hero-tags"] { gap: ${px(t.page.hero.tagGap)}; }
`;
}

function screens(t: Theme): string {
  if (!t.motion.screens) {
    return `
[data-slot="screens"] { display: block; }
[data-slot="screen"] { position: relative; }
[data-slot="scene"] { position: absolute; inset: 0; z-index: 0; pointer-events: none; }`;
  }
  return `
[data-slot="screens"] {
  position: relative;
  height: 100%;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
}

[data-slot="scene"] {
  position: sticky;
  top: 0;
  height: 0;
  z-index: 0;
  overflow: visible;
}

[data-slot="scene"] > * {
  position: absolute;
  inset: 0;
  height: 100vh;
}

[data-slot="screen"] {
  position: relative;
  z-index: 1;
  min-height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

[data-slot="hero-panel"] {
  border-radius: 0 0 var(--panel-corner) var(--panel-corner);
  ${t.panels.style === "glass" ? `background: color-mix(in oklab, ${v("card")} 72%, transparent); backdrop-filter: blur(18px); box-shadow: inset 0 -1px 0 ${mix("background", "foreground", 0.2)};` : `background: ${v("card")};`}
  padding: calc(var(--topbar-height) + 48px) var(--page-gutter) 48px;
}`;
}

function motion(t: Theme): string {
  const focus = {
    ring: `:focus-visible { outline: 2px solid ${v("ring")}; outline-offset: 2px; }`,
    underline: `:focus-visible { outline: 0; box-shadow: 0 2px 0 ${v("ring")}; }`,
    none: `:focus-visible { outline: 0; }`,
  };
  const banner = {
    bar: `[data-slot="banner"] { position: fixed; inset-inline: 0; bottom: 0; border-top: 1px solid ${v("border")}; background: ${v("card")}; padding: 14px var(--page-gutter); z-index: 60; }`,
    card: `[data-slot="banner"] { position: fixed; right: 20px; bottom: 20px; max-width: 420px; border: 1px solid ${v("border")}; border-radius: var(--panel-corner); background: ${v("card")}; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); z-index: 60; }`,
  };
  const links = {
    underline: `a[data-slot="link"] { color: ${v("foreground")}; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: ${v("link")}; }`,
    colour: `a[data-slot="link"] { color: ${v("link")}; text-decoration: none; } a[data-slot="link"]:hover { text-decoration: underline; }`,
  };
  return `
${t.motion.rise ? "" : ".rise { opacity: 1 !important; transform: none !important; transition: none !important; }"}
${t.motion.transitions ? "" : "*, *::before, *::after { transition: none !important; }"}
${focus[t.motion.focus]}
${banner[t.motion.banner]}
${links[t.motion.links]}

@keyframes breathe {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}
${t.motion.breathe.on ? "" : "[data-slot], [data-slot]::after { animation-name: travel, none !important; }"}`;
}

/** the rail beside a topic: sticky under the bar, sections as a list, the open section's pages under it. */
/**
 * the side menu of a topic: sticky under the bar, the sections as small capitals with a
 * chevron, the open section's pages under it on a rule, the current page marked by its edge and
 * a tint. also the buttons that hide, show and close it, and the button back to the top.
 */
function sidenav(): string {
  const chevron = `content: ""; width: 7px; height: 7px; border-right: 1.5px solid currentColor; border-bottom: 1.5px solid currentColor; transform: rotate(-45deg); transition: transform 150ms; flex: none;`;
  return `
[data-slot="side-nav"] { position: sticky; top: calc(var(--topbar-height) + 24px); max-height: calc(100vh - var(--topbar-height) - 48px); overflow-y: auto; align-self: start; }
[data-slot="side-nav"] ul { list-style: none; margin: 0; padding: 0; }
[data-slot="side-nav-title"] { display: flex; flex-direction: column; gap: 6px; margin: 0 0 16px; }
[data-slot="side-nav-head"] { display: flex; align-items: center; min-height: 32px; margin-bottom: 14px; }
[data-slot="side-nav-bar"] { display: flex; align-items: center; gap: 12px; min-height: 32px; margin-bottom: 8px; }
[data-slot="side-nav-bar"]:empty { display: none; }
[data-slot="side-nav-toggle"] { cursor: pointer; background: transparent; border: 1px solid ${v("border")}; border-radius: 999px; padding: 4px 12px; align-items: center; gap: 8px; color: ${v("foreground")}; transition: border-color 150ms; }
[data-slot="side-nav-toggle"]:hover { border-color: ${v("muted-foreground")}; }
[data-slot="side-nav-sections"] > li { border-top: 1px solid ${v("border")}; }
[data-slot="side-nav-sections"] > li:last-child { border-bottom: 1px solid ${v("border")}; }
[data-slot="side-nav-link"] { display: flex; align-items: center; justify-content: space-between; gap: 10px; text-decoration: none; transition: color 150ms, border-color 150ms, background-color 150ms; }
[data-slot="side-nav-link"][data-level="section"] { padding: 10px 2px; color: ${v("foreground")}; }
[data-slot="side-nav-link"][data-level="section"]::after { ${chevron} }
[data-slot="side-nav-link"][data-level="section"][data-open="true"] { color: ${v("selected")}; }
[data-slot="side-nav-link"][data-level="section"][data-open="true"]::after { transform: rotate(45deg); }
[data-slot="side-nav-link"][data-level="section"]:hover { color: ${v("selected")}; }
[data-slot="side-nav-pages"] { margin: 0 0 12px 6px; }
[data-slot="side-nav-pages"] > li + li { margin-top: 10px; }
[data-slot="side-nav-pages"] [data-slot="label"] { display: block; margin: 0 0 4px 14px; }
[data-slot="side-nav-link"][data-level="page"] { padding: 5px 12px; border-left: 2px solid ${v("border")}; border-radius: 0 6px 6px 0; color: ${v("muted-foreground")}; }
[data-slot="side-nav-link"][data-level="page"]:hover { color: ${v("foreground")}; background: ${mix("background", "foreground", 0.05)}; }
[data-slot="side-nav-link"][data-level="page"][aria-current] { color: ${v("selected")}; border-left-color: ${v("selected")}; background: ${mix("background", "selected", 0.1)}; }
[data-slot="back-to-top"] { position: fixed; right: 24px; bottom: 24px; z-index: 55; width: 40px; height: 40px; border-radius: 50%; border: 1px solid ${v("border")}; background: ${v("card")}; color: ${v("foreground")}; cursor: pointer; display: grid; place-items: center; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18); transition: opacity 200ms, transform 200ms, border-color 150ms; }
[data-slot="back-to-top"] > span::before { ${chevron} display: block; transform: translateY(2px) rotate(-135deg); }
[data-slot="back-to-top"]:hover { border-color: ${v("selected")}; color: ${v("selected")}; }
[data-slot="back-to-top"][data-shown="false"] { opacity: 0; transform: translateY(8px); pointer-events: none; }
`;
}

/** the frosted glass of the plain button and of the chips, the top bar's effect */
function frost(t: Theme): string {
  const g = t.buttons.glass;
  return `background: color-mix(in oklab, ${v("background")} ${g.tint}%, transparent); backdrop-filter: blur(${px(g.blur)}); -webkit-backdrop-filter: blur(${px(g.blur)});`;
}

/** a pressed plain button or chosen chip is frosted too when its own fill is clear */
const clearPressed = (t: Theme) => t.buttons.plain.pressed.fill === "transparent";

/**
 * the fractal layer behind the page: its colour, line and opacity; where it grows is the component's.
 * the fade-in of a line keeps no state once it ends (fill "backwards", not "both"): a page grows over
 * a thousand lines, and a thousand finished animations held for good stopped chrome painting the
 * rest of the page. the drift layers are not marked will-change for the same reason: each spans the
 * page's height. the wave's mask covers the whole page and is painted again at every change, so it
 * moves in steps, four a second, which the soft edge of a wave 1,600 px long hides, and it holds
 * still while the page scrolls (data-scrolling on html, set by the site's shell); measured, painting
 * it sixty times a second made four frames in ten late while scrolling.
 */
function fractal(t: Theme): string {
  const f = t.fractal;
  return `
[data-slot="fractal"] { position: absolute; top: 0; left: 0; z-index: 0; pointer-events: none; overflow: hidden; color: ${swatch(f.colour)}; opacity: ${f.on ? f.opacity : 0}; }
${f.on && f.lightOpacity !== undefined ? `html[data-mode="light"] [data-slot="fractal"] { opacity: ${f.lightOpacity}; }` : ""}
${f.wave > 0 ? `@property --fractal-wave { syntax: "<length>"; inherits: false; initial-value: 0px; }
[data-slot="fractal"] { --wave-mask: repeating-radial-gradient(circle at 100% 0, rgba(0,0,0,${f.waveLow}) var(--fractal-wave), #000 calc(var(--fractal-wave) + ${f.wave / 2}px), rgba(0,0,0,${f.waveLow}) calc(var(--fractal-wave) + ${f.wave}px)); mask-image: var(--wave-mask); -webkit-mask-image: var(--wave-mask); animation: fractal-wave ${f.waveTime}s steps(${Math.max(1, Math.round(f.waveTime * 4))}) infinite; }
@keyframes fractal-wave { from { --fractal-wave: 0px; } to { --fractal-wave: ${f.wave}px; } }
@media (prefers-reduced-motion: reduce) { [data-slot="fractal"] { animation: none; mask-image: none; -webkit-mask-image: none; } }
html[data-scrolling] [data-slot="fractal"] { animation-play-state: paused; }
` : ""}[data-slot="fractal-layer"] { position: absolute; top: 0; left: 0; ${f.drift > 0 ? `animation: fractal-drift var(--drift-time) ease-in-out var(--drift-delay) infinite alternate;` : ""} }
@keyframes fractal-drift { from { opacity: 1; } to { opacity: ${(1 - f.drift).toFixed(2)}; } }
@media (prefers-reduced-motion: reduce) { [data-slot="fractal-layer"] { animation: none; } }
[data-slot="fractal"] path { fill: none; stroke: currentColor; stroke-width: ${px(f.stroke)}; stroke-linecap: round; stroke-linejoin: round; }
${f.fade > 0 ? `[data-slot="fractal"] path { animation: fractal-in ${f.fade}ms ease-out backwards; }
@keyframes fractal-in { from { opacity: 0; } to { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { [data-slot="fractal"] path { animation: none; } }
` : ""}`;
}

/** the topic graph of the front page: the light along its links, and a card lifting and its figure brightening when it is lit */
function graph(): string {
  return `
[data-slot="graph-light"] { animation-name: travel; animation-timing-function: linear; animation-iteration-count: infinite; }
[data-slot="topic-graph"] a[data-slot="panel"], a[data-tile] { transition: transform 300ms ease, border-color 300ms ease; }
a[data-tile] { display: flex; border: 1px solid ${v("border")}; border-radius: 10px; padding: 12px 14px; background: color-mix(in oklab, ${v("card")} 88%, transparent); color: ${v("foreground")}; text-decoration: none; }
a[data-tile]:hover, a[data-tile]:focus-visible { transform: translateY(-3px); border-color: ${v("selected")}; }
a[data-tile]:is(:hover, :focus-visible) [data-slot="edge-figure"] :is(.edge-core, .edge-tail, .edge-halo) { animation-duration: var(--figure-seconds), var(--breathe-seconds); }
[data-slot="topic-graph"] a[data-slot="panel"][data-lit] { transform: translateY(-6px); border-color: ${v("selected")}; }
[data-slot="topic-graph"] [data-lit] [data-slot="edge-figure"] .edge-halo { stroke-opacity: 0.45; }
[data-slot="topic-graph"] [data-lit] [data-slot="graph-open"] { color: ${v("selected")}; }
@media (prefers-reduced-motion: reduce) {
  [data-slot="graph-light"] { animation: none; stroke-opacity: 0; }
  [data-slot="topic-graph"] a[data-slot="panel"][data-lit], a[data-tile]:hover { transform: none; }
}
`;
}

export function render(t: Theme): string {
  const parts = [tokens(t), text(t), page(t), topbar(t), buttons(t), tabs(t), sliders(t), inputs(t), panels(t), plots(t), figures(t), readouts(t), pieces(t), sidenav(), hero(t), graph(), fractal(t), screens(t), motion(t)];
  const imports = (t.type.imports ?? []).map((u) => `@import url("${u}");`).join("\n");
  return `/* generated by build/theme.ts from the config folder. edit the config, not this file. */\n${imports}\n${parts.join("\n")}\n`
    .split("\n")
    .filter((line, i, all) => !(line.trim() === "" && all[i - 1]?.trim() === ""))
    .join("\n");
}

if (process.argv[1]?.endsWith("theme.ts")) {
  const out = process.argv[2] ?? new URL("../src/theme.css", import.meta.url);
  writeFileSync(out, render(theme));
  console.log(`${typeof out === "string" ? out : "src/theme.css"} written (case ${KIT_CASE})`);
}
