import { SYSTEMS as CHAOS_PAGES } from "@/lib/chaos";
import { SYSTEMS as COMPLEX_PAGES } from "@/lib/complex";
import { SYSTEMS as NETWORK_PAGES } from "@/lib/networks";
import { SYSTEMS as PRIMES_PAGES } from "@/lib/primes";
import { SYSTEMS as FRACTAL_PAGES } from "@/lib/systems";
import { SYSTEMS as TOKEN_PAGES } from "@/lib/tokens";
import { BUILT } from "@/lib/topic";

/**
 * the site in reading order, for the next button on phones: the topics by their number, and in
 * each its sections in the order of its menu, the play section followed by every page in it. the
 * page after the last page of a topic is the first page of the next topic.
 */
export type Stop = { to: string; label: string };

const PAGES: Record<string, readonly { to: string; label: string }[]> = {
  fractals: FRACTAL_PAGES,
  chaos: CHAOS_PAGES,
  networks: NETWORK_PAGES,
  tokens: TOKEN_PAGES,
  primes: PRIMES_PAGES,
  complex: COMPLEX_PAGES,
};

export const SEQUENCE: Stop[] = Object.values(BUILT)
  .slice()
  .sort((a, b) => a.number - b.number)
  .flatMap((topic) =>
    topic.sections.flatMap((section) => {
      const own = { to: section.to, label: `${topic.title}: ${section.label}` };
      return section.to.endsWith("/play") ? [own, ...(PAGES[topic.slug] ?? []).map((p) => ({ to: p.to, label: `${topic.title}: ${p.label}` }))] : [own];
    }),
  );

/**
 * the page after the one at this path: the next stop when the path is one, or lies under one (a
 * page inside a section counts as that section). only topics and their pages have one: off the
 * topics, and after the very last page, none.
 */
export function nextAfter(path: string): Stop | null {
  const clean = path.replace(/\/+$/, "") || "/";
  let at = SEQUENCE.findIndex((s) => s.to === clean);
  if (at < 0) {
    // the longest stop the path lies under
    let best = -1;
    SEQUENCE.forEach((s, i) => {
      if (clean.startsWith(`${s.to}/`) && (best < 0 || s.to.length > SEQUENCE[best].to.length)) best = i;
    });
    at = best;
  }
  if (at < 0) {
    // a topic's own page leads to its first page
    const home = clean.match(/^\/topics\/([^/]+)$/);
    return home ? (SEQUENCE.find((s) => s.to.startsWith(`/topics/${home[1]}/`)) ?? null) : null;
  }
  return SEQUENCE[at + 1] ?? null;
}
