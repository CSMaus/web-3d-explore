import { L } from "@/lib/lang";

export const TOKENS = {
  slug: "tokens",
  number: 4,
  title: L("Tokens, embeddings and generation"),
  landing: "/topics/tokens/play",
  sections: [
    { to: "/topics/tokens/parts", label: L("Parts") },
    { to: "/topics/tokens/play", label: L("Play") },
    { to: "/topics/tokens/theory", label: L("Mathematics") },
    { to: "/topics/tokens/uses", label: L("Applications") },
    { to: "/topics/tokens/test", label: L("Test") },
  ],
} as const;

export const TOPIC = "tokens";

/**
 * fourteen pages in reading order, in four groups, following story3: a string
 * becomes tokens, tokens become vectors, vectors are mixed across positions,
 * and one token at a time becomes a paragraph. one small corpus and one tiny
 * model, trained in the browser, run through all of them.
 */
export const SYSTEMS = [
  { id: "bytes", to: "/topics/tokens/play/bytes", label: L("Three ways to count text"), group: L("Text cut into pieces") },
  { id: "merge", to: "/topics/tokens/play/merge", label: L("Building a vocabulary of pieces"), group: L("Text cut into pieces") },
  { id: "segment", to: "/topics/tokens/play/segment", label: L("Cutting a sentence into tokens"), group: L("Text cut into pieces") },
  { id: "cost", to: "/topics/tokens/play/cost", label: L("What a token costs"), group: L("Text cut into pieces") },
  { id: "table", to: "/topics/tokens/play/table", label: L("From a number to a list of numbers"), group: L("Pieces turned into numbers") },
  { id: "meaning", to: "/topics/tokens/play/meaning", label: L("Where meaning comes from"), group: L("Pieces turned into numbers") },
  { id: "space", to: "/topics/tokens/play/space", label: L("Measuring how close two tokens are"), group: L("Pieces turned into numbers") },
  { id: "order", to: "/topics/tokens/play/order", label: L("Word order has to be added"), group: L("How a sentence is read") },
  { id: "attend", to: "/topics/tokens/play/attend", label: L("Attention: which earlier words count"), group: L("How a sentence is read") },
  { id: "predict", to: "/topics/tokens/play/predict", label: L("Guessing the next token"), group: L("How a sentence is read") },
  { id: "generate", to: "/topics/tokens/play/generate", label: L("Writing one token at a time"), group: L("Writing text, piece by piece") },
  { id: "sample", to: "/topics/tokens/play/sample", label: L("Choosing the next token"), group: L("Writing text, piece by piece") },
  { id: "pool", to: "/topics/tokens/play/pool", label: L("One list of numbers for a whole passage"), group: L("Writing text, piece by piece") },
  { id: "artefacts", to: "/topics/tokens/play/artefacts", label: L("Four mistakes explained by cutting text"), group: L("Writing text, piece by piece") },
] as const;

export const GROUPS = [L("Text cut into pieces"), L("Pieces turned into numbers"), L("How a sentence is read"), L("Writing text, piece by piece")] as const;

export type TokenRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): TokenRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
