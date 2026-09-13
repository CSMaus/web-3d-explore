import { createFileRoute } from "@tanstack/react-router";
import { TopicBar } from "@/components/TopicBar";
import { COMPLEX } from "@/lib/complex";

export const Route = createFileRoute("/topics/complex/parts")({
  component: ComplexParts,
});

const STEPS = [
  "Numbers on a line, and the one question they cannot answer",
  "A quarter turn, called i",
  "Adding: arrows tip to tail",
  "Multiplying: turn and stretch",
  "Squaring, again and again, until a Julia set appears",
  "The exponential goes round",
];

function ComplexParts() {
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <TopicBar topic={COMPLEX} />
      <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">The series, in order</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        No clip is made yet. The six steps below are the order they will be built in, and every one
        already has its page under Play. This topic is the way in: the fractals topic assumes it
        from its complex-numbers part onward.
      </p>
      <ol className="mt-8 max-w-2xl space-y-2">
        {STEPS.map((step, i) => (
          <li key={step} className="flex items-baseline gap-3 rounded border border-edge px-4 py-2.5">
            <span className="w-6 shrink-0 font-mono text-[11px] text-muted">{i + 1}</span>
            <span className="text-sm text-ink/85">{step}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
