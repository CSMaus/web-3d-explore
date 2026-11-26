import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
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
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/pool")({
  loader: () => api.system(TOPIC, "pool"),
  component: PoolPage,
});

const WAYS = [
  { id: "mean", label: L("Average of all positions") },
  { id: "last", label: L("Last position only") },
];
const PAIRS = [
  { id: "same", label: L("Same meaning, other words"), a: "the cat sleeps on the warm mat", b: "the cat is asleep on the mat" },
  { id: "opposite", label: L("Opposite meaning, same words"), a: "the cat likes the warm mat", b: "the cat does not like the warm mat" },
  { id: "far", label: L("Different subject"), a: "the cat sleeps on the warm mat", b: "the man walks to the river with the dog" },
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
  const ha = useMemo(() => forward(store.model, ta.map((t) => t.id)).h, [store.model, ta]);
  const hb = useMemo(() => forward(store.model, tb.map((t) => t.id)).h, [store.model, tb]);
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
    [store.model, way],
  );

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("One list of numbers for a whole passage")}
        job={L("Can a whole passage be summed up by one list of numbers? A model cuts text into tokens, pieces such as words, and keeps one list of 16 numbers, called a vector, for each position. For tasks such as search, one list per passage is wanted instead. So the lists are collapsed into one: by averaging them, or by keeping only the last. Two passages are then compared by the cosine of the angle between their lists, seen as arrows: 1 means the same direction, 0 unrelated, a negative value opposite. The model is small and trained in the browser on a short text about a cat, a dog and a man. The question: do two passages with opposite meanings get lists that are far apart?")}
        input={
          <div className="space-y-3">
            <Choices options={PAIRS} value={pair} onPick={(id) => { const p = PAIRS.find((x) => x.id === id)!; setPair(id); setA(p.a); setB(p.b); reset(); }} />
            <label className="block">
              <span data-text="note">{L("Passage one")}</span>
              <Input value={a} onChange={(e) => { setA(e.target.value); setPair(""); reset(); }} className="mt-1" />
            </label>
            <label className="block">
              <span data-text="note">{L("Passage two")}</span>
              <Input value={b} onChange={(e) => { setB(e.target.value); setPair(""); reset(); }} className="mt-1" />
            </label>
            <Choices options={WAYS} value={way} onPick={(id) => { setWay(id); reset(); }} />
            {!trained ? <Text kind="warning" as="p">{L("The model is still training ({{done}} of {{total}} steps).", { done: store.model.steps, total: MODEL_STEPS })}</Text> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("positions added in")}
            limit={most}
            onToggle={() => {
              if (!runner.running && at >= most) reset();
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
          <section ref={stage} className="space-y-2">
            {[{ label: L("Passage one"), t: ta, h: ha, v: va }, { label: L("Passage two"), t: tb, h: hb, v: vb }].map((side) => (
              <div key={side.label} className="rounded border border-border p-3">
                <div data-text="caption">{side.label}: {L("{{n}} tokens, so {{n}} lists of {{width}} numbers", { n: side.t.length, width: WIDTH })}</div>
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
                </div><Caption>{way === "mean" ? L("Left: one row per token, one cell per number; the two colours mark positive and negative. Right: the single list made so far, the average of the rows added in, with its first six numbers.") : L("Left: one row per token, one cell per number; the two colours mark positive and negative. Right: the single list made so far, the last row added in, with its first six numbers.")}</Caption></div>
              </div>
            ))}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at === 0 ? undefined : pair === "opposite" ? false : undefined}>
              {at === 0
                ? L("The two passages have {{a}} and {{b}} tokens, so {{a}} and {{b}} lists of numbers. Run collapses each passage into one list and compares the two.", { a: ta.length, b: tb.length })
                : `${L(at === 1 ? "After {{n}} position, the cosine between the two passage lists is {{cos}}." : "After {{n}} positions, the cosine between the two passage lists is {{cos}}.", { n: at, cos: cos.toFixed(3) })}${at >= most ? ` ${L("Across the three pairs, {{how}} gives: {{list}}.", { how: way === "mean" ? L("averaging") : L("taking the last position"), list: all.map((p) => `${p.label} ${p.cos.toFixed(2)}`).join("; ") })} ${all[1].cos > all[2].cos ? L("The pair with opposite meanings is closer than the pair about different things. One list sums up which words were used, and a single \"not\" hardly changes it.") : L("With this model the pair about different things is furthest apart, and the pair with opposite meanings is nearly as close as the pair with the same meaning.")}` : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Lists before collapsing")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} and {{b}}, each of {{width}} numbers", { a: ta.length, b: tb.length, width: WIDTH })}</dd>
              <dt>{L("Lists after")}</dt>
              <dd className="text-right text-foreground/80">{L("1 and 1, each of {{width}} numbers", { width: WIDTH })}</dd>
              <dt>{L("Cosine between the two lists now")}</dt>
              <dd className="text-right text-foreground/80">{at > 0 ? cos.toFixed(4) : "-"}</dd>
              {all.map((p) => (
                <Row key={p.id} label={L("{{pair}}: cosine with all positions in", { pair: p.label })} value={p.cos.toFixed(3)} />
              ))}
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("Search systems that find passages by meaning build this kind of single list too, but they are trained for it. Pairs of passages that belong together are pulled close, and other pairs are pushed apart. A search then returns the passages whose lists are nearest to the list of the query. The weakness shown here survives that training in a milder form: one list loses detail, and passages that share words and structure stay close whatever they say. A model that writes text never builds this single list at all.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="pool" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd className="text-right text-foreground/80">{value}</dd>
    </>
  );
}

