import { createFileRoute } from "@tanstack/react-router";
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
import { INK, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { show, spin } from "@/systems/complex";
import { ComplexFrame } from "./-shared";

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
    <ComplexFrame>
      <TaskPage
        title={system?.name ?? "The exponential goes round"}
        job="Topic 3 had a curve that grows by a fixed fraction of itself: the exponential. Give it an imaginary rate and it cannot grow, because its rate of change is its position turned a quarter, always sideways and never outward. So it goes round the unit circle at a steady pace. The job is to run the angle and watch the point go round, with its two shadows drawn as waves beside it."
        input={
          <div className="space-y-3">
            <Slider label="Turns" min={0.5} max={3} step={0.5} value={turnsTotal} format={(v) => `${v} turn${v === 1 ? "" : "s"}`} onChange={(v) => { setTurnsTotal(v); reset(); }} />
            <p className="text-[11px] text-muted">
              The angle is in radians: a full turn is two pi, about 6.28. Half a turn, pi, lands on
              minus one, and the page pauses to say so.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(theta * 100) / 100}
            limit={Math.round(turnsTotal * 2 * Math.PI * 100) / 100}
            what="radians"
            onToggle={() => {
              if (!runner.running && at >= TICKS) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(TICKS, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[320px_1fr]">
            <div>
              <div className="h-[320px] overflow-hidden rounded border border-edge">
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
              <Caption>The unit circle. White: e to the i theta at the angle so far. Sky: its shadow on the along axis, the cosine. Rose: its shadow on the up axis, the sine.</Caption>
            </div>
            <div>
              <div className="h-[320px] overflow-hidden rounded border border-edge">
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
              <Caption>The two shadows against the angle, in units of pi. Sky: the cosine. Rose: the sine. The faint line is at pi, half a turn.</Caption>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={nearPi ? true : undefined}>
              {at === 0
                ? "The angle is zero and the point is at 1. Press run and the angle grows at a steady rate."
                : nearPi
                  ? `The angle is pi, half a turn, and the point is at ${show(z)}: minus one. That is the famous line, e to the i pi equals minus one, and it says nothing more than that half a turn lands opposite where it started.`
                  : `At angle ${theta.toFixed(2)} the point is at ${show(z)}: cosine ${z[0].toFixed(3)} along, sine ${z[1].toFixed(3)} up, length exactly one. The rate of change points sideways, so the point neither grows nor shrinks; it goes round.`}
            </Verdict>
            <Readout
              rows={[
                ["Angle, radians", theta.toFixed(4)],
                ["Angle, turns", (theta / (2 * Math.PI)).toFixed(4)],
                ["e to the i theta", show(z, 4)],
                ["Cosine, the along shadow", z[0].toFixed(4)],
                ["Sine, the up shadow", z[1].toFixed(4)],
                ["Length, always", Math.hypot(z[0], z[1]).toFixed(6)],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              Multiplying by e to the i theta is a turn by theta with no stretch: the last two pages,
              written as one formula. The position vectors of topic 4 are this at many speeds at
              once, and the swing on topic 2's phase plane is the along shadow of exactly this motion.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-round" />
            <Equations system={system} />
          </>
        }
      />
    </ComplexFrame>
  );
}
