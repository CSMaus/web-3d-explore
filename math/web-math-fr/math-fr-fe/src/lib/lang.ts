import i18n from "@/i18n";

/**
 * the text of the pages in the reader's language. every sentence written in the page code goes
 * through L, keyed by its English wording: L("Press run.") gives the Russian, Korean or French
 * text when the reader's language has it, and the English otherwise, so a sentence not yet
 * translated still reads. a sentence with values in it names them, L("{{n}} steps", { n }), and
 * the translation places them where its language wants them.
 *
 * the dictionaries are src/locales/<language>/text/<area>.json, one per area of the site (a topic,
 * the shared components), each a map from the English wording to the translation. the language
 * is read once per page load; choosing another language reloads the page.
 */

type Dictionary = Record<string, string>;

// each language's files load only when that language is read, so a page never carries the others
const files = import.meta.glob<{ default: Dictionary }>("../locales/*/text/*.json");

const byLanguage: Record<string, Dictionary> = {};

/**
 * the reader's dictionary, loaded once before the pages: page modules call L as they load, so
 * main.tsx waits for this before it brings them in. english needs none.
 */
export async function loadLanguage(code: string): Promise<void> {
  const lang = code.slice(0, 2);
  if (lang === "en" || byLanguage[lang]) return;
  const own = Object.entries(files).filter(([path]) => path.split("/")[2] === lang);
  const mods = await Promise.all(own.map(([, load]) => load()));
  byLanguage[lang] = Object.assign({}, ...mods.map((m) => m.default));
}

/** the reader's language, two letters */
export function language(): string {
  return (i18n.language || "en").slice(0, 2);
}

function fill(text: string, values?: Record<string, string | number>): string {
  if (!values) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

/** a sentence of the page in the reader's language, with its values filled in */
export function L(english: string, values?: Record<string, string | number>): string {
  const lang = language();
  const said = lang === "en" ? english : (byLanguage[lang]?.[english] ?? english);
  return fill(said, values);
}
