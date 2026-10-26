import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/complex/parts")({
  component: ComplexParts,
});

const STEPS = [
  L("Numbers on a line, and the one question they cannot answer"),
  L("A quarter turn, called i"),
  L("Adding: arrows tip to tail"),
  L("Multiplying: turn and stretch"),
  L("Squaring, again and again, until a Julia set appears"),
  L("The exponential goes round"),
];

function ComplexParts() {
  return (
    <div>
      <Heading level={1} className="mt-6">{L("The series, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("No clip is made yet. The six steps below are the order they will be built in, and every one already has its page under Play. This topic is the way in: the fractals topic assumes it from its complex-numbers part onward.")}
      </Text>
      <ol className="mt-8 max-w-2xl space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 rounded border border-border px-4 py-2.5">
            <span data-text="caption" className="w-6 shrink-0">{i + 1}</span>
            <span data-text="body">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
