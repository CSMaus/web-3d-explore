import { L } from "@/lib/lang";

export const COMPLEX = {
  slug: "complex",
  number: 0,
  title: L("Imaginary numbers"),
  landing: "/topics/complex/play",
  sections: [
    { to: "/topics/complex/parts", label: L("Parts") },
    { to: "/topics/complex/play", label: L("Play") },
    { to: "/topics/complex/theory", label: L("Mathematics") },
    { to: "/topics/complex/uses", label: L("Applications") },
  ],
} as const;

export const TOPIC = "complex";

/** seven pages in reading order: a reader who has never met 𝑖 ends able to read the Mandelbrot set, and meets Hamilton's numbers last. */
export const SYSTEMS = [
  { id: "line", to: "/topics/complex/play/line", label: L("The line"), tex: "\\sqrt{-1}", texSaid: L("the square root of minus one") },
  { id: "turn", to: "/topics/complex/play/turn", label: L("What 𝑖 is") },
  { id: "add", to: "/topics/complex/play/add", label: L("Complex numbers: adding") },
  { id: "multiply", to: "/topics/complex/play/multiply", label: L("Complex numbers: multiplying") },
  { id: "square", to: "/topics/complex/play/square", label: L("Which points stay?") },
  { id: "round", to: "/topics/complex/play/round", label: L("Euler's formula") },
  { id: "quaternions", to: "/topics/complex/play/quaternions", label: L("Quaternions") },
] as const;

export type ComplexRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): ComplexRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
