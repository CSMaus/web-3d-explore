import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { L } from "@/lib/lang";
import { INK, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { show, spin } from "@/systems/complex";

export const Route = createFileRoute("/topics/complex/play/round")({
  loader: () => api.system(TOPIC, "round"),
  component: RoundPage,
});

const CIRCLE: Box = { x0: -1.4, x1: 1.4, y0: -1.4, y1: 1.4 };
const TICKS = 240;

function RoundPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [turnsTotal, setTurnsTotal] = useState(1);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: TICKS });
  const at = Math.min(tick, TICKS);
  const theta = (at / TICKS) * turnsTotal * 2 * Math.PI;
  const z = spin(theta);
  const trail = useMemo(() => Array.from({ length: at + 1 }, (_, i) => spin((i / TICKS) * turnsTotal * 2 * Math.PI)), [at, turnsTotal]);
  const waveBox: Box = { x0: 0, x1: turnsTotal * 2 * Math.PI, y0: -1.3, y1: 1.3 };
  const nearPi = Math.abs(theta - Math.PI) < (turnsTotal * 2 * Math.PI) / TICKS;
  const reset = () => {
    runner.reset();
    setTick(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Euler's formula: a point that goes round a circle")}
        job={L("What happens to a quantity that grows at an imaginary rate? Ordinary growth by a fixed fraction of itself, like money at compound interest, is called exponential growth. There the rate of change points the same way as the quantity, so the quantity keeps getting bigger. Multiplying the rate by 𝑖 turns it a quarter turn: it now points sideways, at right angles to the line from zero to the point. A point that is always pushed sideways moves neither away from zero nor towards it. It goes round a circle of radius one at a steady pace. This motion is written e to the 𝑖 theta: e is the number about 2.718 that describes growth, and theta is the angle turned so far. Pressing run increases the angle and moves the point round the circle; its two shadows on the axes are drawn beside it as waves. The thing to look for: where the point is after half a turn.")}
        input={
          <div className="space-y-3">
            <Slider label={L("Number of turns")} min={0.5} max={3} step={0.5} value={turnsTotal} format={(v) => (v === 1 ? L("{{v}} turn", { v }) : L("{{v}} turns", { v }))} onChange={(v) => { setTurnsTotal(v); reset(); }} />
            <Text kind="note" as="p">
              {L("The angle is measured in radians. One radian is the angle at which the arc of a circle is as long as the circle's radius. A full turn is 2 times pi radians, about 6.28, where pi is about 3.14. Half a turn is pi radians.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(theta * 100) / 100}
            limit={Math.round(turnsTotal * 2 * Math.PI * 100) / 100}
            what={L("radians")}
            onToggle={() => {
              if (!runner.running && at >= TICKS) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <div data-slot="plot" className="h-[320px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={CIRCLE}
                  equal
                  deps={[trail, z]}
                  draw={(pen) => {
                    ticks(pen, { x: 0.5, y: 0.5 });
                    pen.axes("#3a4048");
                    const unit: [number, number][] = [];
                    for (let i = 0; i <= 120; i++) unit.push([Math.cos((i / 120) * 2 * Math.PI), Math.sin((i / 120) * 2 * Math.PI)]);
                    pen.line(unit, "#2c3540", 1);
                    pen.line(trail, ONE, 2);
                    pen.arrow(0, 0, z[0], z[1], INK);
                    // the two shadows: along, and up
                    pen.line([[z[0], z[1]], [z[0], 0]], SKY, 1);
                    pen.line([[z[0], z[1]], [0, z[1]], ], TWO, 1);
                    pen.dot(z[0], 0, 4, SKY);
                    pen.dot(0, z[1], 4, TWO);
                    pen.dot(z[0], z[1], 5, INK);
                  }}
                />
              </div>
              <Caption>{L("The circle of radius one around zero. The thick arc is the path of the point so far, and the arrow from zero points to the point itself, e to the 𝑖 theta at the current angle. Two thin lines run from the point to the axes. The dot on the horizontal axis is the point's shadow there, called the cosine of the angle. The dot on the vertical axis is its shadow there, called the sine.")}</Caption>
            </div>
            <div>
              <div data-slot="plot" className="h-[320px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={waveBox}
                  deps={[at, turnsTotal]}
                  draw={(pen) => {
                    ticks(pen, { x: Math.PI / 2, y: 0.5, xFormat: (v) => `${(v / Math.PI).toFixed(1)}π` });
                    pen.axes("#3a4048");
                    const cos: [number, number][] = [];
                    const sin: [number, number][] = [];
                    for (let i = 0; i <= at; i++) {
                      const th = (i / TICKS) * turnsTotal * 2 * Math.PI;
                      cos.push([th, Math.cos(th)]);
                      sin.push([th, Math.sin(th)]);
                    }
                    pen.line(cos, SKY, 1.8);
                    pen.line(sin, TWO, 1.8);
                    pen.dot(theta, z[0], 4, SKY);
                    pen.dot(theta, z[1], 4, TWO);
                    pen.line([[Math.PI, -1.3], [Math.PI, 1.3]], "#3a3f47", 1);
                  }}
                />
              </div>
              <Caption>{L("The two shadows plotted against the angle, which runs along the bottom in multiples of pi. The curve that starts at height one is the cosine. The curve that starts at zero is the sine. The thin vertical line marks pi, half a turn.")}</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={nearPi ? true : undefined}>
              {at === 0
                ? L("The angle is zero and the point is at 1, on the horizontal axis. Press run: the angle grows at a steady rate.")
                : nearPi
                  ? L("The angle is pi, half a turn, and the point is at {{z}}: minus one. This is the well-known formula e to the 𝑖 pi equals minus one. It says that half a turn round the circle ends opposite the starting point.", { z: show(z) })
                  : L("At angle {{a}} radians the point is at {{z}}: {{c}} across, which is the cosine, and {{s}} up, which is the sine. Its distance from zero is exactly one. The point is always pushed sideways, so it moves neither away from zero nor towards it: it goes round.", { a: theta.toFixed(2), z: show(z), c: z[0].toFixed(3), s: z[1].toFixed(3) })}
            </Verdict>
            <Readout
              rows={[
                [L("Angle so far, in radians"), theta.toFixed(4)],
                [L("Angle so far, in whole turns"), (theta / (2 * Math.PI)).toFixed(4)],
                [L("The point, e to the 𝑖 theta"), show(z, 4)],
                [L("Cosine: the shadow on the horizontal axis"), z[0].toFixed(4)],
                [L("Sine: the shadow on the vertical axis"), z[1].toFixed(4)],
                [L("Distance from zero, always one"), Math.hypot(z[0], z[1]).toFixed(6)],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Euler's formula says in one line what the picture shows: e to the 𝑖 theta equals cos theta plus 𝑖 times sin theta. The number e to the 𝑖 theta has length one, so multiplying any complex number by it turns that number's arrow by the angle theta and does not stretch it. This is why the formula appears wherever something turns or swings back and forth: in waves, in alternating current, in a swinging pendulum.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-round" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
