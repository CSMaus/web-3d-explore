import { Link, createFileRoute } from "@tanstack/react-router";
import { NetTabs } from "@/components/NetTabs";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { NETWORKS, TOPIC, routeOf, type NetRoute } from "@/lib/networks";
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
  { id: "line", name: "Draw the line yourself", summary: "Two colours of dots. You draw the dividing line, then a perceptron tries, one correction at a time, and hits the wall it hit in 1969" },
  { id: "unit", name: "Inside one unit", summary: "Three numbers and a squash. Move them by hand, watch the plane recolour, then let the unit move them itself" },
  { id: "layers", name: "Many units, one answer", summary: "Several lines, weighed together. What each middle unit alone sees, and the bent boundary the last one makes of them" },
  { id: "learn", name: "How it learns, and how fast", summary: "Step size, batch size and the standard tricks, with finished runs kept on one chart. And the one-shot formula that works only without bends" },
  { id: "blame", name: "The correction, one dot at a time", summary: "One correction in six moments: forward, the miss, the blame flowing back, every number moving. Backpropagation, checked against nudging" },
  { id: "pictures", name: "The same job on a picture", summary: "One small pattern slid over a drawing, the strongest fits kept, the nearest shape named. A convolution, and why the shape may move" },
  { id: "sequence", name: "The same job on a sequence", summary: "Numbers arriving one a step; say the first one at the end. A gated memory cell beside a plain loop" },
  { id: "words", name: "The same job on words", summary: "Each word decides which words to listen to. One head of attention, wired by hand so the pattern can be read" },
];

function NetIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <h1 className="mt-4 font-mono text-sm tracking-wide text-leaf">Thirteen pages, one job</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        Every page here has the same three parts in the same places: what goes in, a run button,
        and what came out. The first five are the calculus as things that move. The next five
        are one job, two colours of dots, learned by a network page after page. The last three
        are the same job on a picture, a sequence and a sentence. Nothing is a stated result:
        every number on a page is computed in the browser from what is on the screen.
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
  to: NetRoute;
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
