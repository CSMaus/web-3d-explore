/** the sections and systems of topic 2. the shape mirrors topic 1's. */
export const CHAOS = {
  slug: "chaos",
  number: 2,
  title: "Differential equations, attractors and chaos",
  /** the pages, not the series: no clip is filmed yet */
  landing: "/topics/chaos/play",
  sections: [
    { to: "/topics/chaos/parts", label: "Parts" },
    { to: "/topics/chaos/play", label: "Play" },
    { to: "/topics/chaos/theory", label: "Mathematics" },
  ],
} as const;

export const TOPIC = "chaos";

export const SYSTEMS = [
  { id: "field", to: "/topics/chaos/play/field", label: "One equation" },
  { id: "solvers", to: "/topics/chaos/play/solvers", label: "Stepping" },
  { id: "phase", to: "/topics/chaos/play/phase", label: "Phase plane" },
  { id: "lorenz", to: "/topics/chaos/play/lorenz", label: "Lorenz" },
  { id: "rossler", to: "/topics/chaos/play/rossler", label: "Rossler" },
  { id: "logistic", to: "/topics/chaos/play/logistic", label: "Logistic map" },
  { id: "bifurcation", to: "/topics/chaos/play/bifurcation", label: "Bifurcation" },
  { id: "control", to: "/topics/chaos/play/control", label: "The heart" },
] as const;

export type ChaosRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): ChaosRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
