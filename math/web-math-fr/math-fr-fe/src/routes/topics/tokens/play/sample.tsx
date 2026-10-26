import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, TWO } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { CONTEXT, MODEL_STEPS, VOCAB, text as tokenText, tokenIds, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { decode } from "@/systems/bpe";
import { GREEDY, draw, forward, shape, softmax, type Decoding } from "@/systems/lm";
import { rng } from "@/systems/net";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/sample")({
  loader: () => api.system(TOPIC, "sample"),
  component: SamplePage,
});

const MOST = 30;
type Kept = { label: string; text: string };

function describe(r: Decoding) {
  if (r.temperature <= 0) return L("greedy");
  const parts = [L("temperature {{t}}", { t: r.temperature.toFixed(2) })];
  if (r.topK > 0) parts.push(L("top {{k}}", { k: r.topK }));
  if (r.topP < 1) parts.push(L("nucleus {{p}}", { p: r.topP.toFixed(2) }));
  if (r.penalty > 0) parts.push(L("penalty {{x}}", { x: r.penalty.toFixed(1) }));
  return parts.join(", ");
}

function SamplePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ model: true });
  const [text, setText] = useState("the cat sleeps on the");
  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(0);
  const [topP, setTopP] = useState(1);
  const [penalty, setPenalty] = useState(0);
  const [perFrame, setPerFrame] = useState(0.08);
  const [mine, setMine] = useState<number[]>([]);
  const [greedy, setGreedy] = useState<number[]>([]);
  const [kept, setKept] = useState<Kept[]>([]);

  const prompt = useMemo(() => tokenIds(text).slice(0, CONTEXT), [text]);
  const rule: Decoding = { temperature, topK, topP, penalty };
  const work = useRef({ mine: prompt, greedy: prompt, next: rng(23), rule });
  useEffect(() => {
    work.current.rule = rule;
  });

  const nextToken = (ids: number[], r: Decoding, next: () => number) => {
    const seen = ids.slice(-CONTEXT);
    const logits = forward(store.model, seen).logits[seen.length - 1];
    return draw(shape(logits, r, ids), next);
  };

  const [limit, setLimit] = useState(MOST);
  const runner = useRunner(
    () => {
      const w = work.current;
      w.mine = [...w.mine, nextToken(w.mine, w.rule, w.next)];
      w.greedy = [...w.greedy, nextToken(w.greedy, GREEDY, w.next)];
      setMine(w.mine);
      setGreedy(w.greedy);
    },
    { perFrame, stopAt: limit },
  );

  const reset = (keep = true) => {
    runner.reset();
    if (keep && mine.length > prompt.length) {
      setKept((k) => [{ label: describe(work.current.rule), text: decode(VOCAB, mine) }, ...k].slice(0, 5));
    }
    work.current.mine = prompt;
    work.current.greedy = prompt;
    work.current.next = rng(23);
    setMine([]);
    setGreedy([]);
  };

  // the distribution at the current last position, raw and shaped
  const ids = mine.length ? mine : prompt;
  const seen = useMemo(() => ids.slice(-CONTEXT), [ids]);
  const logits = useMemo(() => forward(store.model, seen).logits[seen.length - 1], [store.model, seen]);
  const raw = softmax(logits);
  const shaped = shape(logits, rule, ids);
  const order = raw.map((_, i) => i).sort((a, b) => raw[b] - raw[a]).slice(0, 14);
  const live = shaped.filter((v) => v > 0).length;
  const trained = store.model.steps >= MODEL_STEPS;
  const made = Math.max(0, mine.length - prompt.length);

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Choosing from the distribution")}
        job={L("The loop says choose one token, and every page so far has left the choice open. Always taking the most likely one is a choice; drawing at random from the distribution is another; and the distribution itself can be reshaped before the draw. The job is to run the same model on the same prompt under different rules and read what changes.")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The prompt")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); reset(false); }} className="mt-1" />
            </label>
            <Slider label={L("Temperature")} min={0} max={2.5} step={0.05} value={temperature} format={(v) => (v === 0 ? L("0: greedy") : v.toFixed(2))} onChange={(v) => { setTemperature(v); if (mine.length) reset(); }} />
            <Slider label={L("Top k")} min={0} max={20} step={1} value={topK} format={(v) => (v === 0 ? L("off") : L("keep {{n}}", { n: Math.round(v) }))} onChange={(v) => { setTopK(Math.round(v)); if (mine.length) reset(); }} />
            <Slider label={L("Nucleus")} min={0.1} max={1} step={0.05} value={topP} format={(v) => (v >= 1 ? L("off") : L("mass {{m}}", { m: v.toFixed(2) }))} onChange={(v) => { setTopP(v); if (mine.length) reset(); }} />
            <Slider label={L("Repeat penalty")} min={0} max={4} step={0.1} value={penalty} format={(v) => (v === 0 ? L("off") : v.toFixed(1))} onChange={(v) => { setPenalty(v); if (mine.length) reset(); }} />
            <Text kind="note" as="p">
              {L("Temperature divides the scores before the softmax: below one sharpens, above one flattens. Top k keeps the k most likely; nucleus keeps the fewest whose mass reaches the threshold; the penalty lowers the score of tokens already written. Changing a rule mid-run keeps the run's text below and starts a new one.")}
            </Text>
            {!trained ? <Text kind="warning" as="p">{L("The model is still training ({{done}} of {{total}} steps).", { done: store.model.steps, total: MODEL_STEPS })}</Text> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={made}
            what={L("tokens, both rules")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 10, max: 200, step: 10 }}
            onToggle={() => {
              if (!runner.running && made >= limit) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={() => reset()}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div data-slot="plot" className="h-[300px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[raw, shaped, order]}
                draw={(pen) => {
                  const { ctx, width: W } = pen;
                  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textAlign = "left";
                  ctx.fillStyle = MUTED;
                  const top = Math.max(raw[order[0]], shaped[order[0]]) || 1;
                  order.forEach((id, i) => {
                    const y = 28 + i * 19;
                    ctx.fillStyle = INK;
                    ctx.fillText(visible(tokenText(id)).slice(0, 10), 10, y + 11);
                    ctx.fillStyle = "#3a4550";
                    ctx.fillRect(110, y, ((W - 240) * raw[id]) / top, 6);
                    ctx.fillStyle = shaped[id] > 0 ? ONE : TWO;
                    ctx.fillRect(110, y + 7, ((W - 240) * (shaped[id] > 0 ? shaped[id] : raw[id])) / top, 6);
                    ctx.fillStyle = MUTED;
                    ctx.fillText(`${(raw[id] * 100).toFixed(1)} % → ${(shaped[id] * 100).toFixed(1)} %`, 116 + ((W - 240) * Math.max(raw[id], shaped[id])) / top, y + 11);
                  });
                }}
              />
            </div><Caption>{L("The next-token distribution now. Dim: as the model gave it.  Green: after the rule.  Rose: cut away by the rule.")}</Caption></div>
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded border border-border p-3">
                <div data-text="caption" style={{ color: "var(--c-selected)" }}>{L("The rule: {{rule}}", { rule: describe(rule) })}</div>
                <Text kind="caption" as="p" className="mt-2">{decode(VOCAB, mine.length ? mine : prompt)}</Text>
              </div>
              <div className="rounded border border-border p-3">
                <div data-text="caption" style={{ color: "var(--c-secondary)" }}>{L("Greedy, for comparison")}</div>
                <Text kind="caption" as="p" className="mt-2">{decode(VOCAB, greedy.length ? greedy : prompt)}</Text>
              </div>
            </div>
            {kept.length ? (
              <div className="rounded border border-border p-3">
                <div data-text="caption">{L("Earlier runs, same model, same prompt")}</div>
                <ul className="mt-2 space-y-1.5">
                  {kept.map((k, i) => (
                    <li key={i} data-text="caption">
                      <span className="text-muted-foreground">{k.label}: </span>
                      <span className="text-foreground/75">{k.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {made === 0
                ? L(live === 1 ? "Under {{rule}} the next token is drawn from {{live}} candidate of {{n}}; the model itself gave {{big}} of them more than one per cent. Press run to generate under the rule and under greedy side by side." : "Under {{rule}} the next token is drawn from {{live}} candidates of {{n}}; the model itself gave {{big}} of them more than one per cent. Press run to generate under the rule and under greedy side by side.", { rule: describe(rule), live, n: VOCAB.bytes.length, big: raw.filter((v) => v > 0.01).length })
                : `${L(live === 1 ? "{{made}} tokens under each rule. Greedy is the same every time and {{greedy}}; the rule draws from {{live}} candidate at this step" : "{{made}} tokens under each rule. Greedy is the same every time and {{greedy}}; the rule draws from {{live}} candidates at this step", { made, greedy: greedy.length > prompt.length + 12 && decode(VOCAB, greedy).split(". ").length < 3 ? L("has settled into a loop") : L("repeats whatever the text repeats"), live })}${temperature > 1.3 ? ` ${L("and at this temperature it wanders, because unlikely tokens are given a real chance")}` : temperature > 0 && temperature < 0.5 ? ` ${L("and at this temperature it is nearly greedy")}` : ""}. ${L("The model did not change between the two columns; only the choosing did.")}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Candidates left after the rule")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} of {{b}}", { a: live, b: VOCAB.bytes.length })}</dd>
              <dt>{L("Most likely token, raw and after the rule")}</dt>
              <dd className="text-right text-foreground/80">{visible(tokenText(order[0]))}: {(raw[order[0]] * 100).toFixed(1)} % → {(shaped[order[0]] * 100).toFixed(1)} %</dd>
              <dt>{L("The two limits of temperature")}</dt>
              <dd className="text-right text-foreground/80">{L("0 is greedy; very large is every token alike")}</dd>
              <dt>{L("Runs kept below")}</dt>
              <dd className="text-right text-foreground/80">{kept.length}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("Beam search is the other shape: keep several partial texts and score whole continuations. It suits translation, where there is a right answer to find, and not open writing, where it finds the blandest one. The decoding rule is a second system sitting on top of the model, and its settings change the text as much as a change of model would.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="sample" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

