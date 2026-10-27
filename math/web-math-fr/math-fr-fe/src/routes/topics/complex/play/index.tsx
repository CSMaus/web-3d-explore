import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { TOPIC, routeOf, type ComplexRoute, SYSTEMS } from "@/lib/complex";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/complex/play/")({
  loader: () => api.theory(TOPIC),
  component: ComplexIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
export const LOCAL: { id: string; name: string; summary: string }[] = [
  { id: "line", name: L("Numbers on a line, and the one question they cannot answer"), summary: L("Adding slides the line, multiplying stretches it, minus one flips it. Try every number: none of them squares to minus one.") },
  { id: "turn", name: L("What 𝑖 is"), summary: L("Minus one is a half turn. The number that does half of that, a quarter turn, is 𝑖, and twice is minus one. Watch it go round.") },
  { id: "add", name: L("Complex numbers: adding"), summary: L("Every number is an arrow. Add two by walking one out from the other's tip. The two parts never mix.") },
  { id: "multiply", name: L("Complex numbers: multiplying"), summary: L("Lengths multiply, angles add. Watch one arrow turned and stretched into the product.") },
  { id: "square", name: L("Which points stay?"), summary: L("Start at zero, square and add c, again and again. For some c the path stays near zero; for others it runs away. The values of c that stay form the Mandelbrot set.") },
  { id: "round", name: L("Euler's formula"), summary: L("Growth at an imaginary rate does not grow: it circles. Its two shadows are the sine and the cosine, and at half a turn it lands on minus one.") },
  { id: "quaternions", name: L("Quaternions"), summary: L("Three units for the three axes of space. Pick an axis and an angle, turn the house step by step, and read the four numbers that do it.") },
];

function ComplexIndex() {
  const theory = Route.useLoaderData();
  const items = (theory?.systems.length ? theory.systems : LOCAL).filter((s) => SYSTEMS.some((p) => p.id === s.id));
  return (
    <>
      <Heading level={1} className="mt-4">{L("The pages, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("For a reader who has never met an imaginary number. Every page has the same three parts in the same places: what goes in, run, what came out. By the last page the Mandelbrot set on the fractals pages is something that can be read.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">{L("The descriptions come from the backend, which is not answering; this page needs nothing from it.")}</Text>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} number={i + 1} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </>
  );
}

function Tile({ to, number, name, summary, delay }: { to: ComplexRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
