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
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, classColour, drawNet, layout, plate, shadePlane, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { SETS, dataset, type SetKind } from "@/systems/learn";
import { ACTS, backward, clone, forward, loss, make, params, predict, type Act, type Net } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/layers")({
  loader: () => api.system(TOPIC, "layers"),
  component: LayersPage,
});

const KINDS: { id: SetKind; label: string }[] = (["xor", "rings", "spiral", "split"] as SetKind[]).map((id) => ({ id, label: SETS[id].label }));
const SQUASHES: { id: Act; label: string }[] = [
  { id: "tanh", label: "Squash to -1..1" },
  { id: "sigmoid", label: "Squash to 0..1" },
  { id: "relu", label: "Cut below zero" },
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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Many units, one answer"}
        job="The dots one line cannot separate. Put several units side by side, each drawing its own line, and one more unit after them that weighs their answers. That is a network. The job is the same as before: every dot on its own colour. Watch what each unit alone sees, and what the last one makes of it."
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); restart(); }} />
            <p className="text-[11px] text-muted">{SETS[kind].note}</p>
            <Choices options={SQUASHES} value={act} onPick={(id) => { setAct(id); restart(hidden, id); }} />
            <Slider label="Units in the middle" min={1} max={8} step={1} value={hidden} format={(v) => String(Math.round(v))} onChange={(v) => { setHidden(Math.round(v)); restart(Math.round(v)); }} />
            <Slider label="Step size" min={0.02} max={2} step={0.02} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
            <Slider label="Starting numbers" min={1} max={20} step={1} value={seed} format={(v) => `set ${Math.round(v)}`} onChange={(v) => { setSeed(Math.round(v)); restart(hidden, act, Math.round(v)); }} />
            <p className="text-[11px] text-muted">
              The network starts from small random numbers. One unit in the middle is the last
              page again: a single line. Try one, then three, then eight. Click on the plane to
              send a point through the network and see every unit's answer to it.
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
            <div className="grid gap-2 lg:grid-cols-[1fr_300px]">
              <div><div className="h-[340px] overflow-hidden rounded border border-edge">
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
              </div><Caption>The network's answer everywhere.  Ring: a dot it gets wrong</Caption></div>
              <div><div className="h-[340px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                  deps={[net, probeValues]}
                  draw={(pen) => {
                    const l = layout(net.sizes, pen.width, pen.height, 46);
                    drawNet(pen.ctx, net, l, {
                      values: probeValues ?? undefined,
                      tint: probeValues ? probeValues.map((layer, L) => layer.map((v) => (L === 0 ? 0.5 : L === net.W.length ? v : (ACTS[net.act].f(0) === 0 ? (v + 1) / 2 : v)))) : undefined,
                      labels: ["in", "middle", "answer"],
                      radius: 14,
                    });
                    pen.ctx.fillStyle = MUTED;
                    pen.ctx.textAlign = "left";
                    pen.ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  }}
                />
              </div><Caption>{probe ? "Each circle: that unit's answer to the ringed point" : "Click the plane to send a point through"}</Caption></div>
            </div>
            <div className="h-[130px] overflow-hidden rounded border border-edge">
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
                    pen.ctx.fillText(`${u + 1}: weighs ${net.W[1][0][u].toFixed(2)}`, x0, 12);
                  }
                }}
              />
            </div>
            <div className="h-[120px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={histBox}
                deps={[view.history, histBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(view.history, ONE, 1.8);
                  plate(pen, "How wrong, step by step", histBox.x0 + 8, histBox.y1 - (histBox.y1 - histBox.y0) * 0.15, MUTED);
                }}
              />
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={wrong === 0 ? true : stuck ? false : undefined}>
              {view.steps === 0
                ? `Before any training the network gets ${wrong} of ${data.X.length} dots wrong. The small tiles are the ${hidden} middle unit${hidden > 1 ? "s" : ""}, each a line of its own. Press run.`
                : wrong === 0
                  ? `After ${view.steps} steps every one of the ${data.X.length} dots is on its own colour. The boundary is no longer a line: it is built out of ${hidden} lines, each drawn by one middle unit, weighed together by the last one.`
                  : stuck
                    ? hidden === 1
                      ? `After ${view.steps} steps it still has ${wrong} wrong and has stopped improving. One middle unit is one line, and the last unit can only turn a single line's answer up or down. It needs more lines.`
                      : `After ${view.steps} steps it still has ${wrong} wrong and has stopped improving. It has settled in a dip that is not the bottom: with ${hidden} units it is possible to be stuck. Try a different set of starting numbers, or more units.`
                    : `After ${view.steps} steps it has ${wrong} of ${data.X.length} wrong. How wrong: ${total.toFixed(4)}, ${view.history.length > 10 && total < view.history[view.history.length - 10][1] ? "falling" : "not falling right now"}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Units: two in, {hidden} in the middle, one out</dt>
              <dd className="text-right text-ink/80">{count.total} numbers to learn</dd>
              <dt>Of which weights</dt>
              <dd className="text-right text-ink/80">{count.weights}</dd>
              <dt>And biases</dt>
              <dd className="text-right text-ink/80">{count.biases}</dd>
              <dt>How wrong (average squared miss)</dt>
              <dd className="text-right text-ink/80">{total.toFixed(5)}</dd>
              {probeValues ? (
                <>
                  <dt>The ringed point, through the middle</dt>
                  <dd className="text-right text-ink/80">{probeValues[1].map((v) => v.toFixed(2)).join(", ")}</dd>
                  <dt>And out</dt>
                  <dd className="text-right text-ink/80">{probeValues[2][0].toFixed(3)}</dd>
                </>
              ) : null}
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              Each step is the hill page's ball, rolling on {count.total} numbers at once: for
              every number, how wrong changes when that number moves a hair, and a step the other
              way. The next page is about how those {count.total} slopes are found without
              nudging each number by hand.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`layers-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
