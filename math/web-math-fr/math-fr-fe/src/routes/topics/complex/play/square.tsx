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
 * motion as the fractals series figure "Which points stay?", and the path from zero is drawn for
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
      title={system?.name ?? L("Which points stay?")}
      job={L("Take a number c. Start at zero, square, add c, and do it again and again. Each squaring doubles the angle and squares the length, as on the page before, and c moves the result. For some values of c the path stays near zero for ever; for others its length passes two and it runs away. Every c whose path stays is filled in, and together they form the Mandelbrot set. Here c travels round a loop that crosses the edge of the set, so the path can be watched changing from staying to running away.")}
      input={
        <Text kind="note" as="p">
          {L("Click anywhere on the map to put c there and hold it. Press run to send c round the loop again.")}
        </Text>
      }
      run={
        <RunBar
          running={runner.running && held === null}
          count={degrees}
          limit={ROUND}
          what={L("degrees round the loop")}
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
            setDegrees((v) => Math.min(ROUND, v + many));
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
            {L("Filled shape: every c whose path stays. Lighter outside it, near its edge: the path runs away later. The dot: c. The line: the path from zero, one point for every square and add. Faint loop: the route c travels. Faint circle: length two, past which the path never comes back.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={stays}>
            {stays
              ? L("c = {{c}}: the path stays near zero for all {{n}} steps. This c is in the Mandelbrot set.", { c: show(c), n: MOST })
              : left === 1
                ? L("c = {{c}}: after {{n}} step the length passed two and the path runs away. This c is outside the set.", { c: show(c), n: left })
                : L("c = {{c}}: after {{n}} steps the length passed two and the path runs away. This c is outside the set.", { c: show(c), n: left })}
          </Verdict>
          <Readout
            rows={[
              ["c", show(c)],
              [L("Length of c"), abs(c).toFixed(3)],
              [L("Last point inside length two"), show(last)],
              [L("Left, after"), left === null ? L("not within {{n}}", { n: MOST }) : left === 1 ? L("{{n}} step", { n: left }) : L("{{n}} steps", { n: left })],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The edge of the filled shape is where the path changes from staying to running away. The fractals topic zooms into that edge.")}
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
