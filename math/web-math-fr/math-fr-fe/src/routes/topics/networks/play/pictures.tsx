import { createFileRoute } from "@tanstack/react-router";
import { Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY, heatGrid } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { KERNELS, PICTURES, convolve, dot, patch, pool, type Grid } from "@/systems/shapes";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/pictures")({
  loader: () => api.system(TOPIC, "pictures"),
  component: PicturesPage,
});

const N = 12;
const K = 3;
const OUT = N - K + 1;
const SLIDE = OUT * OUT;
const SHAPES = Object.keys(PICTURES).filter((id) => id !== "noise").map((id) => ({ id, label: L(PICTURES[id].label) }));
const FILTERS = Object.keys(KERNELS).map((id) => ({ id, label: L(KERNELS[id].label) }));

function shifted(g: Grid, dr: number, dc: number): Grid {
  return g.map((row, r) => row.map((_, c) => g[r - dr]?.[c - dc] ?? 0));
}

/**
 * where everything sits on the canvas, from its width: the picture, the
 * pattern, the response map, the pooled map and the five remembered shapes,
 * left to right. the click handler uses the same numbers as the drawing.
 */
function geometry(W: number) {
  const gx = 12;
  const gy = 30;
  const patternW = 3 * 28;
  const shapesW = 5 * 12 + 110;
  const gaps = 3 * 26;
  const cell = Math.max(8, Math.floor(Math.min(22, (W - gx - patternW - shapesW - gaps) / (N + OUT))));
  const kx = gx + N * cell + 26;
  const ox = kx + patternW + 26;
  const cx = ox + OUT * cell + 26;
  return { cell, gx, gy, kx, ky: gy + 20, ox, oy: gy, cx };
}

function distance(a: Grid, b: Grid) {
  let s = 0;
  for (let r = 0; r < a.length; r++) for (let c = 0; c < a[r].length; c++) s += (a[r][c] - b[r][c]) ** 2;
  return Math.sqrt(s);
}

function PicturesPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [cells, setCells] = useState<Grid>(() => PICTURES.cross.make(N));
  const [drawnFrom, setDrawnFrom] = useState("cross");
  const [filter, setFilter] = useState("edgeV");
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.34);

  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: SLIDE + 2 });
  const at = Math.min(tick, SLIDE + 2);
  const kernel = KERNELS[filter].k;

  const conv = useMemo(() => convolve(cells, kernel, 1, 0, "relu"), [cells, kernel]);
  const pooled = useMemo(() => pool(conv.out, 2), [conv]);
  const templates = useMemo(
    () => SHAPES.map((s) => ({ id: s.id, label: s.label, pooled: pool(convolve(PICTURES[s.id].make(N), kernel, 1, 0, "relu").out, 2) })),
    [kernel],
  );
  const ranked = useMemo(
    () => templates.map((t) => ({ ...t, d: distance(pooled, t.pooled) })).sort((a, b) => a.d - b.d),
    [templates, pooled],
  );
  const stage2 = at > SLIDE;
  const stage3 = at > SLIDE + 1;
  const pos = Math.min(at, SLIDE) - 1;
  const row = pos >= 0 ? Math.floor(pos / OUT) : -1;
  const col = pos >= 0 ? pos % OUT : -1;
  const here = pos >= 0 ? patch(cells, row, col, K) : null;
  const hereValue = here ? dot(here, kernel) : 0;
  const outMax = Math.max(1e-9, ...conv.out.flat());

  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const toggle = (r: number, c: number) => {
    setCells((g) => g.map((rowv, rr) => rowv.map((v, cc) => (rr === r && cc === c ? 1 - v : v))));
    setDrawnFrom("yours");
    reset();
  };

  return (
    <div>
      <TaskPage
        title={system?.name ?? L("Finding a shape in a picture")}
        job={L("How can a program tell which shape is in a picture, even when the shape is moved? The picture here is 12 by 12 squares, each one on or off. The task is to say which of five shapes it shows: a cross, a square, a disc, stripes or a seven. The answer should stay the same when the shape moves by one square. A neuron connected to every square would learn the shape in one place only. Instead, a small pattern of 3 by 3 numbers is slid over the picture. At each position, each number of the pattern is multiplied by the square under it, and the nine products are added. A total below zero becomes zero. This sliding sum is called a convolution. Then each block of 2 by 2 results keeps only its largest value; this is called pooling. What is left is compared with the same result for each of the five shapes, and the nearest one is the answer. Press Run to watch it step by step.")}
        input={
          <div className="space-y-3">
            <Choices options={SHAPES} value={drawnFrom} onPick={(id) => { setCells(PICTURES[id].make(N)); setDrawnFrom(id); reset(); }} />
            <Text kind="note" as="p">
              {L("Or draw: a click on any square of the picture turns it on or off.")}
            </Text>
            <div className="flex flex-wrap gap-1.5">
              <Button variant="outline" size="sm" type="button" onClick={() => { setCells((g) => shifted(g, 0, 1)); reset(); }}>{L("Shift right")}</Button>
              <Button variant="outline" size="sm" type="button" onClick={() => { setCells((g) => shifted(g, 1, 0)); reset(); }}>{L("Shift down")}</Button>
              <Button variant="outline" size="sm" type="button" onClick={() => { setCells((g) => shifted(g, -1, -1)); reset(); }}>{L("Shift up and left")}</Button>
            </div>
            <Choices options={FILTERS} value={filter} onPick={(id) => { setFilter(id); reset(); }} />
            <Text kind="note" as="p">{L("{{what}}. The same nine numbers are used at every position.", { what: L(KERNELS[filter].what) })}</Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={stage3 ? L("steps: every position, then pooling, then comparison") : stage2 ? L("steps: every position, then pooling") : L("steps, one per position")}
            limit={SLIDE + 2}
            onToggle={() => {
              if (!runner.running && at >= SLIDE + 2) reset();
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
          <section ref={stage} className="space-y-1"><div data-slot="plot" className="h-[480px] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              deps={[cells, conv, pooled, at, ranked, filter]}
              onPick={(x, y) => {
                // only clicks inside the input grid toggle a square
                const rect = stage.current?.querySelector("canvas")?.getBoundingClientRect();
                if (!rect) return;
                const { cell, gx, gy } = geometry(rect.width);
                const c = Math.floor((x * rect.width - gx) / cell);
                const r = Math.floor(((1 - y) * rect.height - gy) / cell);
                if (c >= 0 && c < N && r >= 0 && r < N) toggle(r, c);
              }}
              draw={(pen) => {
                const ctx = pen.ctx;
                const { cell, gx, gy, kx, ky, ox, oy, cx } = geometry(pen.width);
                ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                ctx.textAlign = "left";
                ctx.fillStyle = MUTED;
                heatGrid(ctx, cells, gx, gy, cell, 0, 1, INK);
                // the patch under the pattern right now
                if (here && !stage2) {
                  ctx.strokeStyle = SKY;
                  ctx.lineWidth = 2;
                  ctx.strokeRect(gx + col * cell - 1, gy + row * cell - 1, K * cell, K * cell);
                }
                // the pattern, with its numbers
                ctx.fillStyle = MUTED;
                ctx.fillText(L("The pattern"), kx, ky - 12);
                heatGrid(ctx, kernel, kx, ky, 28, -2, 2, ONE, true);
                if (here && !stage2) {
                  ctx.fillStyle = MUTED;
                  ctx.fillText(L("Times the patch under it"), kx, ky + 3 * 28 + 26);
                  heatGrid(ctx, here, kx, ky + 3 * 28 + 34, 28, 0, 1, INK, true);
                  ctx.fillStyle = INK;
                  ctx.fillText(L("Sum: {{v}}", { v: hereValue.toFixed(1) }), kx, ky + 6 * 28 + 60);
                  ctx.fillStyle = MUTED;
                }
                // the response map, filled position by position
                ctx.fillStyle = MUTED;
                ctx.fillText(L("How well it fits, {{n}} by {{n}}", { n: OUT }), ox, 18);
                const shownOut: Grid = conv.out.map((r, ri) => r.map((v, ci) => (ri * OUT + ci < Math.min(at, SLIDE) ? v : 0)));
                heatGrid(ctx, shownOut, ox, oy, cell, 0, outMax, SKY);
                if (pos >= 0 && !stage2) {
                  ctx.strokeStyle = INK;
                  ctx.lineWidth = 1.5;
                  ctx.strokeRect(ox + col * cell - 1, oy + row * cell - 1, cell, cell);
                }
                // the pooled map
                const py = oy + OUT * cell + 34;
                ctx.fillStyle = stage2 ? MUTED : "#3a3f47";
                if (stage2) heatGrid(ctx, pooled, ox, py, cell, 0, outMax, SKY);
                else {
                  ctx.strokeStyle = "#23262c";
                  ctx.strokeRect(ox, py, pooled.length * cell, pooled.length * cell);
                }
                // the five shapes, compared
                ctx.fillStyle = stage3 ? MUTED : "#3a3f47";
                ctx.fillText(L("The five shapes, nearest first"), cx, 18);
                ranked.forEach((t, i) => {
                  const ty = gy + i * 78;
                  heatGrid(ctx, t.pooled, cx, ty, 12, 0, Math.max(1e-9, ...t.pooled.flat()), stage3 ? (i === 0 ? ONE : SKY) : "#2a2f37");
                  ctx.fillStyle = stage3 ? (i === 0 ? ONE : MUTED) : "#3a3f47";
                  ctx.textAlign = "left";
                  ctx.fillText(t.label, cx + 5 * 12 + 10, ty + 24);
                  if (stage3) ctx.fillText(L("Distance {{d}}", { d: t.d.toFixed(1) }), cx + 5 * 12 + 10, ty + 40);
                });
              }}
            />
          </div><Caption>{L("Left: the picture, 12 by 12 squares; a click turns a square on or off. Next: the 3 by 3 pattern with its nine numbers, and the patch of the picture under it. Then the map of how well the pattern fits at each of the 10 by 10 positions, brighter for a larger sum, and under it the pooled map, {{n}} by {{n}}. Right: each of the five shapes as its own pooled map, nearest first. Distance: how different two pooled maps are, the square root of the sum of the squared differences", { n: pooled.length })}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={stage3 ? (drawnFrom === "yours" ? undefined : ranked[0].id === drawnFrom) : undefined}>
              {at === 0
                ? L("Press Run. The pattern will visit every position of the picture, one per step, and the map will fill in with how well it fits at each position.")
                : !stage2
                  ? hereValue > 0
                    ? L("Position {{pos}} of {{all}}: row {{row}}, column {{col}}. The patch under the pattern, multiplied square by square by the pattern and added up, gives {{v}}.", { pos: pos + 1, all: SLIDE, row: row + 1, col: col + 1, v: hereValue.toFixed(1) })
                    : L("Position {{pos}} of {{all}}: row {{row}}, column {{col}}. The patch under the pattern, multiplied square by square by the pattern and added up, gives {{v}}. That is not above zero, so the map gets 0 here.", { pos: pos + 1, all: SLIDE, row: row + 1, col: col + 1, v: hereValue.toFixed(1) })
                  : !stage3
                    ? L("The map is complete: {{all}} numbers from only {{weights}} weights, because the same pattern is used everywhere. Now each block of 2 by 2 keeps only its largest number. This forgets where inside the block the best fit was. {{left}} numbers are left.", { all: SLIDE, weights: conv.weights, left: pooled.length * pooled.length })
                    : L("The picture is nearest to {{first}}, at distance {{d1}}; the next nearest is {{second}}, at {{d2}}.", { first: ranked[0].label, d1: ranked[0].d.toFixed(1), second: ranked[1].label, d2: ranked[1].d.toFixed(1) }) +
                      (drawnFrom !== "yours" && ranked[0].id !== drawnFrom ? " " + L("That is wrong: the picture was {{shape}}. This pattern does not tell those two shapes apart; another pattern may.", { shape: L(PICTURES[drawnFrom].label) }) : "") +
                      " " + L("Moving the picture by one square and running again should give the same answer.")}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Weights in the sliding pattern")}</dt>
              <dd className="text-right text-foreground/80">{conv.weights}</dd>
              <dt>{L("Weights needed for the same map if every map cell were connected to every square")}</dt>
              <dd className="text-right text-foreground/80">{conv.denseWeights.toLocaleString("en")}</dd>
              <dt>{L("Multiplications (each followed by an addition) to make the map")}</dt>
              <dd className="text-right text-foreground/80">{conv.work.toLocaleString("en")}</dd>
              <dt>{L("Numbers after pooling")}</dt>
              <dd className="text-right text-foreground/80">{pooled.length * pooled.length}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("This is a convolutional network with the learning left out. In a real one, the nine numbers of the pattern are weights that training finds, by passing the error back through the network as in any other neural network. The picture shows why a shape can move and still be found: the same pattern looks everywhere, and pooling forgets exactly where it fitted.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`pictures-${drawnFrom}-${filter}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}

