import { createFileRoute } from "@tanstack/react-router";
import { Textarea, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, TWO } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { VOCAB } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { SAMPLES, chars } from "@/systems/text";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/cost")({
  loader: () => api.system(TOPIC, "cost"),
  component: CostPage,
});

function CostPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [number, setNumber] = useState("1234567 + 7654321 = 8888888");
  const [code, setCode] = useState("if x:\n        return  x + 1");
  const [window, setWindow] = useState(64);
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.06);

  const rows = useMemo(
    () => SAMPLES.map((s) => {
      const t = encode(VOCAB, s.text);
      const c = chars(s.text).length;
      return { ...s, label: L(s.label), tokens: t, count: t.length, chars: c, ratio: t.length / c };
    }),
    [],
  );
  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: rows.length });
  const at = Math.min(done, rows.length);
  const shown = rows.slice(0, at);
  const current = at > 0 ? rows[at - 1] : null;
  const english = rows[0];
  const numberTokens = useMemo(() => encode(VOCAB, number), [number]);
  const codeTokens = useMemo(() => encode(VOCAB, code), [code]);
  const fits = (n: number) => Math.floor(window / n);

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("What a token costs")}
        job={L("Does the same sentence cost the same number of tokens in every language? A token is a piece of text that a language model treats as one unit. Tokens matter for three reasons. Services that run models charge per token. A model can read only a fixed number of tokens at once, called its window. And the main step of a model compares every token with every other token, so its work grows with the number of tokens multiplied by itself. Here one sentence, 'the cat sleeps on the warm mat by the window', is written in ten languages and once more with emoji. All eleven are cut by one vocabulary, a list of tokens learned with 150 merges from a short English story. In English the sentence is 10 tokens for 44 characters. In Russian it is 64 tokens for 35 characters. Run counts the sentences one at a time. The thing to watch is how the cost grows for writing that the vocabulary never saw.")}
        input={
          <div className="space-y-3">
            <Slider label={L("Window size")} min={16} max={512} step={16} value={window} format={(v) => L("{{n}} tokens", { n: Math.round(v) })} onChange={(v) => setWindow(Math.round(v))} />
            <Text kind="note" as="p">
              {L("A model reads at most a fixed number of tokens at once. This number is called its window. Under the picture, the result says how many copies of each sentence fit in a window of this size.")}
            </Text>
            <label className="block">
              <span data-text="note">{L("A number, cut into tokens")}</span>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} className="mt-1" />
            </label>
            <label className="block">
              <span data-text="note">{L("A piece of program code, cut into tokens")}</span>
              <Textarea value={code} onChange={(e) => setCode(e.target.value)} rows={2} className="mt-1" />
            </label>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("sentences counted")}
            limit={rows.length}
            onToggle={() => {
              if (!runner.running && at >= rows.length) reset();
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
            <div><div data-slot="plot" className="h-[330px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[at, rows]}
                draw={(pen) => {
                  const { ctx, width: W } = pen;
                  ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textAlign = "left";
                  ctx.fillStyle = MUTED;
                  const most = Math.max(...rows.map((r) => Math.max(r.count, r.chars)));
                  const left = 90;
                  const right = W - 80;
                  rows.forEach((r, i) => {
                    const y = 30 + i * 27;
                    const lit = i < at;
                    ctx.fillStyle = lit ? INK : "#3a3f47";
                    ctx.fillText(r.label, 10, y + 12);
                    if (!lit) return;
                    ctx.fillStyle = ONE;
                    ctx.fillRect(left, y, ((right - left) * r.chars) / most, 8);
                    ctx.fillStyle = TWO;
                    ctx.fillRect(left, y + 10, ((right - left) * r.count) / most, 8);
                    ctx.fillStyle = MUTED;
                    ctx.fillText(`${r.chars} / ${r.count}`, right + 6, y + 13);
                  });
                }}
              />
            </div><Caption>{L("One row per language. Upper bar: the number of characters. Lower bar: the number of tokens, with the vocabulary learned from English. On the right: characters / tokens.")}</Caption></div>
            {current ? (
              <div className="rounded border border-border p-3">
                <div data-text="caption">{current.label}: {L("{{tokens}} tokens for {{chars}} characters", { tokens: current.count, chars: current.chars })}</div>
                <div className="mt-2"><TokenRow tokens={current.tokens} size="sm" /></div>
              </div>
            ) : null}
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded border border-border p-3">
                <div data-text="caption">{L("The number: {{n}} tokens. Each box is one token, so the boxes show how the digits are grouped.", { n: numberTokens.length })}</div>
                <div className="mt-2"><TokenRow tokens={numberTokens} size="sm" /></div>
              </div>
              <div className="rounded border border-border p-3">
                <div data-text="caption">{L("The code: {{n}} tokens. Each box is one token. The spaces used to indent the code cost tokens too.", { n: codeTokens.length })}</div>
                <div className="mt-2"><TokenRow tokens={codeTokens} size="sm" /></div>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? L("Nothing is counted yet. Run takes the eleven sentences in turn, cuts each one into tokens and draws its two counts.")
                : current!.id === "en"
                  ? L("English: {{tokens}} tokens for {{chars}} characters, so {{ratio}} tokens per character. The vocabulary was learned from English text, so almost every word is one token.", { tokens: current!.count, chars: current!.chars, ratio: current!.ratio.toFixed(2) })
                  : `${L("{{script}}: {{tokens}} tokens for {{chars}} characters, so {{ratio}} tokens per character. That is {{times}} times the English figure.", { script: current!.label, tokens: current!.count, chars: current!.chars, ratio: current!.ratio.toFixed(2), times: (current!.ratio / english.ratio).toFixed(1) })} ${current!.ratio >= 1 ? L("There are more tokens than characters. Each character here takes two or more bytes, the small numbers from 0 to 255 that store text. The vocabulary has no token for any of these characters, so each byte becomes a token of its own.") : L("The vocabulary has tokens for some pieces of this sentence, the ones that also occur in the English story. The rest is cut letter by letter or byte by byte.")} ${fits(current!.count) === 1 ? L("A window of {{window}} tokens holds {{n}} copy of this sentence, and {{english}} copies of the English one.", { window, n: fits(current!.count), english: fits(english.count) }) : L("A window of {{window}} tokens holds {{n}} copies of this sentence, and {{english}} copies of the English one.", { window, n: fits(current!.count), english: fits(english.count) })}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              {shown.map((r) => (
                <Row key={r.id} label={L("{{script}}: tokens per character (in brackets: how many times the English figure)", { script: r.label })} value={`${r.ratio.toFixed(2)}  (x${(r.ratio / english.ratio).toFixed(1)})`} />
              ))}
              {current ? <Row label={L("{{script}}: pairs of tokens the model compares (tokens times tokens)", { script: current.label })} value={(current.count * current.count).toLocaleString("en")} /> : null}
              <Row label={L("In the number, digits joined into one token")} value={numberTokens.some((t) => /^\s?\d{2,}$/.test(t.text)) ? L("some") : L("none")} />
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The vocabularies of real models are learned from text in many languages, so the gap is smaller than here. It never disappears, and it always favours the languages that the learning text had most of. Numbers are cut wherever merges happened to form. So one token can hold, for example, the thousands digit together with the hundreds digit, and the cuts have nothing to do with the value of the number. In this vocabulary no digit was ever merged, because the English story has no digits.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="cost" />
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

