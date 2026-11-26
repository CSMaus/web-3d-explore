import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow } from "@/components/Tokens";
import { visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, TWO, mix } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { MODEL_STEPS, VOCAB, WIDTH, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { forward, paramCount } from "@/systems/lm";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/attend")({
  loader: () => api.system(TOPIC, "attend"),
  component: AttendPage,
});

const STAGES = [
  L("The input: each token's list of 16 numbers, with its position added."),
  L("Three new lists from each row, made with three tables of learned weights: a query (what the token looks for), a key (what it offers) and a value (what it passes on)."),
  L("Scores: each query is multiplied with each key, number by number, the products are summed, and the sum is divided by 4, the square root of 16."),
  L("The mask: every score of a token for a later token is set to minus infinity, so that it will count for nothing."),
  L("Softmax along each row: each score s becomes e to the power s (e is about 2.718), and each result is divided by the row's total. The results are weights: positive, and adding up to 100 %."),
  L("The values are averaged with these weights, and the result is added to the input."),
];
const MASKS = [
  { id: "causal", label: L("Each token sees only earlier tokens") },
  { id: "both", label: L("Each token sees all tokens") },
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
  const ids = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const n = ids.length;
  const runner = useRunner((k) => setDone(k), { perFrame, stopAt: STAGES.length });
  const at = Math.min(done, STAGES.length);
  const pass = useMemo(() => forward(store.model, ids, mask === "causal"), [store.model, ids, mask]);
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
    <>
      <TaskPage
        title={system?.name ?? L("Attention: which earlier words count")}
        job={L("When a model reads \"the cat sleeps on the warm\", how does the last word take in the words before it? A model works on tokens: pieces of text such as words. Each token is held as a list of 16 numbers, called a vector. Attention gives each token a new list: a weighted average of the lists of the tokens before it and of its own, with larger weights for the ones that matter more. The rest is how those weights are found. This page computes them for a real sentence, with a small model trained in the browser on a short text about a cat, a dog and a man. Run goes through the computation in six stages. The question: which earlier word does the last word take in most?")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The sentence (up to 12 tokens are read)")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className="mt-1" />
            </label>
            <Choices options={MASKS} value={mask} onPick={(id) => { setMask(id); reset(); }} />
            <Slider label={L("A longer text of")} min={10} max={8000} step={10} value={length} format={(v) => L("{{n}} tokens", { n: Math.round(v) })} onChange={(v) => setLength(Math.round(v))} />
            <Text kind="note" as="p">
              {L("This slider does not change the picture. It only sets the length used in a cost count under the results. The table of scores has one entry for each pair of tokens, so its size is the length times itself.")}
            </Text>
            {!trained ? <Text kind="warning" as="p">{L("The model is still learning in the background ({{done}} of {{total}} training steps). The weights below change a little until it finishes.", { done: store.model.steps, total: MODEL_STEPS })}</Text> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("stages")}
            limit={STAGES.length}
            onToggle={() => {
              if (!runner.running && at >= STAGES.length) reset();
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
            <div className="rounded border border-border p-2">
              <TokenRow tokens={tokens} ids size="sm" mark={at >= 5 ? last : null} />
            </div>
            <div><div data-slot="plot" className="h-[470px] overflow-hidden">
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
                  grid(pass.x, 60, 26, cw, rh, 1.5, L("Input x: one row per token"), at >= 1, true);
                  grid(pass.q, col + 40, 26, cw, rh, 1.5, L("Queries  q = x Wq"), at >= 2);
                  grid(pass.k, col * 2 + 40, 26, cw, rh, 1.5, L("Keys  k = x Wk"), at >= 2);
                  grid(pass.v, col * 3 + 40, 26, cw, rh, 1.5, L("Values  v = x Wv"), at >= 2);
                  // row 2: scores or weights, n by n
                  const y2 = 26 + n * rh + 40;
                  const sc = Math.min(30, (pen.height - y2 - 70) / n, (W * 0.45 - 60) / n);
                  const scoresShown = at >= 4 ? pass.scores : pass.scores.map((r, i) => r.map((v, j) => (mask === "causal" && j > i ? (at >= 4 ? -Infinity : pass.q[i].reduce((s, qq, d) => s + qq * pass.k[j][d], 0) / Math.sqrt(WIDTH)) : v)));
                  if (at >= 5) grid(pass.weights, 60, y2, sc, sc, 1, L("Weights: softmax of each row"), true, true);
                  else grid(scoresShown, 60, y2, sc, sc, 3, at >= 4 ? L("Scores, masked: no token sees a later one") : L("Scores  q_i . k_j / 4"), at >= 3, true);
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
                  grid(pass.mixed, rx, y2, cw2, rh, 1.5, L("The mix: weights x values"), at >= 6);
                  grid(pass.h, rx + WIDTH * cw2 + 40, y2, cw2, rh, 1.5, L("Output: x + mix"), at >= 6);
                  ctx.fillStyle = at > 0 ? INK : MUTED;
                }}
              />
            </div><Caption>{L("Each grid is a table of numbers, one cell per number; the two colours mark positive and negative. Top: the input and its three new lists, one row per token. Bottom left: the scores, later the weights, with one row and one column per token; the percentages under it are the last token's weights. Bottom right: the mix and the output.")} {at === 0 ? L("Stage 0 of 6: nothing is computed yet.") : L("Stage {{at}} of 6: {{stage}}", { at, stage: STAGES[at - 1] })}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? L("The sentence has {{n}} tokens. The last one, {{token}}, will get a new list of numbers made from all {{n}}. Run computes it in six stages.", { n, token: visible(tokens[last].text) })
                : at < 5
                  ? STAGES[at - 1] + (at === 3 ? ` ${L("There are {{n}} by {{n}} = {{nn}} scores, one for each pair of tokens.", { n, nn: n * n })}` : at === 4 ? (mask === "causal" ? ` ${L("{{gone}} of the {{nn}} scores are removed: those where a token would look at a later one.", { gone: (n * (n - 1)) / 2, nn: n * n })}` : ` ${L("The mask is off, so every token sees every other, later ones included. A model that writes text one token at a time cannot do this, because the later tokens do not exist yet.")}`) : "")
                  : `${L("{{token}} gives {{pct}} % of its attention to {{other}} at position {{pos}}", { token: visible(tokens[last].text), pct: (row[top] * 100).toFixed(0), other: visible(tokens[top].text), pos: top + 1 })}${row.filter((v) => v > 0.1).length > 1 ? ` ${L("and {{list}}", { list: row.map((v, j) => [v, j] as [number, number]).filter(([v, j]) => v > 0.1 && j !== top).map(([v, j]) => L("{{pct}} % to {{token}}", { pct: (v * 100).toFixed(0), token: visible(tokens[j].text) })).join(", ") })}` : ""}. ${at === 6 ? L("Its new list is the values averaged with these weights, added to the list it had. This is the only way earlier tokens affect later ones, and it is done again at every position.") : L("The weights in the row add up to 100 %.")}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Tokens in the sentence, so rows in each grid")}</dt>
              <dd className="text-right text-foreground/80">{n}</dd>
              <dt>{L("Scores for this sentence")}</dt>
              <dd className="text-right text-foreground/80">{n} x {n} = {n * n}</dd>
              <dt>{L("Scores for a text of {{n}} tokens", { n: length.toLocaleString("en") })}</dt>
              <dd className="text-right text-foreground/80">{(length * length).toLocaleString("en")}</dd>
              <dt>{L("Sum of the last token's weights")}</dt>
              <dd className="text-right text-foreground/80">{row.reduce((a, b) => a + b, 0).toFixed(6)}</dd>
              <dt>{L("Numbers in the three tables of weights (query, key, value)")}</dt>
              <dd className="text-right text-foreground/80">3 x {WIDTH} x {WIDTH} = {count.attention}</dd>
              <dt>{L("Numbers the model learned, in total")}</dt>
              <dd className="text-right text-foreground/80">{count.total.toLocaleString("en")} {L("(token table {{table}}, position lists {{positions}}, attention {{attention}})", { table: count.table.toLocaleString("en"), positions: count.positions, attention: count.attention })}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("Large models run many such attention units side by side, each on part of the numbers, follow them with a small network, and stack dozens of these layers. This model has one attention unit and one layer. The division by the square root of the list length keeps the scores from growing when lists get longer. Very large scores would give one weight close to 100 % and all the others close to 0. The mask matters for training: the model learns from whole texts at once, yet each guess may use only earlier tokens, exactly as when it writes text one token at a time.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="attend" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

