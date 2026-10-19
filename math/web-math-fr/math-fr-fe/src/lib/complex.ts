export const COMPLEX = {
  slug: "complex",
  number: 0,
  title: "Imaginary numbers",
  landing: "/topics/complex/play",
  sections: [
    { to: "/topics/complex/parts", label: "Parts" },
    { to: "/topics/complex/play", label: "Play" },
    { to: "/topics/complex/theory", label: "Mathematics" },
    { to: "/topics/complex/uses", label: "Applications" },
  ],
} as const;

export const TOPIC = "complex";

/** seven pages in reading order: a reader who has never met 𝑖 ends able to read a Julia set, and meets Hamilton's numbers last. */
export const SYSTEMS = [
  { id: "line", to: "/topics/complex/play/line", label: "The line", tex: "\\sqrt{-1}", texSaid: "the square root of minus one" },
  { id: "turn", to: "/topics/complex/play/turn", label: "What 𝑖 is" },
  { id: "add", to: "/topics/complex/play/add", label: "Complex numbers: adding" },
  { id: "multiply", to: "/topics/complex/play/multiply", label: "Complex numbers: multiplying" },
  { id: "square", to: "/topics/complex/play/square", label: "Julia set" },
  { id: "round", to: "/topics/complex/play/round", label: "Euler's formula" },
  { id: "quaternions", to: "/topics/complex/play/quaternions", label: "Quaternions" },
] as const;

export type ComplexRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): ComplexRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
