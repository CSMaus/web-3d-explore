import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { abs, fromPolar, mul, show, turns, type C } from "@/systems/complex";
import { ComplexFrame } from "./-shared";

export const Route = createFileRoute("/topics/complex/play/multiply")({
  loader: () => api.system(TOPIC, "multiply"),
  component: MultiplyPage,
});

const BOX: Box = { x0: -5, x1: 5, y0: -5, y1: 5 };
const FRAMES = 80;

function MultiplyPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [z, setZ] = useState<C>([2, 1]);
  const [w, setW] = useState<C>([0.5, 1.5]);
  const [grab, setGrab] = useState<"z" | "w" | null>(null);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: FRAMES });
  const f = Math.min(tick, FRAMES) / FRAMES;
  const product = mul(z, w);
  // first the turn, then the stretch, so the two halves of the rule are seen apart
  const turnPart = Math.min(1, f * 2);
  const stretchPart = Math.max(0, f * 2 - 1);
  const angleNow = turns(z) + turns(w) * turnPart;
  const lengthNow = abs(z) * (1 + (abs(w) - 1) * stretchPart);
  const now = fromPolar(lengthNow, angleNow);
  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const deg = (t: number) => `${(t * 360).toFixed(0)} deg`;

  return (
    <ComplexFrame>
      <TaskPage
        title={system?.name ?? "Multiplying: turn and stretch"}
        job="Multiply two arrows and the answer has the two lengths multiplied and the two angles added. Nothing else. The job is to watch it happen in two moves: z is first turned by w's angle, then stretched by w's length, and it lands on the product. Drag either tip and run it again."
        input={
          <p className="text-[11px] text-muted">
            Green is z, rose is w. Drag either tip. Put w on the up axis at length one, which is i,
            and the move is a quarter turn with no stretch: the last page's definition, read from
            this page's rule.
          </p>
        }
        run={
          <RunBar
            running={runner.running}
            count={Math.round(f * 100)}
            limit={100}
            what="per cent: turn, then stretch"
            onToggle={() => {
              if (!runner.running && tick >= FRAMES) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(FRAMES, v + many * 8))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage}>
            <div className="h-[min(480px,calc(100vh-20rem))] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={BOX}
                equal
                deps={[z, w, f]}
                onDrag={(x, y) => {
                  const which = grab ?? (Math.hypot(z[0] - x, z[1] - y) <= Math.hypot(w[0] - x, w[1] - y) ? "z" : "w");
                  if (grab === null) setGrab(which);
                  const p: C = [Math.round(x * 4) / 4, Math.round(y * 4) / 4];
                  if (which === "z") setZ(p);
                  else setW(p);
                  reset();
                }}
                onRelease={() => setGrab(null)}
                draw={(pen) => {
                  ticks(pen, { x: 1, y: 1 });
                  pen.axes("#3a4048");
                  const unit: [number, number][] = [];
                  for (let i = 0; i <= 120; i++) unit.push([Math.cos((i / 120) * 2 * Math.PI), Math.sin((i / 120) * 2 * Math.PI)]);
                  pen.line(unit, "#2c3540", 1);
                  pen.arrow(0, 0, z[0], z[1], ONE);
                  pen.arrow(0, 0, w[0], w[1], TWO);
                  pen.text(`z = ${show(z)}`, z[0], z[1] + 0.35, ONE, "center");
                  pen.text(`w = ${show(w)}`, w[0], w[1] + 0.35, TWO, "center");
                  if (f > 0) {
                    pen.arrow(0, 0, now[0], now[1], INK);
                    pen.dot(now[0], now[1], 4, INK);
                  }
                  if (f >= 1) {
                    pen.dot(product[0], product[1], 6, SKY);
                    pen.text(`z w = ${show(product)}`, product[0], product[1] - 0.45, SKY, "center");
                  }
                  pen.text("along", BOX.x1 - 0.8, -0.35, MUTED, "center");
                  pen.text("up", 0.3, BOX.y1 - 0.5, MUTED, "left");
                }}
              />
            </div>
            <Caption>Green: z. Rose: w. White: z on its way to the product, turned first by w's angle, then stretched by w's length. Sky: the product. The grey circle has length one: anything on it turns without stretching.</Caption>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {f === 0
                ? `z is ${show(z)}, length ${abs(z).toFixed(2)} at ${deg(turns(z))}. w is ${show(w)}, length ${abs(w).toFixed(2)} at ${deg(turns(w))}. Press run.`
                : f < 0.5
                  ? `Turning z by w's angle, ${deg(turns(w))}: ${(turnPart * 100).toFixed(0)} per cent of the way. The length has not changed yet.`
                  : f < 1
                    ? `Turned. Now stretching by w's length, ${abs(w).toFixed(2)}: the arrow is ${lengthNow.toFixed(2)} long.`
                    : `z times w is ${show(product)}: length ${abs(z).toFixed(2)} times ${abs(w).toFixed(2)} = ${abs(product).toFixed(2)}, angle ${deg(turns(z))} plus ${deg(turns(w))} = ${deg(turns(product) < turns(z) + turns(w) - 0.5 ? turns(product) + 1 : turns(product))}. Multiplying out the brackets gives the same numbers: ${z[0]}·${w[0]} - ${z[1]}·${w[1]} along, ${z[0]}·${w[1]} + ${z[1]}·${w[0]} up.`}
            </Verdict>
            <Readout
              rows={[
                ["z: length, angle", `${abs(z).toFixed(3)}, ${deg(turns(z))}`],
                ["w: length, angle", `${abs(w).toFixed(3)}, ${deg(turns(w))}`],
                ["Product: length, angle", `${abs(product).toFixed(3)}, ${deg(turns(product))}`],
                ["Lengths multiplied", (abs(z) * abs(w)).toFixed(3)],
                ["Angles added", deg((turns(z) + turns(w)) % 1)],
                ["The four terms", `(${z[0]}·${w[0]} - ${z[1]}·${w[1]}) + (${z[0]}·${w[1]} + ${z[1]}·${w[0]})i = ${show(product)}`],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              The minus in the along part comes from i times i being minus one. That one fact,
              multiplied out, is the whole turn-and-stretch picture. Squaring is multiplying a number
              by itself: the angle doubles and the length squares, which is the next page.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-multiply" />
            <Equations system={system} />
          </>
        }
      />
    </ComplexFrame>
  );
}
