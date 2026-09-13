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
import { FAINT, INK, MUTED, ONE, SKY, TWO, boxOf, drawNet, layout, shadePlane, ticks } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { dataset } from "@/systems/learn";
import { ACTS, agree, backward, clone, forward, gradFlat, loss, make, numerical, predict, type Net } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/blame")({
  loader: () => api.system(TOPIC, "blame"),
  component: BlamePage,
});

const PHASES = [
  "The dot goes in",
  "The middle units answer",
  "The last unit answers",
  "How wrong, at the output",
  "The blame flows back",
  "Every number moves a little",
] as const;
const PICKS = [
  { id: "cycle", label: "Each dot in turn" },
  { id: "0", label: "(0,0) wants rose" },
  { id: "1", label: "(0,1) wants green" },
  { id: "2", label: "(1,0) wants green" },
  { id: "3", label: "(1,1) wants rose" },
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
  const [rate, setRate] = useState(2);
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
        return `the dot (${x[0]}, ${x[1]}) is about to go in. it wants ${y[0] ? "green" : "rose"}. press run, or one step, and watch it pass through six moments.`;
      case 0:
        return `the dot (${x[0]}, ${x[1]}) goes in. its two numbers sit on the two input units.`;
      case 1:
        return `each middle unit weighs the two inputs with its own weights, adds its bias, and squashes: ${t.pass.a[1].map((v) => v.toFixed(2)).join(", ")}.`;
      case 2:
        return `the last unit weighs those three answers and squashes: ${t.pass.a[2][0].toFixed(3)}. it wanted ${y[0]}.`;
      case 3:
        return `the miss is ${t.miss.toFixed(3)}: the answer minus what it wanted. through the squash's own slope that becomes a blame of ${t.dOut[0].toFixed(3)} on the last unit. ${t.miss > 0 ? "rose means: your answer was too high." : "green means: your answer was too low."}`;
      case 4:
        return `the blame flows back along the wires. each middle unit gets a share in proportion to its weight into the last unit, times its own squash's slope: ${t.dHid.map((d) => d.toFixed(3)).join(", ")}. unit ${strongest + 1} carries the most, because its wire to the output is the strongest and it was not saturated.`;
      default:
        return `every weight moves: by minus the step size, times the blame on the unit it feeds, times the value that came along it. the halo on each wire shows the move (green up, rose down). the output for this dot was ${t.pass.a[2][0].toFixed(3)} and is now ${after.toFixed(3)}, ${Math.abs(after - y[0]) < Math.abs(t.pass.a[2][0] - y[0]) ? "closer to" : "not closer to"} ${y[0]}.`;
    }
  })();

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The correction, one dot at a time"}
        job="The last two pages moved every number downhill and did not say how the downhill was found. This page does one correction slowly, on the four dots of exclusive or: a dot goes forward through the network, the miss is measured at the end, and the blame for it flows back along the same wires. Each number then moves by the share of the blame that reached it."
        input={
          <div className="space-y-3">
            <Choices options={PICKS} value={pick} onPick={(id) => { setPick(id); restart(); }} />
            <Slider label="Step size" min={0.1} max={5} step={0.1} value={rate} format={(v) => v.toFixed(1)} onChange={setRate} />
            <p className="text-[11px] text-muted">
              One step here is one of six moments, not one correction. Six steps make one
              correction on one dot. Run it fast and the plane at the right learns exclusive or,
              which one line could not do.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={tick}
            what={`moments, ${Math.floor(tick / 6)} corrections`}
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
            <div className="grid gap-2 lg:grid-cols-[1fr_260px]">
              <div><div className="h-[380px] overflow-hidden rounded border border-edge">
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
                      labels: ["in", "middle", "out"],
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
                      ctx.fillText(`Wanted ${y[0]}`, ox, oy + 34);
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
              </div><Caption>{phase < 0 ? "Six moments, in order:" : `Moment ${phase + 1} of 6: ${PHASES[phase]}`}. {phase === 4 ? "Circles now show blame" : "Circle shows blame"}</Caption></div>
              <div className="space-y-2">
                <div><div className="h-[230px] overflow-hidden rounded border border-edge">
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
                </div><Caption>The four dots and the answer so far</Caption></div>
                <div><div className="h-[142px] overflow-hidden rounded border border-edge">
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
                </div><Caption>How wrong, per correction</Caption></div>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>{words}</Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>The dot, and what it wants</dt>
              <dd className="text-right text-ink/80">({x[0]}, {x[1]}) Wants {y[0]}</dd>
              <dt>The network's answer for it</dt>
              <dd className="text-right text-ink/80">{t.pass.a[2][0].toFixed(4)}</dd>
              <dt>Blame at the output</dt>
              <dd className="text-right text-ink/80">{t.dOut[0].toFixed(4)}</dd>
              <dt>Blame reaching the three middle units</dt>
              <dd className="text-right text-ink/80">{t.dHid.map((d) => d.toFixed(3)).join(", ")}</dd>
              <dt>Largest move any weight makes this correction</dt>
              <dd className="text-right text-ink/80">{Math.max(...t.change.flat(2).map(Math.abs)).toFixed(4)}</dd>
              <dt>The same slopes by nudging each number by hand, worst disagreement</dt>
              <dd className="text-right text-ink/80">{check.toExponential(1)}</dd>
              <dt>How wrong over all four dots</dt>
              <dd className="text-right text-ink/80">{loss(view.net, data, "mse").toFixed(5)}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The blame at a unit is the slope from the first page: how much the miss changes when
              that unit's total changes a hair. Passing it back through a wire multiplies by the
              wire's weight; passing it through a squash multiplies by the squash's slope there.
              That is the chain rule, and it gives every one of the thirteen slopes from one pass
              back, instead of thirteen separate nudges. The last line above is the two agreeing.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="blame" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
