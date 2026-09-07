/**
 * the sections a built topic has. the paths are literals rather than built from
 * the slug so the router can type-check them; a second topic gets its own entry
 * here rather than a template string.
 */
export const FRACTALS = {
  slug: "fractals",
  number: 1,
  title: "fractals",
  sections: [
    { to: "/topics/fractals/parts", label: "parts" },
    { to: "/topics/fractals/play", label: "play" },
    { to: "/topics/fractals/theory", label: "mathematics" },
  ],
} as const;

export type BuiltTopic = typeof FRACTALS;

/** every topic that has pages, by slug. a planned topic is absent from here. */
export const BUILT = { fractals: FRACTALS } as const;

export function builtAt(slug: string): BuiltTopic | null {
  return slug in BUILT ? BUILT[slug as keyof typeof BUILT] : null;
}
