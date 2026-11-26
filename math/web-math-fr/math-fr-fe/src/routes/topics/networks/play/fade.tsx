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
import { L } from "@/lib/lang";
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
  { id: "sigmoid", label: L("Squash into 0 to 1 (sigmoid)") },
  { id: "tanh", label: L("Squash into -1 to 1 (tanh)") },
  { id: "relu", label: L("Negatives become zero (ReLU)") },
];
const STARTS: { id: Init; label: string }[] = (["uniform", "xavier", "he"] as Init[]).map((id) => ({ id, label: L(INITS[id].label) }));
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
        title={system?.name ?? L("Why the first layer learns last")}
        job={L("Why does the first layer of a deep network learn last? The network here has many layers of neurons, one after another: 2 inputs, several middle layers of 6 neurons each, and 1 output. A neuron multiplies its inputs by numbers called weights, adds a number called a bias and squashes the total. The data are 60 dots of two kinds: one kind in the middle, the other in a ring around it. In training, the error found at the output is passed back layer by layer. Each layer's weights move in proportion to the error signal that reaches them. At every layer on the way back, the signal is multiplied by weights and by the slope of a squashing function. For the squashing function into 0 to 1, that slope is at most 1/4. So the signal shrinks layer after layer, and the first layer, the one that receives the dots, gets the least. The bars show how much reaches each layer.")}
        input={
          <div className="space-y-3">
            <Choices options={SQUASHES} value={act} onPick={(id) => { setAct(id); restart(id, init, deep); }} />
            <Choices options={STARTS} value={init} onPick={(id) => { setInit(id); restart(act, id, deep); }} />
            <Text kind="note" as="p">{L(INITS[init].label)}: {L(INITS[init].note)}.</Text>
            <Slider label={L("Middle layers")} min={2} max={7} step={1} value={deep} format={(v) => `${v}`} onChange={(v) => { setDeep(v); restart(act, init, v); }} />
            <Slider label={L("Step size")} min={0.05} max={2} step={0.05} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
            <Text kind="note" as="p">
              {L("The first row chooses the squashing function, the second how the starting weights are drawn. Each middle layer has 6 neurons. 'Step size' sets how far the weights move at each step. The bars are measured before any step, so the choices can be compared without running.")}
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
          <section ref={stage} className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_300px]">
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
                    plate(pen, l === 0 ? L("Layer 1, the first: receives the dots") : l === layers - 1 ? L("Layer {{n}}, the last: gives the answer", { n: l + 1 }) : L("Layer {{n}}", { n: l + 1 }), LOW + 0.15, y - 0.5, INK);
                    plate(pen, view.norms[l].toExponential(1), HIGH - 0.1, y - 0.5, MUTED, "right");
                  }
                }}
              />
            </div><Caption>{L("How much error signal reaches each layer's weights right now: the typical size of their slopes. On this scale each mark is ten times the one to its left, and 1e-3 means 0.001")}</Caption></div>
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
              </div><Caption>{L("The network's answer so far, shaded by the kind it picks at each point. Ring: a dot on the wrong side")}</Caption></div>
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
              </div><Caption>{L("The same sizes (up, on the same ten-times scale) over the training steps (across). One line per layer, in the colour of its bar. The two thicker lines are the first and the last layer")}</Caption></div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={wrong === 0 ? true : stalled || travelRatio > 100 ? false : undefined}>
              {view.steps === 0
                ? L("Before any step, with {{hidden}} middle layers, the error signal reaching the first layer is {{ratio}} times smaller than at the last layer. {{next}}", {
                    hidden: layers - 1,
                    ratio: ratio.toExponential(1),
                    next: ratio > 100 ? L("At that ratio the first layer is almost frozen. Press Run and watch which layers move.") : ratio > 10 ? L("That is a real gap. Press Run and watch which layers move.") : L("That is close to even: the signal arrives almost undiminished. Press Run."),
                  })
                : L("After {{steps}} steps, {{wrong}} of the {{total}} dots are on the wrong side. Since the start, the last layer's weights have moved by {{last}} and the first layer's by {{first}}: {{ratio}} times less. {{story}}{{relu}}{{start}}", {
                    steps: view.steps,
                    wrong,
                    total: data.X.length,
                    last: travel[layers - 1].toExponential(1),
                    first: travel[0].toExponential(1),
                    ratio: travelRatio.toExponential(1),
                    story: stalled ? L("The error signal is now tiny at every layer: the network has stopped learning. The layers nearest the output settled on answering about one half for every dot. The first layer, which barely moved, is the one that would have to change for anything else to happen. This is called the vanishing gradient: the slopes that guide training shrink towards zero on their way back. Seen from outside, it is not slow progress but a network that stops.") : travelRatio > 100 ? L("The first layer is learning last, if at all: the layers nearest the output move first, and the layer that actually receives the dots waits. This is called the vanishing gradient: the slopes that guide training shrink towards zero on their way back to the first layers.") : travelRatio > 10 ? L("The gap is there, but the first layer is moving.") : L("Every layer moves by about the same amount, so the whole network learns at once."),
                    relu: act === "relu" ? L(" With 'Negatives become zero', the slope is exactly 1 wherever the neuron's total is positive, so the signal loses nothing passing through it.") : "",
                    start: init === "he" || init === "xavier" ? L(" The starting weights were sized so the signal keeps its size through each layer, which is what that rule was made for.") : "",
                  })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Error signal at the last layer's weights")}</dt>
              <dd className="text-right text-foreground/80">{last.toExponential(2)}</dd>
              <dt>{L("Error signal at the first layer's weights")}</dt>
              <dd className="text-right text-foreground/80">{first.toExponential(2)}</dd>
              <dt>{L("Last divided by first")}</dt>
              <dd className="text-right text-foreground/80">{ratio.toExponential(2)}</dd>
              <dt>{L("How far the weights of the last and the first layer have moved since the start")}</dt>
              <dd className="text-right text-foreground/80">{travel[layers - 1].toExponential(2)}, {travel[0].toExponential(2)}</dd>
              <dt>{L("Layers of weights (middle layers plus 1)")}</dt>
              <dd className="text-right text-foreground/80">{layers}</dd>
              <dt>{L("Dots on the wrong side, of {{total}}", { total: data.X.length })}</dt>
              <dd className="text-right text-foreground/80">{wrong}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("For comparison: the same number of layers with 'Negatives become zero' and 'He's rule', then the bars again. A third standard fix, skip connections, gives the signal a path that goes around the squashing functions; it is not on this page.")}
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
