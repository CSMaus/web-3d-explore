import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
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
import { FAINT, INK, MUTED, ONE, TWO, boxOf, mix, plate, shadePlane, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { fade, layerNorms } from "@/systems/depth";
import { dataset } from "@/systems/learn";
import { INITS, backward, clone, make, predict, type Act, type Init, type Net } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/fade")({
  loader: () => api.system(TOPIC, "fade"),
  component: FadePage,
});

const SQUASHES: { id: Act; label: string }[] = [
  { id: "sigmoid", label: "Squash to 0..1" },
  { id: "tanh", label: "Squash to -1..1" },
  { id: "relu", label: "Cut below zero" },
];
const STARTS: { id: Init; label: string }[] = (["uniform", "xavier", "he"] as Init[]).map((id) => ({ id, label: INITS[id].label }));
const WIDTH = 6;
const MOST = 2000;
const LOW = -9;
const HIGH = 1;

type View = { net: Net; start: Net; norms: number[]; steps: number; history: [number, number[]][] };

/** how far a layer's weights have moved since the start, as a root mean square. */
function moved(now: Net, start: Net): number[] {
  return now.W.map((m, l) => {
    let s = 0;
    let n = 0;
    for (let i = 0; i < m.length; i++) for (let j = 0; j < m[i].length; j++) {
      s += (m[i][j] - start.W[l][i][j]) ** 2;
      n += 1;
    }
    return Math.sqrt(s / Math.max(1, n));
  });
}

function FadePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [act, setAct] = useState<Act>("sigmoid");
  const [init, setInit] = useState<Init>("uniform");
  const [deep, setDeep] = useState(5);
  const [rate, setRate] = useState(0.5);
  const [perFrame, setPerFrame] = useState(2);
  const [limit, setLimit] = useState(MOST);
  const data = useMemo(() => dataset("rings", 60, 3), []);
  const box = useMemo(() => boxOf(data.X), [data]);

  const build = (a: Act, i: Init, d: number) => make([2, ...new Array(d).fill(WIDTH), 1], a, "sigmoid", i, 4);
  const [view, setView] = useState<View>(() => {
    const net = build("sigmoid", "uniform", 5);
    return { net, start: clone(net), norms: fade(net, data).norms, steps: 0, history: [] };
  });
  const work = useRef({ net: build("sigmoid", "uniform", 5), start: build("sigmoid", "uniform", 5), rate, history: [] as [number, number[]][] });
  useEffect(() => {
    work.current.rate = rate;
  });

  const runner = useRunner(
    (n) => {
      const w = work.current;
      const { grad } = backward(w.net, data, "mse");
      const norms = layerNorms(grad);
      for (let l = 0; l < w.net.W.length; l++) {
        for (let i = 0; i < w.net.W[l].length; i++) {
          for (let j = 0; j < w.net.W[l][i].length; j++) w.net.W[l][i][j] -= w.rate * grad.dW[l][i][j];
          w.net.b[l][i] -= w.rate * grad.db[l][i];
        }
      }
      if (n % 5 === 0 || n < 20) w.history.push([n, norms]);
      setView({ net: clone(w.net), start: w.start, norms, steps: n, history: w.history.slice() });
    },
    { perFrame, stopAt: limit },
  );

  const restart = (a: Act = act, i: Init = init, d: number = deep) => {
    runner.reset();
    const net = build(a, i, d);
    work.current.net = net;
    work.current.start = clone(net);
    work.current.history = [];
    setView({ net: clone(net), start: clone(net), norms: fade(net, data).norms, steps: 0, history: [] });
  };

  const net = view.net;
  const layers = net.W.length;
  const first = view.norms[0];
  const last = view.norms[layers - 1];
  const ratio = last / Math.max(first, 1e-300);
  const travel = useMemo(() => moved(view.net, view.start), [view.net, view.start]);
  const travelRatio = travel[layers - 1] / Math.max(travel[0], 1e-300);
  const stalled = view.steps > 0 && Math.max(...view.norms) < 1e-4;
  const wrong = useMemo(() => {
    let w = 0;
    for (let n = 0; n < data.X.length; n++) if ((predict(net, data.X[n])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) w += 1;
    return w;
  }, [net, data]);
  const colourOf = (l: number) => mix(TWO, ONE, layers === 1 ? 1 : l / (layers - 1));
  const barBox: Box = { x0: LOW, x1: HIGH, y0: 0, y1: layers };
  const histBox = useMemo<Box>(() => ({ x0: -2, x1: Math.max(50, view.steps) + 2, y0: LOW, y1: HIGH }), [view.steps]);
  const log = (v: number) => Math.max(LOW, Math.log10(Math.max(v, 1e-300)));

  return (
    <div>
      <TaskPage
        title={system?.name ?? "The first layer learns last"}
        job="The correction page sent the blame back through two layers. This page stacks many, on the ring inside a ring, and measures how much blame reaches each layer. Every layer the blame passes back through multiplies it by a weight and by the slope of a squash, and a squash to 0..1 has a slope of at most a quarter. Layer after layer, the blame fades, and the first layer, the one that sees the dots, is the one that barely moves."
        input={
          <div className="space-y-3">
            <Choices options={SQUASHES} value={act} onPick={(id) => { setAct(id); restart(id, init, deep); }} />
            <Choices options={STARTS} value={init} onPick={(id) => { setInit(id); restart(act, id, deep); }} />
            <Text kind="note" as="p">{INITS[init].label}: {INITS[init].note}.</Text>
            <Slider label="Hidden layers" min={2} max={7} step={1} value={deep} format={(v) => `${v}`} onChange={(v) => { setDeep(v); restart(act, init, v); }} />
            <Slider label="Step size" min={0.05} max={2} step={0.05} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
            <Text kind="note" as="p">
              Six units in every hidden layer. The bars measure the blame before any step is
              taken, so the comparison between squashes and starts can be read without running.
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={view.steps}
            what="steps"
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 100, max: 6000, step: 100 }}
            onToggle={() => {
              if (!runner.running && view.steps >= limit) restart();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={() => restart()}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[1fr_300px]">
            <div><div data-slot="plot" className="h-[380px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={barBox}
                deps={[view.norms, layers]}
                draw={(pen) => {
                  const { ctx } = pen;
                  for (let e = LOW; e <= HIGH; e++) {
                    pen.line([[e, 0], [e, layers]], FAINT, 1);
                    plate(pen, e === 0 ? "1" : `1e${e}`, e, 0.12, MUTED, "center");
                  }
                  for (let l = 0; l < layers; l++) {
                    const y = layers - l;
                    const v = log(view.norms[l]);
                    ctx.fillStyle = colourOf(l);
                    const top = pen.py(y - 0.22);
                    const bottom = pen.py(y - 0.78);
                    ctx.fillRect(pen.px(LOW), top, Math.max(2, pen.px(v) - pen.px(LOW)), bottom - top);
                    plate(pen, l === 0 ? "Layer 1, first, sees the dots" : l === layers - 1 ? `Layer ${l + 1}, last, gives the answer` : `Layer ${l + 1}`, LOW + 0.15, y - 0.5, INK);
                    plate(pen, view.norms[l].toExponential(1), HIGH - 0.1, y - 0.5, MUTED, "right");
                  }
                }}
              />
            </div><Caption>How much blame reaches each layer's weights right now, on a scale where each mark is ten times the last</Caption></div>
            <div className="space-y-2">
              <div><div data-slot="plot" className="h-[200px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={box}
                  equal
                  deps={[net, data, box]}
                  draw={(pen) => {
                    shadePlane(pen, (x, y) => predict(net, [x, y])[0], 36);
                    ticks(pen);
                    for (let n = 0; n < data.X.length; n++) {
                      const [x, y] = data.X[n];
                      pen.dot(x, y, 3.5, data.Y[n][0] ? ONE : TWO);
                      if ((predict(net, [x, y])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) pen.ring(x, y, 6, INK, 1);
                    }
                  }}
                />
              </div><Caption>The answer so far</Caption></div>
              <div><div data-slot="plot" className="h-[172px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={histBox}
                  deps={[view.history, histBox, layers]}
                  draw={(pen) => {
                    ticks(pen);
                    for (let l = 0; l < layers; l++) {
                      pen.line(view.history.map(([s, norms]) => [s, log(norms[l])] as [number, number]), colourOf(l), l === 0 || l === layers - 1 ? 1.8 : 1);
                    }
                  }}
                />
              </div><Caption>The same, against steps. Rose: the first layer. Green: the last</Caption></div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={wrong === 0 ? true : stalled || travelRatio > 100 ? false : undefined}>
              {view.steps === 0
                ? `Before any step, with ${layers - 1} hidden layers: the blame reaching the first layer is ${ratio.toExponential(1)} times smaller than the blame at the last. ${ratio > 100 ? "At that rate the first layer is as good as frozen. Press run and watch which layers move." : ratio > 10 ? "That is a real gap. Press run and watch which layers move." : "That is close to even: the blame arrives nearly undiminished. Press run."}`
                : `After ${view.steps} steps, ${wrong} of ${data.X.length} wrong. Since the start the last layer's weights have moved ${travel[layers - 1].toExponential(1)} and the first layer's ${travel[0].toExponential(1)}, ${travelRatio.toExponential(1)} times less. ${stalled ? "The blame is now tiny at every layer: the network has stalled. The layers nearest the answer flattened onto answering about one half for every dot, and the first layer, which barely moved, is the one that would have to change for anything else to happen. This is what the vanishing gradient looks like from outside: not slow progress but a network that stops." : travelRatio > 100 ? "The first layer is learning last, if at all: the layers nearest the answer move first and the layer that actually sees the dots waits. This is the vanishing gradient." : travelRatio > 10 ? "The gap is there but the first layer is moving." : "Every layer is moving by about the same amount, so the whole network learns at once."}${act === "relu" ? " The cut-off unit's slope is exactly one wherever it is on, so nothing is lost passing through it." : ""}${init === "he" || init === "xavier" ? " The start was sized so the signal keeps its size through each layer, which is what the rule was made for." : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <dt>Blame at the last layer</dt>
              <dd className="text-right text-foreground/80">{last.toExponential(2)}</dd>
              <dt>Blame at the first layer</dt>
              <dd className="text-right text-foreground/80">{first.toExponential(2)}</dd>
              <dt>Last over first</dt>
              <dd className="text-right text-foreground/80">{ratio.toExponential(2)}</dd>
              <dt>How far the last and the first layer have moved since the start</dt>
              <dd className="text-right text-foreground/80">{travel[layers - 1].toExponential(2)}, {travel[0].toExponential(2)}</dd>
              <dt>Layers of weights</dt>
              <dd className="text-right text-foreground/80">{layers}</dd>
              <dt>Wrong of {data.X.length}</dt>
              <dd className="text-right text-foreground/80">{wrong}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              Try the same depth with the cut-below-zero squash and He's start, and read the
              bars again. Skip connections, the other standard fix, give the blame a wire that
              bypasses the squashes altogether; they are not on this page.
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`fade-${act}-${init}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
