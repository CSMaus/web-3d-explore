import { describe, expect, it } from "vitest";

// the translations of the page text, and the translated content snapshots, by path
const dictionaries = import.meta.glob<{ default: Record<string, string> }>("./locales/*/text/*.json", { eager: true });
const snapshots = import.meta.glob<{ default: unknown }>("./content/snapshot/*/*.json", { eager: true });
const english = import.meta.glob<{ default: unknown }>("./content/snapshot/*.json", { eager: true });

const LANGS = ["ru", "ko", "fr"];

/** every key of a language, merged over its dictionaries */
function merged(lang: string): Record<string, string> {
  return Object.assign({}, ...Object.entries(dictionaries).filter(([path]) => path.split("/")[2] === lang).map(([, mod]) => mod.default));
}

/** the {{names}} a sentence fills in, each once, sorted */
function holes(text: string): string[] {
  return [...new Set([...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))].sort();
}

/** the shape of a piece of content: every key path and the type at it, with the text left out */
function shape(value: unknown, where = ""): string[] {
  if (Array.isArray(value)) return [`${where}[${value.length}]`, ...value.flatMap((v, i) => shape(v, `${where}[${i}]`))];
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => shape(v, `${where}.${k}`));
  return [`${where}:${typeof value}`];
}

describe("translations", () => {
  it("every language translates the same sentences", () => {
    const keys = LANGS.map((lang) => Object.keys(merged(lang)).sort());
    expect(keys[1]).toEqual(keys[0]);
    expect(keys[2]).toEqual(keys[0]);
  });

  it("a translation fills in the same values as its English", () => {
    for (const lang of LANGS) {
      for (const [key, said] of Object.entries(merged(lang))) expect(holes(said), `${lang}: ${key}`).toEqual(holes(key));
    }
  });

  it("no translation has a long dash", () => {
    for (const lang of LANGS) {
      for (const [key, said] of Object.entries(merged(lang))) expect(said, `${lang}: ${key}`).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("every sentence the page code writes has a translation", () => {
    const code = import.meta.glob<string>(["./**/*.ts", "./**/*.tsx", "!./**/*.test.ts", "!./**/*.test.tsx", "!./lib/lang.ts"], { eager: true, query: "?raw", import: "default" });
    const known = merged("ru");
    const missing = Object.entries(code).flatMap(([path, text]) =>
      [...text.matchAll(/\bL\(\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`) as string).filter((key) => !(key in known)).map((key) => `${path}: ${key}`),
    );
    expect(missing).toEqual([]);
  });

  it("a translated snapshot keeps the shape of the English one", () => {
    for (const [path, mod] of Object.entries(snapshots)) {
      const name = path.split("/").pop() as string;
      const source = english[`./content/snapshot/${name}`];
      expect(source, path).toBeDefined();
      expect(shape(mod.default), path).toEqual(shape(source.default));
    }
  });
});
