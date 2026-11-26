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
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, classColour, drawNet, layout, plate, shadePlane, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { SETS, dataset, type SetKind } from "@/systems/learn";
import { ACTS, backward, clone, forward, loss, make, params, predict, type Act, type Net } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/layers")({
  loader: () => api.system(TOPIC, "layers"),
  component: LayersPage,
});

const KINDS: { id: SetKind; label: string }[] = (["xor", "rings", "spiral", "split"] as SetKind[]).map((id) => ({ id, label: L(SETS[id].label) }));
const SQUASHES: { id: Act; label: string }[] = [
  { id: "tanh", label: L("Squash into -1 to 1 (tanh)") },
  { id: "sigmoid", label: L("Squash into 0 to 1 (sigmoid)") },
  { id: "relu", label: L("Negatives become zero (ReLU)") },
];
const MOST = 6000;

type View = { net: Net; steps: number; history: [number, number][] };

function LayersPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [kind, setKind] = useState<SetKind>("rings");
  const [act, setAct] = useState<Act>("tanh");
  const [hidden, setHidden] = useState(4);
  const [rate, setRate] = useState(0.5);
  const [seed, setSeed] = useState(1);
  const [probe, setProbe] = useState<[number, number] | null>(null);
  const [perFrame, setPerFrame] = useState(4);

  const data = useMemo(() => dataset(kind, kind === "xor" ? 4 : 60, 3), [kind]);
  const box = useMemo(() => boxOf(data.X), [data]);
  const build = (h: number, a: Act, s: number) => make([2, h, 1], a, "sigmoid", "xavier", s);

  const [view, setView] = useState<View>(() => ({ net: build(4, "tanh", 1), steps: 0, history: [] }));
  const work = useRef({ net: build(4, "tanh", 1), rate, data, history: [] as [number, number][] });
  useEffect(() => {
    work.current.rate = rate;
    work.current.data = data;
  });

  const [limit, setLimit] = useState(MOST);
  const runner = useRunner(
    (n) => {
      const w = work.current;
      const { grad, loss: l } = backward(w.net, w.data, "mse");
      for (let L = 0; L < w.net.W.length; L++) {
        for (let i = 0; i < w.net.W[L].length; i++) {
          for (let j = 0; j < w.net.W[L][i].length; j++) w.net.W[L][i][j] -= w.rate * grad.dW[L][i][j];
          w.net.b[L][i] -= w.rate * grad.db[L][i];
        }
      }
      if (n % 5 === 0 || n < 40) w.history.push([n, l]);
      setView({ net: clone(w.net), steps: n, history: w.history.slice() });
    },
    { perFrame, stopAt: limit },
  );

  const restart = (h = hidden, a = act, s = seed) => {
    runner.reset();
    work.current.net = build(h, a, s);
    work.current.history = [];
    setView({ net: clone(work.current.net), steps: 0, history: [] });
  };

  const net = view.net;
  const wrong = useMemo(() => {
    let w = 0;
    for (let n = 0; n < data.X.length; n++) if ((predict(net, data.X[n])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) w += 1;
    return w;
  }, [net, data]);
  const total = loss(net, data, "mse");
  const count = params(net);
  const probeValues = probe ? forward(net, probe).a : null;
  const histBox = useMemo<Box>(() => {
    const top = Math.max(0.05, ...view.history.map((p) => p[1]));
    return { x0: -5, x1: Math.max(100, view.steps) + 5, y0: -top * 0.05, y1: top * 1.1 };
  }, [view.history, view.steps]);
  const stuck = view.steps > 1500 && view.history.length > 40 && view.history[view.history.length - 1][1] > view.history[view.history.length - 40][1] * 0.98;

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Several neurons, one answer")}
        job={L("Can several straight lines together divide dots that no single line can divide? The plane holds dots of two kinds, drawn in two colours. In the set 'A ring inside a ring', 30 dots of one kind sit in the middle and 30 of the other kind lie in a ring around them, so no straight line puts each kind on its own side. A neuron here is a small calculation. It takes the two coordinates of a point, multiplies each by its own number called a weight, adds one more number called a bias, and passes the total through a squashing function. On one side of a straight line the result is high, on the other side low, so one neuron draws one line. This page puts several neurons side by side in a middle layer, each drawing its own line. One more neuron, the output, adds up their answers with weights of its own. Neurons connected this way form a neural network. Press Run and the network adjusts all its weights and biases, step by step. The aim: every dot inside the shaded area of its own colour.")}
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); restart(); }} />
            <Text kind="note" as="p">{L(SETS[kind].note)}</Text>
            <Choices options={SQUASHES} value={act} onPick={(id) => { setAct(id); restart(hidden, id); }} />
            <Slider label={L("Neurons in the middle layer")} min={1} max={8} step={1} value={hidden} format={(v) => String(Math.round(v))} onChange={(v) => { setHidden(Math.round(v)); restart(Math.round(v)); }} />
            <Slider label={L("Step size")} min={0.02} max={2} step={0.02} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
            <Slider label={L("Random starting numbers")} min={1} max={20} step={1} value={seed} format={(v) => L("draw {{n}}", { n: Math.round(v) })} onChange={(v) => { setSeed(Math.round(v)); restart(hidden, act, Math.round(v)); }} />
            <Text kind="note" as="p">
              {L("The three buttons above choose the squashing function of the middle neurons. Before training, every weight and bias is a small random number; the last slider picks another random draw. 'Step size' sets how far all the numbers move at each step of training. With one neuron in the middle layer the network can draw only one straight line. Compare one, three and eight. A click on the plane sends that point through the network, and the diagram of the network shows each neuron's answer to it.")}
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
            limitRange={{ min: 100, max: 12000, step: 100 }}
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
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div><div data-slot="plot" className="h-[340px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={box}
                  equal
                  deps={[net, data, probe, box]}
                  onPick={(x, y) => setProbe([x, y])}
                  draw={(pen) => {
                    shadePlane(pen, (x, y) => predict(net, [x, y])[0], 56);
                    ticks(pen);
                    pen.axes("rgba(232,232,234,0.12)");
                    for (let n = 0; n < data.X.length; n++) {
                      const [x, y] = data.X[n];
                      pen.dot(x, y, 4.5, data.Y[n][0] ? ONE : TWO);
                      if ((predict(net, [x, y])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) pen.ring(x, y, 8, INK, 1.2);
                    }
                    if (probe) pen.ring(probe[0], probe[1], 10, SKY, 2);

                  }}
                />
              </div><Caption>{L("Shading: the network's answer at every point of the plane, in the colour of the kind it picks there. A ring around a dot: the network puts that dot on the wrong side")}</Caption></div>
              <div><div data-slot="plot" className="h-[340px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                  deps={[net, probeValues]}
                  draw={(pen) => {
                    const l = layout(net.sizes, pen.width, pen.height, 46);
                    drawNet(pen.ctx, net, l, {
                      values: probeValues ?? undefined,
                      tint: probeValues ? probeValues.map((layer, L) => layer.map((v) => (L === 0 ? 0.5 : L === net.W.length ? v : (ACTS[net.act].f(0) === 0 ? (v + 1) / 2 : v)))) : undefined,
                      labels: [L("inputs"), L("middle"), L("output")],
                      radius: 14,
                    });
                    pen.ctx.fillStyle = MUTED;
                    pen.ctx.textAlign = "left";
                    pen.ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  }}
                />
              </div><Caption>{probe ? L("The network as circles: the two inputs, the middle layer, the output. Each circle is shaded by that neuron's answer to the ringed point") : L("The network as circles: the two inputs, the middle layer, the output. A click on the plane shows each neuron's answer to that point")}</Caption></div>
            </div>
            <div data-slot="plot" className="h-[130px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[net, box]}
                draw={(pen) => {
                  // what each middle unit alone sees: its own line, its own squash
                  const h = net.sizes[1];
                  const gap = 8;
                  const tile = Math.min(pen.height - 24, (pen.width - gap * (h + 1)) / h);
                  const cells = 20;
                  const range = ACTS[net.act].f(-100) < -0.5 ? [-1, 1] : [0, 1];
                  for (let u = 0; u < h; u++) {
                    const x0 = gap + u * (tile + gap);
                    const y0 = 18;
                    for (let i = 0; i < cells; i++) {
                      for (let j = 0; j < cells; j++) {
                        const x = box.x0 + ((i + 0.5) / cells) * (box.x1 - box.x0);
                        const y = box.y1 - ((j + 0.5) / cells) * (box.y1 - box.y0);
                        const a = forward(net, [x, y]).a[1][u];
                        pen.ctx.fillStyle = classColour((a - range[0]) / (range[1] - range[0]));
                        pen.ctx.fillRect(x0 + (i * tile) / cells, y0 + (j * tile) / cells, tile / cells + 0.5, tile / cells + 0.5);
                      }
                    }
                    pen.ctx.fillStyle = MUTED;
                    pen.ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                    pen.ctx.textAlign = "left";
                    pen.ctx.fillText(L("neuron {{n}}, weight {{w}}", { n: u + 1, w: net.W[1][0][u].toFixed(2) }), x0, 12);
                  }
                }}
              />
            </div>
            <Caption>{L("Each small square: what one middle neuron alone answers over the whole plane. Above it: its number and the weight the output neuron gives to its answer")}</Caption>
            <div data-slot="plot" className="h-[120px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={histBox}
                deps={[view.history, histBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(view.history, ONE, 1.8);
                  plate(pen, L("Error score after each step"), histBox.x0 + 8, histBox.y1 - (histBox.y1 - histBox.y0) * 0.15, MUTED);
                }}
              />
            </div>
            <Caption>{L("The error score after each training step: for each dot, the network's answer minus the right answer, squared, then averaged over all dots. Training should make it fall")}</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={wrong === 0 ? true : stuck ? false : undefined}>
              {view.steps === 0
                ? L("Before training, the network puts {{wrong}} of the {{total}} dots on the wrong side. {{tiles}} Press Run to start training.", {
                    wrong,
                    total: data.X.length,
                    tiles: hidden > 1 ? L("The {{n}} small squares are the {{n}} middle neurons, each with a line of its own.", { n: hidden }) : L("The single small square is the one middle neuron and its line.", { n: hidden }),
                  })
                : wrong === 0
                  ? L("After {{steps}} steps of training, all {{total}} dots lie in the area of their own colour. The border between the two areas is no longer a straight line. It is built from {{hidden}} lines, one per middle neuron, added up with weights by the output neuron.", { steps: view.steps, total: data.X.length, hidden })
                  : stuck
                    ? hidden === 1
                      ? L("After {{steps}} steps, {{wrong}} dots are still on the wrong side and the error has stopped falling. One middle neuron draws one straight line. The output neuron can only make that line's answer stronger or weaker, it cannot bend the line. More middle neurons are needed.", { steps: view.steps, wrong })
                      : L("After {{steps}} steps, {{wrong}} dots are still on the wrong side and the error has stopped falling. Training has settled at a low point of the error that is not the lowest one. With {{hidden}} neurons this can happen. Another draw of starting numbers, or more neurons, may get past it.", { steps: view.steps, wrong, hidden })
                    : L("After {{steps}} steps, {{wrong}} of the {{total}} dots are on the wrong side. Error score: {{loss}}, {{trend}}.", {
                        steps: view.steps,
                        wrong,
                        total: data.X.length,
                        loss: total.toFixed(4),
                        trend: view.history.length > 10 && total < view.history[view.history.length - 10][1] ? L("falling") : L("not falling at the moment"),
                      })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Neurons: 2 inputs, {{hidden}} in the middle layer, 1 output", { hidden })}</dt>
              <dd className="text-right text-foreground/80">{L("{{n}} numbers set by training", { n: count.total })}</dd>
              <dt>{L("Of these, weights (multipliers on the connections)")}</dt>
              <dd className="text-right text-foreground/80">{count.weights}</dd>
              <dt>{L("And biases (one added number per neuron)")}</dt>
              <dd className="text-right text-foreground/80">{count.biases}</dd>
              <dt>{L("Error score: average of (answer minus right answer) squared")}</dt>
              <dd className="text-right text-foreground/80">{total.toFixed(5)}</dd>
              {probeValues ? (
                <>
                  <dt>{L("Middle neurons' answers to the ringed point")}</dt>
                  <dd className="text-right text-foreground/80">{probeValues[1].map((v) => v.toFixed(2)).join(", ")}</dd>
                  <dt>{L("Output for the ringed point")}</dt>
                  <dd className="text-right text-foreground/80">{probeValues[2][0].toFixed(3)}</dd>
                </>
              ) : null}
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("What happens in one training step? For each of the {{n}} numbers, training finds how much the error score changes when that number moves by a tiny amount. That rate is called the slope of the error for that number. Then every number moves a little in the direction that lowers the error. Another page of this topic, 'The error passed back', shows how all {{n}} slopes are found in one pass, without moving each number separately.", { n: count.total })}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`layers-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
