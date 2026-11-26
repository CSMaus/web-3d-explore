import { describe, expect, it } from "vitest";

// every content file the site reads without the backend, by name
const files = import.meta.glob<{ default: unknown }>("./content/snapshot/*.json", { eager: true });

/** the fields whose text a reader sees as sentences; the beats' notes behind the clips are not shown */
const SHOWN = new Set(["summary", "note", "name", "label", "title", "question", "caption", "text"]);

/** every shown string in a piece of content, with where it is */
function shown(value: unknown, where: string, key = ""): [string, string][] {
  if (Array.isArray(value)) return value.flatMap((v, i) => shown(v, `${where}[${i}]`, key));
  if (value && typeof value === "object") {
    if (where.includes(".beats[")) return [];
    return Object.entries(value).flatMap(([k, v]) => shown(v, `${where}.${k}`, k));
  }
  return typeof value === "string" && SHOWN.has(key) && value.trim().split(/\s+/).length >= 3 ? [[where, value.trim()]] : [];
}

/** the maths names that are plain lowercase words and may open a sentence */
const NAMED = new Set(["lim", "ln", "xor", "tanh"]);

/** whether the text opens on a maths symbol: x_n, log2, sq(x), dA/dt, a letter with a raised index, a letter before a comma, or a named one */
function symbol(rest: string): boolean {
  const token = rest.split(/\s/)[0];
  if (/[_\d(/⁰-ⁿ]/.test(token) || /^[a-z],$/.test(token)) return true;
  return NAMED.has(token.replace(/[,.:;]+$/, ""));
}

/** a text starts with a capital, or with a maths symbol; so does every sentence after a full stop */
function faults(text: string): string[] {
  const out: string[] = [];
  const first = text.match(/^([a-z])(\w*)/);
  if (first && (first[1] + first[2]).length > 1 && !symbol(text)) out.push(`starts lowercase: ${text.slice(0, 60)}`);
  for (const m of text.matchAll(/[.?!]\s+([a-z])(\w*)/g)) {
    if ((m[1] + m[2]).length === 1 && m[1] !== "a") continue;
    const at = m.index ?? 0;
    if (symbol(text.slice(at + m[0].length - (m[1] + m[2]).length))) continue;
    // a factorial sign after a one-letter symbol does not end a sentence
    if (m[0][0] === "!" && /(^|\s)[a-z]$/.test(text.slice(0, at))) continue;
    if (/(e\.g|i\.e|etc|vs|cf)\.$/.test(text.slice(Math.max(0, (m.index ?? 0) - 5), (m.index ?? 0) + 1))) continue;
    out.push(`sentence starts lowercase: ...${text.slice(Math.max(0, (m.index ?? 0) - 25), (m.index ?? 0) + 25)}`);
  }
  return out;
}

describe("The content", () => {
  it("Starts every shown text and every sentence in it with a capital", () => {
    const found = Object.entries(files).flatMap(([file, mod]) => shown(mod.default, file).flatMap(([where, text]) => faults(text).map((f) => `${where}: ${f}`)));
    expect(found).toEqual([]);
  });
});
