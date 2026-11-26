import { createFileRoute } from "@tanstack/react-router";
import { Label, Button, Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, contours, plate, shadeHeight, shadePlane, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
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
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/learn")({
  loader: () => api.system(TOPIC, "learn"),
  component: LearnPage,
});

const KINDS: { id: SetKind; label: string }[] = (["rings", "xor", "spiral", "split"] as SetKind[]).map((id) => ({ id, label: L(SETS[id].label) }));
const METHODS = (Object.keys(OPTS) as OptKind[]).map((id) => ({ id, label: L(OPTS[id].label) }));
const BATCHES = [
  { id: "all", label: L("All the dots") },
  { id: "8", label: L("8 dots at a time") },
  { id: "1", label: L("1 dot at a time") },
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
        { label: L("{{method}}, step size {{rate}}, {{batch}}", { method: L(OPTS[method].label), rate, batch: BATCHES.find((b) => b.id === batch)?.label ?? "undefined" }), history: view.history, colour: KEPT_COLOURS[k.length % KEPT_COLOURS.length] },
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
    <div>
      <TaskPage
        title={system?.name ?? L("How fast a network learns")}
        job={L("How does a neural network learn, and what makes it learn faster? The plane holds dots of two kinds, drawn in two colours, and the network must put each dot on its own side. It has 2 inputs (the two coordinates of a dot), 6 neurons in a middle layer and 1 output. A neuron multiplies each input by a number called a weight, adds a number called a bias and squashes the total. In all, the network has 25 such numbers. Training repeats one step. First it measures the error score: the network's answer minus the right answer, squared, averaged over the dots. Then, for every number, it finds which way of moving it lowers the error. Then it moves each number a little that way. Three choices change the step: the method, how many dots are looked at before each move, and the step size. Each finished run stays on the top chart, so runs can be compared. The question: which settings put every dot on its own side in the fewest steps?")}
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); setKept([]); restart(false); }} />
            <Choices options={METHODS} value={method} onPick={(id) => { setMethod(id); if (view.steps > 0) restart(); }} />
            <Text kind="note" as="p">{L("{{method}}: {{fixes}}.", { method: L(OPTS[method].label), fixes: L(OPTS[method].fixes) })}</Text>
            <Choices options={BATCHES} value={batch} onPick={(id) => { setBatch(id); if (view.steps > 0) restart(); }} />
            <Slider label={L("Step size")} min={0.01} max={3} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={(v) => { setRate(v); if (view.steps > 0) restart(); }} />
            <Text kind="note" as="p">
              {L("The row of buttons under the method chooses how many dots the network looks at before each move: all of them, 8 picked at random, or 1 picked at random. 'Step size' sets how far the numbers move at each step. Changing a setting after a run has begun ends that run and keeps its curve on the chart.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={view.steps}
            what={L("steps")}
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
          <section data-slot="panel">
            <Label>{L("OR NO STEPS AT ALL")}</Label>
            <Text kind="note" as="p" className="mt-2">
              {L("Without the squashing functions, the whole network reduces to one weighted sum of the two coordinates plus a number, and its border between the two kinds is a straight line. For the best such line there is a formula, the method of least squares. It gives the answer in one calculation, with no steps at all.")}
            </Text>
            <Button variant="outline" size="sm" className="mt-3"
              type="button"
              onClick={() => setOneShot((v) => !v)}
            >
              {oneShot ? L("Hide the line from the formula") : L("Show the line from the formula")}
            </Button>
            {oneShot ? (
              <Text kind="note" as="p" className="mt-2">
                {L("The dashed line on the plane is that answer. It puts {{wrong}} of the {{all}} dots on the wrong side, and no number of steps can improve it: by the error score, it is already the best straight line.", { wrong: straightWrong, all: data.X.length })}
                {straightWrong > 0 ? " " + L("These dots need a curved border, and for a curved border there is no such formula. That is why the network learns in steps.") : ""}
              </Text>
            ) : null}
          </section>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[220px] overflow-hidden">
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
            </div><Caption>{L("Up: the error score. Across: training steps. Thick line: this run. Thinner lines: earlier runs, each labelled with its settings")}</Caption></div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div><div data-slot="plot" className="h-[300px] overflow-hidden">
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
                    plate(pen, L("The network's answer now"), v.x0 + (v.x1 - v.x0) * 0.03, v.y1 - (v.y1 - v.y0) * 0.05, MUTED);
                  }}
                />
              </div><Caption>{L("Shading: the network's answer at every point of the plane, in the colour of the kind it picks there. A ring around a dot: a dot on the wrong side")}</Caption></div>
              <div><div data-slot="plot" className="h-[300px] overflow-hidden">
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
              </div><Caption>{L("The error score as a landscape over two of the 25 numbers, with all the others held fixed. Across: the weight from middle neuron 1 to the output. Up: the weight from middle neuron 2 to the output. Brighter: larger error. The line: where these two weights have been during training, from the ringed start to the dot")}</Caption></div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={blown ? false : wrong === 0 ? true : undefined}>
              {view.steps === 0
                ? L("Nothing is learned yet: {{wrong}} of the {{all}} dots are on the wrong side. Press Run. The top chart will then draw the error score after each step.", { wrong, all: data.X.length })
                : blown
                  ? L("The run broke down after {{steps}} steps: the error score went up instead of down and kept growing. A step size of {{rate}} is too large here. Each move jumps over the low ground and lands higher up on the other side, and the next jump is larger still. Halving the step size fixes it.", { steps: view.steps, rate: rate.toFixed(2) })
                  : wrong === 0
                    ? batch === "all"
                      ? L("Done: every dot is on its own side after {{steps}} steps with {{method}}. Error score: {{total}}.", { steps: view.steps, method: L(OPTS[method].label), total: total.toFixed(4) })
                      : batch === "1"
                        ? L("Done: every dot is on its own side after {{steps}} steps with {{method}}, looking at 1 dot before each move. Error score: {{total}}.", { steps: view.steps, method: L(OPTS[method].label), total: total.toFixed(4) })
                        : L("Done: every dot is on its own side after {{steps}} steps with {{method}}, looking at {{batch}} dots before each move. Error score: {{total}}.", { steps: view.steps, method: L(OPTS[method].label), batch, total: total.toFixed(4) })
                    : L("After {{steps}} steps, {{wrong}} of the {{all}} dots are on the wrong side. Error score: {{total}}, {{trend}}.", { steps: view.steps, wrong, all: data.X.length, total: total.toFixed(4), trend: total < late * 0.97 ? L("still falling") : L("hardly falling any more") }) +
                      (batch !== "all" ? " " + L("The curve is jagged because each step looks at only a few dots, so its estimate of the downhill direction is rough. Each step is cheaper to compute, though.") : "")}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Method")}</dt>
              <dd className="text-right text-foreground/80">{L(OPTS[method].label)}</dd>
              <dt>{L("Dots looked at before each move")}</dt>
              <dd className="text-right text-foreground/80">{batch === "all" ? data.X.length : batch}</dd>
              <dt>{L("Numbers being adjusted (weights and biases)")}</dt>
              <dd className="text-right text-foreground/80">{flatten(net).length}</dd>
              <dt>{L("Runs kept on the chart")}</dt>
              <dd className="text-right text-foreground/80">{kept.length}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("What do the methods change? 'Gradient descent' moves every number straight downhill, by the step size times its slope. 'Momentum' also keeps part of the previous move, so it does not zigzag across a narrow valley. 'Adam' gives every number its own step size, smaller where that number's slope has been steep. None of them changes where the lowest error is. They change how fast training gets there, and whether it gets there at all. The top chart compares them on the same dots.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`learn-${kind}-${method}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
