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
        title={system?.name ?? "Starting sure and wrong"}
        job="One unit, one input of 1, and the right answer is 0. The unit starts by saying almost 1: very sure, and wrong. Two copies of it are trained by the same descent, and the only difference between them is how wrong is turned into a number. One uses the squared miss the earlier pages used. The other uses cross entropy. Watch how long each takes to admit its mistake."
        input={
          <div className="space-y-3">
            <Slider label="Starts at" min={0.6} max={0.995} step={0.005} value={start} format={(v) => v.toFixed(3)} onChange={(v) => { setStart(v); restart(); }} />
            <Slider label="Step size" min={0.02} max={1} step={0.01} value={rate} format={(v) => v.toFixed(2)} onChange={(v) => { setRate(v); restart(); }} />
            <Text kind="note" as="p">
              Starts at is the unit's first answer, when the right answer is 0. Push it towards 1
              to make the start more sure and more wrong. The step size is the same for both
              copies.
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={k}
            what="steps"
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
          <section ref={stage} className="grid gap-2 lg:grid-cols-[1fr_320px]">
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
                  plate(pen, "Rose: trained on the squared miss", v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.05, TWO);
                  plate(pen, "Green: trained on cross entropy", v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.11, ONE);
                  plate(pen, `Within ${NEAR} of the right answer`, v.x1 - (v.x1 - v.x0) * 0.03, NEAR + (v.y1 - v.y0) * 0.03, MUTED, "right");
                }}
              />
            </div><Caption>The unit's answer after every step, under each cost. The right answer is 0</Caption></div>
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
                  plate(pen, `Slope here: ${slopeM.toFixed(4)}`, v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.05, TWO);
                  plate(pen, `Slope here: ${slopeC.toFixed(4)}`, v.x0 + (v.x1 - v.x0) * 0.04, v.y1 - (v.y1 - v.y0) * 0.11, ONE);
                }}
              />
            </div><Caption>The squash, with each copy's total marked on it and the slope drawn there</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={k > 0 && toC > 0 ? true : undefined}>
              {k === 0
                ? `Both copies start by answering ${start.toFixed(3)} when the right answer is 0. Their total sits far out on the flat part of the squash, where its slope is ${slopeM.toFixed(4)}. Press run.`
                : `After ${k} steps the copy trained on the squared miss answers ${am.toFixed(3)}${toM > 0 ? ` and took ${toM} steps to get within ${NEAR} of the right answer` : ` and is not yet within ${NEAR} of the right answer`}. The copy trained on cross entropy answers ${ac.toFixed(3)}${toC > 0 ? ` and took ${toC} steps` : " and is not there yet either"}. ${toM > 0 && toC > 0 ? `That is ${(toM / toC).toFixed(1)} times slower for the squared miss, from the same start with the same step size.` : ""} The squared miss moves the numbers by the miss times the slope of the squash, and out on the flat part that slope is nearly nothing, so the more sure and wrong the start, the slower it corrects. Under cross entropy the slope of the squash cancels out of the move: what is left is the miss alone, and the move is large exactly when the miss is large.`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <dt>Answer now, squared miss and cross entropy</dt>
              <dd className="text-right text-foreground/80">{am.toFixed(4)}, {ac.toFixed(4)}</dd>
              <dt>Move asked for this step, squared miss</dt>
              <dd className="text-right text-foreground/80">{(rate * out.mseSlope[k]).toFixed(5)}</dd>
              <dt>Move asked for this step, cross entropy</dt>
              <dd className="text-right text-foreground/80">{(rate * out.ceSlope[k]).toFixed(5)}</dd>
              <dt>Slope of the squash at each total</dt>
              <dd className="text-right text-foreground/80">{slopeM.toFixed(4)}, {slopeC.toFixed(4)}</dd>
              <dt>Steps to within {NEAR} of the right answer</dt>
              <dd className="text-right text-foreground/80">{toM > 0 ? toM : "not yet"}, {toC > 0 ? toC : "not yet"}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              This is why cross entropy is the usual cost for a yes-or-no answer. The squared miss
              is not wrong; it is slow in exactly the case that matters most, the confident mistake.
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
