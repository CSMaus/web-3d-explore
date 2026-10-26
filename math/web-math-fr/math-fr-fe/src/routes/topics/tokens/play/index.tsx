import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";
import { TOPIC, routeOf, type TokenRoute } from "@/lib/tokens";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/")({
  loader: () => api.theory(TOPIC),
  component: TokenIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
export const LOCAL: { id: string; name: string; summary: string }[] = [
  { id: "bytes", name: L("One string, three ways"), summary: L("What is read, the code points, the bytes: three counts that differ, and two spellings of one letter that look the same and are not") },
  { id: "merge", name: L("Building a vocabulary"), summary: L("Byte-pair encoding on a small text, one merge a step: count the pairs, join the commonest, repeat. The merge list is the whole result") },
  { id: "segment", name: L("Cutting a sentence"), summary: L("The merges replayed on new text. The same sentence under three vocabularies, the space inside the token, and the exact way back") },
  { id: "cost", name: L("What a token costs"), summary: L("One sentence in eleven scripts under one vocabulary: tokens against characters, and why the ratio is what is billed and what fills the window") },
  { id: "table", name: L("From a number to a vector"), summary: L("A token id as a one-hot row, a matrix that picks one row, and the table that makes the picking cheap. The width is fixed; the count grows") },
  { id: "meaning", name: L("Where the meaning comes from"), summary: L("Vectors trained by predicting neighbours, watched forming a map. Which rows moved often and which almost never") },
  { id: "space", name: L("Measuring the space"), summary: L("Cosine against distance, a flat picture that keeps only part of the spread, direction as the carrier of relation, and the narrow cone") },
  { id: "order", name: L("Order has to be supplied"), summary: L("A sentence and its shuffle give one and the same answer until a position is added to every vector") },
  { id: "attend", name: L("Attention, with the numbers"), summary: L("Query, key and value from the stream, the score matrix, the mask, the weights and the mix written back, on a real prompt through a trained model") },
  { id: "predict", name: L("The next token"), summary: L("The last vector scored against every row of the table, softmaxed into a ranked list. Watch it sharpen as the model trains") },
  { id: "generate", name: L("One token at a time"), summary: L("Choose one, append it, run again. The appended token goes in like any other, the window fills, the oldest falls out") },
  { id: "sample", name: L("Choosing from the distribution"), summary: L("Greedy repeats itself; temperature, top-k and nucleus reshape the same distribution, and the choice changes the text as much as the model does") },
  { id: "pool", name: L("One vector for a whole passage"), summary: L("The per-position vectors collapsed into one, on purpose, and what that vector cannot tell apart") },
  { id: "artefacts", name: L("What the first pages explain"), summary: L("Counting letters, long numbers, a stray space, a rare word: four failures, each traced to a page before any model appeared") },
];

function TokenIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;

  return (
    <div>
      <Heading level={1} className="mt-4">{L("Fourteen pages, one text")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("One short text about a cat, a dog and a man runs through every page. A vocabulary is built from it, two small models are trained on it in the browser as the run goes, and the last pages generate from it. Every page has the same three parts in the same places: what goes in, run, what came out. Nothing is a stated result: every number is computed here from that text.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">
          {L("The descriptions come from the backend, which is not answering; this page needs nothing from it and neither does any of the mathematics.")}
        </Text>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} number={i + 1} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

function Tile({ to, number, name, summary, delay }: { to: TokenRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
