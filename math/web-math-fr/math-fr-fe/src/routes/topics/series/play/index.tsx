import { createFileRoute } from "@tanstack/react-router";
import { Text, Heading } from "@kit/index";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { TOPIC, routeOf, type SeriesRoute, SYSTEMS } from "@/lib/series";
import { PlayTile } from "@/components/PlayTile";
import { useRise } from "@/lib/reveal";

export const Route = createFileRoute("/topics/series/play/")({
  loader: () => api.theory(TOPIC),
  component: SeriesIndex,
});

/** the same names and summaries the backend serves, so the page stands alone. */
export const LOCAL: { id: string; name: string; summary: string }[] = [
  { id: "taylor", name: L("Taylor series: a curve from powers of x"), summary: L("How a calculator finds sin(0.5) with nothing but adding and multiplying: a sum of powers of x that copies the curve at one point, built one term at a time.") },
  { id: "radius", name: L("Where a series stops working"), summary: L("The curve 1/(1 + x^2) is smooth everywhere, yet its series about 0 fails for x beyond 1 or below -1. The cause is two points that lie outside the ordinary number line.") },
  { id: "fourier", name: L("Fourier series: a wave from turning circles"), summary: L("A square wave, a sawtooth and a triangle wave built from sine waves. Each sine wave comes from a turning circle, and circles placed on circles draw the whole wave.") },
  { id: "draw", name: L("Any outline drawn by turning circles"), summary: L("The outline of a letter or of an uploaded picture, redrawn by a chain of turning circles, from one circle up to two hundred.") },
  { id: "frequencies", name: L("A photograph kept with only its strongest waves"), summary: L("A photograph cut into blocks of 8 by 8 pixels, each block written as a sum of 64 waves and rebuilt from only the strongest of them: the main idea of JPEG.") },
];

function SeriesIndex() {
  const theory = Route.useLoaderData();
  const items = (theory?.systems.length ? theory.systems : LOCAL).filter((s) => SYSTEMS.some((p) => p.id === s.id));
  return (
    <>
      <Heading level={1} className="mt-4">{L("The pages, in order")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("A series is a sum of many simple terms. Five pages build curves and drawings from such sums.")}
      </Text>
      {!theory ? (
        <Text kind="note" as="p" className="mt-3">{L("The descriptions below are stored copies, because the server that normally sends them is not answering. Nothing else on this page depends on the server.")}</Text>
      ) : null}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((s, i) => (
          <Tile key={s.id} to={routeOf(s.id)} number={i + 1} name={s.name} summary={s.summary} delay={i * 60} />
        ))}
      </div>
    </>
  );
}

function Tile({ to, number, name, summary, delay }: { to: SeriesRoute; number: number; name: string; summary: string; delay: number }) {
  const ref = useRise<HTMLDivElement>(delay);
  return (
    <div ref={ref} className="rise h-full">
      <PlayTile to={to} number={number} label={name} summary={summary} />
    </div>
  );
}
