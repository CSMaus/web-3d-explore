import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { Link } from "@tanstack/react-router";
import { Offline } from "@/components/Offline";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/parts")({
  loader: () => api.topic(TOPIC),
  component: ChaosParts,
});

/** the flow the clips will follow, from math/docs/story2.md. */
const STEPS = [
  L("Differential equations: equations whose unknown is a whole curve, not a number"),
  L("The direction field: an equation drawn as arrows before it is solved"),
  L("Solving one equation exactly, by a formula"),
  L("Equations that no formula can solve"),
  L("Solving by small steps on a computer"),
  L("Systems: several quantities changing together over time"),
  L("Complex numbers, and how they describe turning motion"),
  L("Phase space: the whole state of a system drawn as one point"),
  L("Points of rest, and the straight-line approximation near them"),
  L("Stability, and the number that measures it"),
  L("What a system keeps, and what it loses"),
  L("The limit cycle, a loop the motion settles on, and why two quantities are not enough for chaos"),
  L("The attractor: the shape that the motion settles onto"),
  L("The Lorenz system: three equations from a simplified model of rising warm air"),
  L("The Rossler system, where the folding of the motion is easy to see"),
  L("Deterministic chaos: what the term means exactly"),
  L("Fractals, part one: a dimension that is not a whole number"),
  L("Fractals, part two: points that escape and points that stay"),
  L("The dimension of an attractor, and the same squaring rule on the number line"),
  L("Time in whole steps, and the logistic map: a rule that turns one number into the next"),
  L("Bifurcation: the long-run behaviour splitting in two again and again, and Feigenbaum's constants"),
  L("Control: the experiment that steadied a chaotic heart rhythm with small, timed pulses"),
];

function ChaosParts() {
  const topic = Route.useLoaderData();
  const made = topic?.part_list.length ?? 0;

  return (
    <div>
      <Heading level={1} className="mt-6">{L("The planned videos, in order")}</Heading>

      {!topic ? (
        <div className="mt-6 max-w-2xl">
          <Offline what={L("The server that reports finished videos is not answering. The plan below does not depend on it.")} />
        </div>
      ) : null}

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {made === 0
          ? L("This topic is planned as a series of short videos, called clips. No clip is made yet. The list below gives the 22 steps in the order the clips will be made. The mathematics of every step can already be tried on the interactive pages of this topic, under Play.")
          : L("Videos made so far: {{made}} of {{total}} steps.", { made, total: STEPS.length })}
      </Text>

      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Steps 17 to 19 are about fractals: shapes that stay rough however closely they are examined. A separate topic of this site covers them:")}{" "}
        <Link to="/topics/fractals/parts" className="text-selected hover:underline">
          {L("Fractals")}
        </Link>
        {L(". It was made first, so this topic links to it instead of repeating it.")}
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
                <span data-text="note" className="ml-auto shrink-0">{L("In the Fractals topic")}</span>
              ) : (
                <span data-text="note" className="ml-auto shrink-0">{L("Not made yet")}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
