import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow } from "@/components/Tokens";
import { visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { IDS, MODEL_STEPS, VOCAB, WIDTH, resetModel, stepModel, text as tokenText, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { CORPUS, encode } from "@/systems/bpe";
import { dot, forward, perplexity } from "@/systems/lm";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/predict")({
  loader: () => api.system(TOPIC, "predict"),
  component: PredictPage,
});

const PROMPTS = [
  { id: "a", label: "The cat sleeps on the", text: "the cat sleeps on the" },
  { id: "b", label: "The dog runs to the", text: "the dog runs to the" },
  { id: "c", label: "In the morning the", text: "in the morning the" },
  { id: "d", label: "The man walks in the", text: "the man walks in the" },
];
const CHUNK = 25;

/** what actually followed this prompt in the text, if it occurs there. */
function followedBy(ids: number[]): number | null {
  outer: for (let i = 0; i + ids.length < IDS.length; i++) {
    for (let k = 0; k < ids.length; k++) if (IDS[i + k] !== ids[k]) continue outer;
    return IDS[i + ids.length];
  }
  return null;
}

function PredictPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny();
  const [pick, setPick] = useState("a");
  const [text, setText] = useState(PROMPTS[0].text);
  const [perFrame, setPerFrame] = useState(1);
  const [, bump] = useState(0);

  const [limit, setLimit] = useState(MODEL_STEPS);
  const runner = useRunner(
    () => {
      stepModel(CHUNK);
      bump((v) => v + 1);
    },
    { perFrame, stopAt: limit / CHUNK },
  );
  const model = store.model;
  const steps = model.steps;
  const tokens = useMemo(() => encode(VOCAB, text).slice(0, 12), [text]);
  const ids = useMemo(() => tokens.map((t) => t.id), [tokens]);
  const pass = useMemo(() => forward(model, ids), [model, ids]);
  const last = ids.length - 1;
  const probs = pass.probs[last];
  const logits = pass.logits[last];
  const ranked = useMemo(() => probs.map((p, i) => ({ id: i, p, z: logits[i] })).sort((a, b) => b.p - a.p), [probs, logits]);
  const shown = ranked.slice(0, 12);
  const truth = followedBy(ids);
  const truthRank = truth === null ? -1 : ranked.findIndex((r) => r.id === truth);
  const lossHere = truth === null ? null : -Math.log(probs[truth] + 1e-12);
  const inTop = shown.slice(0, 3).reduce((s, r) => s + r.p, 0);
  const histBox = useMemo<Box>(() => ({ x0: 0, x1: Math.max(200, steps), y0: 0, y1: Math.max(0.5, ...store.history.map((p) => p[1])) * 1.1 }), [steps, store.history]);

  const reset = () => {
    runner.reset();
    resetModel();
    bump((v) => v + 1);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("The next token")}
        job={L("The stream turns one vector per position into another vector per position. The only thing left is to turn the last of them into a statement about what comes next: one score per vocabulary entry, softmaxed into a distribution, read as a ranked list. The job is to watch that list sharpen as the model trains, and to score it against what the text actually said.")}
        input={
          <div className="space-y-3">
            <Choices options={PROMPTS} value={pick} onPick={(id) => { setPick(id); setText(PROMPTS.find((p) => p.id === id)!.text); }} />
            <label className="block">
              <span data-text="note">{L("Or type a prompt")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); setPick(""); }} className="mt-1" />
            </label>
            <Text kind="note" as="p">
              {L("Run trains the shared model by predicting the next token at every position of the text from the vocabulary page. The same trained model is used on the pages after this one, and starting again resets it everywhere.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={steps}
            what={L("training steps")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 250, max: 6000, step: 250 }}
            onToggle={() => {
              if (!runner.running && steps >= limit) reset();
              runner.toggle();
            }}
            onStep={(many) => {
              stepModel(CHUNK * many);
              bump((v) => v + 1);
            }}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="rounded border border-border p-2">
              <TokenRow tokens={tokens} size="sm" mark={last} />
            </div>
            <div><div data-slot="plot" className="h-[330px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[shown, truth]}
                draw={(pen) => {
                  const { ctx, width: W } = pen;
                  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textAlign = "left";
                  ctx.fillStyle = MUTED;
                  const top = shown[0]?.p ?? 1;
                  shown.forEach((r, i) => {
                    const y = 30 + i * 24;
                    const isTruth = r.id === truth;
                    ctx.fillStyle = isTruth ? ONE : INK;
                    ctx.fillText(visible(tokenText(r.id)).slice(0, 12), 10, y + 13);
                    ctx.fillStyle = isTruth ? ONE : SKY;
                    ctx.globalAlpha = isTruth ? 1 : 0.7;
                    ctx.fillRect(120, y, ((W - 260) * r.p) / top, 16);
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = MUTED;
                    ctx.fillText(L("{{pct}} %   score {{z}}", { pct: (r.p * 100).toFixed(1), z: r.z.toFixed(2) }), 126 + ((W - 260) * r.p) / top, y + 13);
                  });
                }}
              />
            </div><Caption>{L("The twelve most likely next tokens, of {{n}}. Green: the one the text actually had.", { n: VOCAB.bytes.length })}</Caption></div>
            <div><div data-slot="plot" className="h-[120px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={histBox}
                deps={[store.history, histBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(store.history, ONE, 1.8);
                }}
              />
            </div><Caption>{L("How wrong about the next token, averaged over the text, against training steps")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={steps === 0 ? undefined : truthRank === 0 ? true : truthRank > 0 && truthRank < 3 ? undefined : steps > 500 ? false : undefined}>
              {steps === 0
                ? L("Untrained: every one of the {{n}} tokens is about equally likely, so the top one has {{pct}} % and the perplexity is {{perplexity}}: as good as guessing among {{n}}. Press run.", { n: VOCAB.bytes.length, pct: (shown[0].p * 100).toFixed(1), perplexity: perplexity(model.loss || Math.log(VOCAB.bytes.length)).toFixed(0) })
                : `${L("After {{steps}} steps the model gives {{a}} {{pa}} %, then {{b}} {{pb}} % and {{c}} {{pc}} %; the top three hold {{top}} % and the other {{rest}} tokens share the rest.", { steps, a: visible(tokenText(shown[0].id)), pa: (shown[0].p * 100).toFixed(0), b: visible(tokenText(shown[1].id)), pb: (shown[1].p * 100).toFixed(0), c: visible(tokenText(shown[2].id)), pc: (shown[2].p * 100).toFixed(0), top: (inTop * 100).toFixed(0), rest: VOCAB.bytes.length - 3 })} ${truth === null ? L("This prompt is not in the text, so there is no right answer to score against.") : L(truthRank === 0 ? "In the text this prompt was followed by {{token}}, which the model ranks {{rank}}St: its loss on this one prediction is {{loss}}." : truthRank === 1 ? "In the text this prompt was followed by {{token}}, which the model ranks {{rank}}Nd: its loss on this one prediction is {{loss}}." : truthRank === 2 ? "In the text this prompt was followed by {{token}}, which the model ranks {{rank}}Rd: its loss on this one prediction is {{loss}}." : "In the text this prompt was followed by {{token}}, which the model ranks {{rank}}Th: its loss on this one prediction is {{loss}}.", { token: visible(tokenText(truth)), rank: truthRank + 1, loss: lossHere!.toFixed(2) })}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Output width, one score a vocabulary entry")}</dt>
              <dd className="text-right text-foreground/80">{VOCAB.bytes.length}</dd>
              <dt>{L("The score for {{token}}: Last vector dotted with its own table row", { token: visible(tokenText(shown[0].id)) })}</dt>
              <dd className="text-right text-foreground/80">{dot(pass.h[last], model.E[shown[0].id]).toFixed(3)} = {shown[0].z.toFixed(3)}</dd>
              <dt>{L("Numbers saved by tying the output to the table")}</dt>
              <dd className="text-right text-foreground/80">{(VOCAB.bytes.length * WIDTH).toLocaleString("en")}</dd>
              <dt>{L("Average loss over the text, smoothed")}</dt>
              <dd className="text-right text-foreground/80">{model.loss.toFixed(3)}</dd>
              <dt>{L("Perplexity: as if choosing among this many")}</dt>
              <dd className="text-right text-foreground/80">{perplexity(model.loss || Math.log(VOCAB.bytes.length)).toFixed(1)}</dd>
              <dt>{L("Text the model is trained on")}</dt>
              <dd className="text-right text-foreground/80">{L("{{tokens}} tokens, {{words}} words", { tokens: IDS.length, words: CORPUS.split(/\s+/).length })}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The training loss is the cross entropy from topic 3, against the token that actually followed, at every position of the text at once. The output layer is the table again, transposed: a score is how well the running vector lines up with a token's own row, which closes the loop back to the lookup page. The model knows this one text and nothing else, and that is exactly what the pages after this one show.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="predict" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

