import { createFileRoute } from "@tanstack/react-router";
import { Swatch, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { StoryOf } from "@/components/StoryOf";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { UNIT, block, dot, frame, line, pane } from "@/lib/panes";
import { TOPIC } from "@/lib/probability";
import { useRunner } from "@/lib/runner";
import * as scene from "@/scenes/probability/galton";
import type { Values } from "@/scenes/probability/galton";
import { STEPS } from "@/storylines/probability/galton";
import type { Act } from "@/storylines/probability/galton";
import { binomial, choose, dropBall, rngFrom } from "@/systems/probability";

export const Route = createFileRoute("/topics/probability/play/galton")({
  loader: () => api.system(TOPIC, "galton"),
  component: GaltonPage,
});

const MOST = 5000;
const TRAIL = 6;
const TILT_LEAST = 0.2;
const TILT_MOST = 0.8;
const TILT_STEP = 0.05;

function storyAct(act: Act, values: Values, change: (next: Values) => void) {
  switch (act) {
    case "tilt":
      return (
        <div className="max-w-2xl">
          <Slider label={L("Tilt: chance of going right")} min={TILT_LEAST} max={TILT_MOST} step={TILT_STEP} value={values.p} format={(v) => v.toFixed(2)} onChange={(v) => change({ p: v })} />
        </div>
      );
  }
}

/**
 * a board of pins: at every pin a ball goes right with chance p and left otherwise, and it lands in
 * the bin that counts its rights. the last few balls' paths are drawn through the pins, the bins
 * fill below, and the binomial chances times the balls dropped stand over them as dots.
 */
function GaltonPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [rows, setRows] = useState(10);
  const [p, setP] = useState(0.5);
  const [limit, setLimit] = useState(1000);
  const [perFrame, setPerFrame] = useState(2);
  const [n, setN] = useState(0);
  const runner = useRunner((k) => setN(Math.min(limit, k)), { perFrame, stopAt: limit });
  const balls = useMemo(() => {
    const rng = rngFrom(10);
    return Array.from({ length: MOST }, () => dropBall(rows, p, rng));
  }, [rows, p]);
  const bins = useMemo(() => {
    const c = new Array(rows + 1).fill(0);
    for (let i = 0; i < n; i += 1) c[balls[i].bin] += 1;
    return c;
  }, [balls, n, rows]);
  const chances = Array.from({ length: rows + 1 }, (_, k) => binomial(rows, k, p));
  const fullest = bins.reduce((best, c, k) => (c > bins[best] ? k : best), 0);
  const likeliest = chances.reduce((best, c, k) => (c > chances[best] ? k : best), 0);
  const average = n ? bins.reduce((s, c, k) => s + c * k, 0) / n : 0;
  const reset = () => {
    runner.reset();
    setN(0);
  };
  const half = rows / 2;

  return (
    <TaskPage
      title={system?.name ?? L("The Galton board")}
      job={L("Why do balls falling at random always pile up in the same shape?")}
      story={<StoryOf steps={STEPS} scene={scene} act={storyAct} />}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("The board")} note={L("The first slider sets the chance that a ball goes right at a pin, the same at every pin. A value above one half tilts the board to the right. The second slider sets the number of rows, which is the number of bounces. Either change starts the drops again.")}>
            <Slider label={L("Chance of going right at each pin")} min={0.05} max={0.95} step={0.05} value={p} format={(v) => v.toFixed(2)} onChange={(v) => { setP(Math.round(v * 100) / 100); reset(); }} />
            <Slider label={L("Rows of pins")} min={2} max={16} step={1} value={rows} format={(v) => String(Math.round(v))} onChange={(v) => { setRows(Math.round(v)); reset(); }} />
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={n}
          limit={limit}
          what={L("balls")}
          onLimit={(v) => setLimit(Math.round(v))}
          limitRange={{ min: 10, max: MOST, step: 10 }}
          onToggle={() => {
            if (!runner.running && n >= limit) reset();
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
          <Text kind="note" as="div" className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
            <span><Swatch colour={ONE} />{L("Thick line: path of the last ball")}</span>
            <span><Swatch colour={SKY} />{L("Bars: balls in each bin")}</span>
            <span><Swatch colour={INK} />{L("Dots: expected balls in each bin")}</span>
          </Text>
          <div data-slot="plot" className="h-[min(480px,calc(100vh-18rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={UNIT}
              deps={[balls, n, bins, rows, p]}
              draw={(pen) => {
                const board = pane(pen, { x0: 0, x1: 1, y0: 0.5, y1: 1 }, { x0: -half - 0.8, x1: half + 0.8, y0: -0.5, y1: rows + 0.3 });
                for (let r = 0; r < rows; r += 1) {
                  for (let j = 0; j <= r; j += 1) dot(pen, board, j - r / 2, rows - r, 2, MUTED);
                }
                for (let t = Math.max(0, n - TRAIL); t < n; t += 1) {
                  const path = balls[t].path.map((k, r): [number, number] => [k - r / 2, rows - r]);
                  const last = t === n - 1;
                  line(pen, board, path, last ? ONE : TWO, last ? 2.2 : 1);
                  if (last) dot(pen, board, path[path.length - 1][0], 0, 5, ONE);
                }
                const top = Math.max(1, ...bins, ...chances.map((c) => c * n)) * 1.12;
                const pile = pane(pen, { x0: 0, x1: 1, y0: 0, y1: 0.5 }, { x0: -half - 0.8, x1: half + 0.8, y0: 0, y1: top });
                frame(pen, pile, { x: rows > 10 ? 2 : 1, xFormat: (v) => (Number.isInteger(v + half) && v + half >= 0 && v + half <= rows ? String(v + half) : "") });
                bins.forEach((c, k) => block(pen, pile, k - half - 0.4, 0, k - half + 0.4, c, SKY));
                chances.forEach((c, k) => dot(pen, pile, k - half, c * n, 3.5, INK));
              }}
            />
          </div>
          <Caption>
            {L("Top: the pins, with the paths of the last six balls. The newest path is the thick line. Bottom: one bar for each bin, numbered by how many times its balls went right. The height of a bar is the number of balls in that bin. Each dot is the expected number of balls: the chance of that bin times the number of balls dropped.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={n >= 500 ? fullest === likeliest : undefined}>
            {n === 0
              ? L("No ball dropped yet. With {{r}} rows and a chance of {{p}} of going right at each pin, bin {{k}} should fill most, with {{c}} per cent of the balls.", { r: rows, p: p.toFixed(2), k: likeliest, c: (chances[likeliest] * 100).toFixed(1) })
              : L("After {{n}} balls, the fullest bin is bin {{f}}, with {{s}} per cent of the balls. The count of paths gives the most to bin {{k}}, {{c}} per cent. On average the balls went right {{a}} times. The expected number is the rows times the chance of going right: {{np}}.", { n, f: fullest, s: ((bins[fullest] / n) * 100).toFixed(1), k: likeliest, c: (chances[likeliest] * 100).toFixed(1), a: average.toFixed(2), np: (rows * p).toFixed(2) })}
          </Verdict>
          <Readout
            rows={[
              [L("Rows of pins"), String(rows)],
              [L("Chance of going right at each pin"), p.toFixed(2)],
              [L("Balls dropped"), String(n)],
              [L("Paths into the likeliest bin, out of all paths"), L("{{a}} of {{b}}", { a: choose(rows, likeliest), b: 2 ** rows })],
              [L("Chance of landing in the likeliest bin"), chances[likeliest].toFixed(4)],
              [L("Average bin of the balls dropped"), n ? average.toFixed(3) : "-"],
              [L("Expected average bin: rows times the chance of going right"), (rows * p).toFixed(3)],
              [L("Spread: typical distance of a ball's bin from the average bin"), Math.sqrt(rows * p * (1 - p)).toFixed(3)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The chance of a bin is the number of paths into it times the chance of each such path. The number of paths comes from Pascal's triangle, a table of numbers in which each number is the sum of the two above it. The chance of one path is p multiplied once for every right and 1 - p once for every left, where p is the chance of going right. This rule for the chances of the bins is called the binomial distribution. With more rows the pile takes a bell shape, called the normal curve. A real board is never this exact: balls bump into each other, and pins are never perfect.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`probability-galton-${rows}-${p.toFixed(2)}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
