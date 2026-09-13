import { Link, createFileRoute } from "@tanstack/react-router";
import { ChaosTabs } from "@/components/ChaosTabs";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { CHAOS, TOPIC, routeOf, type ChaosRoute } from "@/lib/chaos";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/chaos/play/")({
  loader: () => api.theory(TOPIC),
  component: ChaosIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
const LOCAL: { id: string; name: string; summary: string }[] = [
  {
    id: "field",
    name: "One equation, and its field",
    summary:
      "An equation whose unknown is a function. It prescribes a rate at every state, which can be drawn before anything is solved",
  },
  {
    id: "solvers",
    name: "Solving it by stepping",
    summary:
      "No formula, only the rate at the current state. The size of the step decides how much of the answer is real",
  },
  {
    id: "phase",
    name: "Two unknowns, and the phase plane",
    summary:
      "The whole state as one point, its history as one curve, and the clock off the axes altogether",
  },
  {
    id: "lorenz",
    name: "The Lorenz system",
    summary:
      "Three equations from a truncated model of convection, and the smallest honest place chaos can live",
  },
  {
    id: "rossler",
    name: "The Rossler system",
    summary: "Built on purpose to be the simplest carrier of the same behaviour, with one non-linear term",
  },
  {
    id: "logistic",
    name: "The logistic map",
    summary: "One number to the next. A map needs one dimension to be chaotic where a flow needs three",
  },
  {
    id: "bifurcation",
    name: "The bifurcation diagram",
    summary: "Every parameter on one axis and every value the orbit visits above it",
  },
  {
    id: "control",
    name: "Chaos in a heart, and the experiment that steadied it",
    summary: "A rabbit heart made irregular by a drug and steadied by nudges timed from its return map, repeated on the model that explained it",
  },
];

function ChaosIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <h1 className="mt-4 font-mono text-sm tracking-wide text-leaf">Pick something to move</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Every system carries its equations, its parameters as controls, and the numbers measured
        from whatever is on screen. Nothing here is a stated result: the exponents, the dimensions
        and Feigenbaum's constant are all computed in the browser as you watch.
      </p>
      {!theory ? (
        <p className="mt-3 text-[11px] text-muted">
          The descriptions come from the backend, which is not answering; this page needs nothing
          from it and neither does any of the mathematics.
        </p>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </main>
  );
}

function Tile({
  to,
  name,
  summary,
  delay,
}: {
  to: ChaosRoute;
  name: string;
  summary: string;
  delay: number;
}) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise">
      <Link
        to={to}
        className="block rounded border border-edge p-4 transition-colors hover:border-leaf"
      >
        <div className="font-mono text-sm text-ink">{name}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{summary}</p>
      </Link>
    </div>
  );
}
