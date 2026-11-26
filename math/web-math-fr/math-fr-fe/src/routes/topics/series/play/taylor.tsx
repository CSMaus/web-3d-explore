import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { L } from "@/lib/lang";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/series";
import { FN, radiusOf, taylorAt, taylorCoefficients, type Fn } from "@/systems/series";

export const Route = createFileRoute("/topics/series/play/taylor")({
  loader: () => api.system(TOPIC, "taylor"),
  component: TaylorPage,
});

const MOST = 15;
const FUNCTIONS: { id: Fn; label: string; box: Box; centre: [number, number] }[] = [
  { id: "sin", label: "sin x", box: { x0: -7, x1: 7, y0: -2.2, y1: 2.2 }, centre: [-3, 3] },
  { id: "cos", label: "cos x", box: { x0: -7, x1: 7, y0: -2.2, y1: 2.2 }, centre: [-3, 3] },
  { id: "exp", label: "e^x", box: { x0: -4, x1: 3, y0: -1.5, y1: 12 }, centre: [-2, 2] },
  { id: "ln", label: "ln(1 + x)", box: { x0: -1.2, x1: 3, y0: -3, y1: 2 }, centre: [-0.5, 1.5] },
];

/**
 * Taylor's idea, a term at a time: a curve and its partial sums about a centre, each new power a
 * further curve, closer over a wider stretch, and for ln(1 + x) a stretch the sums never pass.
 */
function TaylorPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [fn, setFn] = useState<Fn>("sin");
  const [a, setA] = useState(0);
  const [x, setX] = useState(0.5);
  const [degree, setDegree] = useState(0);
  const [perFrame, setPerFrame] = useState(0.05);
  const runner = useRunner((n) => setDegree(n), { perFrame, stopAt: MOST });
  const spec = FUNCTIONS.find((f) => f.id === fn)!;
  const coefficients = useMemo(() => taylorCoefficients(fn, a, MOST), [fn, a]);
  const reach = radiusOf(fn, a);
  const value = FN[fn](x);
  const sum = taylorAt(coefficients, a, x, degree);
  const error = Math.abs(sum - value);
  const inside = Math.abs(x - a) < reach;
  const reset = () => {
    runner.reset();
    setDegree(0);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Taylor series: a curve from powers of x")}
      job={L("How does a calculator find sin(0.5) = 0.4794255 when all it can do is add and multiply? It adds up a few simple terms: 0.5 - 0.5^3/6 + 0.5^5/120 = 0.4794271, already right to five decimal places. Here 0.5^3 means 0.5 × 0.5 × 0.5, the third power of 0.5. Each term is a power of x divided by a fixed number. A sum of such terms that can go on for ever is called a series, and this one is the Taylor series of sin x. Its terms are chosen so that the sum copies the curve at one point, called the centre: the same height there, the same steepness, the same bend, and so on. On this page, pressing run adds the terms one at a time and draws each new sum as a curve. The question: how many terms does a given accuracy need, and where does no number of terms help? A real calculator first brings x close to 0 and uses slightly tuned numbers. The application 'How does a calculator get sin(x)?' in this topic shows how.")}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("Which function")}>
            <Choices options={FUNCTIONS.map((f) => ({ id: f.id, label: f.label }))} value={fn} onPick={(id) => { setFn(id); setA(0); setX(0.5); reset(); }} />
            <Text kind="note" as="p">{L("Four curves to choose from. sin x and cos x, the sine and the cosine from school trigonometry, go up and down between -1 and 1 for ever. e^x is the number e = 2.718... raised to the power x, and it grows faster and faster. ln(1 + x) is the natural logarithm of 1 + x. It is not defined at x = -1 and to the left of it. The series of the first three work at every x. The series of ln(1 + x) stops working beyond a certain distance from the centre.")}</Text>
          </OptionGroup>
          <OptionGroup title={L("Where the sum is built and where it is checked")}>
            <Slider label={L("Centre a")} min={spec.centre[0]} max={spec.centre[1]} step={0.1} value={a} format={(v) => v.toFixed(1)} onChange={(v) => { setA(v); reset(); }} />
            <Slider label={L("Point x")} min={spec.box.x0 + 0.1} max={spec.box.x1 - 0.1} step={0.05} value={x} format={(v) => v.toFixed(2)} onChange={setX} />
            <Text kind="note" as="p">
              {L("Centre a: the point where the sum copies the curve, with the same height, steepness and bend. Point x: the place where the sum is compared with the true value of the function. It is set with the slider or by a click on the picture. Run adds the powers of (x - a), the distance from the centre, one at a time.")}
            </Text>
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={degree}
          limit={MOST}
          what={L("highest power used")}
          onToggle={() => {
            if (!runner.running && degree >= MOST) reset();
            runner.toggle();
          }}
          onStep={(many) => runner.once(many)}
          onReset={reset}
          perFrame={perFrame}
          onSpeed={setPerFrame}
          pace="slow"
        />
      }
      picture={
        <section ref={stage}>
          <div data-slot="plot" className="h-[min(480px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={spec.box}
              deps={[fn, a, x, degree, coefficients]}
              onPick={(px) => setX(Math.max(spec.box.x0 + 0.1, Math.min(spec.box.x1 - 0.1, px)))}
              draw={(pen) => {
                ticks(pen);
                pen.axes(FAINT);
                // where the series can reach, for the functions that have a limit
                if (Number.isFinite(reach)) {
                  const ctx = pen.ctx;
                  ctx.globalAlpha = 0.08;
                  ctx.fillStyle = SKY;
                  const l = pen.px(a - reach);
                  const r = pen.px(a + reach);
                  ctx.fillRect(l, 0, r - l, pen.height);
                  ctx.globalAlpha = 1;
                }
                const xs = Array.from({ length: 401 }, (_, i) => spec.box.x0 + ((spec.box.x1 - spec.box.x0) * i) / 400);
                const clip = (y: number) => Math.max(spec.box.y0 - 50, Math.min(spec.box.y1 + 50, y));
                // the earlier sums, faint, then the newest bright
                for (let n = 0; n < degree; n += 1) {
                  pen.ctx.globalAlpha = 0.18 + (0.3 * n) / Math.max(1, degree);
                  pen.line(xs.map((t) => [t, clip(taylorAt(coefficients, a, t, n))]), TWO, 1);
                }
                pen.ctx.globalAlpha = 1;
                pen.line(xs.filter((t) => fn !== "ln" || t > -0.999).map((t) => [t, FN[fn](t)]), INK, 1.4);
                pen.line(xs.map((t) => [t, clip(taylorAt(coefficients, a, t, degree))]), ONE, 3);
                pen.line([[x, spec.box.y0], [x, spec.box.y1]], FAINT, 1);
                if (Number.isFinite(value)) pen.dot(x, value, 4, INK);
                pen.dot(x, clip(sum), 5, ONE);
                pen.ring(a, FN[fn](a), 7, TWO, 1.5);
              }}
            />
          </div>
          <Caption>
            {Number.isFinite(reach)
              ? L("Thin line: the true curve of the function. Thick line: the sum of the terms added so far. Faint lines: the sums with fewer terms. Ring: the centre a. Vertical line: the point x, with a small dot at the true value and a larger dot at the value of the sum. Shaded band: the stretch around the centre where this series works. Outside the band no number of terms helps.")
              : L("Thin line: the true curve of the function. Thick line: the sum of the terms added so far. Faint lines: the sums with fewer terms. Ring: the centre a. Vertical line: the point x, with a small dot at the true value and a larger dot at the value of the sum. This series works at every x. Far from the centre it needs more terms.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={degree === 0 ? undefined : inside ? error < 1e-4 : false}>
            {degree === 0
              ? L("Only the first term so far: the height of the curve at the centre, drawn as a flat line. Press run to add powers of x.")
              : !inside
                ? L("The point x is {{d}} away from the centre, but this series works only up to a distance of {{r}}. So far from the centre the terms grow instead of shrinking, and each new term makes the sum worse.", { d: Math.abs(x - a).toFixed(2), r: reach.toFixed(2) })
                : error < 1e-4
                  ? L("With powers up to {{n}}, the sum at x = {{x}} is {{s}} and the true value is {{f}}. They differ by only {{e}}.", { n: degree, x: x.toFixed(2), s: sum.toFixed(7), f: value.toFixed(7), e: error.toExponential(1) })
                  : L("With powers up to {{n}}, the sum at x = {{x}} is {{s}}, but the true value is {{f}}. The difference is {{e}}. More terms are needed, or a point closer to the centre.", { n: degree, x: x.toFixed(2), s: sum.toFixed(5), f: value.toFixed(5), e: error.toExponential(2) })}
          </Verdict>
          <Readout
            rows={[
              [L("Function chosen"), spec.label],
              [L("Centre a"), a.toFixed(1)],
              [L("Highest power used"), String(degree)],
              [L("Sum of the terms at x"), Number.isFinite(sum) ? sum.toPrecision(8) : "-"],
              [L("True value at x"), Number.isFinite(value) ? value.toPrecision(8) : "-"],
              [L("Error: how far the sum is from the true value"), Number.isFinite(error) ? error.toExponential(2) : "-"],
              [L("Reach: how far from the centre the series works"), Number.isFinite(reach) ? reach.toFixed(3) : L("any distance")],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("Why do three of these series work everywhere and one does not? In the series of sin, cos and e^x, each power is divided by a factorial: 3! = 1 × 2 × 3 = 6, 5! = 1 × 2 × 3 × 4 × 5 = 120, and so on. A factorial grows faster than any power, so at every x the terms shrink in the end. In the series of ln(1 + x), the term with the power k is divided only by k. Its terms shrink only while the distance from the centre is less than 1 + a, the distance from the centre to x = -1, where the function is not defined. Another page of this topic, 'Where a series stops working', shows a curve with no such point whose series still stops. Not covered here: Taylor's theorem, which bounds the error in advance. This page measures the error directly.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`series-taylor-${fn}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
