import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { hue, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { CONTEXT, MODEL_STEPS, VOCAB, WIDTH, text as tokenText, tokenIds, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { decode } from "@/systems/bpe";
import { GREEDY, draw, forward, shape, softmax, type Decoding } from "@/systems/lm";
import { rng } from "@/systems/net";
import { FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/generate")({
  loader: () => api.system(TOPIC, "generate"),
  component: GeneratePage,
});

const RULES: { id: string; label: string; rule: Decoding }[] = [
  { id: "greedy", label: "Always the most likely", rule: GREEDY },
  { id: "warm", label: "Draw, temperature 0.8", rule: { temperature: 0.8, topK: 0, topP: 1, penalty: 0 } },
];
const MOST = 40;

type Step = { id: number; p: number; top: { id: number; p: number }[]; windowStart: number };

function GeneratePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ model: true });
  const [text, setText] = useState("the cat sleeps on the");
  const [ruleId, setRuleId] = useState("greedy");
  const [window, setWindow] = useState(CONTEXT);
  const [perFrame, setPerFrame] = useState(0.05);
  const [made, setMade] = useState<Step[]>([]);

  const prompt = useMemo(() => tokenIds(text).slice(0, CONTEXT), [text]);
  const rule = RULES.find((r) => r.id === ruleId)!.rule;
  const work = useRef({ ids: prompt, next: rng(17), rule, window });
  useEffect(() => {
    work.current.rule = rule;
    work.current.window = window;
  });

  const [limit, setLimit] = useState(MOST);
  const runner = useRunner(
    () => {
      const w = work.current;
      const seen = w.ids.slice(-w.window);
      const pass = forward(store.model, seen);
      const logits = pass.logits[seen.length - 1];
      const p = shape(logits, w.rule);
      const id = draw(p, w.next);
      // the panel shows the model's own distribution; the rule only decides the draw
      const raw = softmax(logits);
      const top = raw.map((v, i) => ({ id: i, p: v })).sort((a, b) => b.p - a.p).slice(0, 6);
      if (!top.some((t) => t.id === id)) top[top.length - 1] = { id, p: raw[id] };
      w.ids = [...w.ids, id];
      setMade((m) => [...m, { id, p: raw[id], top, windowStart: w.ids.length - Math.min(w.window, w.ids.length) }]);
    },
    { perFrame, stopAt: limit },
  );

  const reset = () => {
    runner.reset();
    work.current.ids = prompt;
    work.current.next = rng(17);
    setMade([]);
  };
  const all = [...prompt, ...made.map((s) => s.id)];
  const last = made[made.length - 1];
  const windowStart = Math.max(0, all.length - window);
  const dropped = windowStart;
  const cache = Math.min(window, all.length) * WIDTH * 2;
  const trained = store.model.steps >= MODEL_STEPS;
  const repeated = useMemo(() => {
    // does the generated text repeat a stretch of itself
    const ids = made.map((s) => s.id);
    for (let len = 6; len <= 12; len++) {
      for (let i = 0; i + 2 * len <= ids.length; i++) {
        if (ids.slice(i, i + len).join() === ids.slice(i + len, i + 2 * len).join()) return len;
      }
    }
    return 0;
  }, [made]);

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "One token at a time"}
        job="A distribution over the next token is one token, and a paragraph is not. The rest is a loop short enough to write on one line: run the model, choose one token from the distribution at the last position, append it, run again. The appended token goes in as an ordinary token, no different from the prompt's."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">The prompt</span>
              <input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className={FIELD} />
            </label>
            <Choices options={RULES} value={ruleId} onPick={(id) => { setRuleId(id); reset(); }} />
            <Slider label="The window" min={3} max={CONTEXT} step={1} value={window} format={(v) => `${Math.round(v)} tokens`} onChange={(v) => { setWindow(Math.round(v)); reset(); }} />
            <p className="text-[11px] text-muted">
              The model can attend over this many tokens at once and no more; it was trained with a
              window of {CONTEXT}. When the text is longer, the oldest tokens fall out and are gone.
            </p>
            {!trained ? <p className="text-[11px] text-warn">The model is still training ({store.model.steps} of {MODEL_STEPS} steps). What it writes will improve as that finishes; start again to see.</p> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={made.length}
            what="tokens generated"
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 10, max: 200, step: 10 }}
            onToggle={() => {
              if (!runner.running && made.length >= limit) reset();
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
            <div className="rounded border border-edge p-3">
              <div className="font-mono text-[11px] text-muted">The text so far. Dim: fallen out of the window. Sky border: the prompt. Green border: generated.</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {all.map((id, i) => (
                  <span
                    key={i}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[13px] ${i < windowStart ? "opacity-30" : ""} ${i < prompt.length ? "border-sky/60" : "border-leaf/70"} ${i === all.length - 1 && made.length ? "ring-1 ring-leaf" : ""}`}
                    style={{ background: hue(id) }}
                  >
                    <span className="text-ink">{visible(tokenText(id))}</span>
                  </span>
                ))}
              </div>
            </div>
            <div><div className="h-[260px] overflow-hidden rounded border border-edge">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[last, made.length]}
                draw={(pen) => {
                  const { ctx, width: W } = pen;
                  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textAlign = "left";
                  ctx.fillStyle = MUTED;
                  if (!last) {
                    return;
                  }
                  const top = last.top[0].p || 1;
                  last.top.forEach((r, i) => {
                    const y = 30 + i * 30;
                    const chosen = r.id === last.id;
                    ctx.fillStyle = chosen ? ONE : INK;
                    ctx.fillText(visible(tokenText(r.id)).slice(0, 12), 10, y + 14);
                    ctx.fillStyle = chosen ? ONE : SKY;
                    ctx.globalAlpha = chosen ? 1 : 0.6;
                    ctx.fillRect(120, y, ((W - 240) * r.p) / top, 18);
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = MUTED;
                    ctx.fillText(`${(r.p * 100).toFixed(1)} %${chosen ? "   chosen, appended, goes in next" : ""}`, 126 + ((W - 240) * r.p) / top, y + 14);
                  });
                }}
              />
            </div><Caption>The distribution the last token was drawn from will appear here. {`Step ${made.length}: the model's distribution at the last position, and the token the rule chose`}</Caption></div>
            <div className="rounded border border-edge p-3 font-mono text-[12px] leading-relaxed text-ink/85">
              {decode(VOCAB, all)}
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={repeated ? false : undefined}>
              {!last
                ? `The prompt is ${prompt.length} tokens. Press run: each step runs the model over the window, draws one token, and appends it.`
                : `Step ${made.length}: the model was run over ${Math.min(window, all.length - 1)} tokens and ${ruleId === "greedy" ? "took its most likely token" : "drew"} ${visible(tokenText(last.id))}, which it gave ${(last.p * 100).toFixed(0)} %. It is now token ${all.length} of the text and will be read next step like any other.${dropped > 0 ? ` The window is full: ${dropped} token${dropped === 1 ? " has" : "s have"} fallen out of it, prompt included, and the model has no memory of them.` : ""}${repeated ? ` The last ${repeated} tokens repeat the ${repeated} before them: with the most likely token always chosen, the loop has found a cycle and will stay in it.` : ""}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Tokens in the text now</dt>
              <dd className="text-right text-ink/80">{all.length} ({prompt.length} prompt, {made.length} generated)</dd>
              <dt>Tokens the model can see</dt>
              <dd className="text-right text-ink/80">{Math.min(window, all.length)} of {all.length}</dd>
              <dt>Keys and values it keeps rather than recomputes</dt>
              <dd className="text-right text-ink/80">{Math.min(window, all.length)} positions x {WIDTH} x 2 = {cache.toLocaleString("en")} numbers</dd>
              <dt>Work per new token, with that cache</dt>
              <dd className="text-right text-ink/80">One position, not {Math.min(window, all.length)}</dd>
              <dt>Tokens that can be revised</dt>
              <dd className="text-right text-ink/80">None</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The mask from the attention page is why this works: during training the prediction at
              each position used only earlier positions, which is exactly the situation here. An
              emitted token is conditioned on for the rest of the generation and cannot be taken
              back. The prompt is the only conditioning there is; the model does not know which of
              its tokens were an instruction and which were data.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="generate" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}
