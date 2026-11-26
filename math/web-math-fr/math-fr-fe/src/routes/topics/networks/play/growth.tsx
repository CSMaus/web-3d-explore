import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { FAINT, INK, MUTED, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
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
    <div>
      <TaskPage
        title={system?.name ?? L("The thing that grows by how much there is")}
        job={L("When does an amount reach a target if it always grows by a fixed share of itself? At a rate of 12 % a year, an amount of 100 grows at a speed of 12 a year, and an amount of 200 at 24 a year. So the more there is, the faster it grows. Money earning interest and a population with room to spread grow this way. The sliders set the starting amount, the yearly rate and the target. Press run and the years pass. With the starting values, 100 reaches 800 after 17.33 years.")}
        input={
          <div className="space-y-3">
            <Slider label={L("Starting amount")} min={10} max={500} step={10} value={start} format={(v) => String(Math.round(v))} onChange={(v) => { setStart(v); reset(); }} />
            <Slider label={L("Yearly rate")} min={-0.3} max={0.5} step={0.01} value={rate} format={(v) => L("{{p}} % a year", { p: (v * 100).toFixed(0) })} onChange={(v) => { setRate(v); reset(); }} />
            <Slider label={L("Target")} min={10} max={5000} step={10} value={target} format={(v) => String(Math.round(v))} onChange={setTarget} />
            <Text kind="note" as="p">
              {L("The rate is the share of the current amount added per year. A negative rate means decay: the same share of what is left is taken away.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(t * 10) / 10}
            what={L("years")}
            limit={T_END}
            onToggle={() => {
              if (!runner.running && tick >= TICKS) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[340px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={box}
                deps={[curve, t, target, box, straight]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line([[box.x0, target], [box.x1, target]], TWO, 1);
                  plate(pen, L("Target {{n}}", { n: target }), box.x1 - 0.6, target + (box.y1 - box.y0) * 0.02, TWO, "right");
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
                    plate(pen, L("{{v}}, growing {{s}} a year", { v: value.toFixed(0), s: slope.toFixed(1) }), t, value + (box.y1 - box.y0) * 0.07, INK, t > T_END * 0.6 ? "right" : "left");
                  }
                }}
              />
            </div><Caption>{L("Top picture: the amount against time, in years. The thick curve grows by a fixed share of itself. The thin straight line starts the same way but grows by the same amount every year. The short line touching the curve shows how fast the amount grows at this moment. The vertical lines mark each doubling, labelled x2, x4 and so on. The horizontal line is the target.")}</Caption></div>
            <div><div data-slot="plot" className="h-[150px] overflow-hidden">
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
            </div><Caption>{L("Bottom picture: how fast the amount grows, divided by the amount, at every moment.")} {L("The line stays flat: the result is always the rate, {{p}} %.", { p: (rate * 100).toFixed(0) })}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={started && value >= target ? true : undefined}>
              {!started
                ? L("Press run and the years pass. The thick curve is the amount. The short line touching it shows how fast it grows at that moment.")
                : value >= target
                  ? L("After {{t}} years the amount is {{v}}, past the target. It reached the target at {{reach}} years. That moment can be computed without running: divide the target by the start, take the natural logarithm of the result, and divide by the rate. The logarithm is the operation that undoes this kind of growth.", { t: t.toFixed(1), v: value.toFixed(0), reach: reach.toFixed(2) })
                  : L("After {{t}} years the amount is {{v}}, and it grows by {{s}} a year. That is {{p}} % of the amount, the same share as at every other moment. {{when}}", {
                      t: t.toFixed(1),
                      v: value.toFixed(0),
                      s: slope.toFixed(1),
                      p: ((slope / value) * 100).toFixed(1),
                      when: Number.isFinite(reach) && reach > 0 ? L("At this rate the target of {{target}} is reached after {{reach}} years.", { target, reach: reach.toFixed(1) }) : L("At this rate the target is never reached."),
                    })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Amount now")}</dt>
              <dd className="text-right text-foreground/80">{value.toFixed(2)}</dd>
              <dt>{L("Growing by")}</dt>
              <dd className="text-right text-foreground/80">{L("{{s}} a year", { s: slope.toFixed(3) })}</dd>
              <dt>{L("Growth per year divided by the amount")}</dt>
              <dd className="text-right text-foreground/80">{(slope / value).toFixed(4)}</dd>
              <dt>{L("Rate set on the slider")}</dt>
              <dd className="text-right text-foreground/80">{rate.toFixed(4)}</dd>
              <dt>{rate > 0 ? L("Time to double") : L("Time to halve")}</dt>
              <dd className="text-right text-foreground/80">{rate !== 0 ? L("{{t}} years", { t: (Math.LN2 / Math.abs(rate)).toFixed(2) }) : L("Never")}</dd>
              <dt>{L("Growth by a fixed amount, by now (the thin line)")}</dt>
              <dd className="text-right text-foreground/80">{straight.toFixed(1)}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("A curve that always grows at a speed equal to a fixed share of its height is called an exponential curve. The fixed share is the rate. A neural network, a program that learns from examples, uses curves built from this one to turn a sum of numbers into an answer between 0 and 1.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="growth" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
