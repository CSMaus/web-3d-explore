import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";
import { SYSTEMS, TOPIC, routeOf, type SystemRoute } from "@/lib/systems";

export const Route = createFileRoute("/topics/fractals/play/")({
  loader: () => api.theory(TOPIC),
  component: PlayIndex,
});

const LOCAL = [
  { id: "ifs", name: L("Iterated maps"), summary: L("A point moved by a handful of affine moves") },
  { id: "lsystem", name: L("Rewriting systems"), summary: L("A seed word rewritten, then walked") },
  { id: "lichtenberg", name: L("Dielectric breakdown"), summary: L("The figure a discharge burns") },
  { id: "dla", name: L("Wandering particles"), summary: L("Walkers that stick where they touch") },
  { id: "julia", name: L("Julia sets"), summary: L("The points whose walk never escapes") },
  { id: "mandelbrot", name: L("The Mandelbrot set"), summary: L("The same test over every constant") },
  { id: "mandelbulb", name: L("The three-dimensional set"), summary: L("The same rule, one power up") },
];

function PlayIndex() {
  const theory = Route.useLoaderData();
  const systems = (theory ? theory.systems : LOCAL).filter((s) => SYSTEMS.some((p) => p.id === s.id));
  return (
    <div>
      <Heading level={1} className="mt-6">{L("Pick something to move")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Every system carries its equations, its parameters as controls, a colour scheme that can be changed, and the dimension measured from whatever is on screen.")}
      </Text>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {systems.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} number={i + 1} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

function Tile({ to, number, name, summary, delay }: { to: SystemRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
