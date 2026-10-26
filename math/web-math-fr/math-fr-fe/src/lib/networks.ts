import { L } from "@/lib/lang";

export const NETWORKS = {
  slug: "networks",
  number: 3,
  title: L("Calculus into a first neural network"),
  landing: "/topics/networks/play",
  sections: [
    { to: "/topics/networks/parts", label: L("Parts") },
    { to: "/topics/networks/play", label: L("Play") },
    { to: "/topics/networks/theory", label: L("Mathematics") },
    { to: "/topics/networks/uses", label: L("Applications") },
  ],
} as const;

export const TOPIC = "networks";

/**
 * seventeen pages in reading order, in four groups. the first group is the
 * calculus as things that move, the second is one job learned by a network
 * page after page with the reasons for each part shown, the third is where
 * the learning stalls and why, the fourth is the same job on pictures,
 * sequences and words. every page has the same three parts in the same
 * places: what goes in, run, what came out.
 */
export const SYSTEMS = [
  { id: "rate", to: "/topics/networks/play/rate", label: L("How fast"), group: L("The calculus") },
  { id: "rate2", to: "/topics/networks/play/rate2", label: L("Speeding up"), group: L("The calculus") },
  { id: "accumulate", to: "/topics/networks/play/accumulate", label: L("Adding it back"), group: L("The calculus") },
  { id: "growth", to: "/topics/networks/play/growth", label: L("Growth"), group: L("The calculus") },
  { id: "slope", to: "/topics/networks/play/slope", label: L("A hill"), group: L("The calculus") },
  { id: "line", to: "/topics/networks/play/line", label: L("Draw the line"), group: L("One job") },
  { id: "nudge", to: "/topics/networks/play/nudge", label: L("A small change"), group: L("One job") },
  { id: "unit", to: "/topics/networks/play/unit", label: L("Inside one unit"), group: L("One job") },
  { id: "layers", to: "/topics/networks/play/layers", label: L("Many units"), group: L("One job") },
  { id: "any", to: "/topics/networks/play/any", label: L("Any curve"), group: L("One job") },
  { id: "learn", to: "/topics/networks/play/learn", label: L("How it learns"), group: L("One job") },
  { id: "blame", to: "/topics/networks/play/blame", label: L("The correction"), group: L("One job") },
  { id: "slow", to: "/topics/networks/play/slow", label: L("A bad start"), group: L("Where it stalls") },
  { id: "fade", to: "/topics/networks/play/fade", label: L("The first layer"), group: L("Where it stalls") },
  { id: "pictures", to: "/topics/networks/play/pictures", label: L("On pictures"), group: L("The same job on") },
  { id: "sequence", to: "/topics/networks/play/sequence", label: L("On a sequence"), group: L("The same job on") },
  { id: "words", to: "/topics/networks/play/words", label: L("On words"), group: L("The same job on") },
] as const;

export const GROUPS = [L("The calculus"), L("One job"), L("Where it stalls"), L("The same job on")] as const;

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
