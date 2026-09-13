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
import { FAINT, INK, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { MOTIONS, accumulate, strips, trace } from "@/systems/calc";

export const Route = createFileRoute("/topics/networks/play/accumulate")({
  loader: () => api.system(TOPIC, "accumulate"),
  component: AccumulatePage,
});

const T_END = 12;
// the straight-line and braking motions have a speed the rectangles add up
// exactly, so they show no error at all; the ones that bend are the lesson
const OPTIONS = ["bumpy", "back", "faster", "braking", "steady"].map((id) => ({ id, label: MOTIONS[id].label }));

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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Adding it back up"}
        job="This time you are given only the speed, second by second, and the job is to say how far the car has gone. The only tool is the obvious one: for each short stretch of time, speed times duration is distance, and the stretches add up."
        input={
          <div className="space-y-3">
            <Choices options={OPTIONS} value={motion} onPick={(id) => { setMotion(id); reset(); }} />
            <p className="text-[11px] text-muted">{m.what}</p>
            <Slider label="Slices" min={2} max={96} step={1} value={count} format={(v) => String(Math.round(v))} onChange={(v) => { setCount(Math.round(v)); reset(); }} />
            <p className="text-[11px] text-muted">
              How many slices the twelve seconds are cut into. Inside each slice the speed is
              taken as constant, which is a lie that gets smaller as the slices get thinner.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what="slices added"
            limit={count}
            onToggle={() => {
              if (!runner.running && shown >= count) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(count, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div className="h-[260px] overflow-hidden rounded border border-edge">
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
                    plate(pen, `${s.height.toFixed(2)} m/s for ${(s.t1 - s.t0).toFixed(2)} s = ${s.area.toFixed(2)} m`, (s.t0 + s.t1) / 2, s.height + (spdBox.y1 - spdBox.y0) * 0.08, INK, "center");
                  }
                }}
              />
            </div><Caption>The speed. Each rectangle is one slice: speed times duration, a distance.</Caption></div>
            <div><div className="h-[260px] overflow-hidden rounded border border-edge">
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
            </div><Caption>Distance so far. Green: the slices added up.  Faint: where the car really was. Rose: the gap between the two</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={shown === 0 ? undefined : Math.abs(added - truth) < 0.02 * Math.max(1, Math.abs(truth))}>
              {shown === 0
                ? "Press run. One slice at a time, a rectangle of speed times duration goes in, and the running total climbs."
                : `After ${shown} of ${count} slices, ${tNow.toFixed(1)} s in, the slices add up to ${added.toFixed(2)} m. The car had really gone ${truth.toFixed(2)} m. The total is off by ${Math.abs(added - truth).toFixed(3)} m${Math.abs(added - truth) < 0.02 * Math.max(1, Math.abs(truth)) ? ", which is close enough to call right" : ": the slices are too fat for a speed that changes this much inside one of them"}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Each slice lasts</dt>
              <dd className="text-right text-ink/80">{(T_END / count).toFixed(3)} s</dd>
              <dt>All {count} slices together</dt>
              <dd className="text-right text-ink/80">{totals[count].toFixed(3)} m</dd>
              <dt>The true distance over twelve seconds</dt>
              <dd className="text-right text-ink/80">{(m.at(T_END) - m.at(0)).toFixed(3)} m</dd>
              <dt>The error with {count} slices</dt>
              <dd className="text-right text-ink/80">{finalError.toExponential(2)} m</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              Double the slices and the error falls by about four. That is the integral: the sum,
              with the slices made as thin as you like. And the green staircase, once smooth, is
              the position curve from the first page: adding up a rate gives back the thing whose
              rate it was.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`accumulate-${motion}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
