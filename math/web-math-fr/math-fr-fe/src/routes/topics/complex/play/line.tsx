import { createFileRoute } from "@tanstack/react-router";
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
import { INK, MUTED, ONE, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { ComplexFrame } from "./-shared";

export const Route = createFileRoute("/topics/complex/play/line")({
  loader: () => api.system(TOPIC, "line"),
  component: LinePage,
});

const MOVES = [
  { id: "add", label: "Add a number" },
  { id: "times", label: "Multiply by a number" },
  { id: "square", label: "Square: the question" },
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
    <ComplexFrame>
      <TaskPage
        title={system?.name ?? "Numbers on a line, and the one question they cannot answer"}
        job="Every ordinary number is a place on a line: zero in the middle, more to the right, less to the left. Adding slides the whole line along. Multiplying stretches it, and multiplying by a negative number flips it round through zero. The job is to watch those three, then to try every number on the line against one question: which number, times itself, gives minus one?"
        input={
          <div className="space-y-3">
            <Choices options={MOVES} value={move} onPick={(id) => { setMove(id); reset(); }} />
            {move !== "square" ? (
              <Slider label={move === "add" ? "Add" : "Multiply by"} min={-3} max={3} step={0.1} value={k} format={(v) => v.toFixed(1)} onChange={(v) => { setK(v); reset(); }} />
            ) : null}
            <p className="text-[11px] text-muted">
              {move === "add"
                ? "Every mark on the line moves the same distance the same way. Nothing changes shape."
                : move === "times"
                  ? "Every distance from zero is multiplied. A negative number sends the right side to the left: the line turns over through zero."
                  : "A number is tried, from minus three to three, and its square is drawn above it. The question is whether the square ever reaches minus one."}
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            limit={TRIES}
            what={move === "square" ? "numbers tried" : "of the move"}
            onToggle={() => {
              if (!runner.running && at >= TRIES) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(TRIES, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div className="h-[170px] overflow-hidden rounded border border-edge">
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
                      pen.text(`${x.toFixed(2)}, squared: ${(x * x).toFixed(2)}`, x, 0.75, ONE, "center");
                      pen.dot(-1, -0.45, 5, TWO);
                      pen.text("minus one is here, on the lower line", -1, -0.85, TWO, "center");
                      pen.dot(x * x, -0.45, 4, ONE);
                    }
                  }}
                />
              </div>
              <Caption>
                {move === "square"
                  ? "The line, twice: a number tried on top, and its square on the line below. The square is looked for at minus one."
                  : "The line before the move on top, and where every mark lands after it below."}
              </Caption>
            </div>
            {move === "square" ? (
              <div>
                <div className="h-[260px] overflow-hidden rounded border border-edge">
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
                <Caption>Along the bottom: the number tried. Up: its square. The rose line is minus one. The green curve is every square so far; it touches zero and never goes below it.</Caption>
              </div>
            ) : null}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={move === "square" && at >= TRIES ? false : undefined}>
              {move === "add"
                ? `Adding ${k.toFixed(1)} slides every mark ${Math.abs(k).toFixed(1)} to the ${k >= 0 ? "right" : "left"}. Zero goes to ${k.toFixed(1)}; the spacing between marks is untouched.`
                : move === "times"
                  ? `Multiplying by ${k.toFixed(1)} sends 1 to ${k.toFixed(1)} and 2 to ${(2 * k).toFixed(1)}. ${k < 0 ? "The right side has gone left and the left side right: the line has flipped through zero. Multiplying by minus one is exactly a flip, and nothing else." : k === 0 ? "Everything lands on zero." : "Every distance from zero is stretched by the same factor; nothing crosses over."}`
                  : !started
                    ? "Press run. Every number from minus three to three is tried, and its square drawn above it."
                    : at < TRIES
                      ? `${x.toFixed(2)} squared is ${(x * x).toFixed(2)}. The closest any square has come to minus one so far is ${(closest * closest).toFixed(2)}, at ${closest.toFixed(2)}.`
                      : `Every number was tried and no square dipped below zero: the lowest any square got was ${(closest * closest).toFixed(2)}, at ${closest.toFixed(2)}, and minus one is a whole unit further down. A number times itself is a stretch applied twice, and two stretches never make a flip. The question has no answer on the line. It does have one a step off it, on the next page.`}
            </Verdict>
            <Readout
              rows={[
                ["The move", move === "add" ? `x becomes x + ${k.toFixed(1)}` : move === "times" ? `x becomes ${k.toFixed(1)} times x` : "x becomes x times x"],
                ["Where 1 lands", image(1).toFixed(2)],
                ["Where minus 1 lands", image(-1).toFixed(2)],
                ["Where 0 lands", image(0).toFixed(2)],
                ["Numbers tried", move === "square" ? `${at} of ${TRIES}` : "-"],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              Times minus one is a flip: the whole line turned round through zero. The question
              asks for a number that, applied twice, is a flip. Half a flip is not a stretch and
              not a slide, so nothing on the line can be it. It is a turn, and a turn needs room.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="complex-line" />
            <Equations system={system} />
          </>
        }
      />
    </ComplexFrame>
  );
}
