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
  { id: "bytes", name: L("Three ways to count text"), summary: L("What is read, the code points, the bytes: three counts that differ, and two spellings of one letter that look the same and are not") },
  { id: "merge", name: L("Building a vocabulary of pieces"), summary: L("Byte-pair encoding on a small text, one merge a step: count the pairs, join the commonest, repeat. The merge list is the whole result") },
  { id: "segment", name: L("Cutting a sentence into tokens"), summary: L("The merges replayed on new text. The same sentence under three vocabularies, the space inside the token, and the exact way back") },
  { id: "cost", name: L("What a token costs"), summary: L("One sentence in eleven scripts under one vocabulary: tokens against characters, and why the ratio is what is billed and what fills the window") },
  { id: "table", name: L("From a number to a list of numbers"), summary: L("A token id as a one-hot row, a matrix that picks one row, and the table that makes the picking cheap. The width is fixed; the count grows") },
  { id: "meaning", name: L("Where meaning comes from"), summary: L("Vectors trained by predicting neighbours, watched forming a map. Which rows moved often and which almost never") },
  { id: "space", name: L("Measuring how close two tokens are"), summary: L("Cosine against distance, a flat picture that keeps only part of the spread, direction as the carrier of relation, and the narrow cone") },
  { id: "order", name: L("Word order has to be added"), summary: L("The same words in another order give the same result, until each token's list of numbers also carries its position") },
  { id: "attend", name: L("Attention: which earlier words count"), summary: L("Each token's list of numbers is rebuilt as a weighted average of the lists before it, computed stage by stage on a real sentence with a small trained model") },
  { id: "predict", name: L("Guessing the next token"), summary: L("The model's last list of numbers becomes a probability for every possible next token, and the guess improves as the model trains") },
  { id: "generate", name: L("Writing one token at a time"), summary: L("Text is written by guessing one token, adding it to the text and guessing again. The model sees only the latest tokens, and nothing written can be changed") },
  { id: "sample", name: L("Choosing the next token"), summary: L("Always taking the likeliest next token makes text repeat itself. Other rules draw at random, and the rule changes the text as much as the model does") },
  { id: "pool", name: L("One list of numbers for a whole passage"), summary: L("A passage's lists of numbers averaged into one, and why two passages with opposite meanings can still come out almost the same") },
  { id: "artefacts", name: L("Four mistakes explained by cutting text"), summary: L("Counting letters, long numbers, a stray space, a rare word: four common failures of language models, each caused by how text is cut into tokens") },
];

function TokenIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;

  return (
    <div>
      <Heading level={1} className="mt-4">{L("Fourteen pages on how a language model reads and writes")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("A language model is a program that reads text and guesses what comes next; chat assistants and translation programs are built on such models. These fourteen pages take one apart, step by step: how text is cut into tokens (pieces such as words), how each token becomes a list of numbers, how the words of a sentence take each other in, and how text is written one token at a time. One short text about a cat, a dog and a man runs through every page, and two small models learn from it in the browser. Every page has three parts in the same places: what goes in, the run, and what came out. Every number shown is computed on the page from that text.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">
          {L("The page descriptions come from the site's server, which is not answering. The descriptions below are the built-in ones, and the pages themselves work without the server.")}
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
