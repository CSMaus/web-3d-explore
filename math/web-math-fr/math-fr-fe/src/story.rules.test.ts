import { describe, expect, it } from "vitest";
import { STORIES } from "@/storylines/list";

/**
 * the rules every story text keeps, checked on the English wording (the keys) and on the Russian
 * translation: 6 to 20 steps, at most two sentences a step, short sentences, at most one number
 * written in digits in a sentence, no brackets and no long dash.
 */
type Step = { id: string; say: string; fade: Record<string, number>; set: Record<string, number | string>; top: string | null; act: string | null };

const storylines = import.meta.glob<{ STEPS: Step[] }>("./storylines/*/*.ts", { eager: true });
const russian = import.meta.glob<{ default: Record<string, string> }>("./locales/ru/text/story*.json", { eager: true });
const ru: Record<string, string> = Object.assign({}, ...Object.values(russian).map((m) => m.default));

const sentences = (text: string) => text.trim().split(/(?<=[.?!])\s+/).filter(Boolean);
const words = (sentence: string) => sentence.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

function check(where: string, text: string, most: number): string[] {
  const out: string[] = [];
  if (/[\u2013\u2014]/.test(text)) out.push(`${where}: a long dash`);
  if (/[()]/.test(text)) out.push(`${where}: a bracket`);
  const parts = sentences(text);
  if (parts.length > 2) out.push(`${where}: ${parts.length} sentences`);
  for (const s of parts) {
    if (words(s).length > most) out.push(`${where}: ${words(s).length} words in "${s}"`);
    if ((s.match(/\d+/g) ?? []).length > 1) out.push(`${where}: two numbers in "${s}"`);
  }
  return out;
}

describe("The story texts", () => {
  it("every story of the pack is there, whole", () => {
    const found = Object.fromEntries(Object.entries(storylines).map(([path, mod]) => [path.replace("./storylines/", "").replace(".ts", ""), mod.STEPS.length]));
    expect(found).toEqual(STORIES);
  });

  it("every step is complete: an id of its own, a sentence, the picture's values, and a Russian text", () => {
    for (const [path, mod] of Object.entries(storylines)) {
      const ids = mod.STEPS.map((s) => s.id);
      expect(new Set(ids).size, path).toBe(ids.length);
      const fadeKeys = Object.keys(mod.STEPS[0].fade).sort();
      const setKeys = Object.keys(mod.STEPS[0].set).sort();
      for (const s of mod.STEPS) {
        expect(s.say.length, `${path} ${s.id}`).toBeGreaterThan(5);
        expect(Object.keys(s.fade).sort(), `${path} ${s.id}`).toEqual(fadeKeys);
        expect(Object.keys(s.set).sort(), `${path} ${s.id}`).toEqual(setKeys);
        for (const v of Object.values(s.fade)) expect(v >= 0 && v <= 1, `${path} ${s.id}`).toBe(true);
        expect(ru[s.say], `${path} ${s.id}: no Russian text`).toBeTruthy();
      }
    }
  });

  it("the English and the Russian texts keep the rules", () => {
    const problems: string[] = [];
    for (const [path, mod] of Object.entries(storylines)) {
      for (const s of mod.STEPS) {
        problems.push(...check(`${path} ${s.id} en`, s.say, 14));
        problems.push(...check(`${path} ${s.id} ru`, ru[s.say] ?? "", 12));
      }
    }
    expect(problems).toEqual([]);
  });
});
