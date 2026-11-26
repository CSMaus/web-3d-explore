import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { hue, visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { CONTEXT, MODEL_STEPS, VOCAB, WIDTH, text as tokenText, tokenIds, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { decode } from "@/systems/bpe";
import { GREEDY, draw, forward, shape, softmax, type Decoding } from "@/systems/lm";
import { rng } from "@/systems/net";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/generate")({
  loader: () => api.system(TOPIC, "generate"),
  component: GeneratePage,
});

const RULES: { id: string; label: string; rule: Decoding }[] = [
  { id: "greedy", label: L("Always the most likely"), rule: GREEDY },
  { id: "warm", label: L("Random draw, temperature 0.8"), rule: { temperature: 0.8, topK: 0, topP: 1, penalty: 0 } },
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
    <>
      <TaskPage
        title={system?.name ?? L("Writing one token at a time")}
        job={L("How does a model write a whole paragraph when it can only guess the next token? It repeats one short loop. It reads the text so far. It chooses one token from its guess for the next position. It adds that token to the end of the text and reads again. A token is a piece of text such as a word. An added token is read exactly like the tokens typed at the start. The model here is small and trained in the browser on a short text about a cat, a dog and a man. The question: what does the loop write, and when does it start repeating itself?")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The start of the text")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className="mt-1" />
            </label>
            <Choices options={RULES} value={ruleId} onPick={(id) => { setRuleId(id); reset(); }} />
            <Slider label={L("Window")} min={3} max={CONTEXT} step={1} value={window} format={(v) => L("{{n}} tokens", { n: Math.round(v) })} onChange={(v) => { setWindow(Math.round(v)); reset(); }} />
            <Text kind="note" as="p">
              {L("The window is how many of the latest tokens the model reads at each step. It was trained with a window of {{n}}. When the text grows longer, the oldest tokens drop out and the model no longer sees them. \"Always the most likely\" takes the token with the highest probability. \"Random draw\" picks a token at random with the model's probabilities; temperature 0.8 makes the likely tokens a little likelier still.", { n: CONTEXT })}
            </Text>
            {!trained ? <Text kind="warning" as="p">{L("The model is still training ({{done}} of {{total}} steps). Its text gets better once training ends; Reset then starts the text again.", { done: store.model.steps, total: MODEL_STEPS })}</Text> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={made.length}
            what={L("tokens written")}
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
            <div className="rounded border border-border p-3">
              <div data-text="caption">{L("The text so far, one box per token. The first boxes are the start that was typed; the rest were written by the model. Faded boxes have dropped out of the window. The last written token has a ring around it.")}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {all.map((id, i) => (
                  <span
                    key={i}
                    className={`rounded border px-1.5 py-0.5 font-mono text-[13px] ${i < windowStart ? "opacity-30" : ""} ${i < prompt.length ? "border-secondary/60" : "border-selected/70"} ${i === all.length - 1 && made.length ? "ring-1 ring-selected" : ""}`}
                    style={{ background: hue(id) }}
                  >
                    <span className="text-foreground">{visible(tokenText(id))}</span>
                  </span>
                ))}
              </div>
            </div>
            <div><div data-slot="plot" className="h-[260px] overflow-hidden">
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
                    ctx.fillText(chosen ? L("{{pct}} %   chosen and added to the text", { pct: (r.p * 100).toFixed(1) }) : `${(r.p * 100).toFixed(1)} %`, 126 + ((W - 240) * r.p) / top, y + 14);
                  });
                }}
              />
            </div><Caption>{made.length === 0 ? L("After the first step, this shows the six likeliest next tokens and their probabilities.") : L("Step {{n}}: the six likeliest next tokens by the model, with their probabilities. The bar drawn solid, not faded, is the token that was chosen.", { n: made.length })}</Caption></div>
            <div data-text="body" className="rounded border border-border p-3">
              {decode(VOCAB, all)}
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={repeated ? false : undefined}>
              {!last
                ? L("The start of the text is {{n}} tokens long. At each step, Run reads the window, chooses one token and adds it to the text.", { n: prompt.length })
                : `${L("Step {{step}}: the model read {{seen}} tokens and {{how}} {{token}}, to which it gave {{pct}} %. This token is now number {{pos}} in the text, and the next step reads it like any other.", { step: made.length, seen: Math.min(window, all.length - 1), how: ruleId === "greedy" ? L("took its likeliest token,") : L("drew the token"), token: visible(tokenText(last.id)), pct: (last.p * 100).toFixed(0), pos: all.length })}${dropped > 0 ? ` ${dropped === 1 ? L("The window is full: {{n}} token has dropped out of it, counting from the start of the text, and the model no longer sees it.", { n: dropped }) : L("The window is full: {{n}} tokens have dropped out of it, counting from the start of the text, and the model no longer sees them.", { n: dropped })}` : ""}${repeated ? ` ${L("The last {{n}} tokens repeat the {{n}} before them: the text has started going round in a circle.", { n: repeated })}` : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Tokens in the text now")}</dt>
              <dd className="text-right text-foreground/80">{all.length} {L("({{prompt}} typed, {{made}} written by the model)", { prompt: prompt.length, made: made.length })}</dd>
              <dt>{L("Tokens the model can see")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} of {{b}}", { a: Math.min(window, all.length), b: all.length })}</dd>
              <dt>{L("Numbers kept so they are not computed again (the key and value of each earlier token)")}</dt>
              <dd className="text-right text-foreground/80">{L("{{n}} positions x {{width}} x 2 = {{total}} numbers", { n: Math.min(window, all.length), width: WIDTH, total: cache.toLocaleString("en") })}</dd>
              <dt>{L("Positions computed for each new token, thanks to that store")}</dt>
              <dd className="text-right text-foreground/80">{L("1, not {{n}}", { n: Math.min(window, all.length) })}</dd>
              <dt>{L("Written tokens the model can change later")}</dt>
              <dd className="text-right text-foreground/80">{L("None")}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("This works because of how the model was trained. In training, the guess at each position could use only earlier positions, which is exactly the situation when writing. A written token stays in the text, and every later step reads it; it cannot be taken back. The start of the text is all the model has to go on. It has no way to tell which tokens were an instruction and which were material to work on.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="generate" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
