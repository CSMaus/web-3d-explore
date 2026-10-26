import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { Offline } from "@/components/Offline";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/tokens";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/parts")({
  loader: () => api.topic(TOPIC),
  component: TokenParts,
});

/** the flow the clips will follow, from math/docs/story3.md. */
const STEPS = [
  L("Text as bytes, characters and code points"),
  L("The token"),
  L("How the vocabulary is built"),
  L("Going back, and what does not survive"),
  L("What a token costs"),
  L("From an integer to a vector"),
  L("The shape of the space"),
  L("Where the meaning comes from"),
  L("One row per token is not enough"),
  L("Order has to be supplied"),
  L("Attention"),
  L("The block"),
  L("The distribution over the vocabulary"),
  L("One token at a time"),
  L("Choosing from the distribution"),
  L("The window"),
  L("One vector for a whole passage"),
  L("What the first five steps explain"),
];

function TokenParts() {
  const topic = Route.useLoaderData();
  const made = topic?.part_list.length ?? 0;

  return (
    <div>
      <Heading level={1} className="mt-6">{L("The series, in order")}</Heading>

      {!topic ? (
        <div className="mt-6 max-w-2xl">
          <Offline what={L("The parts of a topic are served by the backend. The flow below is the plan and needs nothing from it.")} />
        </div>
      ) : null}

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {made === 0
          ? L("No clip is made yet. The eighteen steps below are the order they will be built in, and the play pages already carry the mechanism of each.")
          : L("{{made}} of {{total}} steps have clips.", { made, total: STEPS.length })}
      </Text>

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("The same short text runs through every step from the sixth onward, and one small model trained on it in the browser is the model at every step. Topic 3 is the prerequisite: a layer, a loss and a descent are assumed and not re-derived.")}
      </Text>

      <ol className="mt-8 max-w-2xl space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 rounded border border-border px-4 py-2.5">
            <span data-text="caption" className="w-6 shrink-0">{i + 1}</span>
            <span data-text="body">{step}</span>
            {i === 10 || i === 13 ? (
              <span data-text="label" className="ml-auto">{L("The centrepiece")}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
