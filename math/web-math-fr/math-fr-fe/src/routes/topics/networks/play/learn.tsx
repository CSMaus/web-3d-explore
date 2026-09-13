import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, contours, plate, shadeHeight, shadePlane, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { SETS, dataset, type SetKind } from "@/systems/learn";
import {
  OPTS,
  backward,
  clone,
  flatten,
  gradFlat,
  loss,
  make,
  optimiser,
  predict,
  rng,
  solveLinear,
  unflatten,
  type Batch,
  type Net,
  type OptKind,
} from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/learn")({
  loader: () => api.system(TOPIC, "learn"),
  component: LearnPage,
});

const KINDS: { id: SetKind; label: string }[] = (["rings", "xor", "spiral", "split"] as SetKind[]).map((id) => ({ id, label: SETS[id].label }));
const METHODS = (Object.keys(OPTS) as OptKind[]).map((id) => ({ id, label: OPTS[id].label }));
const BATCHES = [
  { id: "all", label: "All the dots" },
  { id: "8", label: "8 at a time" },
  { id: "1", label: "One at a time" },
];
const MOST = 4000;
const HIDDEN = 6;

type Kept = { label: string; history: [number, number][]; colour: string };
type View = { net: Net; steps: number; history: [number, number][]; path: [number, number][] };

const KEPT_COLOURS = ["#5b7a9b", "#7a6b8a", "#6b8a7a", "#8a7a6b", "#7a7a7a"];

function LearnPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [kind, setKind] = useState<SetKind>("rings");
  const [method, setMethod] = useState<OptKind>("sgd");
  const [batch, setBatch] = useState("all");
  const [rate, setRate] = useState(0.3);
  const [perFrame, setPerFrame] = useState(4);
  const [kept, setKept] = useState<Kept[]>([]);
  const [oneShot, setOneShot] = useState(false);

  const data = useMemo(() => dataset(kind, kind === "xor" ? 4 : 60, 3), [kind]);
  const box = useMemo(() => boxOf(data.X), [data]);
  const build = () => make([2, HIDDEN, 1], "tanh", "sigmoid", "xavier", 2);

  const [view, setView] = useState<View>(() => {
    const net = build();
    return { net, steps: 0, history: [], path: [[net.W[1][0][0], net.W[1][0][1]]] };
  });
  const work = useRef({
    net: build(),
    step: optimiser("sgd", 0, 0.3),
    flat: [] as number[],
    history: [] as [number, number][],
    path: [] as [number, number][],
    next: rng(5),
    data,
    batch: "all",
    blown: false,
  });
  useEffect(() => {
    work.current.data = data;
    work.current.batch = batch;
  });

  const arm = (net: Net) => {
    const w = work.current;
    w.net = net;
    w.flat = flatten(net);
    w.step = optimiser(method, w.flat.length, rate);
    w.history = [];
    w.path = [[net.W[1][0][0], net.W[1][0][1]]];
    w.next = rng(5);
    w.blown = false;
  };

  const [limit, setLimit] = useState(MOST);
  const runner = useRunner(
    (n) => {
      const w = work.current;
      if (w.blown) return;
      let b: Batch = w.data;
      const size = w.batch === "all" ? w.data.X.length : Number(w.batch);
      if (size < w.data.X.length) {
        const pick = Array.from({ length: size }, () => Math.floor(w.next() * w.data.X.length));
        b = { X: pick.map((i) => w.data.X[i]), Y: pick.map((i) => w.data.Y[i]) };
      }
      const { grad } = backward(w.net, b, "mse");
      w.step(w.flat, gradFlat(w.net, grad));
      unflatten(w.net, w.flat);
      const l = loss(w.net, w.data, "mse");
      if (!Number.isFinite(l) || l > 1e6) w.blown = true;
      if (n % 4 === 0 || n < 40) w.history.push([n, Math.min(l, 10)]);
      if (n % 2 === 0 || n < 60) w.path.push([w.net.W[1][0][0], w.net.W[1][0][1]]);
      setView({ net: clone(w.net), steps: n, history: w.history.slice(), path: w.path.slice() });
    },
    { perFrame, stopAt: limit },
  );

  const restart = (keep = true) => {
    runner.reset();
    if (keep && view.history.length > 5) {
      setKept((k) => [
        { label: `${OPTS[method].label}, step ${rate}, ${BATCHES.find((b) => b.id === batch)?.label}`, history: view.history, colour: KEPT_COLOURS[k.length % KEPT_COLOURS.length] },
        ...k,
      ].slice(0, 5));
    }
    const net = build();
    arm(net);
    setView({ net: clone(net), steps: 0, history: [], path: [[net.W[1][0][0], net.W[1][0][1]]] });
  };

  // the first arming, and a re-arming when the method or the step size changes
  // before a run has started
  useEffect(() => {
    if (view.steps === 0) arm(clone(view.net));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, rate]);

  const net = view.net;
  const total = loss(net, data, "mse");
  const wrong = useMemo(() => {
    let w = 0;
    for (let n = 0; n < data.X.length; n++) if ((predict(net, data.X[n])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) w += 1;
    return w;
  }, [net, data]);
  const straight = useMemo(() => solveLinear(data.X, data.Y), [data]);
  const straightWrong = useMemo(() => {
    let w = 0;
    for (let n = 0; n < data.X.length; n++) {
      const got = straight.weights[0][0] * data.X[n][0] + straight.weights[0][1] * data.X[n][1] + straight.bias[0];
      if ((got > 0.5 ? 1 : 0) !== data.Y[n][0]) w += 1;
    }
    return w;
  }, [straight, data]);

  const histBox = useMemo<Box>(() => {
    const all = [...view.history, ...kept.flatMap((k) => k.history)];
    const top = Math.min(10, Math.max(0.05, ...all.map((p) => p[1])));
    const far = Math.max(200, view.steps, ...kept.map((k) => k.history[k.history.length - 1]?.[0] ?? 0));
    return { x0: -far * 0.02, x1: far * 1.02, y0: -top * 0.05, y1: top * 1.1 };
  }, [view.history, view.steps, kept]);

  // the hill under two of the numbers: how wrong the network is as those two
  // move while every other number stays where it is now
  const hillBox = useMemo<Box>(() => {
    const [a, b] = view.path[view.path.length - 1];
    const xs = view.path.map((p) => p[0]);
    const ys = view.path.map((p) => p[1]);
    const span = Math.max(3, Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1);
    return { x0: a - span, x1: a + span, y0: b - span, y1: b + span };
  }, [view.path]);
  const hill = useMemo(() => {
    const probe = clone(net);
    return (x: number, y: number) => {
      probe.W[1][0][0] = x;
      probe.W[1][0][1] = y;
      return loss(probe, data, "mse");
    };
  }, [net, data]);
  const hillRange = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= 16; i++) {
      for (let j = 0; j <= 16; j++) {
        const h = hill(hillBox.x0 + ((hillBox.x1 - hillBox.x0) * i) / 16, hillBox.y0 + ((hillBox.y1 - hillBox.y0) * j) / 16);
        lo = Math.min(lo, h);
        hi = Math.max(hi, h);
      }
    }
    return { lo, hi };
  }, [hill, hillBox]);

  const blown = !Number.isFinite(total) || total > 1e6 || view.history.some((p) => p[1] >= 10);
  const late = view.history.length > 30 ? view.history[view.history.length - 30][1] : Infinity;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "How it learns, and how fast"}
        job="The same network on the same dots, with the learning itself as the thing to look at. Every step: measure how wrong, find which way is down for each number, move. What you choose is how big the move is, how many dots to look at before each move, and which of the standard tricks to add. Runs you finish stay on the chart, so they can be compared."
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); setKept([]); restart(false); }} />
            <Choices options={METHODS} value={method} onPick={(id) => { setMethod(id); if (view.steps > 0) restart(); }} />
            <p className="text-[11px] text-muted">{OPTS[method].label}: Fixes {OPTS[method].fixes}.</p>
            <Choices options={BATCHES} value={batch} onPick={(id) => { setBatch(id); if (view.steps > 0) restart(); }} />
            <Slider label="Step size" min={0.01} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={(v) => { setRate(v); if (view.steps > 0) restart(); }} />
            <p className="text-[11px] text-muted">
              Changing a setting after a run has begun ends that run and keeps its curve. A step
              size above about two blows up on this problem, and that is worth seeing once.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={view.steps}
            what="steps"
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 100, max: 8000, step: 100 }}
            onToggle={() => {
              if (!runner.running && (view.steps >= limit || blown)) restart();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={() => restart()}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-muted">OR SKIP THE STEPS</h2>
            <p className="mt-2 text-[11px] text-muted">
              Take the squashes away and the whole network is one straight line. For a straight
              line there is a formula: the best one, in one calculation, no steps at all.
            </p>
            <button
              type="button"
              onClick={() => setOneShot((v) => !v)}
              className={oneShot ? "mt-3 rounded border border-leaf px-3 py-1.5 font-mono text-[11px] text-leaf" : "mt-3 rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-leaf"}
            >
              {oneShot ? "Hide the one-shot line" : "Show the one-shot line"}
            </button>
            {oneShot ? (
              <p className="mt-2 text-[11px] text-ink/80">
                The white dashed line is that answer. It gets {straightWrong} of {data.X.length} dots wrong, and
                no amount of stepping can improve it: it is already the best line there is.
                {straightWrong > 0 ? " The dots need a bend, and bends have no formula. Hence the steps." : ""}
              </p>
            ) : null}
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div className="h-[220px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={histBox}
                deps={[view.history, kept, histBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  for (const k of kept) pen.line(k.history, k.colour, 1.2);
                  pen.line(view.history, ONE, 2);
                  kept.forEach((k, i) => plate(pen, k.label, histBox.x1 - (histBox.x1 - histBox.x0) * 0.02, histBox.y1 - (histBox.y1 - histBox.y0) * (0.08 + 0.1 * (i + 1)), k.colour, "right"));
                }}
              />
            </div><Caption>How wrong, against steps.  Green: this run.  Dim: earlier runs</Caption></div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="h-[300px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={box}
                  equal
                  deps={[net, data, oneShot, box]}
                  draw={(pen) => {
                    shadePlane(pen, (x, y) => predict(net, [x, y])[0], 48);
                    ticks(pen);
                    for (let n = 0; n < data.X.length; n++) {
                      const [x, y] = data.X[n];
                      pen.dot(x, y, 4, data.Y[n][0] ? ONE : TWO);
                      if ((predict(net, [x, y])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) pen.ring(x, y, 7, INK, 1.2);
                    }
                    if (oneShot) {
                      const [a, b] = straight.weights[0];
                      const c = straight.bias[0] - 0.5;
                      const v = pen.box;
                      pen.ctx.setLineDash([6, 4]);
                      if (Math.abs(b) > Math.abs(a)) pen.line([[v.x0, -(a * v.x0 + c) / b], [v.x1, -(a * v.x1 + c) / b]], INK, 1.5);
                      else pen.line([[-(b * v.y0 + c) / a, v.y0], [-(b * v.y1 + c) / a, v.y1]], INK, 1.5);
                      pen.ctx.setLineDash([]);
                    }
                    const v = pen.box;
                    plate(pen, "The network's answer now", v.x0 + (v.x1 - v.x0) * 0.03, v.y1 - (v.y1 - v.y0) * 0.05, MUTED);
                  }}
                />
              </div>
              <div><div className="h-[300px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={hillBox}
                  equal
                  deps={[hill, hillRange, view.path, hillBox]}
                  draw={(pen) => {
                    shadeHeight(pen, hill, hillRange.lo, hillRange.hi, 40);
                    const levels = Array.from({ length: 10 }, (_, i) => hillRange.lo + ((hillRange.hi - hillRange.lo) * (i + 0.5)) / 10);
                    contours(pen, hill, levels, "rgba(232,232,234,0.14)", 40);
                    ticks(pen);
                    pen.line(view.path, INK, 1.4);
                    const last = view.path[view.path.length - 1];
                    pen.dot(last[0], last[1], 5, INK);
                    pen.ring(view.path[0][0], view.path[0][1], 5, SKY, 1.5);

                  }}
                />
              </div><Caption>The hill under two of the 25 numbers Bright: more wrong.  White: where they have been</Caption></div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={blown ? false : wrong === 0 ? true : undefined}>
              {view.steps === 0
                ? `Nothing learned yet: ${wrong} of ${data.X.length} wrong. Press run. The top chart will draw how wrong the network is after each step.`
                : blown
                  ? `The run blew up after ${view.steps} steps: how wrong went up instead of down and kept going. The step size ${rate.toFixed(2)} is too big for this hill, so every step overshoots the valley and lands higher, exactly like the ball on the hill page. Halve it.`
                  : wrong === 0
                    ? `Done: every dot right after ${view.steps} steps with ${OPTS[method].label}${batch !== "all" ? `, Looking at ${batch} dot${batch === "1" ? "" : "s"} at a time` : ""}. How wrong: ${total.toFixed(4)}.`
                    : `After ${view.steps} steps, ${wrong} of ${data.X.length} wrong, how wrong ${total.toFixed(4)}, ${total < late * 0.97 ? "still falling" : "no longer falling much"}.${batch !== "all" ? " The curve is jagged because each step sees only a few dots, so its idea of downhill is noisy. It is also cheaper per step." : ""}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Method</dt>
              <dd className="text-right text-ink/80">{OPTS[method].label}</dd>
              <dt>Dots looked at before each move</dt>
              <dd className="text-right text-ink/80">{batch === "all" ? data.X.length : batch}</dd>
              <dt>Numbers being moved</dt>
              <dd className="text-right text-ink/80">{flatten(net).length}</dd>
              <dt>Runs kept on the chart</dt>
              <dd className="text-right text-ink/80">{kept.length}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              Plain descent is the ball. Momentum lets it keep rolling so it does not bounce across
              a narrow valley. Adam gives every number its own step size, shrunk where the slope
              has been steep. None of them changes where the bottom is; they change how the ball
              gets there. Try the same problem with each, and read the chart.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`learn-${kind}-${method}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
