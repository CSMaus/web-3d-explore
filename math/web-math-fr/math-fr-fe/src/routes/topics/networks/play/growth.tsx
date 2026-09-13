import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { grow, slopeBetween, timeToReach, trace } from "@/systems/calc";

export const Route = createFileRoute("/topics/networks/play/growth")({
  loader: () => api.system(TOPIC, "growth"),
  component: GrowthPage,
});

const T_END = 20;
const TICKS = 200;

function GrowthPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [start, setStart] = useState(100);
  const [rate, setRate] = useState(0.12);
  const [target, setTarget] = useState(800);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: TICKS });
  const t = (Math.min(tick, TICKS) / TICKS) * T_END;
  const started = tick > 0;

  const f = useMemo(() => (s: number) => grow(start, rate, s), [start, rate]);
  const value = f(t);
  const slope = slopeBetween(f, t, 1e-4);
  // the straight-line rival: the same start and the same first-moment speed, never changing
  const straight = start + start * rate * t;

  const curve = useMemo(() => trace(f, 0, T_END), [f]);
  const box = useMemo<Box>(() => {
    const top = Math.max(f(T_END), start + start * Math.abs(rate) * T_END, target, start * 1.2);
    return { x0: -0.5, x1: T_END + 0.5, y0: -top * 0.05, y1: top * 1.08 };
  }, [f, start, rate, target]);
  const ratioPts = useMemo(() => trace((s) => slopeBetween(f, s, 1e-4) / f(s), 0, T_END, 60), [f]);
  const ratioBox = useMemo<Box>(() => ({ x0: -0.5, x1: T_END + 0.5, y0: Math.min(-0.05, rate * 1.6), y1: Math.max(0.05, rate * 1.6) }), [rate]);

  const reach = timeToReach(start, rate, target);
  const doubling = rate > 0 ? Math.LN2 / rate : Infinity;

  const reset = () => {
    runner.reset();
    setTick(0);
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The thing that grows by how much there is"}
        job="Money at interest, a population with room, a rumour. What all three share: how fast it grows depends on how much there already is. The job is to watch that one rule play out, and to say when it will reach a target."
        input={
          <div className="space-y-3">
            <Slider label="Start with" min={10} max={500} step={10} value={start} format={(v) => String(Math.round(v))} onChange={(v) => { setStart(v); reset(); }} />
            <Slider label="Rate" min={-0.3} max={0.5} step={0.01} value={rate} format={(v) => `${(v * 100).toFixed(0)} % a year`} onChange={(v) => { setRate(v); reset(); }} />
            <Slider label="Target" min={10} max={5000} step={10} value={target} format={(v) => String(Math.round(v))} onChange={setTarget} />
            <p className="text-[11px] text-muted">
              The rate is the fraction of what there is that gets added each year. A negative
              rate is decay: the same rule, taking away a fraction of what is left.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what="years"
            limit={T_END}
            onToggle={() => {
              if (!runner.running && tick >= TICKS) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(TICKS, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div className="h-[340px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={box}
                deps={[curve, t, target, box, straight]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line([[box.x0, target], [box.x1, target]], TWO, 1);
                  plate(pen, `Target ${target}`, box.x1 - 0.6, target + (box.y1 - box.y0) * 0.02, TWO, "right");
                  // the doublings so far, as ticks on the time axis
                  if (rate > 0) {
                    for (let k = 1; k * doubling <= T_END; k++) {
                      const x = k * doubling;
                      pen.line([[x, 0], [x, f(x)]], x <= t ? "#3a4a3c" : FAINT, 1);
                      if (x <= t) plate(pen, `x${2 ** k}`, x, f(x) + (box.y1 - box.y0) * 0.03, MUTED, "center");
                    }
                  }
                  pen.line([[0, start], [T_END, start + start * rate * T_END]], "#3a4a5c", 1);
                  pen.line(curve.filter((p) => p[0] <= t), ONE, 2.4);
                  pen.line(curve.filter((p) => p[0] >= t), "#243a2c", 1);
                  if (started) {
                    // the tangent: the growth rate right now, as a short line
                    const dx = 2;
                    pen.line([[t - dx, value - slope * dx], [t + dx, value + slope * dx]], SKY, 1.6);
                    pen.dot(t, value, 5, INK);
                    pen.dot(t, straight, 3.5, "#5b7a9b");
                    plate(pen, `${value.toFixed(0)}, growing ${slope.toFixed(1)} a year`, t, value + (box.y1 - box.y0) * 0.07, INK, t > T_END * 0.6 ? "right" : "left");
                  }
                }}
              />
            </div><Caption>Green: grows by a fixed fraction of itself.  Dim blue: grows by a fixed amount. Sky: the steepness right now.  Ticks: each doubling.</Caption></div>
            <div><div className="h-[150px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={ratioBox}
                deps={[ratioPts, t, ratioBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(ratioPts.filter((p) => p[0] <= t), SKY, 2.2);
                  pen.line(ratioPts.filter((p) => p[0] >= t), "#20323a", 1);
                  if (started) pen.dot(t, slope / value, 5, INK);
                }}
              />
            </div><Caption>The steepness divided by the amount, at every moment. {`It never moves: it is the rate, ${(rate * 100).toFixed(0)} %`}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={started && value >= target ? true : undefined}>
              {!started
                ? "Press run and the years pass. The green curve is what you have; the sky line is how fast it is growing at that moment."
                : value >= target
                  ? `${t.toFixed(1)} years in, it is at ${value.toFixed(0)}: past the target. The exact moment was ${reach.toFixed(2)} years, and that is what a logarithm is: the question of when, asked of a growth like this.`
                  : `${t.toFixed(1)} years in, there is ${value.toFixed(0)}, and it is growing by ${slope.toFixed(1)} a year. That is ${((slope / value) * 100).toFixed(1)} % of itself, the same as at every other moment. ${Number.isFinite(reach) && reach > 0 ? `At this rate the target of ${target} is reached at ${reach.toFixed(1)} years.` : "At this rate the target is never reached."}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Amount now</dt>
              <dd className="text-right text-ink/80">{value.toFixed(2)}</dd>
              <dt>Growing at</dt>
              <dd className="text-right text-ink/80">{slope.toFixed(3)} A year</dd>
              <dt>Growth divided by amount</dt>
              <dd className="text-right text-ink/80">{(slope / value).toFixed(4)}</dd>
              <dt>The rate you set</dt>
              <dd className="text-right text-ink/80">{rate.toFixed(4)}</dd>
              <dt>{rate > 0 ? "Time to double" : "Time to halve"}</dt>
              <dd className="text-right text-ink/80">{rate !== 0 ? (Math.LN2 / Math.abs(rate)).toFixed(2) : "Never"} years</dd>
              <dt>The straight-line rival by now</dt>
              <dd className="text-right text-ink/80">{straight.toFixed(1)}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              A curve whose steepness is always a fixed fraction of its height is the exponential.
              The fixed fraction is the rate. Every squashing curve inside a network, and the way
              a training step size shrinks, is built from this one shape.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="growth" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
