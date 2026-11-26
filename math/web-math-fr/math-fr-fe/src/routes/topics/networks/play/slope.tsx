import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, ONE, SKY, TWO, contours, shadeHeight, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { HILLS, gradientAt, roll } from "@/systems/calc";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/slope")({
  loader: () => api.system(TOPIC, "slope"),
  component: SlopePage,
});

const OPTIONS = Object.keys(HILLS).map((id) => ({ id, label: L(HILLS[id].label) }));
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
    <div>
      <TaskPage
        title={system?.name ?? L("Which way is down")}
        job={L("How can a ball find the lowest point of a landscape when it only feels the ground right under it? The picture is a map seen from above: bright places are high, dark places are low. At each step the ball measures which way the ground rises most steeply, and how steeply. Then it moves a short way in the opposite direction, downhill, and measures again. The buttons choose the landscape, a click on the map puts the ball there, and the slider sets the step size. Press run and watch whether the ball reaches the bottom.")}
        input={
          <div className="space-y-3">
            <Choices options={OPTIONS} value={which} onPick={(id) => { setWhich(id); reset(); }} />
            <Text kind="note" as="p">{L(hill.what)}</Text>
            <Slider label={L("Step size")} min={0.005} max={0.2} step={0.005} value={rate} format={(v) => v.toFixed(3)} onChange={(v) => { setRate(v); reset(); }} />
            <Text kind="note" as="p">
              {L("The step size says how far the ball moves for a given steepness: on steep ground it takes a long step, on gentle ground a short one. With too small a step size the ball crawls. With too large a step size it jumps across the valley and lands higher than it started.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={taken}
            what={L("steps")}
            limit={path.length - 1}
            onToggle={() => {
              if (!runner.running && taken >= path.length - 1) reset();
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
            <div><div data-slot="plot" className="h-[400px] overflow-hidden">
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
            </div><Caption>{L("Bright: high. Dark: low. Thin closed lines join points of equal height, as on a hiking map. Two arrows start at the ball: one points the steepest way uphill, the other points the opposite way and is the next step. The line behind the ball is its path, and the small ring marks where it started. A click on the map moves the ball there.")}</Caption></div>
            <div><div data-slot="plot" className="h-[150px] overflow-hidden">
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
            </div><Caption>{L("Bottom picture: the height of the ball (up) after each step (across).")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={taken === 0 ? undefined : escaped ? false : flat && which === "saddle" && heightHere > range.lo + 0.05 ? false : bouncing ? false : heightHere < startHeight}>
              {taken === 0
                ? L("The ball is at height {{h}}. The arrow from the ball shows where the ground under it rises most steeply. Press run and the ball steps the opposite way.", { h: heightHere.toFixed(3) })
                : escaped
                  ? L("The ball flew off the map after {{taken}} steps. The step size is too large. Each step jumps past the bottom and lands higher than before, where the ground is steeper still, so the next jump is even longer.", { taken })
                  : bouncing
                    ? L("After {{taken}} steps the ball is at height {{h}} and no longer getting lower. It jumps from one side of the valley to the other, because the step size is too large for such steep sides. A smaller step size fixes this.", { taken, h: heightHere.toFixed(3) })
                    : flat
                      ? which === "saddle" && heightHere > range.lo + 0.05
                        ? L("After {{taken}} steps the ground under the ball is flat, so it has stopped. But this is not the bottom. It is the middle of the saddle: flat at this one point, while the ground falls away in one direction. A small push sideways would send the ball down. Flat ground is not always the lowest ground.", { taken })
                        : L("After {{taken}} steps the ground under the ball is flat: the ball is at the bottom, at height {{h}}. It started at height {{start}}.", { taken, h: heightHere.toFixed(4), start: startHeight.toFixed(3) })
                      : L("After {{taken}} steps the ball is at height {{h}}, down from {{start}}. The steepness under it is {{slope}}, so the next step will be {{len}} long.", { taken, h: heightHere.toFixed(3), start: startHeight.toFixed(3), slope: Math.hypot(...g).toFixed(3), len: stepLen.toFixed(3) })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Position of the ball on the map (across, up)")}</dt>
              <dd className="text-right text-foreground/80">({fmt(here[0])}, {fmt(here[1])})</dd>
              <dt>{L("Steepness to the right: change in height per unit moved right")}</dt>
              <dd className="text-right text-foreground/80">{L("{{v}} per unit", { v: fmt(g[0], 4) })}</dd>
              <dt>{L("Steepness upwards on the map: change in height per unit moved up")}</dt>
              <dd className="text-right text-foreground/80">{L("{{v}} per unit", { v: fmt(g[1], 4) })}</dd>
              <dt>{L("The same two steepnesses, computed exactly")}</dt>
              <dd className="text-right text-foreground/80">({fmt(exact[0], 4)}, {fmt(exact[1], 4)})</dd>
              <dt>{L("Next step: step size times the two steepnesses, with the sign reversed")}</dt>
              <dd className="text-right text-foreground/80">({fmt(-rate * g[0], 4)}, {fmt(-rate * g[1], 4)})</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The two steepnesses together, one for each direction on the map, are called the gradient. Drawn as an arrow, the gradient points the steepest way uphill. Stepping against it again and again is called gradient descent. A neural network, a program that learns from examples, learns the same way. Its height is its error, how far its answers are from the right ones, and its directions are its own adjustable numbers: thousands of them instead of two.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`slope-${which}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
