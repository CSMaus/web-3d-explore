import { CHAOS } from "@/lib/chaos";
import { COMPLEX } from "@/lib/complex";
import { NETWORKS } from "@/lib/networks";
import { PRIMES } from "@/lib/primes";
import { TOKENS } from "@/lib/tokens";

/**
 * the sections a built topic has. the paths are literals rather than built from
 * the slug so the router can type-check them; a second topic gets its own entry
 * here rather than a template string.
 */
export const FRACTALS = {
  slug: "fractals",
  number: 1,
  title: "Fractals",
  /** where the index sends a reader: the series, since it is filmed */
  landing: "/topics/fractals/parts",
  sections: [
    { to: "/topics/fractals/parts", label: "Parts" },
    { to: "/topics/fractals/play", label: "Play" },
    { to: "/topics/fractals/theory", label: "Mathematics" },
  ],
} as const;

export type BuiltTopic = typeof FRACTALS | typeof CHAOS | typeof NETWORKS | typeof TOKENS | typeof PRIMES | typeof COMPLEX;

/** every topic that has pages, by slug. a planned topic is absent from here. */
export const BUILT = { fractals: FRACTALS, chaos: CHAOS, networks: NETWORKS, tokens: TOKENS, primes: PRIMES, complex: COMPLEX } as const;

export function builtAt(slug: string): BuiltTopic | null {
  return slug in BUILT ? BUILT[slug as keyof typeof BUILT] : null;
}
