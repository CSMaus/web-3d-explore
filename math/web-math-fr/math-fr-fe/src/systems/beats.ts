/**
 * measurements on a recorded heart: intervals between beats, grouped by the
 * rhythm the cardiologists named, and one question asked of each rhythm: does
 * knowing one interval say anything about the next.
 */
import type { Beat } from "@/data/mitdb207";

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function between(beats: Beat[], from: number, to: number): Beat[] {
  return beats.filter((b) => b.t >= from && b.t < to);
}

export function stats(rr: number[]): { n: number; mean: number; sd: number } {
  const n = rr.length;
  if (!n) return { n: 0, mean: 0, sd: 0 };
  const mean = rr.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(rr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / n);
  return { n, mean, sd };
}

/**
 * how much knowing one interval narrows the next: the spread of the next
 * interval among beats whose own interval fell in the same bin, over the spread
 * of the next interval knowing nothing. one for no help, zero for a rule.
 */
export function narrowing(rr: number[], bin = 20): { ratio: number; used: number } {
  if (rr.length < 12) return { ratio: NaN, used: 0 };
  const nexts = rr.slice(1);
  const total = stats(nexts).sd;
  if (!total) return { ratio: 0, used: nexts.length };
  const by = new Map<number, number[]>();
  for (let i = 0; i < rr.length - 1; i++) {
    const k = Math.round(rr[i] / bin);
    const list = by.get(k) ?? [];
    list.push(rr[i + 1]);
    by.set(k, list);
  }
  let weighted = 0;
  let used = 0;
  for (const list of by.values()) {
    if (list.length < 4) continue;
    weighted += stats(list).sd * list.length;
    used += list.length;
  }
  return { ratio: used ? weighted / used / total : NaN, used };
}

export type Episode = { from: number; to: number; label: string; beats: number };

/** the stretches of one rhythm inside a window, with how many beats each held */
export function episodes(segments: { from: number; to: number; label: string }[], beats: Beat[], label: string, from: number, to: number): Episode[] {
  return segments
    .filter((s) => s.label === label && s.to > from && s.from < to)
    .map((s) => ({ from: Math.max(s.from, from), to: Math.min(s.to, to), label, beats: beats.filter((b) => b.t >= s.from && b.t < s.to).length }));
}

/** a beat's colour class: the flutter waves, the premature and escape beats, and the rest */
export function kind(type: string): "flutter" | "odd" | "beat" {
  if (type === "!") return "flutter";
  if ("AVEFaJSjnQ".includes(type)) return "odd";
  return "beat";
}
