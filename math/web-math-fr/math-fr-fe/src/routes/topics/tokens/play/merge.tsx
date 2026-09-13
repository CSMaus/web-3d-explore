import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/tokens";
import { CORPUS, emptyVocab, encode, mergeOnce, mostFrequent, pairCounts, startWords, tokenText, type Merge, type Vocab, type Word } from "@/systems/bpe";
import { FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/merge")({
  loader: () => api.system(TOPIC, "merge"),
  component: MergePage,
});

type Stage = { vocab: Vocab; words: Word[]; merges: Merge[] };

function MergePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [corpus, setCorpus] = useState(CORPUS);
  const [target, setTarget] = useState(150);
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.2);

  // every stage of the training, computed once per corpus and target, so a
  // step is a lookup and the reader can step backwards by starting again
  const stages = useMemo<Stage[]>(() => {
    const out: Stage[] = [{ vocab: emptyVocab(), words: startWords(corpus), merges: [] }];
    for (let i = 0; i < target; i++) {
      const last = out[out.length - 1];
      const next = mergeOnce(last.vocab, last.words);
      if (!next) break;
      out.push({ vocab: next.vocab, words: next.words, merges: next.vocab.merges });
    }
    return out;
  }, [corpus, target]);
  const most = stages.length - 1;
  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: most });
  const at = Math.min(done, most);
  const now = stages[at];
  const pairs = useMemo(() => {
    const counts = Array.from(pairCounts(now.words).values()).sort((a, b) => b.count - a.count);
    return counts.slice(0, 10);
  }, [now]);
  const winner = mostFrequent(pairCounts(now.words));
  const last = at > 0 ? now.merges[at - 1] : null;
  const tokensNow = now.words.reduce((s, w) => s + w.symbols.length * w.count, 0);
  const bytesTotal = stages[0].words.reduce((s, w) => s + w.symbols.length * w.count, 0);
  const preview = useMemo(() => encode(now.vocab, corpus.slice(0, 220), at), [now, corpus, at]);
  const name = (v: Vocab, id: number) => visible(tokenText(v, id));

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "Building a vocabulary"}
        job="A short text, and a rule short enough to run by hand: count every pair of neighbouring symbols, join the commonest pair into one new symbol, and repeat. Start from bytes. The list of joins is the vocabulary, and it is the whole of what a tokeniser learns."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">The text to learn from</span>
              <textarea value={corpus} onChange={(e) => { setCorpus(e.target.value); reset(); }} rows={7} className={FIELD} />
            </label>
            <Slider label="Merges to make" min={10} max={300} step={10} value={target} format={(v) => String(Math.round(v))} onChange={(v) => { setTarget(Math.round(v)); reset(); }} />
            <p className="text-[11px] text-muted">
              The alphabet is the 256 byte values, so anything can be written and nothing is
              unknown. A join never crosses a space: a space is glued to the word after it and
              travels inside the token.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="merges"
            limit={most}
            onToggle={() => {
              if (!runner.running && at >= most) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(most, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-[1fr_260px]">
              <div><div className="h-[250px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                  deps={[pairs, winner, now]}
                  draw={(pen) => {
                    const { ctx, width: W } = pen;
                    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.textAlign = "left";
                    ctx.fillStyle = MUTED;
                    const top = pairs[0]?.count ?? 1;
                    pairs.forEach((p, i) => {
                      const y = 30 + i * 21;
                      const label = `${name(now.vocab, p.a)} + ${name(now.vocab, p.b)}`;
                      ctx.fillStyle = i === 0 ? ONE : INK;
                      ctx.fillText(label.slice(0, 22), 10, y + 11);
                      ctx.fillStyle = i === 0 ? ONE : SKY;
                      ctx.globalAlpha = i === 0 ? 1 : 0.6;
                      ctx.fillRect(190, y, ((W - 260) * p.count) / top, 14);
                      ctx.globalAlpha = 1;
                      ctx.fillStyle = MUTED;
                      ctx.fillText(String(p.count), 196 + ((W - 260) * p.count) / top, y + 11);
                    });
                  }}
                />
              </div><Caption>{at >= most ? "No pair is left that occurs twice" : `The ten commonest neighbouring pairs now. The top one is joined next.`}</Caption></div>
              <div className="h-[250px] overflow-hidden rounded border border-edge p-3 font-mono text-[11px]">
                <div className="text-muted">The merge list, newest last</div>
                <ol className="mt-2 space-y-0.5">
                  {now.merges.slice(Math.max(0, at - 9), at).map((m, i) => {
                    const index = Math.max(0, at - 9) + i;
                    return (
                      <li key={index} className={index === at - 1 ? "text-leaf" : "text-ink/70"}>
                        <span className="text-muted">{index + 1}.</span> {name(now.vocab, m.a)} + {name(now.vocab, m.b)} → <span className="text-ink">{name(now.vocab, m.into)}</span>
                        <span className="text-muted"> ({m.count})</span>
                      </li>
                    );
                  })}
                  {at === 0 ? <li className="text-muted">Nothing joined yet: every symbol is a byte</li> : null}
                </ol>
              </div>
            </div>
            <div className="min-h-[190px] rounded border border-edge p-3">
              <div className="font-mono text-[11px] text-muted">The start of the text, cut at the symbols the vocabulary has so far</div>
              <div className="mt-2">
                <TokenRow tokens={preview} size="sm" />
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at >= most ? true : undefined}>
              {at === 0
                ? `Before any merge the text is ${bytesTotal} bytes, so ${bytesTotal} tokens, from an alphabet of 256. The commonest pair right now is ${winner ? `${name(now.vocab, winner.a)} + ${name(now.vocab, winner.b)}, seen ${winner.count} times` : "none"}. Press run.`
                : `Merge ${at}: ${name(now.vocab, last!.a)} + ${name(now.vocab, last!.b)} became one symbol, ${name(now.vocab, last!.into)}, because that pair was the commonest, ${last!.count} times. The vocabulary is now ${now.vocab.bytes.length} symbols and the text is ${tokensNow} tokens, down from ${bytesTotal} bytes.${at >= most ? " No more pairs occur twice, so there is nothing left worth a symbol." : ""}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Symbols in the vocabulary</dt>
              <dd className="text-right text-ink/80">256 + {at} = {now.vocab.bytes.length}</dd>
              <dt>Tokens the text takes</dt>
              <dd className="text-right text-ink/80">{tokensNow}</dd>
              <dt>Bytes a token, on average</dt>
              <dd className="text-right text-ink/80">{(bytesTotal / tokensNow).toFixed(2)}</dd>
              <dt>Distinct words in the text</dt>
              <dd className="text-right text-ink/80">{now.words.length}</dd>
              <dt>Longest symbol so far</dt>
              <dd className="text-right text-ink/80">{visible(tokenText(now.vocab, now.vocab.bytes.reduce((b, v, i) => (v.length > now.vocab.bytes[b].length ? i : b), 0)))}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              More merges: fewer, longer tokens and a bigger vocabulary, which is a bigger output
              layer later. Fewer merges: the reverse. The text decides everything: a word that never
              appears here never becomes a symbol, and the next page shows what happens to it.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="merge" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}
