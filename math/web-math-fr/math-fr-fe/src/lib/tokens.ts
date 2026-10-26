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
  { id: "bytes", to: "/topics/tokens/play/bytes", label: L("Three ways"), group: L("Text into tokens") },
  { id: "merge", to: "/topics/tokens/play/merge", label: L("A vocabulary"), group: L("Text into tokens") },
  { id: "segment", to: "/topics/tokens/play/segment", label: L("Cutting"), group: L("Text into tokens") },
  { id: "cost", to: "/topics/tokens/play/cost", label: L("What it costs"), group: L("Text into tokens") },
  { id: "table", to: "/topics/tokens/play/table", label: L("The table"), group: L("Tokens into vectors") },
  { id: "meaning", to: "/topics/tokens/play/meaning", label: L("Meaning"), group: L("Tokens into vectors") },
  { id: "space", to: "/topics/tokens/play/space", label: L("The space"), group: L("Tokens into vectors") },
  { id: "order", to: "/topics/tokens/play/order", label: L("Order"), group: L("Positions, mixed") },
  { id: "attend", to: "/topics/tokens/play/attend", label: L("Attention"), group: L("Positions, mixed") },
  { id: "predict", to: "/topics/tokens/play/predict", label: L("The next token"), group: L("Positions, mixed") },
  { id: "generate", to: "/topics/tokens/play/generate", label: L("The loop"), group: L("One token at a time") },
  { id: "sample", to: "/topics/tokens/play/sample", label: L("Choosing"), group: L("One token at a time") },
  { id: "pool", to: "/topics/tokens/play/pool", label: L("One vector"), group: L("One token at a time") },
  { id: "artefacts", to: "/topics/tokens/play/artefacts", label: L("What it explains"), group: L("One token at a time") },
] as const;

export const GROUPS = [L("Text into tokens"), L("Tokens into vectors"), L("Positions, mixed"), L("One token at a time")] as const;

export type TokenRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): TokenRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
