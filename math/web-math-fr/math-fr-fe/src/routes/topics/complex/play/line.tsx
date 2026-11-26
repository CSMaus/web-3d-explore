import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/complex";
import { L } from "@/lib/lang";
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";

export const Route = createFileRoute("/topics/complex/play/line")({
  loader: () => api.system(TOPIC, "line"),
  component: LinePage,
});

const MOVES = [
  { id: "add", label: L("Add a number") },
  { id: "times", label: L("Multiply by a number") },
  { id: "square", label: L("Square a number") },
];
const TRIES = 120;
const LINE: Box = { x0: -4.5, x1: 4.5, y0: -1, y1: 1 };

function LinePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [move, setMove] = useState("square");
  const [k, setK] = useState(-1);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(1);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: TRIES });
  const at = Math.min(tick, TRIES);
  // the tried number sweeps the line from left to right
  const x = -3 + (6 * at) / TRIES;
  const marks = useMemo(() => [-3, -2, -1, 0, 1, 2, 3], []);
  const image = (v: number) => (move === "add" ? v + k : move === "times" ? v * k : v * v);
  const tried = useMemo(() => Array.from({ length: at + 1 }, (_, i) => -3 + (6 * i) / TRIES), [at]);
  const closest = useMemo(() => (move === "square" ? tried.reduce((b, v) => (Math.abs(v * v + 1) < Math.abs(b * b + 1) ? v : b), tried[0] ?? 0) : 0), [tried, move]);
  const curveBox: Box = { x0: -3.2, x1: 3.2, y0: -2, y1: 9.5 };

  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const started = at > 0;

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Numbers on a line, and the one question they cannot answer")}
        job={L("Is there a number that gives minus one when it is multiplied by itself? Every ordinary number can be drawn as a point on a line: zero in the middle, positive numbers to the right, negative numbers to the left. Three buttons choose what happens to the line. 'Add a number' moves every point the same distance. 'Multiply by a number' stretches every distance from zero; a negative number also flips the line over, so that the right side goes to the left. 'Square a number' multiplies a number by itself: the square of 3 is 9, and the square of minus 3 is also 9. With this last button chosen, pressing run tries the numbers from minus three to three one by one and draws the square of each. The question to watch: does any square reach minus one?")}
        input={
          <div className="space-y-3">
            <Choices options={MOVES} value={move} onPick={(id) => { setMove(id); reset(); }} />
            {move !== "square" ? (
              <Slider label={move === "add" ? L("Add") : L("Multiply by")} min={-3} max={3} step={0.1} value={k} format={(v) => v.toFixed(1)} onChange={(v) => { setK(v); reset(); }} />
            ) : null}
            <Text kind="note" as="p">
              {move === "add"
                ? L("Every point of the line moves the same distance in the same direction. The gaps between the marks stay the same.")
                : move === "times"
                  ? L("Every distance from zero is multiplied by the chosen number. A negative number also sends the right side of the line to the left and the left side to the right: the line flips over, and zero stays in place.")
                  : L("The numbers from minus three to three are tried one after another, from left to right. The square of each one, the number multiplied by itself, is marked on the lower line and on the graph below. The question is whether a square ever reaches minus one.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            limit={TRIES}
            what={move === "square" ? L("numbers tried") : L("steps of the move")}
            onToggle={() => {
              if (!runner.running && at >= TRIES) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div data-slot="plot" className="h-[170px] overflow-hidden">
                <Plot
                  className="h-full w-full"
                  box={LINE}
                  deps={[move, k, at, x]}
                  draw={(pen) => {
                    pen.line([[LINE.x0, 0.35], [LINE.x1, 0.35]], MUTED, 1.5);
                    pen.line([[LINE.x0, -0.45], [LINE.x1, -0.45]], MUTED, 1.5);
                    const f = at / TRIES;
                    for (const m of marks) {
                      pen.dot(m, 0.35, 3, m === 0 ? INK : SKY);
                      pen.text(String(m), m, 0.6, MUTED, "center");
                      // where the mark lands under the move, drawn as far along as the run has got
                      const to = move === "square" ? m : m + (image(m) - m) * f;
                      if (move !== "square") {
                        pen.line([[m, 0.3], [to, -0.4]], "#2c3540", 1);
                        pen.dot(to, -0.45, 3, m === 0 ? INK : m < 0 ? TWO : ONE);
                        pen.text(to.toFixed(1), to, -0.85, MUTED, "center");
                      }
                    }
                    if (move === "square") {
                      pen.dot(x, 0.35, 5, ONE);
                      pen.text(L("{{x}} times itself is {{sq}}", { x: x.toFixed(2), sq: (x * x).toFixed(2) }), x, 0.75, ONE, "center");
                      pen.dot(-1, -0.45, 5, TWO);
                      pen.text(L("Minus one: the square looked for"), -1, -0.85, TWO, "center");
                      pen.dot(x * x, -0.45, 4, ONE);
                    }
                  }}
                />
              </div>
              <Caption>
                {move === "square"
                  ? L("Two copies of the number line. Upper line: the number being tried. Lower line: its square, the number multiplied by itself, and the point minus one, which the square would have to reach.")
                  : L("Upper line: the marks before the move. Lower line: where each mark lands after the move. A thin line joins each mark to the place where it lands.")}
              </Caption>
            </div>
            {move === "square" ? (
              <div>
                <div data-slot="plot" className="h-[260px] overflow-hidden">
                  <Plot
                    className="h-full w-full"
                    box={curveBox}
                    deps={[at]}
                    draw={(pen) => {
                      ticks(pen);
                      pen.axes("#3a4048");
                      pen.line([[curveBox.x0, -1], [curveBox.x1, -1]], TWO, 1.2);
                      pen.line(tried.map((v) => [v, v * v] as [number, number]), ONE, 2);
                      if (started) pen.dot(x, x * x, 4.5, INK);
                    }}
                  />
                </div>
                <Caption>{L("A graph of the squares. Across: the number tried, from minus three to three. Up: its square. The thin horizontal line below the axis is at height minus one. The thick curve joins all the squares found so far. It touches zero once, at zero, and never goes below zero.")}</Caption>
              </div>
            ) : null}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={move === "square" && at >= TRIES ? false : undefined}>
              {move === "add"
                ? k >= 0
                  ? L("Adding {{k}} moves every mark {{d}} to the right. Zero lands on {{k}}. The gaps between the marks do not change.", { k: k.toFixed(1), d: Math.abs(k).toFixed(1) })
                  : L("Adding {{k}} moves every mark {{d}} to the left. Zero lands on {{k}}. The gaps between the marks do not change.", { k: k.toFixed(1), d: Math.abs(k).toFixed(1) })
                : move === "times"
                  ? L("Multiplying by {{k}} sends 1 to {{k}} and 2 to {{k2}}. {{more}}", {
                      k: k.toFixed(1),
                      k2: (2 * k).toFixed(1),
                      more: k < 0 ? L("The right side has moved to the left and the left side to the right: the line has flipped over, and zero has stayed in place. Multiplying by minus one does exactly this flip and nothing more: every number keeps its distance from zero and moves to the other side.") : k === 0 ? L("Every mark lands on zero.") : L("Every distance from zero is multiplied by the same number. No mark crosses to the other side of zero."),
                    })
                  : !started
                    ? L("Press run. The numbers from minus three to three are tried one by one, and the square of each is drawn.")
                    : at < TRIES
                      ? L("{{x}} times itself is {{sq}}. So far the square closest to minus one is {{low}}, the square of {{at}}.", { x: x.toFixed(2), sq: (x * x).toFixed(2), low: (closest * closest).toFixed(2), at: closest.toFixed(2) })
                      : L("Every number from minus three to three was tried, and no square went below zero. The smallest square was {{low}}, the square of {{at}}. Minus one lies at least one whole unit lower. The reason holds for every number: a positive number times a positive number is positive, and a negative number times a negative number is positive too. So no number on the line answers the question. An answer exists off the line, in a second direction: the page 'What 𝑖 is', in the same topic, shows it.", { low: (closest * closest).toFixed(2), at: closest.toFixed(2) })}
            </Verdict>
            <Readout
              rows={[
                [L("The chosen move"), move === "add" ? L("each number x becomes x + {{k}}", { k: k.toFixed(1) }) : move === "times" ? L("each number x becomes {{k}} times x", { k: k.toFixed(1) }) : L("each number x becomes x times x")],
                [L("Where the number 1 lands"), image(1).toFixed(2)],
                [L("Where the number minus 1 lands"), image(-1).toFixed(2)],
                [L("Where the number 0 lands"), image(0).toFixed(2)],
                [L("Numbers tried so far"), move === "square" ? L("{{n}} of {{total}}", { n: at, total: TRIES }) : "-"],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("Multiplying by minus one flips the whole line over, with zero staying in place. The question asks for a number that gives this flip when it is used twice as a multiplier. On the line, multiplying can only stretch, squeeze or flip, so no number can do half of a flip. In a flat plane the same flip can be made as a half turn around zero. Half of that, a quarter turn, points off the line. This is where the new number 𝑖 comes from.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-line" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
