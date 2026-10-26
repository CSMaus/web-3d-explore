import * as React from "react";
import { cn } from "cn";
import { Slot } from "radix-ui";

/**
 * the kit's own elements, beyond what the registry provides. every one is a
 * plain element with a data-slot name and no styling of its own: the theme
 * sheet, generated from the config folder, writes the look onto the slot.
 */

export function Page({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="page" className={cn("pt-24 pb-16", className)} {...props} />;
}

/** a heading at one of three levels; each level is its own text style. */
export function Heading({ className, level = 1, ...props }: React.ComponentProps<"h1"> & { level?: 1 | 2 | 3 }) {
  const Tag = `h${level}` as const;
  return <Tag data-slot="heading" data-level={level} className={cn("fractal-obstacle", className)} {...props} />;
}

/** text in a named style from the config, for any style the fixed elements do not cover. */
export function Text({ kind, as = "span", className, ...props }: React.HTMLAttributes<HTMLElement> & { kind: string; as?: "span" | "p" | "div" | "dl" | "dt" | "dd" | "li" | "ul" | "figcaption" }) {
  const Tag = as as "span";
  return <Tag data-text={kind} className={cn("fractal-obstacle", className)} {...props} />;
}

/** the one very large line of a front page. */
export function Display({ className, ...props }: React.ComponentProps<"h1">) {
  return <h1 data-slot="display" className={className} {...props} />;
}

/** the paragraph under a display line. */
export function Lede({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="lede" className={className} {...props} />;
}

/** the small section label: "WHAT GOES IN", "RUN", "MATHEMATICS". a heading, so a page's sections can be read in order. */
export function Label({ className, as = "h2", ...props }: React.ComponentProps<"h2"> & { as?: "h2" | "h3" | "div" | "span" }) {
  const Tag = as;
  return <Tag data-slot="label" className={cn("m-0 text-inherit", className)} {...props} />;
}

/** a small coloured word or two, such as "no prerequisites". */
export function Tag({ colour, style, ...props }: React.ComponentProps<"span"> & { colour?: string }) {
  return <span data-slot="tag" style={{ ...(colour ? ({ "--tag-colour": colour } as React.CSSProperties) : {}), ...style }} {...props} />;
}

export function Panel({ label, tone, className, children, ...props }: React.ComponentProps<"section"> & { label?: string; tone?: "primary" | "muted" }) {
  return (
    <section data-slot="panel" data-tone={tone} className={cn("fractal-obstacle", className)} {...props}>
      {label ? <Label>{label}</Label> : null}
      <div>{children}</div>
    </section>
  );
}

/** the header row of a card: a dot, a title, and a right-hand note or action. */
export function PanelHead({ meta, children, className, ...props }: React.ComponentProps<"div"> & { meta?: React.ReactNode }) {
  return (
    <div data-slot="panel-head" className={className} {...props}>
      <span>{children}</span>
      {meta ? <span data-slot="meta">{meta}</span> : null}
    </div>
  );
}

export function Caption({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="caption" className={className} {...props} />;
}

/** a picture with its caption, in the order the theme sets. */
export function Figure({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="figure" className={className} {...props} />;
}

/** the frame a canvas sits in; the page gives it a height. */
export function Plot({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="plot" className={className} {...props} />;
}

export function Verdict({ good, className, ...props }: React.ComponentProps<"p"> & { good?: boolean }) {
  return <p data-slot="verdict" data-good={good === undefined ? undefined : String(good)} className={className} {...props} />;
}

export function Readout({ rows, className }: { rows: [React.ReactNode, React.ReactNode][]; className?: string }) {
  return (
    <dl data-slot="readout" className={cn("fractal-obstacle", className)}>
      {rows.map(([k, v], i) => (
        <React.Fragment key={i}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function Banner({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="banner" className={className} {...props} />;
}

export function TextLink({ asChild, ...props }: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";
  return <Comp data-slot="link" {...props} />;
}

/** the thin line at the foot of a screen: a marker, a note, a hint. */
export function Strip({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="strip" className={className} {...props} />;
}

/** the first thing a keyboard reaches: a link that jumps past the bar to the content. */
export function SkipLink({ children, ...props }: React.ComponentProps<"a">) {
  return (
    <a data-slot="skip" href="#content" {...props}>
      {children}
    </a>
  );
}

// ------------------------------------------------------------------ the top bar

export function Brand({ asChild, children, ...props }: React.ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp data-slot="topbar-brand" {...props}>
      {asChild ? (
        children
      ) : (
        <>
          <span data-slot="brand-mark" aria-hidden="true" />
          <span>{children}</span>
        </>
      )}
    </Comp>
  );
}

/** the mark and the wordmark, for use inside a routed link. */
export function BrandInner({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span data-slot="brand-mark" aria-hidden="true" />
      <span>{children}</span>
    </>
  );
}

export function TopBar({ brand, actions, className, children, ...props }: React.ComponentProps<"header"> & { brand: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header data-slot="topbar" className={className} {...props}>
      <nav data-slot="topbar-inner" aria-label="Site">
        {brand}
        <div data-slot="topbar-links">{children}</div>
        {actions ? <div data-slot="topbar-actions">{actions}</div> : null}
      </nav>
    </header>
  );
}

export function TopBarLink({ active, asChild, ...props }: React.ComponentProps<"a"> & { active?: boolean; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";
  return <Comp data-slot="topbar-link" data-active={active ? "true" : "false"} aria-current={active ? "page" : undefined} {...props} />;
}

export function TopBarDivider() {
  return <span data-slot="topbar-divider" aria-hidden="true" />;
}

/** the search field as it sits in the bar: a button that opens the search, with its key. */
export function SearchButton({ label, shortcut, ...props }: React.ComponentProps<"button"> & { label: string; shortcut?: string }) {
  return (
    <button type="button" data-slot="search-button" {...props}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span>{label}</span>
      {shortcut ? <kbd data-slot="key">{shortcut}</kbd> : null}
    </button>
  );
}

/** the language switch: a plain select, which every assistive tool already knows. */
export function LanguageSwitch({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: { code: string; label: string; name: string }[];
  onChange: (code: string) => void;
  label: string;
}) {
  return (
    <span data-slot="language">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o.code} value={o.code}>
            {o.label}
          </option>
        ))}
      </select>
      <span aria-hidden="true">▾</span>
    </span>
  );
}

// ---------------------------------------------------------------------- the hero

/** the first screen of a front page: words at the left, one picture at the right. */
export function Hero({
  eyebrow,
  title,
  lede,
  actions,
  tags,
  picture,
  aside,
  size = "stage",
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  actions?: React.ReactNode;
  tags?: React.ReactNode;
  /** the large picture behind the right of the first screen, off its edge */
  picture?: React.ReactNode;
  /** small controls set at the lower right, over the picture */
  aside?: React.ReactNode;
  /** "stage" fills the first screen of the front page; "page" heads a page of lists */
  size?: "stage" | "page";
  className?: string;
}) {
  return (
    <section data-slot="hero" data-size={size} className={className}>
      {picture ? <div data-slot="hero-picture">{picture}</div> : null}
      <div data-slot="hero-text">
        {eyebrow ? (
          <div data-slot="hero-eyebrow">
            <Label as="div">{eyebrow}</Label>
          </div>
        ) : null}
        <Display>{title}</Display>
        {lede ? <Lede className="max-w-xl">{lede}</Lede> : null}
        {actions ? <div data-slot="hero-actions" className="flex flex-wrap gap-3">{actions}</div> : null}
        {tags ? <div data-slot="hero-tags" className="flex flex-wrap">{tags}</div> : null}
      </div>
      {aside ? <div data-slot="hero-aside">{aside}</div> : null}
    </section>
  );
}

/** a section the width of the screen with its content in the page's column; "card" is the second tone, for bands in turn. */
export function Band({ tone = "page", className, ...props }: React.ComponentProps<"section"> & { tone?: "page" | "card" }) {
  return <section data-slot="band" data-tone={tone} className={className} {...props} />;
}

// ------------------------------------------------------------ frame and screens

/** full-height screens that snap one at a time when the config says so, with a scene behind them. */
export function Screens({ scene, children, className, ...props }: React.ComponentProps<"div"> & { scene?: React.ReactNode }) {
  return (
    <div data-slot="screens" className={className} {...props}>
      {scene ? (
        <div data-slot="scene" aria-hidden="true">
          <div>{scene}</div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function Screen({ className, ...props }: React.ComponentProps<"section">) {
  return <section data-slot="screen" className={className} {...props} />;
}

/** the panel that holds the words of the first screen and lifts away as the next one arrives. */
export function HeroPanel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="hero-panel" className={className} {...props} />;
}

/** the small things at the foot of a screen: the counter, the scroll hint, the share control. */
export function Furniture({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="furniture" className={className} {...props} />;
}

/** "002 / 005": which screen this is, of how many. */
export function Counter({ at, of, className, ...props }: React.ComponentProps<"p"> & { at: number; of: number }) {
  const pad = (n: number) => String(n).padStart(3, "0");
  return (
    <p data-slot="counter" className={className} {...props}>
      {pad(at)} / {pad(of)}
    </p>
  );
}

/** the mouse drawn as an outline with a moving dot: there is more below. */
export function ScrollHint({ label, ...props }: React.ComponentProps<"span"> & { label: string }) {
  return <span data-slot="scroll-hint" role="img" aria-label={label} {...props} />;
}

export function Share({ label, ...props }: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button type="button" data-slot="share" {...props}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      <span>{label}</span>
    </button>
  );
}

/** a card with a figure above its title and text. */
export function IconCard({ figure, title, children, className, ...props }: React.ComponentProps<"article"> & { figure: React.ReactNode; title: React.ReactNode }) {
  return (
    <article data-slot="icon-card" className={className} {...props}>
      <div data-slot="icon-card-figure">{figure}</div>
      <h3 data-slot="icon-card-title">{title}</h3>
      <p data-slot="icon-card-text">{children}</p>
    </article>
  );
}

// ------------------------------------------------------------------ switches

type NameSelectProps = { value: string; names: Record<string, string>; onChange: (name: string) => void; label: string };

/** the palette of a case that has several, as a select; the choice is saved in the browser. */
export function PaletteSwitch(props: NameSelectProps) {
  return <NameSelect {...props} />;
}

/** the case (the design) in use, as a select; development only: the word is written into config/case.ts and the page loads again. */
export function CaseSwitch(props: NameSelectProps) {
  return <NameSelect {...props} />;
}

function NameSelect({ value, names, onChange, label }: NameSelectProps) {
  return (
    <span data-slot="language">
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {Object.entries(names).map(([k, n]) => (
          <option key={k} value={k}>
            {n}
          </option>
        ))}
      </select>
      <span aria-hidden="true">▾</span>
    </span>
  );
}

/** light or dark: one button that shows the mode it would switch to. */
export function ModeSwitch({ mode, onChange, labels }: { mode: "light" | "dark"; onChange: (m: "light" | "dark") => void; labels: { light: string; dark: string } }) {
  const next = mode === "dark" ? "light" : "dark";
  return (
    <button type="button" data-slot="mode-switch" onClick={() => onChange(next)} aria-label={labels[next]}>
      <span aria-hidden="true" />
      <span>{labels[next]}</span>
    </button>
  );
}

// ------------------------------------------------------------------ side navigation

/** the rail beside a topic: its sections, and under the open section its pages. one landmark, named for the topic. */
export function SideNav({ label, children, ...props }: React.ComponentProps<"nav"> & { label: string }) {
  return (
    <nav data-slot="side-nav" aria-label={label} className="fractal-obstacle" {...props}>
      {children}
    </nav>
  );
}

/** one link of the rail: a section when `level` says so, else a page. the current one carries aria-current from the router. */
export function SideNavLink({ asChild, level = "page", ...props }: React.ComponentProps<"a"> & { asChild?: boolean; level?: "section" | "page" }) {
  const Comp = asChild ? Slot.Root : "a";
  return <Comp data-slot="side-nav-link" data-text={level === "section" ? "label" : "tab"} data-level={level} {...props} />;
}
