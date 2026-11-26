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
  L("Three ways to count text: letters, code points, bytes"),
  L("What a token is"),
  L("How the list of tokens is built"),
  L("Turning tokens back into text, and what is lost"),
  L("What a token costs"),
  L("From a number to a list of numbers"),
  L("Measuring how close two tokens are"),
  L("Where the meaning comes from"),
  L("Why one list per token is not enough"),
  L("Word order has to be added"),
  L("Attention: how a word takes in earlier words"),
  L("One full layer of the model"),
  L("A probability for every next token"),
  L("Writing one token at a time"),
  L("Choosing the next token"),
  L("How many tokens the model can see"),
  L("One list of numbers for a whole passage"),
  L("Four mistakes explained by the first five steps"),
];

function TokenParts() {
  const topic = Route.useLoaderData();
  const made = topic?.part_list.length ?? 0;

  return (
    <div>
      <Heading level={1} className="mt-6">{L("Planned videos, in order")}</Heading>

      {!topic ? (
        <div className="mt-6 max-w-2xl">
          <Offline what={L("The list of finished videos comes from the site's server, which is not answering. The plan below works without it.")} />
        </div>
      ) : null}

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {made === 0
          ? L("No video of this topic is made yet. The eighteen steps below are the planned videos, in the order they will be made. The interactive pages of this topic already show what each step is about.")
          : L("{{made}} of {{total}} steps have a video.", { made, total: STEPS.length })}
      </Text>

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("The topic is about how a language model, a program that reads text and guesses what comes next, cuts text into tokens (pieces such as words), turns them into numbers and writes text. From the sixth step on, every video uses the same short text, and one small model learns from it in the browser. The videos assume what the site's topic 3, on neural networks, explains: what a layer of a network is, how a loss measures error, and how training lowers it.")}
      </Text>

      <ol className="mt-8 max-w-2xl space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 rounded border border-border px-4 py-2.5">
            <span data-text="caption" className="w-6 shrink-0">{i + 1}</span>
            <span data-text="body">{step}</span>
            {i === 10 || i === 13 ? (
              <span data-text="label" className="ml-auto">{L("Main step")}</span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
