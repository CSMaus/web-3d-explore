import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, classColour, shadePlane, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { SETS, dataset, type SetKind } from "@/systems/learn";
import { ACTS, backward, clone, loss, make, predict, type Act, type Net } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/unit")({
  loader: () => api.system(TOPIC, "unit"),
  component: UnitPage,
});

const KINDS: { id: SetKind; label: string }[] = (["split", "xor", "rings"] as SetKind[]).map((id) => ({ id, label: SETS[id].label }));
const SQUASHES: { id: Act; label: string }[] = [
  { id: "sigmoid", label: "Squash to 0..1" },
  { id: "tanh", label: "Squash to -1..1" },
  { id: "relu", label: "Cut below zero" },
  { id: "linear", label: "No squash" },
];
const MOST = 3000;

function fresh(act: Act): Net {
  // a deliberate wrong start, the same every time, so the reader sees it move
  const net = make([2, 1], act, act, "zeros");
  net.W[0][0] = [0.3, -0.25];
  net.b[0] = [0.15];
  return net;
}

function wrongCount(net: Net, data: { X: number[][]; Y: number[][] }, cut: number) {
  let wrong = 0;
  for (let n = 0; n < data.X.length; n++) {
    const out = predict(net, data.X[n])[0];
    if ((out > cut ? 1 : 0) !== data.Y[n][0]) wrong += 1;
  }
  return wrong;
}

function UnitPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [kind, setKind] = useState<SetKind>("split");
  const [act, setAct] = useState<Act>("sigmoid");
  const [rate, setRate] = useState(1);
  const [probe, setProbe] = useState<[number, number]>([0.6, -0.4]);
  const [perFrame, setPerFrame] = useState(1);
  const [net, setNet] = useState<Net>(() => fresh("sigmoid"));
  const [steps, setSteps] = useState(0);

  const data = useMemo(() => dataset(kind, kind === "xor" ? 4 : 60, 3), [kind]);
  const box = useMemo(() => boxOf(data.X), [data]);
  const work = useRef({ net: fresh("sigmoid"), rate: 1, data });
  // kept current after each render, never during one
  useEffect(() => {
    work.current.rate = rate;
    work.current.data = data;
  });

  const [limit, setLimit] = useState(MOST);
  const runner = useRunner(
    (n) => {
      const w = work.current;
      const { grad } = backward(w.net, w.data, "mse");
      for (let j = 0; j < 2; j++) w.net.W[0][0][j] -= w.rate * grad.dW[0][0][j];
      w.net.b[0][0] -= w.rate * grad.db[0][0];
      setNet(clone(w.net));
      setSteps(n);
    },
    { perFrame, stopAt: limit },
  );

  const restart = (nextAct: Act = act) => {
    runner.reset();
    work.current.net = fresh(nextAct);
    setNet(clone(work.current.net));
    setSteps(0);
  };
  const setParam = (which: 0 | 1 | 2, v: number) => {
    runner.reset();
    if (which === 2) work.current.net.b[0][0] = v;
    else work.current.net.W[0][0][which] = v;
    setNet(clone(work.current.net));
  };

  const [w1, w2] = net.W[0][0];
  const b = net.b[0][0];
  const cut = act === "tanh" ? 0 : act === "linear" ? 0.5 : 0.5;
  // the squash's output range, for the shading and for reading the answer
  const toUnit = (a: number) => (act === "tanh" ? (a + 1) / 2 : act === "relu" ? Math.min(1, a) : a);
  const wrong = wrongCount(net, data, cut);
  const total = loss(net, data, "mse");
  const z = w1 * probe[0] + w2 * probe[1] + b;
  const a = ACTS[act].f(z);
  const squash = ACTS[act];

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Inside one unit"}
        job="The same dots, the same line. This page opens the machine that draws it. One unit takes the two coordinates of a dot, multiplies each by a weight, adds a bias, and squashes the total to a number between zero and one. That number is its answer: green or rose. The three numbers are yours to move by hand, and then to hand over."
        input={
          <div className="space-y-3">
            <Choices options={KINDS} value={kind} onPick={(id) => { setKind(id); restart(); }} />
            <Choices options={SQUASHES} value={act} onPick={(id) => { setAct(id); restart(id); }} />
            <Slider label="Weight on x" min={-4} max={4} step={0.05} value={w1} format={(v) => v.toFixed(2)} onChange={(v) => setParam(0, v)} />
            <Slider label="Weight on y" min={-4} max={4} step={0.05} value={w2} format={(v) => v.toFixed(2)} onChange={(v) => setParam(1, v)} />
            <Slider label="Bias" min={-4} max={4} step={0.05} value={b} format={(v) => v.toFixed(2)} onChange={(v) => setParam(2, v)} />
            <Slider label="Step size" min={0.05} max={4} step={0.05} value={rate} format={(v) => v.toFixed(2)} onChange={setRate} />
            <p className="text-[11px] text-muted">
              Move the three sliders and watch the colours on the plane move with them. Click a
              dot to see its own numbers go through the unit. Then press run: the unit takes the
              sliders from you and moves them itself, downhill on how wrong it is.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={steps}
            what="steps"
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 100, max: 6000, step: 100 }}
            onToggle={() => {
              if (!runner.running && steps >= limit) restart();
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
            <div><div className="h-[420px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={box}
                equal
                deps={[net, data, probe, box]}
                onPick={(x, y) => {
                  // snap to the nearest dot so the numbers shown belong to a real example
                  let best = 0;
                  let d = Infinity;
                  for (let n = 0; n < data.X.length; n++) {
                    const dd = Math.hypot(data.X[n][0] - x, data.X[n][1] - y);
                    if (dd < d) {
                      d = dd;
                      best = n;
                    }
                  }
                  setProbe([data.X[best][0], data.X[best][1]]);
                }}
                draw={(pen) => {
                  shadePlane(pen, (x, y) => toUnit(predict(net, [x, y])[0]), 56);
                  ticks(pen);
                  pen.axes("rgba(232,232,234,0.12)");
                  for (let n = 0; n < data.X.length; n++) {
                    const [x, y] = data.X[n];
                    pen.dot(x, y, 4.5, data.Y[n][0] ? ONE : TWO);
                    const out = predict(net, [x, y])[0];
                    if ((out > cut ? 1 : 0) !== data.Y[n][0]) pen.ring(x, y, 8, INK, 1.2);
                  }
                  pen.ring(probe[0], probe[1], 11, SKY, 2);

                }}
              />
            </div><Caption>The plane, coloured by the unit's answer White ring: wrong.  Sky ring: the dot shown at right</Caption></div>
            <div><div className="h-[420px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[net, probe, act]}
                draw={(pen) => {
                  const { ctx, width: W, height: H } = pen;
                  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textBaseline = "middle";
                  const inX = 42;
                  const sumX = W * 0.5;
                  const outX = W - 42;
                  const y1 = H * 0.3;
                  const y2 = H * 0.5;
                  const sumY = H * 0.4;
                  const r = 17;
                  const circle = (x: number, y: number, label: string, fill: string, stroke: string) => {
                    ctx.fillStyle = fill;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = stroke;
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                    ctx.fillStyle = INK;
                    ctx.textAlign = "center";
                    ctx.fillText(label, x, y);
                  };
                  const wire = (x0: number, y0: number, x1: number, y1b: number, w: number, label: string) => {
                    ctx.strokeStyle = w >= 0 ? ONE : TWO;
                    ctx.lineWidth = 0.6 + Math.min(5, Math.abs(w)) * 1.1;
                    ctx.beginPath();
                    ctx.moveTo(x0 + r, y0);
                    ctx.lineTo(x1 - r, y1b);
                    ctx.stroke();
                    ctx.fillStyle = MUTED;
                    ctx.textAlign = "center";
                    ctx.fillText(label, (x0 + x1) / 2, (y0 + y1b) / 2 - 9);
                  };
                  wire(inX, y1, sumX, sumY, w1, `x ${w1.toFixed(2)}`);
                  wire(inX, y2, sumX, sumY, w2, `x ${w2.toFixed(2)}`);
                  wire(sumX, sumY, outX, sumY, 1, "squash");
                  circle(inX, y1, probe[0].toFixed(2), "#0e1116", SKY);
                  circle(inX, y2, probe[1].toFixed(2), "#0e1116", SKY);
                  circle(sumX, sumY, z.toFixed(2), "#0e1116", INK);
                  circle(outX, sumY, a.toFixed(2), classColour(toUnit(a)), INK);
                  ctx.fillStyle = MUTED;
                  ctx.textAlign = "center";
                  ctx.fillText("x", inX, y1 - 28);
                  ctx.fillText("y", inX, y2 + 28);
                  ctx.fillText(`+ Bias ${b.toFixed(2)}`, sumX, sumY + 30);
                  ctx.fillText("Answer", outX, sumY - 28);
                  // the squash itself, with the point this dot lands on
                  const gx0 = 30;
                  const gx1 = W - 30;
                  const gy0 = H * 0.66;
                  const gy1 = H * 0.96;
                  const zr = 5;
                  const lo = act === "tanh" ? -1 : act === "relu" ? 0 : act === "linear" ? -zr : 0;
                  const hi = act === "relu" || act === "linear" ? zr : 1;
                  const X = (zz: number) => gx0 + ((zz + zr) / (2 * zr)) * (gx1 - gx0);
                  const Y = (aa: number) => gy1 - ((aa - lo) / (hi - lo)) * (gy1 - gy0);
                  ctx.strokeStyle = FAINT;
                  ctx.lineWidth = 1;
                  ctx.beginPath();
                  ctx.moveTo(gx0, Y(Math.max(lo, 0)));
                  ctx.lineTo(gx1, Y(Math.max(lo, 0)));
                  ctx.moveTo(X(0), gy0);
                  ctx.lineTo(X(0), gy1);
                  ctx.stroke();
                  ctx.strokeStyle = SKY;
                  ctx.lineWidth = 1.6;
                  ctx.beginPath();
                  for (let i = 0; i <= 80; i++) {
                    const zz = -zr + (2 * zr * i) / 80;
                    const aa = Math.max(lo, Math.min(hi, squash.f(zz)));
                    if (i === 0) ctx.moveTo(X(zz), Y(aa));
                    else ctx.lineTo(X(zz), Y(aa));
                  }
                  ctx.stroke();
                  const zc = Math.max(-zr, Math.min(zr, z));
                  ctx.fillStyle = INK;
                  ctx.beginPath();
                  ctx.arc(X(zc), Y(Math.max(lo, Math.min(hi, a))), 4.5, 0, Math.PI * 2);
                  ctx.fill();
                  ctx.fillStyle = MUTED;
                  ctx.textAlign = "left";
                  ctx.textBaseline = "alphabetic";
                }}
              />
            </div><Caption>{`The squash: total ${z.toFixed(2)} in, ${a.toFixed(2)} out`}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={wrong === 0}>
              {wrong === 0
                ? `The unit answers every one of the ${data.X.length} dots correctly${steps > 0 ? `, after ${steps} steps of moving its own three numbers` : ""}.`
                : kind === "xor" && steps > 200
                  ? `After ${steps} steps the unit still has ${wrong} of 4 wrong, and the sliders have stopped moving. One unit is one line, and no line does exclusive or. The answer is more units, on the next page.`
                  : kind === "rings" && steps > 200
                    ? `After ${steps} steps the unit still has ${wrong} of ${data.X.length} wrong. Its boundary is a straight line and the shape it needs is a circle. More units, next page.`
                    : `The unit gets ${wrong} of ${data.X.length} dots wrong${steps > 0 ? ` after ${steps} steps` : ""}. How wrong, as one number: ${total.toFixed(4)}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>The ringed dot: {probe[0].toFixed(2)} times {w1.toFixed(2)} plus {probe[1].toFixed(2)} times {w2.toFixed(2)} plus {b.toFixed(2)}</dt>
              <dd className="text-right text-ink/80">{z.toFixed(3)}</dd>
              <dt>Squashed</dt>
              <dd className="text-right text-ink/80">{a.toFixed(3)}, So {toUnit(a) > 0.5 ? "green" : "rose"}</dd>
              <dt>How wrong over all dots (average squared miss)</dt>
              <dd className="text-right text-ink/80">{total.toFixed(5)}</dd>
              <dt>Numbers the unit can change</dt>
              <dd className="text-right text-ink/80">3</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The line from the last page is where the total is exactly zero, so the squash gives
              one half: neither colour. The squash is what the perceptron did not have. Its
              answer changes smoothly with the sliders, so how wrong it is has a slope, and the
              hill page's ball can roll down it. Each run step is one roll step, on three numbers.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`unit-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}

