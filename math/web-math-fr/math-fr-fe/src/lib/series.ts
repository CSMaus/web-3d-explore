import { L } from "@/lib/lang";

/** the sections and pages of topic 5, series. the shape mirrors the other topics'. */
export const SERIES = {
  slug: "series",
  number: 5,
  title: L("Series: functions built from simple pieces"),
  landing: "/topics/series/play",
  sections: [
    { to: "/topics/series/parts", label: L("Parts") },
    { to: "/topics/series/play", label: L("Play") },
    { to: "/topics/series/theory", label: L("Mathematics") },
    { to: "/topics/series/uses", label: L("Applications") },
    { to: "/topics/series/test", label: L("Test") },
  ],
} as const;

export const TOPIC = "series";

/** five pages in reading order: powers first, then where they stop, then waves, outlines and pictures */
export const SYSTEMS = [
  { id: "taylor", to: "/topics/series/play/taylor", label: L("Taylor series") },
  { id: "radius", to: "/topics/series/play/radius", label: L("Where a series stops working") },
  { id: "fourier", to: "/topics/series/play/fourier", label: L("Fourier series") },
  { id: "draw", to: "/topics/series/play/draw", label: L("Drawn by circles") },
  { id: "frequencies", to: "/topics/series/play/frequencies", label: L("Strongest waves") },
] as const;

export type SeriesRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): SeriesRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
