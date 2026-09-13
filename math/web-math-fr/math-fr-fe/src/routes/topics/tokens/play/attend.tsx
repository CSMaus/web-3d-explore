import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, TWO, mix } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { MODEL_STEPS, VOCAB, WIDTH, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { forward, paramCount } from "@/systems/lm";
import { FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/attend")({
  loader: () => api.system(TOPIC, "attend"),
  component: AttendPage,
});

const STAGES = [
  "The stream: each token's row plus its position",
  "Three projections of every row: a query, a key and a value",
  "Scores: each query against each key, divided by the square root of the width",
  "The mask: every score against a later position becomes minus infinity",
  "Softmax along each row: weights that are positive and add to one",
  "The weights applied to the values, and the result added back into the stream",
];
const MASKS = [
  { id: "causal", label: "May only look back" },
  { id: "both", label: "May look both ways" },
];

function signed(v: number, scale = 1) {
  const t = Math.max(-1, Math.min(1, v / scale));
  return t < 0 ? mix("#1b1f25", TWO, -t) : mix("#1b1f25", ONE, t);
}

function AttendPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ model: true });
  const [text, setText] = useState("the cat sleeps on the warm");
  const [mask, setMask] = useState("causal");
  const [length, setLength] = useState(1000);
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.03);

  const tokens = useMemo(() => encode(VOCAB, text).slice(0, 12), [text]);
  const ids = tokens.map((t) => t.id);
  const n = ids.length;
  const runner = useRunner((k) => setDone(k), { perFrame, stopAt: STAGES.length });
  const at = Math.min(done, STAGES.length);
  const key = ids.join(",");
  const pass = useMemo(() => forward(store.model, ids, mask === "causal"), [store.model, store.version, key, mask]);
  const count = paramCount(store.model);
  const last = n - 1;
  const row = pass.weights[last];
  const top = row.reduce((b, v, j) => (v > row[b] ? j : b), 0);
  const trained = store.model.steps >= MODEL_STEPS;

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "Attention, with the numbers"}
        job="Every position gets a new vector that is a weighted average of the vectors at all positions. That is the whole mechanism; everything else is how the weights are computed. The job is to compute them, on a real prompt, through the small model this topic trains, in six moments."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">The prompt</span>
              <input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className={FIELD} />
            </label>
            <Choices options={MASKS} value={mask} onPick={(id) => { setMask(id); reset(); }} />
            <Slider label="A sequence of" min={10} max={8000} step={10} value={length} format={(v) => `${Math.round(v)} tokens`} onChange={(v) => setLength(Math.round(v))} />
            <p className="text-[11px] text-muted">
              The slider does not change the picture. It is for the cost line in the result: the
              score matrix has one entry per pair of positions, so its size is the length squared.
            </p>
            {!trained ? <p className="text-[11px] text-warn">The model is still training in the background ({store.model.steps} of {MODEL_STEPS} steps); the weights below settle as it finishes.</p> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="moments"
            limit={STAGES.length}
            onToggle={() => {
              if (!runner.running && at >= STAGES.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(STAGES.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="rounded border border-edge p-2">
              <TokenRow tokens={tokens} ids size="sm" mark={at >= 5 ? last : null} />
            </div>
            <div><div className="h-[470px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[pass, at, tokens, mask]}
                draw={(pen) => {
                  const { ctx, width: W } = pen;
                  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textAlign = "left";
                  const grid = (M: number[][], x: number, y: number, cw: number, rh: number, scale: number, label: string, lit: boolean, labelsLeft = false) => {
                    ctx.fillStyle = lit ? MUTED : "#3a3f47";
                    ctx.fillText(label, x, y - 4);
                    M.forEach((r, i) => {
                      if (labelsLeft) {
                        ctx.fillStyle = lit ? MUTED : "#3a3f47";
                        ctx.textAlign = "right";
                        ctx.fillText(visible(tokens[i].text).slice(0, 7), x - 4, y + i * rh + rh - 2);
                        ctx.textAlign = "left";
                      }
                      r.forEach((v, j) => {
                        ctx.fillStyle = lit ? (Number.isFinite(v) ? signed(v, scale) : "#0e1116") : "#1b1f25";
                        ctx.fillRect(x + j * cw, y + i * rh, cw - 1, rh - 1);
                        if (lit && !Number.isFinite(v)) {
                          ctx.fillStyle = "#3a3f47";
                          ctx.fillText("-∞", x + j * cw + 2, y + i * rh + rh - 3);
                        }
                      });
                    });
                  };
                  const cw = Math.min(11, (W * 0.24 - 60) / WIDTH);
                  const rh = 14;
                  const col = W * 0.25;
                  // row 1: x, q, k, v
                  grid(pass.x, 60, 26, cw, rh, 1.5, "The stream x", at >= 1, true);
                  grid(pass.q, col + 40, 26, cw, rh, 1.5, "Queries  q = x Wq", at >= 2);
                  grid(pass.k, col * 2 + 40, 26, cw, rh, 1.5, "Keys  k = x Wk", at >= 2);
                  grid(pass.v, col * 3 + 40, 26, cw, rh, 1.5, "Values  v = x Wv", at >= 2);
                  // row 2: scores or weights, n by n
                  const y2 = 26 + n * rh + 40;
                  const sc = Math.min(30, (pen.height - y2 - 70) / n, (W * 0.45 - 60) / n);
                  const scoresShown = at >= 4 ? pass.scores : pass.scores.map((r, i) => r.map((v, j) => (mask === "causal" && j > i ? (at >= 4 ? -Infinity : pass.q[i].reduce((s, qq, d) => s + qq * pass.k[j][d], 0) / Math.sqrt(WIDTH)) : v)));
                  if (at >= 5) grid(pass.weights, 60, y2, sc, sc, 1, "Weights: softmax of each row", true, true);
                  else grid(scoresShown, 60, y2, sc, sc, 3, at >= 4 ? "Scores, masked: nothing may look ahead" : "Scores  q_i . k_j / sqrt(width)", at >= 3, true);
                  if (at >= 5) {
                    ctx.fillStyle = INK;
                    pass.weights[last].forEach((v, j) => {
                      ctx.textAlign = "center";
                      ctx.fillText((v * 100).toFixed(0) + "%", 60 + j * sc + sc / 2, y2 + n * sc + 12);
                    });
                    ctx.textAlign = "left";
                    ctx.fillStyle = MUTED;
                  }
                  // row 2 right: the mixed vectors and the stream after
                  const rx = Math.max(60 + n * sc + 50, W * 0.42);
                  const cw2 = Math.min(cw, (W - rx - 60) / (2 * WIDTH));
                  grid(pass.mixed, rx, y2, cw2, rh, 1.5, "The mix: weights x values", at >= 6);
                  grid(pass.h, rx + WIDTH * cw2 + 40, y2, cw2, rh, 1.5, "The stream after: x + mix", at >= 6);
                  ctx.fillStyle = at > 0 ? INK : MUTED;
                }}
              />
            </div><Caption>The last row, as percentages. {at === 0 ? "Six moments, in order. Press run." : `Moment ${at} of 6: ${STAGES[at - 1]}`}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? `${n} tokens. The last one, ${visible(tokens[last].text)}, will end up with a new vector built from all ${n}. Press run.`
                : at < 5
                  ? STAGES[at - 1] + (at === 3 ? ` There are ${n} by ${n} = ${n * n} scores, one per pair of positions.` : at === 4 ? (mask === "causal" ? ` ${(n * (n - 1)) / 2} of the ${n * n} entries are gone: the future.` : " The mask is off, so every position sees every other, which a model that writes text one token at a time cannot do.") : "")
                  : `${visible(tokens[last].text)} listens ${(row[top] * 100).toFixed(0)} % to ${visible(tokens[top].text)} at position ${top + 1}${row.filter((v) => v > 0.1).length > 1 ? ` And ${row.map((v, j) => [v, j] as [number, number]).filter(([v, j]) => v > 0.1 && j !== top).map(([v, j]) => `${(v * 100).toFixed(0)} % to ${visible(tokens[j].text)}`).join(", ")}` : ""}. ${at === 6 ? "Its new vector is those weights applied to the values, added to what it had. That is the only way earlier tokens reach later ones, and it is recomputed at every position." : "The row adds to one."}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Positions, so rows in every grid</dt>
              <dd className="text-right text-ink/80">{n}</dd>
              <dt>Scores for this prompt</dt>
              <dd className="text-right text-ink/80">{n} x {n} = {n * n}</dd>
              <dt>Scores for a sequence of {length.toLocaleString("en")}</dt>
              <dd className="text-right text-ink/80">{(length * length).toLocaleString("en")}</dd>
              <dt>The last row adds to</dt>
              <dd className="text-right text-ink/80">{row.reduce((a, b) => a + b, 0).toFixed(6)}</dd>
              <dt>Numbers in the three projections</dt>
              <dd className="text-right text-ink/80">3 x {WIDTH} x {WIDTH} = {count.attention}</dd>
              <dt>Numbers in the whole model</dt>
              <dd className="text-right text-ink/80">{count.total.toLocaleString("en")} (Table {count.table.toLocaleString("en")}, Positions {count.positions}, Attention {count.attention})</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              A full model has many heads doing this at once on slices of the width, a small
              network after each one, and the pair stacked many times deep; this one has one head
              and one layer. The division by the square root of the width keeps the scores from
              growing with the width, which would drive every row to a single one and zeros. The
              mask is why training on whole texts matches writing one token at a time.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="attend" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}

