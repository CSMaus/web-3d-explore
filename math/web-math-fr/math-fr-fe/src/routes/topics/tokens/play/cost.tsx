import { createFileRoute } from "@tanstack/react-router";
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
import { FIELD, TokenFrame } from "./-shared";

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
      return { ...s, tokens: t, count: t.length, chars: c, ratio: t.length / c };
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
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "What a token costs"}
        job="One sentence, the same meaning, in eleven scripts, all cut by the one vocabulary built two pages ago from English text. The job is to count what each costs in tokens, because tokens are what is billed, what fills the window, and what the attention cost grows with the square of."
        input={
          <div className="space-y-3">
            <Slider label="A window of" min={16} max={512} step={16} value={window} format={(v) => `${Math.round(v)} tokens`} onChange={(v) => setWindow(Math.round(v))} />
            <p className="text-[11px] text-muted">
              A model can attend over only so many tokens at once. The result panel says how many
              copies of each sentence fit in this window.
            </p>
            <label className="block">
              <span className="text-xs text-muted">A number, cut</span>
              <input value={number} onChange={(e) => setNumber(e.target.value)} className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs text-muted">Code, cut</span>
              <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={2} className={FIELD} />
            </label>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="scripts counted"
            limit={rows.length}
            onToggle={() => {
              if (!runner.running && at >= rows.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(rows.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div><div className="h-[330px] overflow-hidden rounded border border-edge">
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
            </div><Caption>Green: characters.  Rose: tokens under the English-trained vocabulary.  One row a script.</Caption></div>
            {current ? (
              <div className="rounded border border-edge p-3">
                <div className="font-mono text-[11px] text-muted">{current.label}: {current.count} tokens for {current.chars} characters</div>
                <div className="mt-2"><TokenRow tokens={current.tokens} size="sm" /></div>
              </div>
            ) : null}
            <div className="grid gap-2 lg:grid-cols-2">
              <div className="rounded border border-edge p-3">
                <div className="font-mono text-[11px] text-muted">The number: {numberTokens.length} tokens. Where does each digit go?</div>
                <div className="mt-2"><TokenRow tokens={numberTokens} size="sm" /></div>
              </div>
              <div className="rounded border border-edge p-3">
                <div className="font-mono text-[11px] text-muted">The code: {codeTokens.length} tokens. Every run of spaces is its own cost.</div>
                <div className="mt-2"><TokenRow tokens={codeTokens} size="sm" /></div>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? "Press run. Each script is cut in turn and its two counts drawn."
                : current!.id === "en"
                  ? `English: ${current!.count} tokens for ${current!.chars} characters, ${current!.ratio.toFixed(2)} tokens a character. The vocabulary was built on English, so almost every word is one token.`
                  : `${current!.label}: ${current!.count} tokens for ${current!.chars} characters, ${current!.ratio.toFixed(2)} tokens a character, ${(current!.ratio / english.ratio).toFixed(1)} times the English rate. ${current!.ratio >= 1 ? "More tokens than characters: every character is several bytes and the vocabulary has no symbol for any of them, so it falls back to bytes." : "The vocabulary has some of these pieces from shared letters, and none of the words."} in a window of ${window} tokens this sentence fits ${fits(current!.count)} time${fits(current!.count) === 1 ? "" : "s"}; the English one fits ${fits(english.count)}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              {shown.map((r) => (
                <Row key={r.id} label={`${r.label}, tokens a character`} value={`${r.ratio.toFixed(2)}  (x${(r.ratio / english.ratio).toFixed(1)})`} />
              ))}
              {current ? <Row label={`Attention cost for ${current.label}, tokens squared`} value={(current.count * current.count).toLocaleString("en")} /> : null}
              <Row label="The number, digits kept together" value={numberTokens.some((t) => /^\s?\d{2,}$/.test(t.text)) ? "some" : "none"} />
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              A real vocabulary is trained on many languages and the gap is smaller, but it is never
              zero, and it always favours whatever the training text had most of. The number is cut
              wherever the merges happened to fall, so place value can sit across a token boundary;
              the last page comes back to that.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="cost" />
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

