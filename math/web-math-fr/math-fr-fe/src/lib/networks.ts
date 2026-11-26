import { L } from "@/lib/lang";

export const NETWORKS = {
  slug: "networks",
  number: 3,
  title: L("From calculus to a first neural network"),
  landing: "/topics/networks/play",
  sections: [
    { to: "/topics/networks/parts", label: L("Parts") },
    { to: "/topics/networks/play", label: L("Play") },
    { to: "/topics/networks/theory", label: L("Mathematics") },
    { to: "/topics/networks/uses", label: L("Applications") },
    { to: "/topics/networks/test", label: L("Test") },
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
  { id: "rate", to: "/topics/networks/play/rate", label: L("Speed from position"), group: L("Change and totals") },
  { id: "rate2", to: "/topics/networks/play/rate2", label: L("Speeding up or slowing down"), group: L("Change and totals") },
  { id: "accumulate", to: "/topics/networks/play/accumulate", label: L("Distance from speed"), group: L("Change and totals") },
  { id: "growth", to: "/topics/networks/play/growth", label: L("Growth in proportion"), group: L("Change and totals") },
  { id: "slope", to: "/topics/networks/play/slope", label: L("Which way is down"), group: L("Change and totals") },
  { id: "line", to: "/topics/networks/play/line", label: L("Dividing dots by a line"), group: L("Teaching a network to sort dots") },
  { id: "nudge", to: "/topics/networks/play/nudge", label: L("Small change, small effect"), group: L("Teaching a network to sort dots") },
  { id: "unit", to: "/topics/networks/play/unit", label: L("One artificial neuron"), group: L("Teaching a network to sort dots") },
  { id: "layers", to: "/topics/networks/play/layers", label: L("Several neurons together"), group: L("Teaching a network to sort dots") },
  { id: "any", to: "/topics/networks/play/any", label: L("Drawing any curve"), group: L("Teaching a network to sort dots") },
  { id: "learn", to: "/topics/networks/play/learn", label: L("Speed of learning"), group: L("Teaching a network to sort dots") },
  { id: "blame", to: "/topics/networks/play/blame", label: L("The error passed back"), group: L("Teaching a network to sort dots") },
  { id: "slow", to: "/topics/networks/play/slow", label: L("Sure and wrong"), group: L("When learning stalls") },
  { id: "fade", to: "/topics/networks/play/fade", label: L("The first layer learns last"), group: L("When learning stalls") },
  { id: "pictures", to: "/topics/networks/play/pictures", label: L("Finding a shape in a picture"), group: L("Pictures, sequences, words") },
  { id: "sequence", to: "/topics/networks/play/sequence", label: L("Remembering a number"), group: L("Pictures, sequences, words") },
  { id: "words", to: "/topics/networks/play/words", label: L("Which word to look at"), group: L("Pictures, sequences, words") },
] as const;

export const GROUPS = [L("Change and totals"), L("Teaching a network to sort dots"), L("When learning stalls"), L("Pictures, sequences, words")] as const;

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
