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
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, plate, shadePlane, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { nudge } from "@/systems/depth";
import { dataset } from "@/systems/learn";
import { ACTS } from "@/systems/net";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/nudge")({
  loader: () => api.system(TOPIC, "nudge"),
  component: NudgePage,
});

// a line that starts a little off, so the hard unit has a few dots wrong
const W = [0.6, 0.4];
const B = -0.55;
const MOST = 300;

function NudgePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const data = useMemo(() => dataset("split", 60, 3), []);
  const box = useMemo(() => boxOf(data.X), [data]);
  // the dot the hard unit gets wrong that is closest to the line, so the nudges
  // carry it across and the jump arrives within the run; failing that, the
  // closest dot of all
  const nearest = useMemo(() => {
    const z = (p: number[]) => W[0] * p[0] + W[1] * p[1] + B;
    const wrong = (n: number) => (z(data.X[n]) > 0 ? 1 : 0) !== data.Y[n][0];
    let best = -1;
    for (let n = 0; n < data.X.length; n++) {
      if (!wrong(n)) continue;
      if (best < 0 || Math.abs(z(data.X[n])) < Math.abs(z(data.X[best]))) best = n;
    }
    if (best >= 0) return best;
    best = 0;
    for (let n = 1; n < data.X.length; n++) if (Math.abs(z(data.X[n])) < Math.abs(z(data.X[best]))) best = n;
    return best;
  }, [data]);
  const [probe, setProbe] = useState(nearest);
  const [size, setSize] = useState(0.01);
  const [perFrame, setPerFrame] = useState(1);
  const [limit, setLimit] = useState(MOST);
  const [k, setK] = useState(0);
  const runner = useRunner((n) => setK(n), { perFrame, stopAt: limit });
  const restart = () => {
    runner.reset();
    setK(0);
  };

  const x = data.X[probe];
  const want = data.Y[probe][0];
  const z0 = W[0] * x[0] + W[1] * x[1] + B;
  // pushed the way that moves this dot's answer towards its colour
  const push = size * (want ? 1 : -1) * (x[0] >= 0 ? 1 : -1);
  const out = useMemo(() => nudge(W, B, x, data, push, k), [x, data, push, k]);
  const w1 = W[0] + k * push;
  const a0 = out.smooth[0];
  const ak = out.smooth[k];
  const per = k > 0 ? (ak - a0) / k : 0;
  const flip = out.flipAt;
  const traceBox = useMemo<Box>(() => ({ x0: -1, x1: Math.max(50, k) + 1, y0: -0.06, y1: 1.06 }), [k]);
  const hardSteps = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= k; i++) {
      if (i > 0 && out.hard[i] !== out.hard[i - 1]) pts.push([i, out.hard[i - 1]]);
      pts.push([i, out.hard[i]]);
    }
    return pts;
  }, [out, k]);

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("A small change, and what it does")}
        job={L("When one number inside a calculation changes by a tiny amount, does the answer show which way to change it? The calculation decides on which side of a line a dot lies. Each dot has two coordinates, x and y, and a right answer, 1 or 0, shown by its colour. The calculation multiplies x and y by two numbers called weights, adds a third number called the bias, and gets a total. A calculation like this is called a unit, or an artificial neuron. Two units share the same three numbers. The hard unit answers 1 when the total is above zero and 0 otherwise. The smooth unit turns the total into a number between 0 and 1 that changes gradually. Each step of the run adds the same small amount, a nudge, to the weight on x. Watch how each unit's answer moves.")}
        input={
          <div className="space-y-3">
            <Slider label={L("Size of one nudge")} min={0.002} max={0.05} step={0.002} value={size} format={(v) => v.toFixed(3)} onChange={(v) => { setSize(v); restart(); }} />
            <Text kind="note" as="p">
              {L("Each step adds this amount to the weight on x, in the direction that moves the ringed dot's answer towards its right answer. Nothing else changes. At the start the ringed dot is the dot nearest the line among those the hard unit gets wrong. A click on another dot follows that dot instead.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={k}
            what={L("nudges")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 50, max: 1000, step: 50 }}
            onToggle={() => {
              if (!runner.running && k >= limit) restart();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={restart}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div><div data-slot="plot" className="h-[400px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={box}
                equal
                deps={[w1, probe, data, box]}
                onPick={(px, py) => {
                  let best = 0;
                  let d = Infinity;
                  for (let n = 0; n < data.X.length; n++) {
                    const dd = Math.hypot(data.X[n][0] - px, data.X[n][1] - py);
                    if (dd < d) {
                      d = dd;
                      best = n;
                    }
                  }
                  setProbe(best);
                  restart();
                }}
                draw={(pen) => {
                  shadePlane(pen, (px, py) => ACTS.sigmoid.f(w1 * px + W[1] * py + B), 56);
                  ticks(pen);
                  pen.axes("rgba(232,232,234,0.12)");
                  const v = pen.box;
                  pen.line([[v.x0, -(w1 * v.x0 + B) / W[1]], [v.x1, -(w1 * v.x1 + B) / W[1]]], INK, 1.5);
                  for (let n = 0; n < data.X.length; n++) pen.dot(data.X[n][0], data.X[n][1], 4.5, data.Y[n][0] ? ONE : TWO);
                  pen.ring(x[0], x[1], 11, SKY, 2);
                  plate(pen, L("Line: where the hard unit's answer changes between 0 and 1"), v.x0 + (v.x1 - v.x0) * 0.03, v.y1 - (v.y1 - v.y0) * 0.05, MUTED);
                }}
              />
            </div><Caption>{L("Left picture: the dots, each coloured by its right answer. The background is shaded by the smooth unit's answer at each point: faint near the line, where the answer is close to one half, and stronger further away. The large ring marks the dot whose answers are traced in the right picture.")}</Caption></div>
            <div><div data-slot="plot" className="h-[400px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={traceBox}
                deps={[out, k, traceBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(hardSteps, TWO, 1.6);
                  pen.line(out.smooth.map((a, i) => [i, a] as [number, number]), ONE, 2);
                  const v = pen.box;
                  plate(pen, L("Smooth curve: the smooth unit"), v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.05, ONE);
                  plate(pen, L("Flat line with a jump: the hard unit"), v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.11, TWO);
                }}
              />
            </div><Caption>{L("Right picture: the ringed dot's answer from each unit, from 0 to 1 (up), after each nudge (across).")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={k > 0 ? true : undefined}>
              {k === 0
                ? (out.hard[0] === want
                  ? L("The ringed dot's right answer is {{want}}, and its total is {{total}}. The smooth unit answers {{smooth}}. The hard unit answers {{hard}}, which is right. Press run: each nudge adds {{push}} to the weight on x and changes nothing else.", { want, total: z0.toFixed(3), smooth: a0.toFixed(3), hard: out.hard[0], push: push.toFixed(3) })
                  : L("The ringed dot's right answer is {{want}}, and its total is {{total}}. The smooth unit answers {{smooth}}. The hard unit answers {{hard}}, which is wrong. Press run: each nudge adds {{push}} to the weight on x and changes nothing else.", { want, total: z0.toFixed(3), smooth: a0.toFixed(3), hard: out.hard[0], push: push.toFixed(3) }))
                : L("After {{k}} nudges the smooth unit's answer went from {{from}} to {{to}}, about {{per}} per nudge, a small change every time. The hard unit's answer {{hard}}. Learning needs the first kind of answer. When a small change in a number gives a small change in the answer, the direction of that change shows which way to move the number. An answer that stays still or jumps gives no such direction.", {
                    k,
                    from: a0.toFixed(3),
                    to: ak.toFixed(3),
                    per: Math.abs(per).toFixed(4),
                    hard: flip < 0
                      ? L("has not moved at all in {{k}} nudges", { k })
                      : flip < k
                        ? L("did not move for {{still}} nudges, then jumped from {{from}} to {{to}} at nudge {{flip}} and has not moved since", { still: flip - 1, from: out.hard[0], to: out.hard[flip], flip })
                        : L("did not move for {{still}} nudges, then jumped from {{from}} to {{to}} at nudge {{flip}}", { still: flip - 1, from: out.hard[0], to: out.hard[flip], flip }),
                  })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Weight on x now")}</dt>
              <dd className="text-right text-foreground/80">{w1.toFixed(3)}</dd>
              <dt>{L("The smooth unit's answer for the ringed dot")}</dt>
              <dd className="text-right text-foreground/80">{ak.toFixed(4)}</dd>
              <dt>{L("The hard unit's answer for the ringed dot")}</dt>
              <dd className="text-right text-foreground/80">{out.hard[k]}</dd>
              <dt>{L("Smooth unit: change in the answer per nudge")}</dt>
              <dd className="text-right text-foreground/80">{k > 0 ? per.toFixed(5) : L("not yet nudged")}</dd>
              <dt>{L("Dots answered wrongly, out of {{all}}: smooth unit, hard unit", { all: data.X.length })}</dt>
              <dd className="text-right text-foreground/80">{out.smoothWrong[k]}, {out.hardWrong[k]}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("For the smooth unit, the change per nudge equals the steepness of its curve at this dot's total, times the dot's x. That steepness is called the derivative: how fast the answer changes as the total changes. It exists because the smooth curve has no corners and no jumps. The hard unit's answer is flat everywhere except at the jump. So its steepness is zero everywhere else, and at the jump it is not a number at all.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="nudge" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
