import { L } from "@/lib/lang";

/** the sections and pages of topic 7, probability. the shape mirrors the other topics'. */
export const PROBABILITY = {
  slug: "probability",
  number: 7,
  title: L("Probability: counting chance"),
  landing: "/topics/probability/play",
  sections: [
    { to: "/topics/probability/parts", label: L("Parts") },
    { to: "/topics/probability/play", label: L("Play") },
    { to: "/topics/probability/theory", label: L("Mathematics") },
    { to: "/topics/probability/uses", label: L("Applications") },
    { to: "/topics/probability/test", label: L("Test") },
  ],
} as const;

export const TOPIC = "probability";

/**
 * twelve pages in reading order, in six groups of two: counting equally likely outcomes, what a
 * piece of knowledge does to a chance, the average of a game, counts of successes and waits,
 * quantities that vary continuously, and walks made of coin tosses.
 */
export const SYSTEMS = [
  { id: "dice", to: "/topics/probability/play/dice", label: L("Two dice"), group: L("Counting equal chances") },
  { id: "birthdays", to: "/topics/probability/play/birthdays", label: L("Birthdays"), group: L("Counting equal chances") },
  { id: "test", to: "/topics/probability/play/test", label: L("A positive test"), group: L("What new knowledge does") },
  { id: "doors", to: "/topics/probability/play/doors", label: L("Three doors"), group: L("What new knowledge does") },
  { id: "game", to: "/topics/probability/play/game", label: L("A game with a die"), group: L("The average result") },
  { id: "hats", to: "/topics/probability/play/hats", label: L("Hats handed back"), group: L("The average result") },
  { id: "galton", to: "/topics/probability/play/galton", label: L("Galton board"), group: L("Counting successes") },
  { id: "poisson", to: "/topics/probability/play/poisson", label: L("Rare events"), group: L("Counting successes") },
  { id: "bins", to: "/topics/probability/play/bins", label: L("From bars to a curve"), group: L("Waiting times as curves") },
  { id: "memory", to: "/topics/probability/play/memory", label: L("Waiting for a taxi"), group: L("Waiting times as curves") },
  { id: "walks", to: "/topics/probability/play/walks", label: L("Coin-toss walks"), group: L("Walks of coin tosses") },
  { id: "ruin", to: "/topics/probability/play/ruin", label: L("Gambler's ruin"), group: L("Walks of coin tosses") },
] as const;

export const GROUPS = [L("Counting equal chances"), L("What new knowledge does"), L("The average result"), L("Counting successes"), L("Waiting times as curves"), L("Walks of coin tosses")] as const;

export type ProbabilityRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): ProbabilityRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
