import { L } from "@/lib/lang";

/** the sections and systems of topic 2. the shape mirrors topic 1's. */
export const CHAOS = {
  slug: "chaos",
  number: 2,
  title: L("Differential equations, attractors and chaos"),
  /** the pages, not the series: no clip is filmed yet */
  landing: "/topics/chaos/play",
  sections: [
    { to: "/topics/chaos/parts", label: L("Parts") },
    { to: "/topics/chaos/play", label: L("Play") },
    { to: "/topics/chaos/theory", label: L("Mathematics") },
    { to: "/topics/chaos/uses", label: L("Applications") },
  ],
} as const;

export const TOPIC = "chaos";

export const SYSTEMS = [
  { id: "field", to: "/topics/chaos/play/field", label: L("One equation") },
  { id: "solvers", to: "/topics/chaos/play/solvers", label: L("Stepping") },
  { id: "phase", to: "/topics/chaos/play/phase", label: L("Phase plane") },
  { id: "lorenz", to: "/topics/chaos/play/lorenz", label: L("Lorenz") },
  { id: "rossler", to: "/topics/chaos/play/rossler", label: L("Rossler") },
  { id: "logistic", to: "/topics/chaos/play/logistic", label: L("Logistic map") },
  { id: "bifurcation", to: "/topics/chaos/play/bifurcation", label: L("Bifurcation") },
] as const;

export type ChaosRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): ChaosRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
