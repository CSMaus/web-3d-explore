export const PRIMES = {
  slug: "primes",
  number: 5,
  title: "An aside: the gaps between primes",
  landing: "/topics/primes/play/gaps",
  sections: [
    { to: "/topics/primes/parts", label: "Parts" },
    { to: "/topics/primes/play", label: "Play" },
    { to: "/topics/primes/theory", label: "Mathematics" },
  ],
} as const;

export const TOPIC = "primes";

export const SYSTEMS = [{ id: "gaps", to: "/topics/primes/play/gaps", label: "The gaps" }] as const;

export type PrimesRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): PrimesRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
