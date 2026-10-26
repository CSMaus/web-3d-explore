import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { TOPIC, routeOf, type NetRoute } from "@/lib/networks";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/networks/play/")({
  loader: () => api.theory(TOPIC),
  component: NetIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
const LOCAL: { id: string; name: string; summary: string }[] = [
  { id: "rate", name: "How fast is it going", summary: "A car on a road. Its speed, read from nothing but where it is: a change divided by a change, with the gap made small. The derivative" },
  { id: "rate2", name: "Is it speeding up or slowing down", summary: "The same ratio taken of the speed. The acceleration, and what its sign means for the car" },
  { id: "accumulate", name: "Adding it back up", summary: "Given only the speed, the distance: slices of speed times duration, added. The integral, and the derivative undone" },
  { id: "growth", name: "The thing that grows by how much there is", summary: "A fixed fraction of itself a year. The exponential, its doubling time, and the logarithm as a question about when" },
  { id: "slope", name: "Which way is down", summary: "A ball on a landscape, knowing only the ground under it. The gradient, and stepping against it" },
  { id: "line", name: "Draw the line by hand", summary: "Two colours of dots. The dividing line is drawn by hand, then a perceptron tries, one correction at a time, and hits the wall it hit in 1969" },
  { id: "nudge", name: "A small change, and what it does", summary: "One weight moved a little, again and again, on a hard unit and a smooth one. One answer creeps, the other jumps or does nothing. Why learning needs the smooth one" },
  { id: "unit", name: "Inside one unit", summary: "Three numbers and a squash. Move them by hand, watch the plane recolour, then let the unit move them itself" },
  { id: "layers", name: "Many units, one answer", summary: "Several lines, weighed together. What each middle unit alone sees, and the bent boundary the last one makes of them" },
  { id: "any", name: "Any curve at all", summary: "A row of units, each one step of a staircase, switched on one at a time until the staircase follows any curve chosen. What a network can draw, before any learning" },
  { id: "learn", name: "How it learns, and how fast", summary: "Step size, batch size and the standard tricks, with finished runs kept on one chart. And the one-shot formula that works only without bends" },
  { id: "blame", name: "The correction, one dot at a time", summary: "One correction in six moments: forward, the miss, the blame flowing back, every number moving. Backpropagation, checked against nudging" },
  { id: "slow", name: "Starting sure and wrong", summary: "One unit that starts almost certain of the wrong answer, trained twice: on the squared miss and on cross entropy. One barely moves for a long while. Why the cost is chosen the way it is" },
  { id: "fade", name: "The first layer learns last", summary: "Many layers stacked, and the blame measured as it flows back through them. It fades at every squash, and the layer that sees the dots moves least. The vanishing gradient, and the two fixes" },
  { id: "pictures", name: "The same job on a picture", summary: "One small pattern slid over a drawing, the strongest fits kept, the nearest shape named. A convolution, and why the shape may move" },
  { id: "sequence", name: "The same job on a sequence", summary: "Numbers arriving one a step; say the first one at the end. A gated memory cell beside a plain loop" },
  { id: "words", name: "The same job on words", summary: "Each word decides which words to listen to. One head of attention, wired by hand so the pattern can be read" },
];

function NetIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;

  return (
    <div>
      <Heading level={1} className="mt-4">Seventeen pages, one job</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        Every page here has the same three parts in the same places: what goes in, a run button,
        and what came out. The first five are the calculus as things that move. The next seven
        are one job, two colours of dots, learned by a network page after page, with the reason
        for each part shown rather than stated. The two after that are where learning stalls,
        and why. The last three are the same job on a picture, a sequence and a sentence.
        Nothing is a stated result: every number on a page is computed in the browser from what
        is on the screen.
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">
          The descriptions come from the backend, which is not answering; this page needs nothing
          from it and neither does any of the mathematics.
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

function Tile({ to, number, name, summary, delay }: { to: NetRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
