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
import { FN, radiusOf, taylorAt, taylorCoefficients } from "@/systems/series";

export const Route = createFileRoute("/topics/series/play/radius")({
  loader: () => api.system(TOPIC, "radius"),
  component: RadiusPage,
});

const MOST = 40;
const LINE: Box = { x0: -3, x1: 3, y0: -0.6, y1: 1.6 };
const PLANE: Box = { x0: -3, x1: 3, y0: -2.2, y1: 2.2 };

/**
 * 1/(1 + x^2): smooth on the whole real line, yet its series about a centre a reaches only a
 * distance sqrt(1 + a^2). on the left the sums on the line; on the right the complex plane, where
 * the poles at plus and minus i and the circle that cannot pass them show why.
 */
function RadiusPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [a, setA] = useState(0);
  const [x, setX] = useState(0.8);
  const [degree, setDegree] = useState(0);
  const [guess, setGuess] = useState<"" | "settle" | "swing">("");
  const [perFrame, setPerFrame] = useState(0.12);
  const runner = useRunner((n) => setDegree(n), { perFrame, stopAt: MOST });
  const coefficients = useMemo(() => taylorCoefficients("bump", a, MOST), [a]);
  const reach = radiusOf("bump", a);
  const value = FN.bump(x);
  const sum = taylorAt(coefficients, a, x, degree);
  const inside = Math.abs(x - a) < reach - 1e-9;
  const error = Math.abs(sum - value);
  const guessed = guess === "" || degree === 0 ? "" : (guess === "settle") === inside ? L("The guess was right.") : L("The guess was wrong.");
  const reset = () => {
    runner.reset();
    setDegree(0);
  };
  const xs = Array.from({ length: 401 }, (_, i) => LINE.x0 + ((LINE.x1 - LINE.x0) * i) / 400);

  return (
    <TaskPage
      title={system?.name ?? L("Where a series stops working")}
      job={L("Why does the same series give the right answer at one point and nonsense at another? Here is the function 1/(1 + x^2): one divided by one plus x squared. Its curve is a smooth hill. Its series about the centre 0 is 1 - x^2 + x^4 - x^6 + ..., a sum of powers of x that goes on for ever. At x = 0.5, the terms up to the power 20 give 0.8000002, and the true value is 0.8. At x = 1.2 the same series gives -3.2 with powers up to 10, 23.0 with powers up to 20 and 867.8 with powers up to 40, while the true value is 0.41. The curve has no jump, no corner and no point where it shoots off to infinity. Still, its series about 0 works only for x between -1 and 1. Nothing on the curve marks the numbers 1 and -1. The reason lies outside the ordinary number line. Complex numbers are numbers with two parts, drawn as points of a flat plane. Among them is i, the number whose square is -1. At x = i and x = -i the expression 1 + x^2 equals zero, so the function is not defined there. A series about a centre works only up to the distance from the centre to the nearest such point. On this page the reader moves the centre and the point, guesses whether the sums will settle on the true value, and then adds terms to check.")}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("Where the sum is built and where it is checked")}>
            <Slider label={L("Centre a")} min={-2} max={2} step={0.1} value={a} format={(v) => v.toFixed(1)} onChange={(v) => { setA(v); setGuess(""); reset(); }} />
            <Slider label={L("Point x")} min={-2.9} max={2.9} step={0.05} value={x} format={(v) => v.toFixed(2)} onChange={(v) => { setX(v); setGuess(""); }} />
            <Text kind="note" as="p">{L("Centre a: the point the series is built around. Point x: where its sum is compared with the true value. Both are moved with the sliders. The point x can also be set by a click on the left picture.")}</Text>
          </OptionGroup>
          <OptionGroup title={L("A guess before the run")}>
            <Choices options={[{ id: "settle", label: L("The sums will settle on the true value") }, { id: "swing", label: L("The sums will swing wider and wider") }]} value={guess} onPick={(id) => setGuess(id as "settle" | "swing")} />
            <Text kind="note" as="p">{L("A hint for the guess: the circle in the right picture shows how far from the centre the series works. The guess is checked once terms are added.")}</Text>
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
        <section ref={stage} className="grid gap-2 lg:grid-cols-[1fr_1fr]">
          <div>
            <div data-slot="plot" className="h-[min(400px,calc(100vh-22rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={LINE}
                deps={[a, x, degree, coefficients]}
                onPick={(px) => setX(Math.max(-2.9, Math.min(2.9, px)))}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.ctx.globalAlpha = 0.08;
                  pen.ctx.fillStyle = SKY;
                  pen.ctx.fillRect(pen.px(a - reach), 0, pen.px(a + reach) - pen.px(a - reach), pen.height);
                  pen.ctx.globalAlpha = 1;
                  pen.line(xs.map((t) => [t, FN.bump(t)]), INK, 1.4);
                  pen.line(xs.map((t) => [t, Math.max(-5, Math.min(5, taylorAt(coefficients, a, t, degree)))]), ONE, 3);
                  pen.line([[x, LINE.y0], [x, LINE.y1]], FAINT, 1);
                  pen.dot(x, Math.max(-5, Math.min(5, sum)), 5, inside ? ONE : TWO);
                  pen.ring(a, FN.bump(a), 7, TWO, 1.5);
                }}
              />
            </div>
            <Caption>{L("Left picture: the ordinary number line, with x across. Thin line: the curve 1/(1 + x^2). Thick line: the sum of the terms added so far. Ring: the centre a. Vertical line and dot: the point x and the value of the sum there. Shaded band: the stretch where the series works.")}</Caption>
          </div>
          <div>
            <div data-slot="plot" className="h-[min(400px,calc(100vh-22rem))] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={PLANE}
                equal
                deps={[a, x]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  const ring: [number, number][] = [];
                  for (let i = 0; i <= 120; i += 1) ring.push([a + reach * Math.cos((i / 120) * 2 * Math.PI), reach * Math.sin((i / 120) * 2 * Math.PI)]);
                  pen.line(ring, SKY, 1.6);
                  pen.ring(0, 1, 7, TWO, 2);
                  pen.ring(0, -1, 7, TWO, 2);
                  pen.text("i", 0.18, 1.1, TWO);
                  pen.text("-i", 0.18, -1.05, TWO);
                  pen.line([[a, 0], [0, 1]], FAINT, 1);
                  pen.dot(a, 0, 4, INK);
                  pen.dot(x, 0, 5, inside ? ONE : TWO);
                }}
              />
            </div>
            <Caption>{L("Right picture: the plane of complex numbers. Across is the ordinary number line, up is the second part of the number. The two rings mark i and -i, where 1 + x^2 = 0 and the function is not defined. The circle is the largest circle around the centre a that does not reach them. Dots: the centre and the point x. The series settles inside the circle and nowhere outside it.")}</Caption>
          </div>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={degree === 0 ? undefined : inside && error < 1e-3}>
            {degree === 0
              ? inside
                ? L("The point x is {{d}} from the centre, inside the circle of radius {{r}}. So the sums should settle on the true value. Press run to add terms.", { d: Math.abs(x - a).toFixed(2), r: reach.toFixed(3) })
                : L("The point x is {{d}} from the centre, outside the circle of radius {{r}}. So the sums should never settle. Press run to add terms.", { d: Math.abs(x - a).toFixed(2), r: reach.toFixed(3) })
              : inside
                ? `${guessed} ${error < 1e-3 ? L("With powers up to {{n}}, the sum is {{s}} and the true value is {{f}}. Inside the circle the sums close in on the true value: the difference is {{e}}.", { n: degree, s: sum.toFixed(6), f: value.toFixed(6), e: error.toExponential(1) }) : L("With powers up to {{n}}, the sum is {{s}} and the true value is {{f}}, a difference of {{e}}. Inside the circle the sums do close in, but near its edge they do it slowly, so more terms are needed.", { n: degree, s: sum.toFixed(6), f: value.toFixed(6), e: error.toExponential(1) })}`.trim()
                : `${guessed} ${L("With powers up to {{n}}, the sum is {{s}} and the true value is {{f}}. Outside the circle the terms keep growing, and the sum swings further and further each way.", { n: degree, s: Math.abs(sum) > 1e6 ? sum.toExponential(2) : sum.toFixed(3), f: value.toFixed(6) })}`.trim()}
          </Verdict>
          <Readout
            rows={[
              [L("Centre a"), a.toFixed(1)],
              [L("Radius of the circle, sqrt(1 + a^2)"), reach.toFixed(4)],
              [L("Distance from the centre to x"), Math.abs(x - a).toFixed(4)],
              [L("Highest power used"), String(degree)],
              [L("Sum of the terms at x"), Math.abs(sum) > 1e6 ? sum.toExponential(3) : sum.toFixed(6)],
              [L("True value at x"), value.toFixed(6)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("Why is the radius sqrt(1 + a^2)? It is the distance from the centre a to the point i. The way from a to i is a steps along and 1 step up, so by Pythagoras its length is sqrt(a^2 + 1). Moving the centre away from 0 moves it away from i and -i, so the series works further: from a = 2 it reaches 2.236 on each side. The ordinary number line alone cannot explain these numbers. The points i and -i do. Not covered here: why a series of powers always works inside a whole circle and nowhere outside it. The Cauchy-Hadamard formula proves this.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="series-radius" />
          <Equations system={system} />
        </>
      }
    />
  );
}
