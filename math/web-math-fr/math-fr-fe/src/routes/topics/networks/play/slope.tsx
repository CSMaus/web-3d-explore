import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
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
import { FAINT, INK, ONE, SKY, TWO, contours, shadeHeight, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { HILLS, gradientAt, roll } from "@/systems/calc";

export const Route = createFileRoute("/topics/networks/play/slope")({
  loader: () => api.system(TOPIC, "slope"),
  component: SlopePage,
});

const OPTIONS = Object.keys(HILLS).map((id) => ({ id, label: HILLS[id].label }));
const MOST = 400;

function SlopePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [which, setWhich] = useState("valley");
  const [from, setFrom] = useState<[number, number]>([2.4, 0.9]);
  const [rate, setRate] = useState(0.08);
  const [steps, setSteps] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const hill = HILLS[which];
  const path = useMemo(() => roll(hill, from, rate, MOST), [hill, from, rate]);
  const runner = useRunner((n) => setSteps(n), { perFrame, stopAt: path.length - 1 });
  const taken = Math.min(steps, path.length - 1);
  const here = path[taken];
  const g = gradientAt(hill, here[0], here[1]);
  const exact = hill.slopes(here[0], here[1]);
  const heightHere = hill.height(here[0], here[1]);
  const startHeight = hill.height(from[0], from[1]);

  const range = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    const b = hill.box;
    for (let i = 0; i <= 40; i++) {
      for (let j = 0; j <= 40; j++) {
        const h = hill.height(b.x0 + ((b.x1 - b.x0) * i) / 40, b.y0 + ((b.y1 - b.y0) * j) / 40);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
    }
    return { lo, hi };
  }, [hill]);
  const levels = useMemo(() => Array.from({ length: 12 }, (_, i) => range.lo + ((range.hi - range.lo) * (i + 0.5)) / 12), [range]);

  const heights = useMemo(() => path.map((p, i) => [i, hill.height(p[0], p[1])] as [number, number]), [path, hill]);
  const hBox = useMemo<Box>(() => {
    const ys = heights.map((p) => p[1]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const pad = (hi - lo) * 0.15 || 0.5;
    return { x0: -2, x1: Math.max(20, heights.length) + 2, y0: lo - pad, y1: hi + pad };
  }, [heights]);

  const reset = () => {
    runner.reset();
    setSteps(0);
  };
  const escaped = path.length - 1 < MOST && path.length - 1 <= taken;
  const bouncing = taken > 4 && heights[taken][1] > heights[taken - 2][1] * 0.999 && heights[taken][1] > 1e-6;
  const flat = Math.hypot(...g) < 1e-3;
  const stepLen = rate * Math.hypot(...g);
  // a value that is zero to the shown precision prints as zero, not minus zero
  const fmt = (v: number, d = 3) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Which way is down"}
        job="A landscape seen from above: bright is high, dark is low. A ball is put down somewhere. The job is to get it to the bottom knowing nothing but the ground under its own feet: which way is uphill, and how steeply. It takes a step the other way, and asks again."
        input={
          <div className="space-y-3">
            <Choices options={OPTIONS} value={which} onPick={(id) => { setWhich(id); reset(); }} />
            <p className="text-[11px] text-muted">{hill.what}</p>
            <Slider label="Step size" min={0.005} max={0.2} step={0.005} value={rate} format={(v) => v.toFixed(3)} onChange={(v) => { setRate(v); reset(); }} />
            <p className="text-[11px] text-muted">
              Click anywhere on the landscape to put the ball there. The step size is how far it
              moves for a given steepness: a steep slope means a long step. Too small and it
              crawls; too big and it leaps across the valley and lands higher than it started.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={taken}
            what="steps"
            limit={path.length - 1}
            onToggle={() => {
              if (!runner.running && taken >= path.length - 1) reset();
              runner.toggle();
            }}
            onStep={(many) => setSteps((v) => Math.min(path.length - 1, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div className="h-[400px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={hill.box}
                equal
                deps={[hill, path, taken, range]}
                onPick={(x, y) => {
                  setFrom([x, y]);
                  reset();
                }}
                draw={(pen) => {
                  shadeHeight(pen, hill.height, range.lo, range.hi, 72);
                  contours(pen, hill.height, levels, "rgba(232,232,234,0.16)", 60);
                  ticks(pen);
                  pen.line(path.slice(0, taken + 1), INK, 1.4);
                  for (let i = 0; i < taken; i++) pen.dot(path[i][0], path[i][1], 2, "#bfc3c8");
                  // the slope under the ball: uphill in rose, and the step it will take in green
                  const scale = 0.25;
                  pen.arrow(here[0], here[1], g[0] * scale, g[1] * scale, TWO);
                  if (taken < path.length - 1) {
                    pen.arrow(here[0], here[1], path[taken + 1][0] - here[0], path[taken + 1][1] - here[1], ONE);
                  }
                  pen.dot(here[0], here[1], 6, INK);
                  pen.ring(from[0], from[1], 6, SKY, 1.5);
                }}
              />
            </div><Caption>Bright: high.  Dark: low.  Click to place the ball. Rose: uphill from under the ball.  Green: the step it takes, the other way.</Caption></div>
            <div><div className="h-[150px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={hBox}
                deps={[heights, taken, hBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(heights.slice(0, taken + 1), ONE, 2);
                  pen.line(heights.slice(taken), "#243a2c", 1);
                  pen.dot(taken, heights[taken][1], 4.5, INK);
                }}
              />
            </div><Caption>How high the ball is, step by step</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={taken === 0 ? undefined : escaped ? false : flat && which === "saddle" && heightHere > range.lo + 0.05 ? false : bouncing ? false : heightHere < startHeight}>
              {taken === 0
                ? `The ball is at height ${heightHere.toFixed(3)}. Under it the ground rises most steeply along the rose arrow. Press run and it steps the other way.`
                : escaped
                  ? `The ball flew off the landscape after ${taken} steps. The step size is too big: each step overshoots the bottom and lands higher than the last, and the steepness there is greater still.`
                  : bouncing
                    ? `After ${taken} steps the ball is at height ${heightHere.toFixed(3)} and getting no lower. It is leaping from one wall of the valley to the other, because the step size is too big for how steep the walls are. Make the step smaller.`
                    : flat
                      ? which === "saddle" && heightHere > range.lo + 0.05
                        ? `After ${taken} steps the ground under the ball is flat, so it has stopped. But it is not at the bottom: this is the middle of the saddle, where the slope is zero one way and the ground falls away the other. A step in any direction across would take it down. Flat ground is not the same as the lowest ground.`
                        : `After ${taken} steps the ground under the ball is flat: the bottom, height ${heightHere.toFixed(4)}. It started at ${startHeight.toFixed(3)}.`
                      : `After ${taken} steps the ball is at height ${heightHere.toFixed(3)}, down from ${startHeight.toFixed(3)}. The slope under it is ${Math.hypot(...g).toFixed(3)}, so the next step is ${stepLen.toFixed(3)} long.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>The ball stands at</dt>
              <dd className="text-right text-ink/80">({fmt(here[0])}, {fmt(here[1])})</dd>
              <dt>Nudge it a hair to the right: height changes by</dt>
              <dd className="text-right text-ink/80">{fmt(g[0], 4)} per unit</dd>
              <dt>Nudge it a hair up: height changes by</dt>
              <dd className="text-right text-ink/80">{fmt(g[1], 4)} per unit</dd>
              <dt>Those two together are the uphill arrow; exact</dt>
              <dd className="text-right text-ink/80">({fmt(exact[0], 4)}, {fmt(exact[1], 4)})</dd>
              <dt>The step: step size times the arrow, reversed</dt>
              <dd className="text-right text-ink/80">({fmt(-rate * g[0], 4)}, {fmt(-rate * g[1], 4)})</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The uphill arrow is the gradient: the first page's ratio, taken once for each
              direction you could move in. Stepping against it is gradient descent. When a network
              learns, the landscape is how wrong it is, the directions are its own numbers, and
              there are thousands of them instead of two. The picture is this one.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`slope-${which}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
