import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
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
import { FAINT, MUTED, ONE, SKY, plate, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { CURVES, gap, staircase, stepAt, type Curve } from "@/systems/depth";
import { ACTS, params, predict } from "@/systems/net";

export const Route = createFileRoute("/topics/networks/play/any")({
  loader: () => api.system(TOPIC, "any"),
  component: AnyPage,
});

const SHAPES = (Object.keys(CURVES) as Curve[]).map((id) => ({ id, label: L(CURVES[id].label) }));
const SAMPLES = 240;

function AnyPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [curve, setCurve] = useState<Curve>("bump");
  const [n, setN] = useState(12);
  const [steep, setSteep] = useState(60);
  const [perFrame, setPerFrame] = useState(0.5);
  const [k, setK] = useState(0);
  const runner = useRunner((t) => setK(t), { perFrame, stopAt: n });
  const restart = () => {
    runner.reset();
    setK(0);
  };

  const f = CURVES[curve].f;
  const on = Math.min(k, n);
  const net = useMemo(() => staircase(f, n, steep, on), [f, n, steep, on]);
  const before = useMemo(() => staircase(f, n, steep, Math.max(0, on - 1)), [f, n, steep, on]);
  const fit = useMemo(() => gap(net, f), [net, f]);
  const target = useMemo(() => Array.from({ length: SAMPLES + 1 }, (_, i) => [i / SAMPLES, f(i / SAMPLES)] as [number, number]), [f]);
  const range = useMemo(() => {
    const ys = target.map((p) => p[1]);
    const lo = Math.min(...ys);
    const hi = Math.max(...ys);
    const pad = Math.max(0.15, (hi - lo) * 0.15);
    return { lo, hi, pad };
  }, [target]);
  const box = useMemo<Box>(() => ({ x0: -0.02, x1: 1.02, y0: range.lo - range.pad, y1: range.hi + range.pad }), [range]);
  const rises = useMemo(() => net.W[1][0].slice(0, on), [net, on]);
  const tallest = Math.max(0.05, ...rises.map(Math.abs));
  const stepBox = useMemo<Box>(() => ({ x0: -0.02, x1: 1.02, y0: -tallest * 1.15, y1: tallest * 1.15 }), [tallest]);
  const count = params(net);

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Can a network draw any curve?")}
        job={L("Can a neural network draw any curve at all? The network on this page takes one number x, between 0 and 1, and gives back one number, its output. Between the two sits a row of neurons, the middle layer. A neuron is a small calculation: here it multiplies x by a number called its weight, adds a number called its bias, and squashes the total into a value between 0 and 1. With a large weight the squash is almost a sharp step: about 0 before one place on the x axis, about 1 after it. The output neuron multiplies each step by a height and adds them all up. So the output is a staircase. Nothing is trained on this page: the place and the height of every step are read off the chosen curve. Run switches the middle neurons on one at a time, and the staircase grows along the curve. The question: how close to the curve can such a staircase come?")}
        input={
          <div className="space-y-3">
            <Choices options={SHAPES} value={curve} onPick={(id) => { setCurve(id); restart(); }} />
            <Slider label={L("Middle neurons (steps)")} min={2} max={40} step={1} value={n} format={(v) => `${v}`} onChange={(v) => { setN(v); restart(); }} />
            <Slider label={L("Steepness")} min={5} max={300} step={5} value={steep} format={(v) => `${v}`} onChange={(v) => { setSteep(v); restart(); }} />
            <Text kind="note" as="p">
              {L("The first slider sets how many middle neurons there are, so how many steps the staircase has. 'Steepness' is the weight that multiplies x inside each middle neuron. A low value makes each step a gentle slope, a high value makes it a sharp edge. The heights come from the curve. Since nothing is learned here, the page shows what a network of this shape is able to draw, before any training.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={on}
            what={L("neurons on")}
            limit={n}
            onToggle={() => {
              if (!runner.running && on >= n) restart();
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
            <div><div data-slot="plot" className="h-[320px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={box}
                deps={[net, before, target, box, on]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(target, MUTED, 1.4);
                  const trace = (m: typeof net) => Array.from({ length: SAMPLES + 1 }, (_, i) => [i / SAMPLES, predict(m, [i / SAMPLES])[0]] as [number, number]);
                  if (on > 0) pen.line(trace(before), "rgba(232,232,234,0.35)", 1);
                  pen.line(trace(net), ONE, 2.2);
                  if (on > 0) {
                    const s = stepAt(on - 1, n);
                    pen.line([[s, pen.box.y0], [s, pen.box.y1]], SKY, 1);
                    plate(pen, L("Neuron {{n}} switches on here", { n: on }), s > 0.6 ? s - 0.01 : s + 0.01, pen.box.y1 - (pen.box.y1 - pen.box.y0) * 0.06, SKY, s > 0.6 ? "right" : "left");
                  }
                  plate(pen, L("Thin line: the curve to draw.  Thick line: the network"), pen.box.x0 + 0.02, pen.box.y0 + (pen.box.y1 - pen.box.y0) * 0.05, MUTED);
                }}
              />
            </div><Caption>{L("Across: the input x, from 0 to 1. Up: the value. Thin line: the chosen curve. Thick line: the network's output. Faint line: the output before the newest neuron was switched on. Vertical line: where the newest neuron's step is")}</Caption></div>
            <div><div data-slot="plot" className="h-[200px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={stepBox}
                deps={[net, on, stepBox, steep, n]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  for (let i = 0; i < on; i++) {
                    const s = stepAt(i, n);
                    const h = net.W[1][0][i];
                    const pts = Array.from({ length: SAMPLES + 1 }, (_, j) => [j / SAMPLES, h * ACTS.sigmoid.f(steep * (j / SAMPLES - s))] as [number, number]);
                    pen.line(pts, i === on - 1 ? SKY : "rgba(165,227,160,0.55)", i === on - 1 ? 2 : 1);
                  }
                }}
              />
            </div><Caption>{L("Each middle neuron on its own: one step, times its height, which can go up or down. The thicker line is the newest one. Added together, plus the output bias, they give the thick line of the picture above")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={on >= n ? fit.worst < 0.1 : undefined}>
              {on === 0
                ? L("No middle neuron is on yet, so the output is flat at {{bias}}. That number is the output neuron's bias, set to the height of the curve near its left end. Press Run: each step switches on one more middle neuron, and each neuron adds one step to the staircase.", { bias: net.b[1][0].toFixed(3) })
                : on < n
                  ? L("{{on}} of {{n}} middle neurons are on. The largest gap between the network's output and the curve is {{worst}}, at x = {{at}}, {{where}}.", {
                      on,
                      n,
                      worst: fit.worst.toFixed(3),
                      at: fit.at.toFixed(2),
                      where: fit.at > stepAt(on - 1, n) ? L("to the right of the newest step, where no neuron is on yet") : L("inside the part already built"),
                    })
                  : L("All {{n}} middle neurons are on. Nowhere does the network's output differ from the curve by more than {{worst}}; the average gap is {{mean}}. {{why}} Any curve over this interval can be followed this way, as closely as wanted. This is why a network with enough neurons can draw any curve: not by cleverness, but by enough small steps.", {
                      n,
                      worst: fit.worst.toFixed(3),
                      mean: fit.mean.toFixed(4),
                      why: fit.worst > 0.1 ? L("The gap comes from the steps. More neurons make the steps narrower, more steepness makes their edges sharper, and either one shrinks the gap.") : L("More neurons or steeper steps shrink the gap further, as far as wanted."),
                    })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Middle neurons switched on")}</dt>
              <dd className="text-right text-foreground/80">{L("{{on}} of {{n}}", { on, n })}</dd>
              <dt>{L("Numbers in the network (weights and biases)")}</dt>
              <dd className="text-right text-foreground/80">{count.total}</dd>
              <dt>{L("Largest gap between output and curve")}</dt>
              <dd className="text-right text-foreground/80">{L("{{worst}} at x = {{at}}", { worst: fit.worst.toFixed(4), at: fit.at.toFixed(2) })}</dd>
              <dt>{L("Average gap between output and curve")}</dt>
              <dd className="text-right text-foreground/80">{fit.mean.toFixed(4)}</dd>
              <dt>{L("Height of the newest step")}</dt>
              <dd className="text-right text-foreground/80">{on > 0 ? net.W[1][0][on - 1].toFixed(3) : L("none")}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("How does one neuron make one step? Inside middle neuron k, the total is the steepness times (x minus the place of step k). Left of that place the total is negative and the squash gives almost 0. Right of it the total is positive and the squash gives almost 1. The weight from that neuron to the output is the height of the step, and the output neuron adds all the steps. On 'Saw teeth', the sharp drops need very steep neurons; a low steepness shows the drops smeared out.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`any-${curve}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
