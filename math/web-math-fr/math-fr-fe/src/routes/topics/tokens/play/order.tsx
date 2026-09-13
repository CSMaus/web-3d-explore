import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, TWO, mix } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { VOCAB, WIDTH, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode, type Token } from "@/systems/bpe";
import { forward, sinusoid, type Model } from "@/systems/lm";
import { rng } from "@/systems/net";
import { BTN, FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/order")({
  loader: () => api.system(TOPIC, "order"),
  component: OrderPage,
});

const SCHEMES = [
  { id: "none", label: "No position" },
  { id: "learned", label: "A learned vector per index" },
  { id: "sinus", label: "Sines and cosines" },
];

function signed(v: number, scale = 1) {
  const t = Math.max(-1, Math.min(1, v / scale));
  return t < 0 ? mix("#1b1f25", TWO, -t) : mix("#1b1f25", ONE, t);
}

function shuffle(tokens: Token[], seed: number) {
  const next = rng(seed);
  const out = tokens.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function OrderPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ model: true });
  const [text, setText] = useState("the dog watches the cat");
  const [scheme, setScheme] = useState("none");
  const [seed, setSeed] = useState(2);
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.06);

  const tokens = useMemo(() => encode(VOCAB, text).slice(0, 12), [text]);
  const mixed = useMemo(() => shuffle(tokens, seed), [tokens, seed]);
  const n = tokens.length;
  const runner = useRunner((k) => setDone(k), { perFrame, stopAt: n });
  const at = Math.min(done, n);
  const E = store.model.E;
  const P = store.model.P;

  // the model with its position vectors swapped for the chosen scheme
  const model = useMemo<Model>(() => {
    const rows = Array.from({ length: P.length }, (_, p) => (scheme === "none" ? new Array(WIDTH).fill(0) : scheme === "learned" ? P[p] : sinusoid(p, WIDTH)));
    return { ...store.model, P: rows };
  }, [scheme, P, store.model, store.version]);
  // the mixing is one step of attention with the mask off: every position looks at every
  // other and takes a weighted average, with weights that depend only on content
  const streamA = useMemo(() => forward(model, tokens.map((t) => t.id), false).h, [model, tokens]);
  const streamB = useMemo(() => forward(model, mixed.map((t) => t.id), false).h, [model, mixed]);
  const total = (rows: number[][], upTo: number) => {
    const acc = new Array(WIDTH).fill(0);
    for (let i = 0; i < upTo; i++) for (let d = 0; d < WIDTH; d++) acc[d] += rows[i][d] / Math.max(1, upTo);
    return acc;
  };
  void E;
  const sumA = total(streamA, at);
  const sumB = total(streamB, at);
  const gap = Math.sqrt(sumA.reduce((s, v, d) => s + (v - sumB[d]) ** 2, 0));
  const same = gap < 1e-9;
  const isShuffled = mixed.some((t, i) => t.id !== tokens[i].id);

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "Order has to be supplied"}
        job="A contextual vector has to be built from every position in the sentence, and the mixing that builds it treats every position alike: each one looks at all the others and takes a weighted average. Mix a sentence that way, and mix the same words shuffled, and the results are the same set of vectors in a different order. The job is to see that happen, and to see what fixes it."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">The sentence</span>
              <input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className={FIELD} />
            </label>
            <button type="button" onClick={() => { setSeed((s) => s + 1); reset(); }} className={BTN}>Shuffle it another way</button>
            <Choices options={SCHEMES} value={scheme} onPick={(id) => { setScheme(id); reset(); }} />
            <p className="text-[11px] text-muted">
              {scheme === "none"
                ? "Each token's vector is its row of the table and nothing else. The same token at position 1 and position 5 is the same vector."
                : scheme === "learned"
                  ? "One trainable vector per position index, added to the token's row. The shared model learned these; there are as many as the model's window is long, and no more."
                  : "A fixed vector per position made of sines and cosines at many frequencies, added to the row. Nothing to learn, and there is one for any index."}
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="mixed positions folded in"
            limit={n}
            onToggle={() => {
              if (!runner.running && at >= n) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(n, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              {[{ label: "The sentence", list: tokens, rows: streamA, sum: sumA }, { label: "The same words, shuffled", list: mixed, rows: streamB, sum: sumB }].map((side) => (
                <div key={side.label} className="space-y-2">
                  <div className="rounded border border-edge p-2">
                    <div className="font-mono text-[11px] text-muted">{side.label}</div>
                    <div className="mt-1"><TokenRow tokens={side.list} size="sm" dimFrom={at} /></div>
                  </div>
                  <div><div className="h-[260px] overflow-hidden rounded border border-edge">
                    <Plot
                      className="h-full w-full"
                      box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                      deps={[side.rows, side.sum, at]}
                      draw={(pen) => {
                        const { ctx, width: W } = pen;
                        ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                        ctx.textAlign = "left";
                        const cw = Math.min(14, (W - 70) / WIDTH);
                        const rh = 13;
                        ctx.fillStyle = MUTED;
                        side.rows.forEach((row, i) => {
                          const y = 20 + i * rh;
                          ctx.fillStyle = i < at ? INK : "#3a3f47";
                          ctx.fillText(String(i + 1), 8, y + 10);
                          for (let d = 0; d < WIDTH; d++) {
                            ctx.fillStyle = signed(row[d], 1.2);
                            ctx.globalAlpha = i < at ? 1 : 0.25;
                            ctx.fillRect(24 + d * cw, y, cw - 1, rh - 1);
                            ctx.globalAlpha = 1;
                          }
                        });
                        const y = 30 + side.rows.length * rh + 10;
                        ctx.fillStyle = MUTED;
                        ctx.fillText("Added up and averaged:", 8, y);
                        for (let d = 0; d < WIDTH; d++) {
                          ctx.fillStyle = signed(side.sum[d], 1.2);
                          ctx.fillRect(24 + d * cw, y + 6, cw - 1, 18);
                        }
                        ctx.fillStyle = INK;
                        ctx.fillText(side.sum.slice(0, 5).map((v) => v.toFixed(2)).join("  ") + " ...", 8, y + 40);
                      }}
                    />
                  </div><Caption>{`After mixing: one row a position, ${WIDTH} wide${scheme === "none" ? "" : ", positions added before"}`}</Caption></div>
                </div>
              ))}
            </div>
            {scheme === "sinus" ? (
              <div><div className="h-[110px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                  deps={[scheme]}
                  draw={(pen) => {
                    const { ctx, width: W } = pen;
                    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.fillStyle = MUTED;
                    const cw = Math.min(14, (W - 40) / WIDTH);
                    for (let p = 0; p < 24; p++) {
                      const v = sinusoid(p, WIDTH);
                      for (let d = 0; d < WIDTH; d++) {
                        ctx.fillStyle = signed(v[d]);
                        ctx.fillRect(30 + d * cw, 20 + p * 3.4, cw - 1, 3);
                      }
                    }
                  }}
                />
              </div><Caption>The position vectors for positions 1 to 24: slow waves on the left, fast on the right. Every position gets a different pattern, and two positions a fixed distance apart are related by the same rotation wherever they are.</Caption></div>
            ) : null}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at === 0 ? undefined : scheme === "none" ? false : !same}>
              {at === 0
                ? "Press run: both sentences are mixed, then their mixed vectors are folded into one total, position by position, side by side."
                : !isShuffled
                  ? "The shuffle happened to leave the sentence as it was; shuffle it another way."
                  : same
                    ? `After ${at} positions the two totals are identical: they differ by ${gap.toExponential(1)}. The same rows went in, in a different order; the mixing treats positions alike, so it gave the same vectors back in that other order, and the total does not care about order. Nothing built this way can tell a sentence from its shuffle.`
                    : `After ${at} positions the two totals differ by ${gap.toFixed(3)}. The token rows that went in are the same, but each carried its position with it, so the mixing weights came out different and the order survived. That is what a position vector is for, and it is all it is for.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Tokens</dt>
              <dd className="text-right text-ink/80">{n}</dd>
              <dt>Width of every vector, the stream's width for the whole depth</dt>
              <dd className="text-right text-ink/80">{WIDTH}</dd>
              <dt>Gap between the two totals</dt>
              <dd className="text-right text-ink/80">{gap.toExponential(2)}</dd>
              <dt>Position vectors available</dt>
              <dd className="text-right text-ink/80">{scheme === "none" ? "None" : scheme === "learned" ? `${P.length}, the window's length, and then none` : "One for any index"}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The learned scheme has a ceiling: a position past the last learned vector has no vector.
              The sine scheme has none, and rotating a query and a key by an angle proportional to
              their positions, so that their dot product depends only on the distance between them,
              is what current models do. The mask is off here on purpose: with it on, the mixing
              itself would already know which position came first. The next page opens the mixing.

            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`order-${scheme}`} />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}

