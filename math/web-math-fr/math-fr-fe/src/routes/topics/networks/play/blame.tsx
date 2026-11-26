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
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, drawNet, layout, shadePlane, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { dataset } from "@/systems/learn";
import { ACTS, agree, backward, clone, forward, gradFlat, loss, make, numerical, params, predict, work as passes, type Net } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/blame")({
  loader: () => api.system(TOPIC, "blame"),
  component: BlamePage,
});

const PHASES = [
  L("The dot goes in"),
  L("The middle neurons answer"),
  L("The output neuron answers"),
  L("The error at the output"),
  L("The error is passed back"),
  L("Every number moves a little"),
] as const;
const PICKS = [
  { id: "cycle", label: L("Each dot in turn") },
  { id: "0", label: L("Only (0, 0), right answer 0") },
  { id: "1", label: L("Only (0, 1), right answer 1") },
  { id: "2", label: L("Only (1, 0), right answer 1") },
  { id: "3", label: L("Only (1, 1), right answer 0") },
];

/**
 * one example through a two-layer network, with every intermediate number kept:
 * the values on the way forward, the blame on the way back, and the change
 * each weight gets. this is backpropagation written out for one dot.
 */
function trace(net: Net, x: number[], y: number[], rate: number) {
  const pass = forward(net, x);
  const [, a1, a2] = pass.a;
  const [z0, z1] = pass.z;
  const dOut = a2.map((a, i) => (a - y[i]) * ACTS[net.out].d(z1[i]));
  const dHid = a1.map((_, j) => {
    let s = 0;
    for (let i = 0; i < dOut.length; i++) s += net.W[1][i][j] * dOut[i];
    return s * ACTS[net.act].d(z0[j]);
  });
  const change = [
    dHid.map((d) => x.map((xi) => -rate * d * xi)),
    dOut.map((d) => a1.map((aj) => -rate * d * aj)),
  ];
  const changeB = [dHid.map((d) => -rate * d), dOut.map((d) => -rate * d)];
  return { pass, dOut, dHid, change, changeB, miss: a2[0] - y[0] };
}

function BlamePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [pick, setPick] = useState("cycle");
  const [rate, setRate] = useState(4.2);
  const [perFrame, setPerFrame] = useState(0.04);
  const data = useMemo(() => dataset("xor", 4), []);
  const box = useMemo(() => boxOf(data.X, 0.5), [data]);

  const build = () => make([2, 3, 1], "tanh", "sigmoid", "xavier", 4);
  const [view, setView] = useState<{ net: Net; before: Net; tick: number; history: [number, number][] }>(() => {
    const net = build();
    return { net, before: clone(net), tick: 0, history: [] };
  });
  const work = useRef({ net: build(), before: build(), rate, pick, history: [] as [number, number][] });
  useEffect(() => {
    work.current.rate = rate;
    work.current.pick = pick;
  });

  const exampleAt = (tick: number, p: string) => (p === "cycle" ? Math.floor((tick - 1) / 6) % 4 : Number(p));

  const [limit, setLimit] = useState(400);
  const runner = useRunner(
    (n) => {
      const w = work.current;
      // the numbers only change on the last phase of a cycle; the other five
      // phases are the same state shown further along
      if (n % 6 === 0) {
        const e = exampleAt(n, w.pick);
        w.before = clone(w.net);
        const t = trace(w.net, data.X[e], data.Y[e], w.rate);
        for (let L = 0; L < 2; L++) {
          for (let i = 0; i < w.net.W[L].length; i++) {
            for (let j = 0; j < w.net.W[L][i].length; j++) w.net.W[L][i][j] += t.change[L][i][j];
            w.net.b[L][i] += t.changeB[L][i];
          }
        }
        w.history.push([n / 6, loss(w.net, data, "mse")]);
      }
      setView({ net: clone(w.net), before: clone(w.before), tick: n, history: w.history.slice() });
    },
    { perFrame, stopAt: limit * 6 },
  );

  const restart = () => {
    runner.reset();
    work.current.net = build();
    work.current.before = clone(work.current.net);
    work.current.history = [];
    setView({ net: clone(work.current.net), before: clone(work.current.net), tick: 0, history: [] });
  };

  const tick = view.tick;
  const phase = tick === 0 ? -1 : (tick - 1) % 6;
  const example = tick === 0 ? exampleAt(1, pick) : exampleAt(tick, pick);
  const x = data.X[example];
  const y = data.Y[example];
  // in the last phase the network has already moved; the blame shown is the
  // one computed on the state before the move, which is kept for that reason
  const shown = useMemo(() => {
    const net = phase === 5 ? view.before : view.net;
    return { net, t: trace(net, x, y, rate) };
  }, [view.net, view.before, phase, x, y, rate]);
  const t = shown.t;
  const after = predict(view.net, x)[0];

  // the same slopes by nudging every number, so the blame is checked, not trusted
  const check = useMemo(() => {
    const one = { X: [x], Y: [y] };
    const a = gradFlat(shown.net, backward(shown.net, one, "mse").grad);
    const b = gradFlat(shown.net, numerical(shown.net, one, "mse", 1e-4));
    return agree(a, b).worst;
  }, [shown.net, x, y]);

  const upTo = phase < 0 ? 0 : phase === 0 ? 0 : phase === 1 ? 1 : 2;
  const values = phase < 0 ? undefined : shown.t.pass.a;
  const tint = phase >= 3 && phase <= 4
    ? [x.map(() => 0.5), phase === 4 ? t.dHid.map((d) => 0.5 - Math.max(-0.5, Math.min(0.5, d * 2))) : t.dHid.map(() => 0.5), t.dOut.map((d) => 0.5 - Math.max(-0.5, Math.min(0.5, d * 2)))]
    : phase >= 1
      ? [x.map(() => 0.5), t.pass.a[1].map((v) => (upTo >= 1 ? (v + 1) / 2 : 0.5)), t.pass.a[2].map((v) => (upTo >= 2 ? v : 0.5))]
      : undefined;
  const histBox = useMemo<Box>(() => ({ x0: -2, x1: Math.max(50, view.history.length) + 2, y0: -0.01, y1: Math.max(0.05, ...view.history.map((p) => p[1])) * 1.1 }), [view.history]);
  const strongest = t.dHid.reduce((best, d, i) => (Math.abs(d) > Math.abs(t.dHid[best]) ? i : best), 0);

  const words = (() => {
    switch (phase) {
      case -1:
        return y[0]
          ? L("The dot ({{a}}, {{b}}) is about to go in. The right answer for it is 1. Press Run or One step to follow it through six moments.", { a: x[0], b: x[1] })
          : L("The dot ({{a}}, {{b}}) is about to go in. The right answer for it is 0. Press Run or One step to follow it through six moments.", { a: x[0], b: x[1] });
      case 0:
        return L("The dot ({{a}}, {{b}}) goes in. Its two coordinates sit on the two input neurons.", { a: x[0], b: x[1] });
      case 1:
        return L("Each middle neuron multiplies the two inputs by its own weights, adds its bias and squashes the total. Their answers: {{values}}.", { values: t.pass.a[1].map((v) => v.toFixed(2)).join(", ") });
      case 2:
        return L("The output neuron multiplies those three answers by its weights, adds its bias and squashes: {{out}}. The right answer is {{want}}.", { out: t.pass.a[2][0].toFixed(3), want: y[0] });
      case 3:
        return L("The miss is {{miss}}: the answer minus the right answer. Multiplied by the slope of the output's squashing function at that point, it becomes the output neuron's error signal: {{blame}}. {{meaning}}", {
          miss: t.miss.toFixed(3),
          blame: t.dOut[0].toFixed(3),
          meaning: t.miss > 0 ? L("A positive signal means the answer was too high.") : L("A negative signal means the answer was too low."),
        });
      case 4:
        return L("The error is passed back along the connections. Each middle neuron gets a share: the output's error signal, times the weight of its connection to the output, times the slope of its own squashing function. The shares: {{shares}}. Neuron {{unit}} gets the largest share, because for it the product of connection weight and slope is the largest.", {
          shares: t.dHid.map((d) => d.toFixed(3)).join(", "),
          unit: strongest + 1,
        });
      default:
        return Math.abs(after - y[0]) < Math.abs(t.pass.a[2][0] - y[0])
          ? L("Every weight moves by minus the step size, times the error signal of the neuron it feeds, times the value that came along it. The halo around each connection shows its move, one colour for up and the other for down. For this dot the output was {{was}} and is now {{now}}, closer to {{want}}.", { was: t.pass.a[2][0].toFixed(3), now: after.toFixed(3), want: y[0] })
          : L("Every weight moves by minus the step size, times the error signal of the neuron it feeds, times the value that came along it. The halo around each connection shows its move, one colour for up and the other for down. For this dot the output was {{was}} and is now {{now}}, not closer to {{want}}.", { was: t.pass.a[2][0].toFixed(3), now: after.toFixed(3), want: y[0] });
    }
  })();

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("How the error is passed back, one dot at a time")}
        job={L("How does a neural network find out which way to move each of its numbers? This page follows one correction slowly. The network has 2 inputs, 3 neurons in a middle layer and 1 output neuron. A neuron multiplies each input by a number called a weight, adds a number called a bias and squashes the total into a narrow range. With all weights and biases, the network has 13 numbers. The data are four dots at the corners of a square: (0, 0) and (1, 1) should get the answer 0, (0, 1) and (1, 0) the answer 1. No straight line divides them. One correction goes like this. A dot goes forward through the network and gives an answer. The answer is compared with the right one. The difference, the error, is then passed backwards along the same connections, and each neuron receives its share of it. Each number then moves in proportion to the share that reached it. This way of finding the moves is called backpropagation.")}
        input={
          <div className="space-y-3">
            <Choices options={PICKS} value={pick} onPick={(id) => { setPick(id); restart(); }} />
            <Slider label={L("Step size")} min={0.1} max={5} step={0.1} value={rate} format={(v) => v.toFixed(1)} onChange={setRate} />
            <Text kind="note" as="p">
              {L("Here one step of the run is one of six moments, not a whole correction: six steps make one correction on one dot. The buttons above choose the dot: each in turn, or always the same one. 'Step size' sets how far the numbers move in each correction. Run fast, and the network learns to divide the four dots, which no single straight line can do.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={tick}
            what={L("moments, {{n}} corrections done", { n: Math.floor(tick / 6) })}
            limit={limit * 6}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 10, max: 2000, step: 10 }}
            onToggle={() => {
              if (!runner.running && tick >= limit * 6) restart();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={restart}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div><div data-slot="plot" className="h-[380px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                  deps={[shown, phase, tint, view.net]}
                  draw={(pen) => {
                    const l = layout(shown.net.sizes, pen.width, pen.height, 56);
                    drawNet(pen.ctx, shown.net, l, {
                      values: phase >= 3 && phase <= 4 ? [x, phase === 4 ? t.dHid : t.pass.a[1], t.dOut] : values,
                      tint,
                      upTo: phase < 0 ? 0 : phase <= 2 ? upTo : 3,
                      labels: [L("inputs"), L("middle"), L("output")],
                      change: phase === 5 ? t.change : undefined,
                      radius: 18,
                    });
                    const ctx = pen.ctx;
                    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.textAlign = "left";
                    ctx.fillStyle = phase < 0 ? MUTED : INK;
                    if (phase >= 3) {
                      const [ox, oy] = l.at[2][0];
                      ctx.fillStyle = MUTED;
                      ctx.textAlign = "center";
                      ctx.fillText(L("Right answer {{y}}", { y: y[0] }), ox, oy + 34);
                      ctx.textAlign = "right";
                      ctx.textAlign = "left";
                    }
                    if (phase === 4) {
                      // arrows back along the strongest wires
                      for (let j = 0; j < l.at[1].length; j++) {
                        const [x1, y1] = l.at[2][0];
                        const [x0, y0] = l.at[1][j];
                        const mx = (x0 + x1) / 2;
                        const my = (y0 + y1) / 2;
                        const dx = x0 - x1;
                        const dy = y0 - y1;
                        const len = Math.hypot(dx, dy);
                        ctx.strokeStyle = t.dHid[j] > 0 ? TWO : ONE;
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(mx, my);
                        ctx.lineTo(mx + (dx / len) * 22, my + (dy / len) * 22);
                        ctx.stroke();
                      }
                    }
                  }}
                />
              </div><Caption>{phase < 0 ? L("The network as circles: 2 inputs, 3 middle neurons, 1 output, joined by their connections") : L("Moment {{n}} of 6: {{name}}", { n: phase + 1, name: PHASES[phase] })}. {phase === 4 ? L("Numbers in the middle and output circles: error signals") : phase === 3 ? L("Number in the output circle: its error signal") : L("Numbers in the circles: the neurons' answers")}</Caption></div>
              <div className="space-y-2">
                <div><div data-slot="plot" className="h-[230px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={box}
                    equal
                    deps={[view.net, example, box]}
                    draw={(pen) => {
                      shadePlane(pen, (px, py) => predict(view.net, [px, py])[0], 32);
                      ticks(pen);
                      for (let n = 0; n < 4; n++) {
                        pen.dot(data.X[n][0], data.X[n][1], 6, data.Y[n][0] ? ONE : TWO);
                        if ((predict(view.net, data.X[n])[0] > 0.5 ? 1 : 0) !== data.Y[n][0]) pen.ring(data.X[n][0], data.X[n][1], 10, INK, 1.2);
                      }
                      pen.ring(x[0], x[1], 13, SKY, 2);

                    }}
                  />
                </div><Caption>{L("The four dots on the plane. Shading: the network's answer at every point so far. Small ring: a dot on the wrong side. Large ring: the dot in use now")}</Caption></div>
                <div><div data-slot="plot" className="h-[142px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={histBox}
                    deps={[view.history, histBox]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.axes(FAINT);
                      pen.line(view.history, ONE, 1.8);
                    }}
                  />
                </div><Caption>{L("Up: the error score over all four dots. Across: corrections made")}</Caption></div>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>{words}</Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("The dot in use, and its right answer")}</dt>
              <dd className="text-right text-foreground/80">({x[0]}, {x[1]}) {L("right answer {{y}}", { y: y[0] })}</dd>
              <dt>{L("The network's answer for it")}</dt>
              <dd className="text-right text-foreground/80">{t.pass.a[2][0].toFixed(4)}</dd>
              <dt>{L("Error signal at the output")}</dt>
              <dd className="text-right text-foreground/80">{t.dOut[0].toFixed(4)}</dd>
              <dt>{L("Error signals reaching the three middle neurons")}</dt>
              <dd className="text-right text-foreground/80">{t.dHid.map((d) => d.toFixed(3)).join(", ")}</dd>
              <dt>{L("Largest move of any weight in this correction")}</dt>
              <dd className="text-right text-foreground/80">{Math.max(...t.change.flat(2).map(Math.abs)).toFixed(4)}</dd>
              <dt>{L("Check: largest difference from the slopes found by moving each number a tiny amount")}</dt>
              <dd className="text-right text-foreground/80">{check.toExponential(1)}</dd>
              <dt>{L("Error score over all four dots")}</dt>
              <dd className="text-right text-foreground/80">{loss(view.net, data, "mse").toFixed(5)}</dd>
              <dt>{L("Slopes needed: one per number in the network")}</dt>
              <dd className="text-right text-foreground/80">{params(shown.net).total}</dd>
              <dt>{L("Cost of finding them all in one backward pass, counted in forward passes")}</dt>
              <dd className="text-right text-foreground/80">{L("about {{n}}", { n: 1 + passes(shown.net).ratio })}</dd>
              <dt>{L("Cost of finding them by moving each number separately, counted in forward passes")}</dt>
              <dd className="text-right text-foreground/80">{2 * params(shown.net).total}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("What is an error signal? For one neuron, it is how much the miss changes when that neuron's total changes by a tiny amount: a rate of change, called a derivative. Passed back through a connection, the signal is multiplied by the connection's weight. Passed back through a squashing function, it is multiplied by that function's slope at that point. Multiplying slopes along a path in this way is called the chain rule. It gives all 13 slopes from one pass backwards, instead of 13 separate trials, each moving one number. The 'Check' line above compares the two ways: they agree to many decimal places.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="blame" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
