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
import { L } from "@/lib/lang";
import { FAINT, INK, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { MOTIONS, accumulate, strips, trace } from "@/systems/calc";

export const Route = createFileRoute("/topics/networks/play/accumulate")({
  loader: () => api.system(TOPIC, "accumulate"),
  component: AccumulatePage,
});

const T_END = 12;
// the straight-line and braking motions have a speed the rectangles add up
// exactly, so they show no error at all; the ones that bend are the lesson
const OPTIONS = ["bumpy", "back", "faster", "braking", "steady"].map((id) => ({ id, label: L(MOTIONS[id].label) }));

function AccumulatePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [motion, setMotion] = useState("bumpy");
  const [count, setCount] = useState(8);
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.06);

  const m = MOTIONS[motion];
  const list = useMemo(() => strips(m.speed, 0, T_END, count), [m, count]);
  const totals = useMemo(() => accumulate(list), [list]);
  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: count });
  const shown = Math.min(done, count);
  const tNow = (shown / count) * T_END;
  const added = totals[shown];
  const truth = m.at(tNow) - m.at(0);

  const spdTrace = useMemo(() => trace(m.speed, 0, T_END), [m]);
  const posTrace = useMemo(() => trace((s) => m.at(s) - m.at(0), 0, T_END), [m]);
  const spdBox = useMemo<Box>(() => {
    const ys = spdTrace.map((p) => p[1]);
    const lo = Math.min(0, ...ys);
    const hi = Math.max(0, ...ys);
    const pad = (hi - lo) * 0.2 || 1;
    return { x0: -0.3, x1: T_END + 0.3, y0: lo - pad, y1: hi + pad };
  }, [spdTrace]);
  const posBox = useMemo<Box>(() => {
    const ys = posTrace.map((p) => p[1]);
    const lo = Math.min(0, ...ys);
    const hi = Math.max(0, ...ys);
    const pad = (hi - lo) * 0.15 || 1;
    return { x0: -0.3, x1: T_END + 0.3, y0: lo - pad, y1: hi + pad };
  }, [posTrace]);

  const reset = () => {
    runner.reset();
    setDone(0);
  };
  const finalError = Math.abs(totals[count] - (m.at(T_END) - m.at(0)));

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Adding it back up")}
        job={L("If only the speed of a car is known, how far has it gone? Over a short time the speed hardly changes, and then distance is speed times time: 5 m/s for 2 s is 10 m. So the 12 seconds are cut into slices, each slice gives a short distance, and the distances are added up. The buttons choose how the car moves. The slider sets how many slices there are. Press run to add the slices one by one, and compare the total with the true distance.")}
        input={
          <div className="space-y-3">
            <Choices options={OPTIONS} value={motion} onPick={(id) => { setMotion(id); reset(); }} />
            <Text kind="note" as="p">{L(m.what)}</Text>
            <Slider label={L("Slices")} min={2} max={96} step={1} value={count} format={(v) => String(Math.round(v))} onChange={(v) => { setCount(Math.round(v)); reset(); }} />
            <Text kind="note" as="p">
              {L("How many slices the 12 seconds are cut into. Inside each slice the speed is treated as fixed, equal to the speed at the middle of the slice. That is not quite true, and the thinner the slices, the less it matters.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what={L("slices added")}
            limit={count}
            onToggle={() => {
              if (!runner.running && shown >= count) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[260px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={spdBox}
                deps={[spdTrace, list, shown, spdBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  // every slice added so far as a filled rectangle, the newest brighter
                  for (let i = 0; i < shown; i++) {
                    const s = list[i];
                    const x0 = pen.px(s.t0);
                    const x1 = pen.px(s.t1);
                    const y0 = pen.py(0);
                    const y1 = pen.py(s.height);
                    pen.ctx.fillStyle = i === shown - 1 ? "rgba(143,211,232,0.55)" : "rgba(143,211,232,0.22)";
                    pen.ctx.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
                    pen.ctx.strokeStyle = "rgba(143,211,232,0.7)";
                    pen.ctx.lineWidth = 1;
                    pen.ctx.strokeRect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0));
                  }
                  pen.line(spdTrace, SKY, 1.8);
                  if (shown > 0) {
                    const s = list[shown - 1];
                    plate(pen, L("{{h}} m/s for {{d}} s = {{a}} m", { h: s.height.toFixed(2), d: (s.t1 - s.t0).toFixed(2), a: s.area.toFixed(2) }), (s.t0 + s.t1) / 2, s.height + (spdBox.y1 - spdBox.y0) * 0.08, INK, "center");
                  }
                }}
              />
            </div><Caption>{L("Top picture: the speed against time. Each rectangle is one slice. Its height is the speed and its width is the time, so its area is a distance. The newest rectangle is the brightest.")}</Caption></div>
            <div><div data-slot="plot" className="h-[260px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={posBox}
                deps={[posTrace, totals, shown, posBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(posTrace, "#243a2c", 1.2);
                  // the running total, as a staircase of what has been added
                  const stair: [number, number][] = [[0, 0]];
                  for (let i = 0; i < shown; i++) stair.push([list[i].t1, totals[i + 1]]);
                  pen.line(stair, ONE, 2.2);
                  for (let i = 1; i < stair.length; i++) pen.dot(stair[i][0], stair[i][1], 3, ONE);
                  if (shown > 0) {
                    pen.dot(tNow, truth, 5, INK);
                    pen.ring(tNow, added, 7, ONE, 2);
                    pen.line([[tNow, added], [tNow, truth]], TWO, 1.5);
                  }
                }}
              />
            </div><Caption>{L("Bottom picture: distance from the start against time. The thin curve is where the car really was. The thick staircase is the slices added up so far. The ring is the running total now, the large dot is the true distance, and the short vertical line between them is the error.")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={shown === 0 ? undefined : Math.abs(added - truth) < 0.02 * Math.max(1, Math.abs(truth))}>
              {shown === 0
                ? L("Press run. Each step adds one slice, a rectangle of speed times time, to the running total.")
                : L("After {{shown}} of {{count}} slices, at {{t}} s, the slices add up to {{added}} m. The car had really gone {{truth}} m. The difference is {{off}} m{{tail}}.", {
                    shown,
                    count,
                    t: tNow.toFixed(1),
                    added: added.toFixed(2),
                    truth: truth.toFixed(2),
                    off: Math.abs(added - truth).toFixed(3),
                    tail: Math.abs(added - truth) < 0.02 * Math.max(1, Math.abs(truth)) ? L(", small enough to count as right") : L(": the slices are too wide, and the speed changes a lot inside each one"),
                  })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Each slice lasts")}</dt>
              <dd className="text-right text-foreground/80">{(T_END / count).toFixed(3)} s</dd>
              <dt>{L("All {{count}} slices added up", { count })}</dt>
              <dd className="text-right text-foreground/80">{totals[count].toFixed(3)} m</dd>
              <dt>{L("True distance after 12 seconds")}</dt>
              <dd className="text-right text-foreground/80">{(m.at(T_END) - m.at(0)).toFixed(3)} m</dd>
              <dt>{L("Error with {{count}} slices: how far the sum is from the true distance", { count })}</dt>
              <dd className="text-right text-foreground/80">{finalError.toExponential(2)} m</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("With twice as many slices the error becomes about four times smaller. As the slices get thinner and thinner, the sum comes as close to the true distance as wanted. That limit is called the integral of the speed. The staircase then becomes the curve of the car's position: adding up a speed gives back the position it came from.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`accumulate-${motion}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
