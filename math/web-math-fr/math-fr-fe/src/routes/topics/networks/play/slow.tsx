import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, TWO, plate, ticks } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { logit, slowdown, stepsTo } from "@/systems/depth";
import { ACTS } from "@/systems/net";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/slow")({
  loader: () => api.system(TOPIC, "slow"),
  component: SlowPage,
});

const MOST = 400;
const NEAR = 0.1;
const Z = 8;

function SlowPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [start, setStart] = useState(0.98);
  const [rate, setRate] = useState(0.15);
  const [perFrame, setPerFrame] = useState(1);
  const [limit, setLimit] = useState(MOST);
  const [k, setK] = useState(0);
  const runner = useRunner((n) => setK(n), { perFrame, stopAt: limit });
  const restart = () => {
    runner.reset();
    setK(0);
  };

  const out = useMemo(() => slowdown(logit(start), rate, k), [start, rate, k]);
  const am = out.mse[k];
  const ac = out.ce[k];
  const zm = logit(am);
  const zc = logit(ac);
  const slopeM = ACTS.sigmoid.d(zm);
  const slopeC = ACTS.sigmoid.d(zc);
  const toM = stepsTo(out.mse, 0, NEAR);
  const toC = stepsTo(out.ce, 0, NEAR);
  const traceBox = useMemo<Box>(() => ({ x0: -1, x1: Math.max(50, k) + 1, y0: -0.06, y1: 1.06 }), [k]);
  const squashBox: Box = { x0: -Z, x1: Z, y0: -0.1, y1: 1.15 };

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Starting sure and wrong")}
        job={L("What happens when a neuron starts out sure of the wrong answer? The neuron on this page has one input, always 1, and two numbers of its own: a weight and a bias. Its total, weight times input plus bias, goes through a squashing function called the sigmoid, which turns any number into an answer between 0 and 1. The right answer is 0. At the start the neuron answers 0.98: almost certain, and wrong. Two copies of it are trained with the same kind of steps. They differ only in how the error is scored. One copy uses the squared error: half the square of (answer minus right answer). The other uses cross entropy: here, minus the natural logarithm of (1 minus the answer), which grows without limit as a wrong answer gets more sure. Press Run and compare how many steps each copy needs to come within 0.1 of the right answer.")}
        input={
          <div className="space-y-3">
            <Slider label={L("First answer")} min={0.6} max={0.995} step={0.005} value={start} format={(v) => v.toFixed(3)} onChange={(v) => { setStart(v); restart(); }} />
            <Slider label={L("Step size")} min={0.02} max={1} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={(v) => { setRate(v); restart(); }} />
            <Text kind="note" as="p">
              {L("'First answer' is what the neuron answers before any training; the right answer is 0. Moving it towards 1 makes the start more sure and more wrong. 'Step size' sets how far the weight and the bias move at each step. It is the same for both copies.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={k}
            what={L("steps")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 50, max: 2000, step: 50 }}
            onToggle={() => {
              if (!runner.running && k >= limit) restart();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={restart}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div><div data-slot="plot" className="h-[380px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={traceBox}
                deps={[out, k, traceBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line([[pen.box.x0, NEAR], [pen.box.x1, NEAR]], "rgba(232,232,234,0.25)", 1);
                  pen.line(out.mse.map((a, i) => [i, a] as [number, number]), TWO, 2);
                  pen.line(out.ce.map((a, i) => [i, a] as [number, number]), ONE, 2);
                  const v = pen.box;
                  plate(pen, L("This colour: trained on the squared error"), v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.05, TWO);
                  plate(pen, L("This colour: trained on cross entropy"), v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.11, ONE);
                  plate(pen, L("Below this line: within {{near}} of the right answer", { near: NEAR }), v.x1 - (v.x1 - v.x0) * 0.03, NEAR + (v.y1 - v.y0) * 0.03, MUTED, "right");
                }}
              />
            </div><Caption>{L("Up: the neuron's answer. Across: training steps. One line per copy, each labelled at the top in its own colour. The right answer is 0")}</Caption></div>
            <div><div data-slot="plot" className="h-[380px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={squashBox}
                deps={[zm, zc, slopeM, slopeC]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(Array.from({ length: 161 }, (_, i) => [-Z + (2 * Z * i) / 160, ACTS.sigmoid.f(-Z + (2 * Z * i) / 160)] as [number, number]), INK, 1.4);
                  const tangent = (z: number, colour: string) => {
                    const a = ACTS.sigmoid.f(z);
                    const s = ACTS.sigmoid.d(z);
                    pen.line([[z - 2, a - 2 * s], [z + 2, a + 2 * s]], colour, 1.5);
                    pen.dot(z, a, 5, colour);
                  };
                  tangent(zm, TWO);
                  tangent(zc, ONE);
                  const v = pen.box;
                  plate(pen, L("Slope here: {{s}}", { s: slopeM.toFixed(4) }), v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.05, TWO);
                  plate(pen, L("Slope here: {{s}}", { s: slopeC.toFixed(4) }), v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.11, ONE);
                }}
              />
            </div><Caption>{L("The sigmoid: across, the neuron's total; up, its answer. A dot marks each copy's total now, with a short straight line showing the slope of the curve there. Far out on either side the curve is almost flat")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={k > 0 && toC > 0 ? true : undefined}>
              {k === 0
                ? L("Both copies start by answering {{start}}, while the right answer is 0. Their total lies far out on the flat part of the sigmoid, where its slope is only {{slope}}. Press Run.", { start: start.toFixed(3), slope: slopeM.toFixed(4) })
                : `${toM > 0
                    ? L("After {{k}} steps, the copy trained on the squared error answers {{am}}. It needed {{n}} steps to come within {{near}} of the right answer.", { k, am: am.toFixed(3), n: toM, near: NEAR })
                    : L("After {{k}} steps, the copy trained on the squared error answers {{am}} and is not yet within {{near}} of the right answer.", { k, am: am.toFixed(3), near: NEAR })} ${toC > 0
                    ? L("The copy trained on cross entropy answers {{ac}} and needed {{n}} steps.", { ac: ac.toFixed(3), n: toC })
                    : L("The copy trained on cross entropy answers {{ac}} and is not there yet.", { ac: ac.toFixed(3) })} ${toM > 0 && toC > 0
                    ? L("So the squared error is {{x}} times slower, from the same start with the same step size.", { x: (toM / toC).toFixed(1) })
                    : ""} ${L("Why? The miss is the answer minus the right answer. Under the squared error, each move is the miss times the slope of the sigmoid. Out on the flat part that slope is close to zero, so the more sure and wrong the start, the slower the correction. Under cross entropy the slope of the sigmoid cancels out of the move. What is left is the miss alone, so the move is large exactly when the miss is large.")}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Answer now: squared error copy, cross entropy copy")}</dt>
              <dd className="text-right text-foreground/80">{am.toFixed(4)}, {ac.toFixed(4)}</dd>
              <dt>{L("Size of this step's move, squared error copy")}</dt>
              <dd className="text-right text-foreground/80">{(rate * out.mseSlope[k]).toFixed(5)}</dd>
              <dt>{L("Size of this step's move, cross entropy copy")}</dt>
              <dd className="text-right text-foreground/80">{(rate * out.ceSlope[k]).toFixed(5)}</dd>
              <dt>{L("Slope of the sigmoid at each copy's total")}</dt>
              <dd className="text-right text-foreground/80">{slopeM.toFixed(4)}, {slopeC.toFixed(4)}</dd>
              <dt>{L("Steps needed to come within {{near}} of the right answer", { near: NEAR })}</dt>
              <dd className="text-right text-foreground/80">{toM > 0 ? toM : L("not yet")}, {toC > 0 ? toC : L("not yet")}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("This is why cross entropy is the usual way to score the error when the answer is yes or no. The squared error is not wrong. It is slow in the very case that matters most: a confident mistake.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="slow" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
