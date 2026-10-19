import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { Offline } from "@/components/Offline";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/tokens";

export const Route = createFileRoute("/topics/tokens/parts")({
  loader: () => api.topic(TOPIC),
  component: TokenParts,
});

/** the flow the clips will follow, from math/docs/story3.md. */
const STEPS = [
  "Text as bytes, characters and code points",
  "The token",
  "How the vocabulary is built",
  "Going back, and what does not survive",
  "What a token costs",
  "From an integer to a vector",
  "The shape of the space",
  "Where the meaning comes from",
  "One row per token is not enough",
  "Order has to be supplied",
  "Attention",
  "The block",
  "The distribution over the vocabulary",
  "One token at a time",
  "Choosing from the distribution",
  "The window",
  "One vector for a whole passage",
  "What the first five steps explain",
];

function TokenParts() {
  const topic = Route.useLoaderData();
  const made = topic?.part_list.length ?? 0;

  return (
    <div>
      <Heading level={1} className="mt-6">The series, in order</Heading>

      {!topic ? (
        <div className="mt-6 max-w-2xl">
          <Offline what="The parts of a topic are served by the backend. The flow below is the plan and needs nothing from it." />
        </div>
      ) : null}

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {made === 0
          ? "No clip is made yet. The eighteen steps below are the order they will be built in, and the play pages already carry the mechanism of each."
          : `${made} of ${STEPS.length} steps have clips.`}
      </Text>

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        The same short text runs through every step from the sixth onward, and one small model
        trained on it in the browser is the model at every step. Topic 3 is the prerequisite: a
        layer, a loss and a descent are assumed and not re-derived.
      </Text>

      <ol className="mt-8 max-w-2xl space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 rounded border border-border px-4 py-2.5">
            <span data-text="caption" className="w-6 shrink-0">{i + 1}</span>
            <span data-text="body">{step}</span>
            {i === 10 || i === 13 ? (
              <span data-text="label" className="ml-auto">The centrepiece</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
