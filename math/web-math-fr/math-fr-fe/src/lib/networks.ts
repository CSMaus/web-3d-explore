export const NETWORKS = {
  slug: "networks",
  number: 3,
  title: "Calculus into a first neural network",
  landing: "/topics/networks/play",
  sections: [
    { to: "/topics/networks/parts", label: "Parts" },
    { to: "/topics/networks/play", label: "Play" },
    { to: "/topics/networks/theory", label: "Mathematics" },
  ],
} as const;

export const TOPIC = "networks";

/**
 * thirteen pages in reading order, in three groups. the first group is the
 * calculus as things that move, the second is one job learned by a network
 * page after page, the third is the same job on pictures, sequences and words.
 * every page has the same three parts in the same places: what goes in, run,
 * what came out.
 */
export const SYSTEMS = [
  { id: "rate", to: "/topics/networks/play/rate", label: "How fast", group: "The calculus" },
  { id: "rate2", to: "/topics/networks/play/rate2", label: "Speeding up", group: "The calculus" },
  { id: "accumulate", to: "/topics/networks/play/accumulate", label: "Adding it back", group: "The calculus" },
  { id: "growth", to: "/topics/networks/play/growth", label: "Growth", group: "The calculus" },
  { id: "slope", to: "/topics/networks/play/slope", label: "A hill", group: "The calculus" },
  { id: "line", to: "/topics/networks/play/line", label: "Draw the line", group: "One job" },
  { id: "unit", to: "/topics/networks/play/unit", label: "Inside one unit", group: "One job" },
  { id: "layers", to: "/topics/networks/play/layers", label: "Many units", group: "One job" },
  { id: "learn", to: "/topics/networks/play/learn", label: "How it learns", group: "One job" },
  { id: "blame", to: "/topics/networks/play/blame", label: "The correction", group: "One job" },
  { id: "pictures", to: "/topics/networks/play/pictures", label: "On pictures", group: "The same job on" },
  { id: "sequence", to: "/topics/networks/play/sequence", label: "On a sequence", group: "The same job on" },
  { id: "words", to: "/topics/networks/play/words", label: "On words", group: "The same job on" },
] as const;

export const GROUPS = ["The calculus", "One job", "The same job on"] as const;

export type NetRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): NetRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}

/** the pages that were rejected, and where each one's replacement is. */
export const REPLACED: Record<string, NetRoute> = {
  perceptron: "/topics/networks/play/line",
  neuron: "/topics/networks/play/unit",
  network: "/topics/networks/play/layers",
  forward: "/topics/networks/play/unit",
  solve: "/topics/networks/play/learn",
  descent: "/topics/networks/play/slope",
  backprop: "/topics/networks/play/blame",
  optimisers: "/topics/networks/play/learn",
  cnn: "/topics/networks/play/pictures",
  lstm: "/topics/networks/play/sequence",
  attention: "/topics/networks/play/words",
};
