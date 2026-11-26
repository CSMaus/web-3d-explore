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
  { id: "ifs", name: L("Iterated maps"), summary: L("A few moves, each one shrinking, turning and shifting the plane, applied to one point again and again in random order. The points pile up on one fixed shape, such as a fern") },
  { id: "lsystem", name: L("Rewriting systems"), summary: L("A short word of letters rewritten by a few rules, all letters at once, several times over. The final word is then read as orders for a drawing pen, and it draws a plant, a curve or a snowflake") },
  { id: "lichtenberg", name: L("Dielectric breakdown"), summary: L("How does a spark choose its path through glass or wood? Such a material does not conduct electricity, and is called a dielectric. When a strong enough voltage burns a path through it, this is called dielectric breakdown. The model splits the material into square cells. The spark starts from one cell and burns one more cell at a time. A cell next to the tips of the burn, where the electric field is strongest, is the most likely to burn next. The result is a branching mark like the one a real spark leaves") },
  { id: "dla", name: L("Wandering particles"), summary: L("What shape grows when particles wander at random and stick where they land? One particle is fixed at the centre of a square grid. Other particles are released one at a time. Each one moves by random steps until it lands next to a particle already in place, and then it stays there. The clump of stuck particles is called the cluster. It grows thin branching arms. The process is called diffusion-limited aggregation. Random wandering of particles is called diffusion, and the particles gather, or aggregate, only as fast as their wandering brings them") },
  { id: "julia", name: L("Julia sets"), summary: L("Which starting points stay near the centre forever when one step is repeated without end? Each point of the plane is written as a number with two parts: how far across and how far up. Such a number is called a complex number. Its two parts are joined by the letter i, a number whose square is minus one. The step squares the point's number and adds a fixed number c. The result is the next point, and the step is repeated on it. Some starting points stay near the centre. Others move further away with every step and never come back: they escape. The points that never escape form a filled shape, and its edge is called the Julia set of c. The page starts at c = -0.5 + 0.5i. The two c sliders change c, and the big picture shows the shape for that c. The thing to watch: for some c the shape is one piece, for others it falls apart into dust") },
  { id: "mandelbrot", name: L("The Mandelbrot set"), summary: L("Start from 0, square, add a fixed number c, and repeat: for which c does the result stay near 0 forever? Each point of the plane is written as a complex number: a number with two parts, how far across and how far up, joined by the letter i, a number whose square is minus one. Each point of this picture is one value of c. For each c the computer starts from 0 and repeats the step. If the result stays within 2 of the centre for every step tried, c belongs to the Mandelbrot set and is drawn in the solid tone. If it escapes past 2, c is shaded by how many steps that took. The same values of c decide another picture, the Julia set of c: it holds together in one piece exactly when c is in the Mandelbrot set. The view starts centred on -0.6 with half the width of the view at 1.6. A click centres the picture and the zoom slider magnifies it. The thing to watch: at every zoom the edge shows new detail") },
  { id: "mandelbulb", name: L("The three-dimensional set"), summary: L("Is there a solid in space built the way the Mandelbrot set is built? The flat Mandelbrot set comes from one step: square a point of the plane, add a fixed point c, repeat from 0, and keep the c for which the point never runs off. Squaring a point of the plane squares its distance from the centre and doubles its angle. A point in space has a distance r from the centre and two angles. This solid replaces squaring with a power n: the distance is raised to the power n and both angles are multiplied by n. Then c is added, and the step is repeated. The points that never run off form the solid on the screen, drawn at power 8. The camera circles it. The thing to watch: the number of folds around the vertical axis is one fewer than the power") },
];

function PlayIndex() {
  const theory = Route.useLoaderData();
  const systems = (theory ? theory.systems : LOCAL).filter((s) => SYSTEMS.some((p) => p.id === s.id));
  return (
    <div>
      <Heading level={1} className="mt-6">{L("Rules that draw fractals")}</Heading>
      <Text kind="intro" as="p" className="mt-3 max-w-2xl">
        {L("Can a short rule, repeated many times, draw a fern, a branching spark or a curve like a coastline? Each page below runs one such rule and draws the result. Its sliders change the numbers of the rule, and the picture redraws. A readout gives the dimension of what is drawn, a number that says how rough the shape is: 1 for a smooth line, 2 for a filled area. Each page also shows the rule's formulas, and its colours can be changed. Shapes like these, rough at every magnification, are called fractals.")}
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
