import { Link, createFileRoute } from "@tanstack/react-router";
import { PlayTabs } from "@/components/PlayTabs";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { useRise } from "@/lib/reveal";
import { TOPIC, routeOf, type SystemRoute } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";

export const Route = createFileRoute("/topics/fractals/play/")({
  loader: () => api.theory(TOPIC),
  component: PlayIndex,
});

const LOCAL = [
  { id: "ifs", name: "iterated maps", summary: "a point moved by a handful of affine moves" },
  { id: "lsystem", name: "rewriting systems", summary: "a seed word rewritten, then walked" },
  { id: "lichtenberg", name: "dielectric breakdown", summary: "the figure a discharge burns" },
  { id: "dla", name: "wandering particles", summary: "walkers that stick where they touch" },
  { id: "julia", name: "Julia sets", summary: "the points whose walk never escapes" },
  { id: "mandelbrot", name: "the Mandelbrot set", summary: "the same test over every constant" },
  { id: "mandelbulb", name: "the three-dimensional set", summary: "the same rule, one power up" },
];

function PlayIndex() {
  const theory = Route.useLoaderData();
  const systems = theory ? theory.systems : LOCAL;
  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-24">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="mt-6 font-mono text-sm tracking-wide text-leaf">pick something to move</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted">
        every system carries its equations, its parameters as controls, a colour scheme that can be
        changed, and the dimension measured from whatever is on screen.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {systems.map((s, i) => (
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
  to: SystemRoute;
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
        <p className="mt-1 text-xs text-muted">{summary}</p>
      </Link>
    </div>
  );
}
