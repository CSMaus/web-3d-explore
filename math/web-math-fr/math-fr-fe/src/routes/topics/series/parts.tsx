import { createFileRoute } from "@tanstack/react-router";
import { Heading, Text } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/series/parts")({
  component: SeriesParts,
});

const STEPS = [
  L("Powers of x: how a calculator finds sin(x), one term at a time"),
  L("Where a series stops working, and the points outside the number line that stop it"),
  L("Waves: a square wave built from sine waves, and the turning circles behind them"),
  L("Any outline drawn by turning circles"),
  L("A photograph kept with only its strongest waves"),
];

function SeriesParts() {
  return (
    <div>
      <Heading level={1} className="mt-6">{L("The planned videos, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("The videos for this topic are not made yet. They will follow the five steps below, in this order. Each step already has an interactive page in the Play section.")}
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
