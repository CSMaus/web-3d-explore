import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { Link } from "@tanstack/react-router";
import { Offline } from "@/components/Offline";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";

export const Route = createFileRoute("/topics/chaos/parts")({
  loader: () => api.topic(TOPIC),
  component: ChaosParts,
});

/** the flow the clips will follow, from math/docs/story2.md. */
const STEPS = [
  "The differential equation, an equation whose unknown is a function",
  "The direction field, the equation as a picture before it is solved",
  "Solving one equation in closed form",
  "Where the closed form runs out",
  "The numerical route",
  "The system, several unknowns on one clock",
  "Complex numbers, and rotation as an eigenvalue",
  "Phase space, the state as a single point",
  "Equilibria, and the local linear stand-in",
  "Stability, and the exponent that measures it",
  "What is conserved, and what leaks",
  "The limit cycle, and why two dimensions are not enough",
  "The attractor",
  "The Lorenz system",
  "The Rossler system, and the folding made plain",
  "Deterministic chaos, stated properly",
  "The fractal block, part one: dimension",
  "The fractal block, part two: escape-time dynamics",
  "Closing the loop: the attractor's dimension, and the map on the real axis",
  "Discrete time, and the logistic map",
  "Bifurcation, the cascade, and Feigenbaum's constants",
  "Control, and the one experiment",
];

function ChaosParts() {
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
          ? "No clip is made yet. The twenty-two steps below are the order they will be built in, and every one of them already has its mathematics on the play pages."
          : `${made} of ${STEPS.length} steps have clips.`}
      </Text>

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        Steps 17 to 19 are the fractal block, which is{" "}
        <Link to="/topics/fractals/parts" className="text-selected hover:underline">
          Topic 1
        </Link>
        . It was built first and out of order, and it stands alone, so this topic keeps it by
        reference rather than repeating it.
      </Text>

      <ol className="mt-10 max-w-3xl space-y-1">
        {STEPS.map((title, i) => {
          const borrowed = i >= 16 && i <= 18;
          return (
            <li
              key={title}
              data-text="caption" className="flex gap-3 border-t border-border py-2.5"
            >
              <span className="w-8 shrink-0 text-muted-foreground">{i + 1}</span>
              <span className={borrowed ? "text-secondary" : "text-foreground/80"}>{title}</span>
              {borrowed ? (
                <span data-text="note" className="ml-auto shrink-0">From topic 1</span>
              ) : (
                <span data-text="note" className="ml-auto shrink-0">Not built</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
