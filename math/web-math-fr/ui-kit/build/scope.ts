/**
 * puts several cases into one stylesheet. each case's sheet, as render() writes it, is rewritten
 * so its rules hold only under `html[data-case="<case>"]`: every selector gains that condition
 * inside :where(), which adds no specificity, so the rules weigh against the page's own styles
 * exactly as they did alone. the default case also holds when the html element names no case, so
 * a page that never sets one (Storybook, a test) still has a look.
 *
 * what cannot sit under a selector is lifted out: local imports and @property go to the top once
 * (a font from another server is left to the page, which loads only the case in force's);
 * tailwind's @theme block is kept from the default case only, and every case's own font stacks
 * become variables under its condition; keyframes are renamed per case, with the animations that
 * name them, so two cases can animate the same thing differently.
 */

type Block = { head: string; body: string | null };

/** the top-level statements of a piece of css: a rule or an at-rule with its block, or a statement ending in ; */
function blocks(css: string): Block[] {
  const out: Block[] = [];
  let i = 0;
  const n = css.length;
  while (i < n) {
    // skip blank space and comments
    while (i < n && /\s/.test(css[i])) i++;
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (i >= n) break;
    let head = "";
    let quote = "";
    let parens = 0;
    while (i < n) {
      const c = css[i];
      if (quote) {
        if (c === quote && css[i - 1] !== "\\") quote = "";
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "(") parens++;
      else if (c === ")") parens--;
      else if (parens === 0 && (c === "{" || c === ";")) break;
      head += c;
      i++;
    }
    if (i >= n) break;
    if (css[i] === ";") {
      out.push({ head: head.trim(), body: null });
      i++;
      continue;
    }
    // the block, to its matching brace
    let depth = 1;
    let j = i + 1;
    quote = "";
    while (j < n && depth > 0) {
      const c = css[j];
      if (quote) {
        if (c === quote && css[j - 1] !== "\\") quote = "";
      } else if (c === '"' || c === "'") quote = c;
      else if (css.startsWith("/*", j)) {
        const end = css.indexOf("*/", j + 2);
        j = end < 0 ? n : end + 1;
      } else if (c === "{") depth++;
      else if (c === "}") depth--;
      j++;
    }
    out.push({ head: head.trim(), body: css.slice(i + 1, j - 1) });
    i = j;
  }
  return out;
}

/** a selector list split at its top-level commas, leaving the commas inside :is() and the like */
function selectors(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (c === "," && depth === 0) {
      out.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(list.slice(start).trim());
  return out.filter(Boolean);
}

export type Scoped = {
  /** the case's rules under its condition */
  css: string;
  /** the font imports and @property rules, to go at the top of the sheet once */
  lifted: string[];
  /** tailwind's @theme block, as written */
  theme: string | null;
};

export function scope(css: string, name: string, fallback: boolean): Scoped {
  const conditions = [`[data-case="${name}"]`, ...(fallback ? [":not([data-case])"] : [])];
  const onRoot = `:where(${conditions.join(", ")})`;
  const under = `:where(${conditions.map((c) => `html${c}`).join(", ")}) `;
  const names = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  const renamed = (word: string) => (names.has(word) ? `${word}--${name}` : word);
  const lifted: string[] = [];
  let theme: string | null = null;

  const selector = (s: string) => {
    if (s.startsWith(":root")) return `:root${onRoot}${s.slice(5)}`;
    if (/^html(?![\w-])/.test(s)) return `html${onRoot}${s.slice(4)}`;
    return `${under}${s}`;
  };
  const declarations = (body: string) =>
    body.replace(/(animation(?:-name)?\s*:)([^;}]*)/g, (_, prop: string, value: string) => prop + value.replace(/[A-Za-z_][\w-]*/g, renamed));

  const walk = (css: string): string =>
    blocks(css)
      .map(({ head, body }) => {
        if (body === null) {
          if (head.startsWith("@import")) lifted.push(`${head};`);
          return head.startsWith("@") ? "" : `${head};`;
        }
        if (head.startsWith("@property")) {
          lifted.push(`${head} {${body}}`);
          return "";
        }
        if (head.startsWith("@theme")) {
          if (fallback) theme = `${head} {${body}}`;
          const fonts = body.split(";").map((d) => d.trim()).filter((d) => d.startsWith("--font-"));
          return fonts.length ? `:root${onRoot} { ${fonts.join("; ")}; }` : "";
        }
        if (head.startsWith("@keyframes")) return `@keyframes ${renamed(head.replace(/^@keyframes\s+/, ""))} {${body}}`;
        if (head.startsWith("@")) return `${head} {\n${walk(body)}\n}`;
        return `${selectors(head).map(selector).join(", ")} {${declarations(body)}}`;
      })
      .filter(Boolean)
      .join("\n");

  return { css: walk(css), lifted, theme };
}

/** one sheet for several cases: the lifted rules once, the default case's @theme, then each case under its condition */
export function combine(parts: { name: string; css: string }[], fallback: string): string {
  const scoped = parts.map((p) => ({ name: p.name, ...scope(p.css, p.name, p.name === fallback) }));
  const lifted = [...new Set(scoped.flatMap((s) => s.lifted))];
  // a font from another server is not imported here: every visitor would load it, whatever the
  // case; the page adds the stylesheets of the case in force itself (type.imports)
  const imports = lifted.filter((l) => l.startsWith("@import") && !/url\(["']?https?:/.test(l));
  const rest = lifted.filter((l) => !l.startsWith("@import"));
  const theme = scoped.find((s) => s.theme)?.theme ?? "";
  return [
    "/* generated by build/theme.ts from the config folder: every case a visitor can choose, each under html[data-case]. edit the config, not this file. */",
    ...imports,
    theme,
    ...rest,
    ...scoped.map((s) => `\n/* ${s.name}${s.name === fallback ? ", the default" : ""} */\n${s.css}`),
  ]
    .filter(Boolean)
    .join("\n");
}
