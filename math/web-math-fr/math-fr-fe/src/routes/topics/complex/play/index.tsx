import { Link, createFileRoute } from "@tanstack/react-router";
import { api } from "@/lib/api";
import { TOPIC, routeOf, type ComplexRoute } from "@/lib/complex";
import { useRise } from "@/lib/reveal";
import { ComplexFrame } from "./-shared";

export const Route = createFileRoute("/topics/complex/play/")({
  loader: () => api.theory(TOPIC),
  component: ComplexIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
export const LOCAL: { id: string; name: string; summary: string }[] = [
  { id: "line", name: "Numbers on a line, and the one question they cannot answer", summary: "Adding slides the line, multiplying stretches it, minus one flips it. Try every number: none of them squares to minus one." },
  { id: "turn", name: "A quarter turn, called i", summary: "Minus one is a half turn. The number that does half of that, a quarter turn, is i, and twice is minus one. Watch it go round." },
  { id: "add", name: "Adding: arrows tip to tail", summary: "Every number is an arrow. Add two by walking one out from the other's tip. The two parts never mix." },
  { id: "multiply", name: "Multiplying: turn and stretch", summary: "Lengths multiply, angles add. Watch one arrow turned and stretched into the product." },
  { id: "square", name: "Squaring, again and again", summary: "Square a number over and over: inside the circle it falls to zero, outside it runs away. Add a shift each time and the boundary is a Julia set." },
  { id: "round", name: "The exponential goes round", summary: "Growth at an imaginary rate does not grow: it circles. Its two shadows are the sine and the cosine, and at half a turn it lands on minus one." },
  { id: "quaternions", name: "Beyond i: turns in space, and where they are used", summary: "Three imaginary units instead of one, turning a shape in space. Two turns in a different order land differently, and so the numbers cannot commute." },
];

function ComplexIndex() {
  const theory = Route.useLoaderData();
  const items = theory?.systems.length ? theory.systems : LOCAL;
  return (
    <ComplexFrame>
      <h1 className="mt-4 font-mono text-sm tracking-wide text-leaf">Seven pages, from nothing</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        For a reader who has never met an imaginary number. Every page has the same three parts in
        the same places: what goes in, run, what came out. By the last page the Julia set on the
        fractals pages is something you can read.
      </p>
      {!theory ? (
        <p className="mt-3 text-[11px] text-muted">The descriptions come from the backend, which is not answering; this page needs nothing from it.</p>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </ComplexFrame>
  );
}

function Tile({ to, name, summary, delay }: { to: ComplexRoute; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise">
      <Link to={to} className="block rounded border border-edge p-4 transition-colors hover:border-leaf">
        <div className="font-mono text-sm text-ink">{name}</div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{summary}</p>
      </Link>
    </div>
  );
}
