import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/complex/parts")({
  component: ComplexParts,
});

const STEPS = [
  L("Numbers on a line, and the one question they cannot answer"),
  L("A quarter turn: the number called 𝑖"),
  L("Adding complex numbers: one arrow placed at the tip of the other"),
  L("Multiplying complex numbers: a turn and a stretch"),
  L("Squaring and adding c again and again: which points stay near zero"),
  L("Growth at an imaginary rate goes round a circle"),
];

function ComplexParts() {
  return (
    <div>
      <Heading level={1} className="mt-6">{L("The planned videos, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("A series of short videos is planned for this topic, and none is made yet. The six steps below are the order in which they will be made. Each step already has an interactive page in the Play section. This topic is meant to be read first: the topic 'Fractals' relies on it from the point where complex numbers appear.")}
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
