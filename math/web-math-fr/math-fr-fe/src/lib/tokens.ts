export const TOKENS = {
  slug: "tokens",
  number: 4,
  title: "Tokens, embeddings and generation",
  landing: "/topics/tokens/play",
  sections: [
    { to: "/topics/tokens/parts", label: "Parts" },
    { to: "/topics/tokens/play", label: "Play" },
    { to: "/topics/tokens/theory", label: "Mathematics" },
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
  { id: "bytes", to: "/topics/tokens/play/bytes", label: "Three ways", group: "Text into tokens" },
  { id: "merge", to: "/topics/tokens/play/merge", label: "A vocabulary", group: "Text into tokens" },
  { id: "segment", to: "/topics/tokens/play/segment", label: "Cutting", group: "Text into tokens" },
  { id: "cost", to: "/topics/tokens/play/cost", label: "What it costs", group: "Text into tokens" },
  { id: "table", to: "/topics/tokens/play/table", label: "The table", group: "Tokens into vectors" },
  { id: "meaning", to: "/topics/tokens/play/meaning", label: "Meaning", group: "Tokens into vectors" },
  { id: "space", to: "/topics/tokens/play/space", label: "The space", group: "Tokens into vectors" },
  { id: "order", to: "/topics/tokens/play/order", label: "Order", group: "Positions, mixed" },
  { id: "attend", to: "/topics/tokens/play/attend", label: "Attention", group: "Positions, mixed" },
  { id: "predict", to: "/topics/tokens/play/predict", label: "The next token", group: "Positions, mixed" },
  { id: "generate", to: "/topics/tokens/play/generate", label: "The loop", group: "One token at a time" },
  { id: "sample", to: "/topics/tokens/play/sample", label: "Choosing", group: "One token at a time" },
  { id: "pool", to: "/topics/tokens/play/pool", label: "One vector", group: "One token at a time" },
  { id: "artefacts", to: "/topics/tokens/play/artefacts", label: "What it explains", group: "One token at a time" },
] as const;

export const GROUPS = ["Text into tokens", "Tokens into vectors", "Positions, mixed", "One token at a time"] as const;

export type TokenRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): TokenRoute {
  return (SYSTEMS.find((s) => s.id === id) ?? SYSTEMS[0]).to;
}
