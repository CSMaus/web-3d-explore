import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { lay, picture } from "@/components/projects/escape";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { EDGE, FAINT, GROUND, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { useRunner } from "@/lib/runner";
import { abs, show, type C } from "@/systems/complex";

export const Route = createFileRoute("/topics/complex/play/square")({
  loader: () => api.system(TOPIC, "square"),
  component: SquarePage,
});

/**
 * which values of c stay: start at zero, square and add c, again and again. the map is the
 * Mandelbrot set, every c whose path stays; c travels round a loop that crosses its edge, the same
 * motion as the fractals series figure "Which points stay near zero? The Mandelbrot set", and the path from zero is drawn for
 * each c, staying near or running away. a click holds c where it lands.
 */

const BOX: Box = { x0: -2.3, x1: 0.9, y0: -1.4, y1: 1.4 };
const MOST = 40;
const ROUND = 360;

/** the loop c travels, the one of the series figure: it crosses the edge of the set four times */
function onLoop(degrees: number): C {
  const a = (degrees * Math.PI) / 180;
  return [-0.45 + 0.42 * Math.cos(a), 0.5 * Math.sin(a)];
}

/** the path from zero under z to z squared plus c, and the step at which it left, if it did */
function pathOf(c: C): { path: C[]; left: number | null } {
  let z: C = [0, 0];
  const path: C[] = [z];
  for (let n = 1; n <= MOST; n++) {
    z = [z[0] * z[0] - z[1] * z[1] + c[0], 2 * z[0] * z[1] + c[1]];
    if (z[0] * z[0] + z[1] * z[1] > 4) return { path, left: n };
    path.push(z);
  }
  return { path, left: null };
}

const round2 = (v: number) => Math.round(v * 100) / 100;

function SquarePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [degrees, setDegrees] = useState(0);
  const [held, setHeld] = useState<C | null>(null);
  const [perFrame, setPerFrame] = useState(0.35);
  const runner = useRunner((n) => setDegrees(n), { perFrame, stopAt: ROUND });

  // the page opens moving, as the figure does, unless the reader asked for less motion
  const { play } = runner;
  useEffect(() => {
    const still = typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    if (!still) play();
    // only on opening
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const c = held ?? onLoop(degrees);
  const { path, left } = useMemo(() => pathOf(c), [c[0], c[1]]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = path[path.length - 1];
  const stays = left === null;
  const loop = useMemo(() => Array.from({ length: 121 }, (_, i) => onLoop((i / 120) * ROUND)), []);

  const again = () => {
    setHeld(null);
    runner.reset();
    setDegrees(0);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Which points stay near zero? The Mandelbrot set")}
      job={L("Which numbers c keep a repeated calculation close to zero? The calculation: start at zero, multiply the result by itself, add c, and repeat again and again. Here c is a complex number: a point of a flat plane, written a + bi, where a is how far across from zero and b is how far up. Multiplying a complex number by itself doubles its angle and squares its length, the distance from zero; adding c then shifts the result. The results form a path of points that starts at zero. For some c the path stays close to zero for ever. For other c the distance from zero grows past two, and after that the path always runs off. The values of c whose paths stay are filled in on the map, and together they form a shape called the Mandelbrot set. On this page c moves round a loop that crosses the edge of the set, so the path can be seen switching from staying to running off.")}
      input={
        <Text kind="note" as="p">
          {L("A click anywhere on the map puts c there and holds it still. Pressing run sends c round the loop again.")}
        </Text>
      }
      run={
        <RunBar
          running={runner.running && held === null}
          count={degrees}
          limit={ROUND}
          what={L("degrees of the way round the loop")}
          onToggle={() => {
            if (held !== null || degrees >= ROUND) {
              again();
              runner.play();
              return;
            }
            runner.toggle();
          }}
          onStep={(many) => {
            setHeld(null);
            runner.once(many);
          }}
          onReset={again}
          perFrame={perFrame}
          onSpeed={setPerFrame}
          pace="slow"
        />
      }
      picture={
        <section ref={stage}>
          <div data-slot="plot" className="h-[min(500px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={BOX}
              equal
              deps={[c[0], c[1]]}
              onPick={(x, y) => {
                runner.pause();
                setHeld([round2(x), round2(y)]);
              }}
              draw={(pen) => {
                const v = pen.box;
                const w = Math.max(60, Math.min(520, Math.round(pen.width / 2)));
                const h = Math.max(40, Math.round((w * (v.y1 - v.y0)) / (v.x1 - v.x0)));
                lay(pen, picture("complex-escape", w, h, { cx: (v.x0 + v.x1) / 2, cy: (v.y0 + v.y1) / 2, span: v.x1 - v.x0 }, { ground: GROUND, mid: FAINT, hot: MUTED, inside: EDGE }, undefined, 60), v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
                const two: [number, number][] = [];
                for (let i = 0; i <= 120; i++) two.push([2 * Math.cos((i / 120) * 2 * Math.PI), 2 * Math.sin((i / 120) * 2 * Math.PI)]);
                pen.line(two, FAINT, 1);
                pen.line(loop, FAINT, 1);
                pen.line(path, stays ? SKY : TWO, 1.2);
                pen.dot(c[0], c[1], 5, stays ? ONE : TWO);
              }}
            />
          </div>
          <Caption>
            {L("A map of values of c. The filled shape: every c whose path stays near zero, the Mandelbrot set. Just outside the shape, shading shows how long the path takes to run off: the nearer the shape, the longer the path stays. The dot: the current c. The line from zero: its path, one point for each squaring and adding of c. The thin loop: the route that c travels. The thin circle around zero: the points at distance two; a path that goes past it never comes back.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={stays}>
            {stays
              ? L("c = {{c}}: for all {{n}} steps the path stayed within distance two of zero. This c is in the Mandelbrot set.", { c: show(c), n: MOST })
              : left === 1
                ? L("c = {{c}}: after {{n}} step the distance from zero passed two, so the path runs off. This c is outside the set.", { c: show(c), n: left })
                : L("c = {{c}}: after {{n}} steps the distance from zero passed two, so the path runs off. This c is outside the set.", { c: show(c), n: left })}
          </Verdict>
          <Readout
            rows={[
              ["c", show(c)],
              [L("Length of c: its distance from zero"), abs(c).toFixed(3)],
              [L("Last point of the path within distance two of zero"), show(last)],
              [L("The path ran off"), left === null ? L("not within {{n}} steps", { n: MOST }) : L("at step {{n}}", { n: left })],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The edge of the filled shape is where the paths change from staying to running off. Magnified, the edge shows finer and finer detail without end. Another topic of this site, 'Fractals', zooms into that edge.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="complex-which-points-stay" />
          <Equations system={system} />
        </>
      }
    />
  );
}
