import { createFileRoute } from "@tanstack/react-router";
import { Button, Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { StoryOf } from "@/components/StoryOf";
import type { At } from "@/components/StoryOf";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { Tex } from "@/components/Tex";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { addPoint, finish, fromStage } from "@/lib/freehand";
import { L } from "@/lib/lang";
import { GLYPHS } from "@/lib/outline";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/series";
import type { StoryStep } from "@/lib/storyline";
import * as scene from "@/scenes/series/fourier";
import type { Data, Shape, Values } from "@/scenes/series/fourier";
import { STEPS } from "@/storylines/series/fourier";
import type { Act, Fade, Set, Top } from "@/storylines/series/fourier";
import { peakOf, sumText, waveAt, waveSum, waveTerms, type Wave } from "@/systems/series";

export const Route = createFileRoute("/topics/series/play/fourier")({
  loader: () => api.system(TOPIC, "fourier"),
  component: FourierPage,
});

const MOST = 40;
/** the circles on the left, centred at (-2.4, 0); the wave on the right over one turn, x from 0 to 2 pi */
const BOX: Box = { x0: -4.4, x1: 6.6, y0: -1.9, y1: 1.9 };
const HUB = -2.4;
const WAVES: { id: Wave; label: string }[] = [
  { id: "square", label: L("Square") },
  { id: "sawtooth", label: L("Sawtooth") },
  { id: "triangle", label: L("Triangle") },
];

const LEAST = 1;
const KNOWN: Record<Shape, true> = { cat: true, pi: true, sigma: true, amp: true, three: true };
const isShape = (id: string): id is Shape => id in KNOWN;
const SHAPES: { id: Shape; label: string }[] = [
  { id: "cat", label: L("Cat") },
  ...GLYPHS.flatMap((g) => (isShape(g.id) ? [{ id: g.id, label: g.glyph }] : [])),
];

type Change = (next: Values) => void;

function storyAct(act: Act, values: Values, change: Change, data: Data, set: Set) {
  if (act === "count") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" disabled={set.count <= LEAST} onClick={() => change({ ...values, count: set.count - 1 })}>
          {L("One arrow fewer")}
        </Button>
        <Button variant="outline" disabled={set.count >= scene.MOST[set.mode]} onClick={() => change({ ...values, count: set.count + 1 })}>
          {L("One more arrow")}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" disabled={values.own === null} onClick={() => change({ ...values, own: null, drawing: false, count: null })}>
        {L("Clear the drawing")}
      </Button>
      {data.own === null ? <Text kind="note" as="span">{L("Draw one closed line here")}</Text> : null}
    </div>
  );
}

function storyTune(_step: StoryStep<Fade, Set, Top, Act>, values: Values, change: Change, _data: Data, set: Set) {
  return (
    <div className="max-w-2xl space-y-3">
      <Slider
        label={L("Number of arrows")}
        min={LEAST}
        max={scene.MOST[set.mode]}
        step={1}
        value={set.count}
        format={(v) => String(Math.round(v))}
        onChange={(v) => change({ ...values, count: Math.round(v) })}
      />
      {set.mode === "draw" ? (
        <OptionGroup
          title={L("Shape to draw")}
          note={L("The chain of arrows redraws the chosen outline. The four signs are the outlines of the next page.")}
        >
          <Choices options={SHAPES} value={values.shape} onPick={(id) => change({ ...values, shape: id, count: null })} />
        </OptionGroup>
      ) : null}
    </div>
  );
}

const ROWS = 5;
const CELL = "py-0.5 pl-2 text-right first:pl-0 sm:pl-4 sm:first:pl-0";
const MARK = "§";
const MINUS = "−";
const HALF_TURN = 180;
const SERIES_TEX = "c_1 e^{it} + c_{-1} e^{-it} + c_2 e^{2it} + \\dots";
const TEX_OF: [string, string][] = [
  ["sin", "\\sin"],
  ["½", "\\tfrac{1}{2}"],
  ["⅓", "\\tfrac{1}{3}"],
  ["¼", "\\tfrac{1}{4}"],
  ["⅕", "\\tfrac{1}{5}"],
  ["⅐", "\\tfrac{1}{7}"],
  ["…", "\\dots"],
];

const texOf = (sum: string) => TEX_OF.reduce((s, [from, to]) => s.split(from).join(to), sum);
const signed = (n: number, plus: string) => (n < 0 ? MINUS : plus) + String(Math.abs(n));

function storyAside(step: StoryStep<Fade, Set, Top, Act>, data: Data, set: Set) {
  if (step.fade.list !== 1) return null;
  return (
    <>
      <div className="overflow-x-auto">
        <table data-slot="story-list" className="tabular-nums">
          <thead>
            <tr>
              <th scope="col" className={CELL}>{L("Arrow")}</th>
              <th scope="col" className={CELL}>{L("Length of the arrow")}</th>
              <th scope="col" className={CELL}>{L("Turns per lap")}</th>
              <th scope="col" className={CELL}>{L("Starting angle")}</th>
            </tr>
          </thead>
          <tbody>
            {data.arms.slice(0, ROWS).map((arm, i) => (
              <tr key={arm.n}>
                <td className={CELL}>{i + 1}</td>
                <td className={CELL}>{arm.r.toFixed(3)}</td>
                <td className={CELL}>{signed(arm.n, "+")}</td>
                <td className={CELL}>{signed(Math.round((Math.atan2(arm.im, arm.re) * HALF_TURN) / Math.PI), "")}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Text kind="note" as="div">{L("More rows: {{n}}", { n: Math.max(0, set.count - ROWS) })}</Text>
    </>
  );
}

function storyTop(step: StoryStep<Fade, Set, Top, Act>, data: Data, set: Set) {
  if (step.top === "sum") {
    const [lead, tail] = L("height = {{sum}}", { sum: MARK }).split(MARK);
    return (
      <>
        <span aria-hidden="true">
          {lead}
          <Tex tex={texOf(sumText(set.wave, set.count))} />
          {tail}
        </span>
        <span className="sr-only">{scene.topLine("sum", data, set)}</span>
      </>
    );
  }
  if (step.top === "formula") {
    const [lead, tail] = L("drawing(t) = {{sum}}", { sum: MARK }).split(MARK);
    return (
      <>
        {lead}
        <Tex tex={SERIES_TEX} />
        {tail}
        <Text kind="note" as="div">{L("c holds the length and the starting angle of an arrow. The number before t is its speed. A minus sign means it spins the other way.")}</Text>
      </>
    );
  }
  return undefined;
}

type Where = At<Fade, Set, Top, Act, Values>;

const storyPointer = {
  onDrag: (sx: number, sy: number, at: Where) => {
    if (at.set.mode !== "own") return;
    const p = fromStage(sx, sy);
    if (!at.values.drawing) {
      at.change({ ...at.values, own: [p], drawing: true, count: null });
      return;
    }
    at.change({ ...at.values, own: addPoint(at.values.own ?? [], p) });
  },
  onRelease: (at: Where) => {
    if (at.set.mode !== "own" || !at.values.drawing) return;
    at.change({ ...at.values, own: finish(at.values.own ?? []), drawing: false });
  },
};

/**
 * a wave rebuilt from sines, each sine a circle turning on the tip of the one before. the tip's
 * height, carried across, traces the sum beside the wave it is aiming at; run adds the sines one
 * by one, and the overshoot at a jump is measured as it stays.
 */
function FourierPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [wave, setWave] = useState<Wave>("square");
  const [count, setCount] = useState(1);
  const [perFrame, setPerFrame] = useState(0.06);
  const [phase, setPhase] = useState(0.6);
  const runner = useRunner((n) => setCount(Math.min(MOST, 1 + n)), { perFrame, stopAt: MOST - 1 });
  const terms = useMemo(() => waveTerms(wave, count), [wave, count]);
  const peak = useMemo(() => peakOf(terms, 4000), [terms]);
  const error = useMemo(() => {
    let s = 0;
    const n = 2000;
    for (let i = 0; i < n; i += 1) {
      const x = -Math.PI + ((i + 0.5) * 2 * Math.PI) / n;
      s += (waveSum(terms, x) - waveAt(wave, x)) ** 2;
    }
    return Math.sqrt(s / n);
  }, [terms, wave]);
  const jumps = wave !== "triangle";

  // the circles turn, one turn every eight seconds, while the run adds circles and for one turn
  // when asked; otherwise, and for a reader who asked for stillness, they hold
  const [spin, setSpin] = useState(false);
  const moving = runner.running || spin;
  useEffect(() => {
    if (!moving || typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    let frame = 0;
    let last = performance.now();
    let turned = 0;
    const tick = (now: number) => {
      const step = ((now - last) / 8000) * 2 * Math.PI;
      last = now;
      turned += step;
      setPhase((p) => (p + step) % (2 * Math.PI));
      if (!runner.running && turned >= 2 * Math.PI) {
        setSpin(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [moving, runner.running]);

  const reset = () => {
    runner.reset();
    setCount(1);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Fourier series: a wave from turning circles")}
      job={L("How do smoothly turning arrows make a wave with sharp corners?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} tune={storyTune} aside={storyAside} top={storyTop} pointer={storyPointer} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("Which wave")}>
            <Choices options={WAVES} value={wave} onPick={(id) => { setWave(id); reset(); }} />
            <Text kind="note" as="p">{L("Three waves to choose from. The square wave jumps between 1 and -1. The sawtooth rises steadily and then drops back at once. Both jump once in each turn. The triangle wave goes up and down in straight lines: it has corners but no jump. The three need very different numbers of circles.")}</Text>
          </OptionGroup>
          <OptionGroup title={L("The circles")}>
            <Text kind="note" as="p">{L("Run adds the circles one at a time, and the circles turn while it goes on. The step buttons add circles without turning them. The button below turns the circles once. The dashed line in the picture carries the height of the moving point across to the wave.")}</Text>
            <Button variant="outline" size="sm" disabled={moving} onClick={() => setSpin(true)}>{L("Turn the circles once")}</Button>
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={count}
          limit={MOST}
          what={L("circles")}
          onToggle={() => {
            if (!runner.running && count >= MOST) reset();
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
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={BOX}
              equal
              deps={[terms, phase, wave]}
              draw={(pen) => {
                pen.line([[BOX.x0, 0], [BOX.x1, 0]], FAINT, 1);
                pen.line([[0, BOX.y0], [0, BOX.y1]], FAINT, 1);
                // the circles, tip to tail, at this moment
                let cx = HUB;
                let cy = 0;
                terms.forEach((t, i) => {
                  const r = Math.hypot(t.a, t.b);
                  const ring: [number, number][] = [];
                  for (let j = 0; j <= 64; j += 1) ring.push([cx + r * Math.cos((j / 64) * 2 * Math.PI), cy + r * Math.sin((j / 64) * 2 * Math.PI)]);
                  pen.ctx.globalAlpha = i < 12 ? 0.55 : 0.25;
                  pen.line(ring, MUTED, 1);
                  pen.ctx.globalAlpha = 1;
                  // a sine term b sin(k t) is the height of b e^{ikt}; a cosine term a cos(k t) of i a e^{ikt}
                  const ang = t.k * phase;
                  const nx = cx + t.b * Math.cos(ang) - t.a * Math.sin(ang);
                  const ny = cy + t.b * Math.sin(ang) + t.a * Math.cos(ang);
                  pen.line([[cx, cy], [nx, ny]], SKY, 1.2);
                  cx = nx;
                  cy = ny;
                });
                pen.dot(cx, cy, 4, INK);
                // the wave on the right: the aim, the sum, and where the tip is now
                const xs = Array.from({ length: 600 }, (_, i) => (i / 599) * 2 * Math.PI);
                pen.line(xs.map((u) => [u, waveAt(wave, u)]), FAINT, 2);
                pen.line(xs.map((u) => [u, waveSum(terms, u)]), ONE, 2);
                const at = phase;
                pen.ctx.setLineDash([4, 4]);
                pen.line([[cx, cy], [at, cy]], TWO, 1);
                pen.ctx.setLineDash([]);
                pen.dot(at, cy, 5, TWO);
              }}
            />
          </div>
          <Caption>
            {L("Left: the circles, each sitting on the edge of the one before. The first and largest is fixed in place. The dot on the last circle is the moving point. Right: one full turn of the wave. Faint thick line: the wave being aimed at. Solid line: the sum of the circles so far. Dashed line: the height of the moving point, carried across to the part of the wave it is drawing now.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={count < 3 ? undefined : !jumps ? error < 0.01 : undefined}>
            {jumps
              ? L("With {{n}} circles the sum differs from the wave by {{e}} on average. Next to the jump it rises to {{p}}, which is {{o}} per cent of the jump above the flat top. More circles make this spike narrower, but it does not get lower.", { n: count, e: error.toFixed(3), p: peak.toFixed(3), o: (((peak - 1) / 2) * 100).toFixed(1) })
              : L("With {{n}} circles the sum differs from the triangle wave by {{e}} on average. A wave without jumps needs few circles, because its circles shrink fast. The next circles of the triangle wave are 1/9, 1/25 and 1/49 of the first: one over the square of the speed. Those of the square wave shrink only to 1/3, 1/5 and 1/7 of the first: one over the speed.", { n: count, e: error.toFixed(4) })}
          </Verdict>
          <Readout
            rows={[
              [L("Wave chosen"), WAVES.find((w) => w.id === wave)!.label],
              [L("Circles added"), String(count)],
              [L("Speeds of the circles (turns per turn of the first)"), terms.map((t) => t.k).slice(0, 8).join(", ") + (terms.length > 8 ? ", ..." : "")],
              [L("Average error: how far the sum is from the wave"), error.toFixed(4)],
              [L("Highest point of the sum"), peak.toFixed(4)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The spike next to a jump never goes away. Its height tends to about 9 per cent of the jump above the flat top, however many circles are added. For a square wave between -1 and 1 the sum peaks at 1.179. Henry Wilbraham described this in 1848. It was seen again in 1898 on Michelson's machine, which added sine waves with gears, and Gibbs explained it in 1899. It is now called the Gibbs phenomenon. Another page of this topic, 'Any outline drawn by turning circles', uses circles of the same kind to draw a closed shape instead of a wave.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`series-fourier-${wave}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
