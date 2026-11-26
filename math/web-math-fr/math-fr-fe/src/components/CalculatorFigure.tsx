import { useMemo, useState } from "react";
import { Caption, Field, Figure, Panel, Plot as Frame, Readout, Text } from "@kit/index";
import { Plot, type Box } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, TWO, ticks } from "@/lib/draw";
import { L } from "@/lib/lang";
import { reduceQuarter, sinPoly, sinReduced } from "@/systems/series";

const BOX: Box = { x0: -12, x1: 12, y0: -2, y1: 2 };
const NAMES = [L("sin r"), L("cos r"), L("minus sin r"), L("minus cos r")];

/**
 * the reader's experiment inside the calculator piece: one x on a slider, the seven-term
 * polynomial of sin used on x as it is, and the calculator's way, quarter turns taken off first
 * and the same polynomial used on what is left. both answers and the true one side by side.
 */
export function CalculatorFigure() {
  const [x, setX] = useState(2.5);
  const curve = useMemo(() => {
    const sin: [number, number][] = [];
    const poly: [number, number][] = [];
    for (let i = 0; i <= 480; i += 1) {
      const t = BOX.x0 + ((BOX.x1 - BOX.x0) * i) / 480;
      sin.push([t, Math.sin(t)]);
      // past the top of the frame the line is cut, not drawn off the page
      const p = sinPoly(t);
      if (Math.abs(p) <= 2.2) poly.push([t, p]);
    }
    return { sin, poly };
  }, []);
  const { k, r, turn } = reduceQuarter(x);
  const straight = sinPoly(x);
  const reduced = sinReduced(x);
  const truth = Math.sin(x);

  return (
    <Panel label={L("Try it: sin x computed two ways")} tone="primary">
      <div className="space-y-4">
        <Field label="x" min={-30} max={30} step={0.01} value={x} format={(v) => v.toFixed(2)} onChange={setX} />
        <Figure>
          <Frame className="relative h-[260px]">
            <Plot
              className="h-full w-full"
              box={BOX}
              deps={[x]}
              draw={(pen) => {
                ticks(pen);
                pen.axes(FAINT);
                // the window the polynomial is trusted on
                pen.line([[-Math.PI / 4, -2], [-Math.PI / 4, 2]], MUTED, 1);
                pen.line([[Math.PI / 4, -2], [Math.PI / 4, 2]], MUTED, 1);
                pen.line(curve.sin, TWO, 1.2);
                pen.line(curve.poly, ONE, 2.6);
                if (Math.abs(x) <= BOX.x1) pen.dot(x, truth, 4, INK);
                if (Math.abs(r) <= BOX.x1) pen.dot(r, Math.sin(r), 4, ONE);
              }}
            />
          </Frame>
          <Caption>{L("The slider sets x. Thin line: the true sin x. Thick line: the sum of the first seven terms of its series, up to the power 13. It follows sin x closely near 0 and leaves it beyond about 5. The two vertical lines mark a quarter of pi on each side of 0: the window the calculator works in. Two dots on the sine curve: one at the chosen x, and one at r, what is left of x after the quarter turns are taken off. The dot at r always lies inside the window.")}</Caption>
        </Figure>
        <Readout
          rows={[
            [L("Seven-term sum used directly on x"), Math.abs(straight) < 1e6 ? straight.toFixed(10) : straight.toExponential(3)],
            [L("Number of quarter turns taken off"), String(k)],
            [L("What is left of x, called r"), r.toFixed(10)],
            [L("So sin x equals"), NAMES[turn]],
            [L("Short sum used on r"), reduced.toFixed(10)],
            [L("True value of sin x"), truth.toFixed(10)],
            [L("Error: directly on x, and on r"), `${Math.abs(straight - truth).toExponential(1)}, ${Math.abs(reduced - truth).toExponential(1)}`],
          ]}
        />
        <Text kind="note" as="p">
          {L("Both ways use the same short sums: seven terms for sin, eight for cos. Only the place where they are used is different.")}
        </Text>
      </div>
    </Panel>
  );
}
