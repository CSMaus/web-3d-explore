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
import { CONTEXT, MODEL_STEPS, VOCAB, WIDTH, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { cosine, forward } from "@/systems/lm";
import { FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/pool")({
  loader: () => api.system(TOPIC, "pool"),
  component: PoolPage,
});

const WAYS = [
  { id: "mean", label: "Average every position" },
  { id: "last", label: "Read off the last position" },
];
const PAIRS = [
  { id: "same", label: "Same meaning, other words", a: "the cat sleeps on the warm mat", b: "the cat is asleep on the mat" },
  { id: "opposite", label: "Opposite meaning, same words", a: "the cat likes the warm mat", b: "the cat does not like the warm mat" },
  { id: "far", label: "Different subject", a: "the cat sleeps on the warm mat", b: "the man walks to the river with the dog" },
];

function signed(v: number, scale = 1) {
  const t = Math.max(-1, Math.min(1, v / scale));
  return t < 0 ? mix("#1b1f25", TWO, -t) : mix("#1b1f25", ONE, t);
}

function PoolPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ model: true });
  const [pair, setPair] = useState("opposite");
  const [a, setA] = useState(PAIRS[1].a);
  const [b, setB] = useState(PAIRS[1].b);
  const [way, setWay] = useState("mean");
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.06);

  const ta = useMemo(() => encode(VOCAB, a).slice(0, CONTEXT), [a]);
  const tb = useMemo(() => encode(VOCAB, b).slice(0, CONTEXT), [b]);
  const ha = useMemo(() => forward(store.model, ta.map((t) => t.id)).h, [store.model, store.version, ta]);
  const hb = useMemo(() => forward(store.model, tb.map((t) => t.id)).h, [store.model, store.version, tb]);
  const most = Math.max(ta.length, tb.length);
  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: most });
  const at = Math.min(done, most);
  const collapse = (rows: number[][], upTo: number) => {
    const n = Math.min(upTo, rows.length);
    if (n === 0) return new Array(WIDTH).fill(0);
    if (way === "last") return rows[n - 1];
    const acc = new Array(WIDTH).fill(0);
    for (let i = 0; i < n; i++) for (let d = 0; d < WIDTH; d++) acc[d] += rows[i][d] / n;
    return acc;
  };
  const va = collapse(ha, at);
  const vb = collapse(hb, at);
  const cos = at > 0 ? cosine(va, vb) : 0;
  const trained = store.model.steps >= MODEL_STEPS;
  // the same measure for all three pairs, for the comparison line
  const all = useMemo(
    () => PAIRS.map((p) => {
      const ra = forward(store.model, encode(VOCAB, p.a).slice(0, CONTEXT).map((t) => t.id)).h;
      const rb = forward(store.model, encode(VOCAB, p.b).slice(0, CONTEXT).map((t) => t.id)).h;
      const c = (rows: number[][]) => (way === "last" ? rows[rows.length - 1] : rows[0].map((_, d) => rows.reduce((s, r) => s + r[d], 0) / rows.length));
      return { ...p, cos: cosine(c(ra), c(rb)) };
    }),
    [store.model, store.version, way],
  );

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "One vector for a whole passage"}
        job="Everything since the lookup page has been one vector per position, and yet people say the embedding of a document. That object has to be made on purpose: the per-position vectors collapsed into one. The job is to make it, two ways, for two passages, and to measure what the one vector can and cannot tell apart."
        input={
          <div className="space-y-3">
            <Choices options={PAIRS} value={pair} onPick={(id) => { const p = PAIRS.find((x) => x.id === id)!; setPair(id); setA(p.a); setB(p.b); reset(); }} />
            <label className="block">
              <span className="text-xs text-muted">Passage one</span>
              <input value={a} onChange={(e) => { setA(e.target.value); setPair(""); reset(); }} className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Passage two</span>
              <input value={b} onChange={(e) => { setB(e.target.value); setPair(""); reset(); }} className={FIELD} />
            </label>
            <Choices options={WAYS} value={way} onPick={(id) => { setWay(id); reset(); }} />
            {!trained ? <p className="text-[11px] text-warn">The model is still training ({store.model.steps} of {MODEL_STEPS} steps).</p> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="positions folded in"
            limit={most}
            onToggle={() => {
              if (!runner.running && at >= most) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(most, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            {[{ label: "Passage one", t: ta, h: ha, v: va }, { label: "Passage two", t: tb, h: hb, v: vb }].map((side) => (
              <div key={side.label} className="rounded border border-edge p-3">
                <div className="font-mono text-[11px] text-muted">{side.label}: {side.t.length} positions, {side.t.length} vectors of {WIDTH}</div>
                <div className="mt-2"><TokenRow tokens={side.t} size="sm" dimFrom={at} /></div>
                <div><div className="mt-2 h-[120px]">
                  <Plot
                    className="h-full w-full"
                    box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                    deps={[side.h, side.v, at]}
                    draw={(pen) => {
                      const { ctx, width: W } = pen;
                      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                      const cw = Math.min(14, (W * 0.6 - 30) / WIDTH);
                      const rh = Math.min(9, 100 / Math.max(1, side.h.length));
                      side.h.forEach((row, i) => {
                        for (let d = 0; d < WIDTH; d++) {
                          ctx.fillStyle = signed(row[d], 2);
                          ctx.globalAlpha = i < at ? 1 : 0.2;
                          ctx.fillRect(10 + d * cw, 6 + i * rh, cw - 1, rh - 1);
                          ctx.globalAlpha = 1;
                        }
                      });
                      const x0 = W * 0.65;
                      ctx.fillStyle = MUTED;
                      for (let d = 0; d < WIDTH; d++) {
                        ctx.fillStyle = at > 0 ? signed(side.v[d], 2) : "#1b1f25";
                        ctx.fillRect(x0 + d * Math.min(14, (W - x0 - 20) / WIDTH), 24, Math.min(14, (W - x0 - 20) / WIDTH) - 1, 30);
                      }
                      ctx.fillStyle = INK;
                      ctx.fillText(at > 0 ? side.v.slice(0, 6).map((v) => v.toFixed(2)).join(" ") + " ..." : "", x0, 72);
                    }}
                  />
                </div><Caption>{way === "mean" ? "Collapsed: the average" : "Collapsed: the last row"}</Caption></div>
              </div>
            ))}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at === 0 ? undefined : pair === "opposite" ? false : undefined}>
              {at === 0
                ? `Two passages, ${ta.length} and ${tb.length} tokens, so ${ta.length} and ${tb.length} vectors. Press run to fold them into one vector each and compare.`
                : `After folding in ${at} position${at === 1 ? "" : "s"} the two passage vectors have cosine ${cos.toFixed(3)}.${at >= most ? ` Across the three pairs, ${way === "mean" ? "averaging" : "the last position"} gives: ${all.map((p) => `${p.label} ${p.cos.toFixed(2)}`).join("; ")}. ${all[1].cos > all[2].cos ? "The pair with opposite meaning sits closer than the pair with a different subject: the one vector is a summary of the words used, and a single \"not\" barely moves it." : "On this model the different subject is furthest, and the opposite pair is not far behind the same-meaning pair."}` : ""}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Vectors before collapsing</dt>
              <dd className="text-right text-ink/80">{ta.length} and {tb.length}, Each {WIDTH} wide</dd>
              <dt>Vectors after</dt>
              <dd className="text-right text-ink/80">1 and 1, each {WIDTH} wide</dd>
              <dt>Cosine between them now</dt>
              <dd className="text-right text-ink/80">{at > 0 ? cos.toFixed(4) : "-"}</dd>
              {all.map((p) => (
                <Row key={p.id} label={`${p.label}, fully folded`} value={p.cos.toFixed(3)} />
              ))}
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              A retrieval model makes exactly this vector, but trains for it: pairs that belong
              together are pulled close and pairs that do not are pushed apart, a different loss
              on the same kind of vector. Searching a store of passages is then nearest neighbours
              over these. The weakness shown here survives that training in weaker form: the vector
              is a lossy summary, and passages that share words and structure sit close whatever
              they say. A generative model never makes this vector at all.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="pool" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className="text-right text-ink/80">{value}</dd>
    </>
  );
}

