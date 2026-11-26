import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { TOPIC, routeOf, type ChaosRoute, SYSTEMS } from "@/lib/chaos";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/play/")({
  loader: () => api.theory(TOPIC),
  component: ChaosIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
const LOCAL: { id: string; name: string; summary: string }[] = [
  {
    id: "field",
    name: L("One equation for change, drawn as strokes"),
    summary: L("An equation that gives, for every value and every moment, how fast a quantity changes. Drawn as short strokes, it shows the shape of every possible answer before anything is calculated"),
  },
  {
    id: "solvers",
    name: L("Solving an equation step by step"),
    summary: L("When no formula gives the answer, it is built in small steps: read the rate of change, move a little, repeat. The size of the step decides how close the result stays to the true answer"),
  },
  {
    id: "phase",
    name: L("Two quantities at once: the phase plane"),
    summary: L("Two quantities that change together, such as the position and the speed of a swing. Their pair of values is drawn as one point, and its history as one curve"),
  },
  {
    id: "lorenz",
    name: L("The Lorenz system"),
    summary: L("Three equations written by Edward Lorenz in 1963 as a much simplified model of a layer of fluid heated from below. Two starts that differ by a tiny amount soon move completely apart. This is chaos, and three quantities are the fewest in which a smooth motion can be chaotic"),
  },
  {
    id: "rossler",
    name: L("The Rossler system"),
    summary: L("Three equations built by Rossler in 1976 to be the simplest system with the same unpredictable behaviour. Two of the equations only add and scale the quantities, and only one term multiplies two of them together"),
  },
  {
    id: "logistic",
    name: L("The logistic map"),
    summary: L("A rule that turns one number into the next, applied over and over. One number is enough for chaos here, where a smooth motion needs three, so everything is quick to compute and to draw"),
  },
  {
    id: "bifurcation",
    name: L("The bifurcation diagram"),
    summary: L("The rule x → r x (1 - x) turns one number into the next. Its setting r runs along the bottom of one picture, and above each r are all the numbers the sequence keeps returning to. Every change of behaviour shows in that one picture"),
  },
];

function ChaosIndex() {
  const theory = Route.useLoaderData();
  const items = (theory?.systems.length ? theory.systems : LOCAL).filter((s) => SYSTEMS.some((p) => p.id === s.id));

  return (
    <div>
      <Heading level={1} className="mt-4">{L("Choose a page to try")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Each page below shows one system: a rule for how some numbers change over time. Each page has the equations, sliders for the fixed numbers in them, and readouts measured from what is on the screen. No result is copied from a book. The growth rates, the dimensions and Feigenbaum's constant are all computed in the browser while the page is open.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">
          {L("The short descriptions below come from the site's server, which is not answering now. The pages themselves do not need the server: every calculation runs in the browser.")}
        </Text>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} number={i + 1} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

function Tile({ to, number, name, summary, delay }: { to: ChaosRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
