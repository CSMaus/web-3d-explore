import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY, heatGrid } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { KERNELS, PICTURES, convolve, dot, patch, pool, type Grid } from "@/systems/shapes";

export const Route = createFileRoute("/topics/networks/play/pictures")({
  loader: () => api.system(TOPIC, "pictures"),
  component: PicturesPage,
});

const N = 12;
const K = 3;
const OUT = N - K + 1;
const SLIDE = OUT * OUT;
const SHAPES = Object.keys(PICTURES).filter((id) => id !== "noise").map((id) => ({ id, label: PICTURES[id].label }));
const FILTERS = Object.keys(KERNELS).map((id) => ({ id, label: KERNELS[id].label }));

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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The same job on a picture"}
        job="A small picture, twelve by twelve. The job is to say which of five shapes it is, and to keep saying so when it is drawn a pixel to one side. A unit wired to every pixel would learn the shape in one place only. Instead, one tiny three by three pattern is slid over the whole picture, the strongest responses are kept, and what is left is compared with the five shapes."
        input={
          <div className="space-y-3">
            <Choices options={SHAPES} value={drawnFrom} onPick={(id) => { setCells(PICTURES[id].make(N)); setDrawnFrom(id); reset(); }} />
            <p className="text-[11px] text-muted">
              Or draw: click any square of the picture to turn it on or off.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => { setCells((g) => shifted(g, 0, 1)); reset(); }} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted">Shift right</button>
              <button type="button" onClick={() => { setCells((g) => shifted(g, 1, 0)); reset(); }} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted">Shift down</button>
              <button type="button" onClick={() => { setCells((g) => shifted(g, -1, -1)); reset(); }} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted">Shift up and left</button>
            </div>
            <Choices options={FILTERS} value={filter} onPick={(id) => { setFilter(id); reset(); }} />
            <p className="text-[11px] text-muted">{KERNELS[filter].what}. The same nine numbers are used at every position.</p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={stage3 ? "steps: every position, then pooled, then compared" : stage2 ? "steps: every position, then pooled" : "steps, one a position"}
            limit={SLIDE + 2}
            onToggle={() => {
              if (!runner.running && at >= SLIDE + 2) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(SLIDE + 2, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-1"><div className="h-[480px] overflow-hidden rounded border border-edge">
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
                ctx.fillText("The pattern", kx, ky - 12);
                heatGrid(ctx, kernel, kx, ky, 28, -2, 2, ONE, true);
                if (here && !stage2) {
                  ctx.fillStyle = MUTED;
                  ctx.fillText("Times the patch", kx, ky + 3 * 28 + 26);
                  heatGrid(ctx, here, kx, ky + 3 * 28 + 34, 28, 0, 1, INK, true);
                  ctx.fillStyle = INK;
                  ctx.fillText(`Adds up to ${hereValue.toFixed(1)}`, kx, ky + 6 * 28 + 60);
                  ctx.fillStyle = MUTED;
                }
                // the response map, filled position by position
                ctx.fillStyle = MUTED;
                ctx.fillText(`Where it fits, ${OUT} by ${OUT}`, ox, 18);
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
                ctx.fillText("Nearest remembered shape", cx, 18);
                ranked.forEach((t, i) => {
                  const ty = gy + i * 78;
                  heatGrid(ctx, t.pooled, cx, ty, 12, 0, Math.max(1e-9, ...t.pooled.flat()), stage3 ? (i === 0 ? ONE : SKY) : "#2a2f37");
                  ctx.fillStyle = stage3 ? (i === 0 ? ONE : MUTED) : "#3a3f47";
                  ctx.textAlign = "left";
                  ctx.fillText(t.label, cx + 5 * 12 + 10, ty + 24);
                  if (stage3) ctx.fillText(`Distance ${t.d.toFixed(1)}`, cx + 5 * 12 + 10, ty + 40);
                });
              }}
            />
          </div><Caption>The picture. Click to draw. {hereValue > 0 ? "Kept" : "Below zero: cut to 0"}. {`Biggest of each 2x2: ${pooled.length} by ${pooled.length}`}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={stage3 ? (drawnFrom === "yours" ? undefined : ranked[0].id === drawnFrom) : undefined}>
              {at === 0
                ? "Press run. The pattern will visit every position of the picture, and the map on the right will fill in with how well it fitted there."
                : !stage2
                  ? `Position ${pos + 1} of ${SLIDE}: row ${row + 1}, column ${col + 1}. The patch under the pattern, times the pattern, adds up to ${hereValue.toFixed(1)}${hereValue > 0 ? "" : ", So nothing is kept here"}.`
                  : !stage3
                    ? `The map is complete: ${SLIDE} numbers from ${conv.weights} weights. Now each block of two by two keeps only its largest, which throws away exactly where inside the block the fit was: ${pooled.length * pooled.length} numbers left.`
                    : `The picture is nearest to ${ranked[0].label}, at distance ${ranked[0].d.toFixed(1)}; the next nearest is ${ranked[1].label} at ${ranked[1].d.toFixed(1)}.${drawnFrom !== "yours" && ranked[0].id !== drawnFrom ? ` That is wrong: it was ${PICTURES[drawnFrom].label}. This pattern does not tell those two apart; try another.` : ""} shift the picture by a pixel and run again: the answer should hold.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Weights in the sliding pattern</dt>
              <dd className="text-right text-ink/80">{conv.weights}</dd>
              <dt>Weights a unit wired to every pixel would need, for the same map</dt>
              <dd className="text-right text-ink/80">{conv.denseWeights.toLocaleString("en")}</dd>
              <dt>Multiply-adds to make the map</dt>
              <dd className="text-right text-ink/80">{conv.work.toLocaleString("en")}</dd>
              <dt>Numbers after pooling</dt>
              <dd className="text-right text-ink/80">{pooled.length * pooled.length}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              This is a convolutional network with the learning left out: the nine numbers in the
              pattern are the weights a real one would learn, by the same blame flowing back as on
              the last page. What the picture shows is why the shape can move and still be found:
              the same pattern looks everywhere, and pooling forgets exactly where it fitted.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`pictures-${drawnFrom}-${filter}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}

