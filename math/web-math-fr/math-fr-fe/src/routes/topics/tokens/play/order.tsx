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
import { TokenRow } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, TWO, mix } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { VOCAB, WIDTH, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode, type Token } from "@/systems/bpe";
import { forward, sinusoid, type Model } from "@/systems/lm";
import { rng } from "@/systems/net";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/order")({
  loader: () => api.system(TOPIC, "order"),
  component: OrderPage,
});

const SCHEMES = [
  { id: "none", label: L("No position added") },
  { id: "learned", label: L("A learned list per position") },
  { id: "sinus", label: L("Sines and cosines") },
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
  }, [scheme, P, store.model]);
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
    <>
      <TaskPage
        title={system?.name ?? L("Word order has to be added")}
        job={L("Does a model notice word order? \"The dog watches the cat\" and \"the cat watches the dog\" use the same words but mean different things. A model first cuts a sentence into tokens: pieces of text such as words. Each token is replaced by a list of 16 numbers, called a vector. Then the lists are mixed: each position takes an average of all the lists, giving some more weight than others. This page mixes a sentence and the same words in a shuffled order, then averages the result of each. With nothing added, the two averages come out equal, so the order is lost. The choice below adds a position to every list before the mixing. The question: which choice lets the two sentences come out different?")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The sentence")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className="mt-1" />
            </label>
            <Button variant="outline" size="sm" type="button" onClick={() => { setSeed((s) => s + 1); reset(); }}>{L("Shuffle again")}</Button>
            <Choices options={SCHEMES} value={scheme} onPick={(id) => { setScheme(id); reset(); }} />
            <Text kind="note" as="p">
              {scheme === "none"
                ? L("Each token gets only its own list of numbers, taken from a table with one row per token. The token \"the\" gets the same list at position 1 and at position 5.")
                : scheme === "learned"
                  ? L("A second list of numbers is added for each position: one for position 1, one for position 2, and so on. The model learned these lists during training. There is one for each position the model can read at once, and none beyond.")
                  : L("A fixed list is added for each position, made of sine and cosine waves of many speeds. Nothing is learned, and every position, however far along, has its own list.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("positions added in")}
            limit={n}
            onToggle={() => {
              if (!runner.running && at >= n) reset();
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
            <div className="grid gap-2 lg:grid-cols-2">
              {[{ label: L("The sentence"), list: tokens, rows: streamA, sum: sumA }, { label: L("The same words, shuffled"), list: mixed, rows: streamB, sum: sumB }].map((side) => (
                <div key={side.label} className="space-y-2">
                  <div className="rounded border border-border p-2">
                    <div data-text="caption">{side.label}</div>
                    <div className="mt-1"><TokenRow tokens={side.list} size="sm" dimFrom={at} /></div>
                  </div>
                  <div><div data-slot="plot" className="h-[260px] overflow-hidden">
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
                        ctx.fillText(L("Average of the rows above:"), 8, y);
                        for (let d = 0; d < WIDTH; d++) {
                          ctx.fillStyle = signed(side.sum[d], 1.2);
                          ctx.fillRect(24 + d * cw, y + 6, cw - 1, 18);
                        }
                        ctx.fillStyle = INK;
                        ctx.fillText(side.sum.slice(0, 5).map((v) => v.toFixed(2)).join("  ") + " ...", 8, y + 40);
                      }}
                    />
                  </div><Caption>{scheme === "none" ? L("After mixing: one row per position, {{width}} numbers each. Each cell is one number: the two colours mark positive and negative, and a stronger colour means a larger number. Faded rows are not added in yet. The strip at the bottom is the average of the rows added in so far, with its first five numbers printed under it.", { width: WIDTH }) : L("After mixing: one row per position, {{width}} numbers each, with the position lists added before the mixing. Each cell is one number: the two colours mark positive and negative, and a stronger colour means a larger number. Faded rows are not added in yet. The strip at the bottom is the average of the rows added in so far, with its first five numbers printed under it.", { width: WIDTH })}</Caption></div>
                </div>
              ))}
            </div>
            {scheme === "sinus" ? (
              <div><div data-slot="plot" className="h-[110px] overflow-hidden">
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
              </div><Caption>{L("The position lists for positions 1 to 24, one thin row each, from top to bottom. The left columns change slowly from row to row, the right columns quickly. Every position gets a different pattern. Moving the same number of positions along changes the pattern in the same way, from any starting position.")}</Caption></div>
            ) : null}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at === 0 ? undefined : scheme === "none" ? false : !same}>
              {at === 0
                ? L("Nothing is mixed yet. Run mixes both sentences, then adds in their rows one position at a time and keeps an average for each side.")
                : !isShuffled
                  ? L("The shuffle left the words in their original order. \"Shuffle again\" tries another order.")
                  : at < n
                    ? L("After {{at}} of {{n}} positions the two averages differ by {{gap}}. The two sides have not yet added in the same tokens, so this difference means nothing yet. The comparison counts once all {{n}} positions are in.", { at, n, gap: gap.toFixed(3) })
                    : same
                      ? L("After {{at}} positions the two averages are equal: they differ by {{gap}}, which is rounding error. Both sides had the same rows, only in another order. The mixing treats every position alike, so it gave back the same mixed rows in that other order. An average does not depend on order. So nothing built this way can tell a sentence from its shuffle.", { at, gap: gap.toExponential(1) })
                      : L("After {{at}} positions the two averages differ by {{gap}}. The token rows were the same on both sides, but each row now carried its position. So the mixing weights came out different, and the order left a trace. This is the only job of a position list.", { at, gap: gap.toFixed(3) })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Tokens in the sentence")}</dt>
              <dd className="text-right text-foreground/80">{n}</dd>
              <dt>{L("Numbers in each list, the same at every stage of the model")}</dt>
              <dd className="text-right text-foreground/80">{WIDTH}</dd>
              <dt>{L("Difference between the two averages")}</dt>
              <dd className="text-right text-foreground/80">{gap.toExponential(2)}</dd>
              <dt>{L("Position lists this choice provides")}</dt>
              <dd className="text-right text-foreground/80">{scheme === "none" ? L("None") : scheme === "learned" ? L("{{n}}, one per position the model can read", { n: P.length }) : L("One for every position")}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The learned lists have a limit: a position past the last learned list gets nothing. The sine lists have no limit. Large current models use a third way: inside the mixing they turn the numbers by an angle that grows with the position, so that what counts is the distance between two positions. Here every position may look at every other, later ones included. Real text models let a position look only at earlier positions, and that rule alone would already reveal some of the order. It is switched off here to show the problem plainly. A page of the same topic, \"Attention: which earlier words count\", shows how the mixing weights are computed.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`order-${scheme}`} />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

