import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { IDS, MODEL_STEPS, VOCAB, WIDTH, resetModel, stepModel, text as tokenText, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { CORPUS, encode } from "@/systems/bpe";
import { dot, forward, perplexity } from "@/systems/lm";
import { FIELD, TokenFrame } from "./-shared";

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
  const ids = tokens.map((t) => t.id);
  const key = ids.join(",");
  const pass = useMemo(() => forward(model, ids), [model, store.version, key]);
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
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "The next token"}
        job="The stream turns one vector per position into another vector per position. The only thing left is to turn the last of them into a statement about what comes next: one score per vocabulary entry, softmaxed into a distribution, read as a ranked list. The job is to watch that list sharpen as the model trains, and to score it against what the text actually said."
        input={
          <div className="space-y-3">
            <Choices options={PROMPTS} value={pick} onPick={(id) => { setPick(id); setText(PROMPTS.find((p) => p.id === id)!.text); }} />
            <label className="block">
              <span className="text-xs text-muted">Or type a prompt</span>
              <input value={text} onChange={(e) => { setText(e.target.value); setPick(""); }} className={FIELD} />
            </label>
            <p className="text-[11px] text-muted">
              Run trains the shared model by predicting the next token at every position of the
              text from the vocabulary page. The same trained model is used on the pages after this
              one, and starting again resets it everywhere.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={steps}
            what="training steps"
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
            <div className="rounded border border-edge p-2">
              <TokenRow tokens={tokens} size="sm" mark={last} />
            </div>
            <div><div className="h-[330px] overflow-hidden rounded border border-edge">
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
                    ctx.fillText(`${(r.p * 100).toFixed(1)} %   score ${r.z.toFixed(2)}`, 126 + ((W - 260) * r.p) / top, y + 13);
                  });
                }}
              />
            </div><Caption>{`The twelve most likely next tokens, of ${VOCAB.bytes.length}. Green: the one the text actually had.`}</Caption></div>
            <div><div className="h-[120px] overflow-hidden rounded border border-edge">
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
            </div><Caption>How wrong about the next token, averaged over the text, against training steps</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={steps === 0 ? undefined : truthRank === 0 ? true : truthRank > 0 && truthRank < 3 ? undefined : steps > 500 ? false : undefined}>
              {steps === 0
                ? `Untrained: every one of the ${VOCAB.bytes.length} tokens is about equally likely, so the top one has ${(shown[0].p * 100).toFixed(1)} % and the perplexity is ${perplexity(model.loss || Math.log(VOCAB.bytes.length)).toFixed(0)}: as good as guessing among ${VOCAB.bytes.length}. Press run.`
                : `After ${steps} steps the model gives ${visible(tokenText(shown[0].id))} ${(shown[0].p * 100).toFixed(0)} %, then ${visible(tokenText(shown[1].id))} ${(shown[1].p * 100).toFixed(0)} % and ${visible(tokenText(shown[2].id))} ${(shown[2].p * 100).toFixed(0)} %; the top three hold ${(inTop * 100).toFixed(0)} % and the other ${VOCAB.bytes.length - 3} tokens share the rest. ${truth === null ? "This prompt is not in the text, so there is no right answer to score against." : `In the text this prompt was followed by ${visible(tokenText(truth))}, which the model ranks ${truthRank + 1}${truthRank === 0 ? "St" : truthRank === 1 ? "Nd" : truthRank === 2 ? "Rd" : "Th"}: its loss on this one prediction is ${lossHere!.toFixed(2)}.`}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Output width, one score a vocabulary entry</dt>
              <dd className="text-right text-ink/80">{VOCAB.bytes.length}</dd>
              <dt>The score for {visible(tokenText(shown[0].id))}: Last vector dotted with its own table row</dt>
              <dd className="text-right text-ink/80">{dot(pass.h[last], model.E[shown[0].id]).toFixed(3)} = {shown[0].z.toFixed(3)}</dd>
              <dt>Numbers saved by tying the output to the table</dt>
              <dd className="text-right text-ink/80">{(VOCAB.bytes.length * WIDTH).toLocaleString("en")}</dd>
              <dt>Average loss over the text, smoothed</dt>
              <dd className="text-right text-ink/80">{model.loss.toFixed(3)}</dd>
              <dt>Perplexity: as if choosing among this many</dt>
              <dd className="text-right text-ink/80">{perplexity(model.loss || Math.log(VOCAB.bytes.length)).toFixed(1)}</dd>
              <dt>Text the model is trained on</dt>
              <dd className="text-right text-ink/80">{IDS.length} tokens, {CORPUS.split(/\s+/).length} words</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The training loss is the cross entropy from topic 3, against the token that actually
              followed, at every position of the text at once. The output layer is the table again,
              transposed: a score is how well the running vector lines up with a token's own row,
              which closes the loop back to the lookup page. The model knows this one text and
              nothing else, and that is exactly what the pages after this one show.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="predict" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}

