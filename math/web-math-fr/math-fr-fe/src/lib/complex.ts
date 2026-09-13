export const COMPLEX = {
  slug: "complex",
  number: 0,
  title: "Imaginary numbers, from nothing",
  landing: "/topics/complex/play",
  sections: [
    { to: "/topics/complex/parts", label: "Parts" },
    { to: "/topics/complex/play", label: "Play" },
    { to: "/topics/complex/theory", label: "Mathematics" },
  ],
} as const;

export const TOPIC = "complex";

/** seven pages in reading order: a reader who has never met i ends able to read a Julia set, and meets Hamilton's numbers last. */
export const SYSTEMS = [
  { id: "line", to: "/topics/complex/play/line", label: "The line" },
  { id: "turn", to: "/topics/complex/play/turn", label: "A quarter turn" },
  { id: "add", to: "/topics/complex/play/add", label: "Adding" },
  { id: "multiply", to: "/topics/complex/play/multiply", label: "Multiplying" },
  { id: "square", to: "/topics/complex/play/square", label: "Squaring, again" },
  { id: "round", to: "/topics/complex/play/round", label: "Going round" },
  { id: "quaternions", to: "/topics/complex/play/quaternions", label: "Turns in space" },
] as const;

export type ComplexRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): ComplexRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
