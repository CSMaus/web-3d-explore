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
  { id: "line", name: L("Numbers on a line, and the one question they cannot answer"), summary: L("Every ordinary number is a point on a line. Adding a number slides the line, multiplying stretches it, and multiplying by minus one flips it over. The numbers from minus three to three are tried one by one: none of them, multiplied by itself, gives minus one.") },
  { id: "turn", name: L("What 𝑖 is"), summary: L("Multiplying by minus one turns every arrow from zero half way round. A number that turns an arrow only a quarter of the way round is written i. Two quarter turns make a half turn, so i times i is minus one.") },
  { id: "add", name: L("Complex numbers: adding"), summary: L("A complex number is a point of a flat plane: so far across and so far up. Drawn as an arrow from zero, two such numbers are added by placing a copy of the second arrow at the tip of the first. The across parts add together, and the up parts add together.") },
  { id: "multiply", name: L("Complex numbers: multiplying"), summary: L("Each arrow from zero has a length and an angle. Multiplying two complex numbers multiplies their lengths and adds their angles. The page turns and stretches one arrow until it becomes the product.") },
  { id: "square", name: L("Which points stay near zero? The Mandelbrot set"), summary: L("Start at zero, multiply the number by itself, add a fixed complex number c, and repeat. For some values of c the results stay close to zero for ever; for others they run off. The values of c that stay close form a shape called the Mandelbrot set.") },
  { id: "round", name: L("Euler's formula: a point that goes round a circle"), summary: L("A point that is always pushed at right angles to the line from zero goes round a circle. Written with i, this motion is Euler's formula. Its shadows on the two axes are the cosine and the sine waves, and half a turn lands on minus one.") },
  { id: "quaternions", name: L("Quaternions: turns in space"), summary: L("A turn in three-dimensional space can be written with four numbers, called a quaternion: one for how far to turn and three for the axis. An axis and an angle are chosen, a house turns step by step, and the four numbers of the turn are shown.") },
];

function ComplexIndex() {
  const theory = Route.useLoaderData();
  const items = (theory?.systems.length ? theory.systems : LOCAL).filter((s) => SYSTEMS.some((p) => p.id === s.id));
  return (
    <>
      <Heading level={1} className="mt-4">{L("The pages, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Seven pages for a reader who has never met an imaginary number. They start from the ordinary number line and the one question it cannot answer: which number, multiplied by itself, gives minus one? Each page has the same three parts in the same places: the settings, a run button, and what came out. By the fifth page a well-known shape, the Mandelbrot set, can be read as a map of a calculation.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">{L("The page descriptions could not be loaded from the server, so copies built into the site are shown. Everything on these pages works without the server.")}</Text>
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
