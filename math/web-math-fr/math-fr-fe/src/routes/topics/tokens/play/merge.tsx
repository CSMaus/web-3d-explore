import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
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
import { INK, MUTED, ONE, SKY } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/tokens";
import { CORPUS, emptyVocab, encode, mergeOnce, mostFrequent, pairCounts, startWords, tokenText, type Merge, type Vocab, type Word } from "@/systems/bpe";
import { Textarea } from "@kit/index";
import { L } from "@/lib/lang";

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
    <>
      <TaskPage
        title={system?.name ?? L("Building a vocabulary of pieces")}
        job={L("How does a language model decide which pieces of text to treat as single units? These units are called tokens, and the list of all of them is called the vocabulary. A common method, byte-pair encoding, learns the vocabulary from a sample text with one short rule. At the start the text is written in bytes. A byte is a whole number from 0 to 255, and each English letter takes one byte. Every pair of neighbouring symbols in the text is counted. The commonest pair is replaced everywhere by one new symbol. This step is called a merge. Then the counting starts again. The sample text here is a short story of 2039 bytes about a cat, a dog and a man. The first merge joins h and e, a pair seen 125 times. The slider sets how many merges to make, and Run makes them one at a time. The thing to watch is that common words turn into single symbols and the text gets shorter: 2039 symbols at the start, 516 after 150 merges.")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The sample text the vocabulary is learned from")}</span>
              <Textarea value={corpus} onChange={(e) => { setCorpus(e.target.value); reset(); }} rows={7} className="mt-1" />
            </label>
            <Slider label={L("Number of merges to make")} min={10} max={300} step={10} value={target} format={(v) => String(Math.round(v))} onChange={(v) => { setTarget(Math.round(v)); reset(); }} />
            <Text kind="note" as="p">
              {L("The vocabulary starts with the 256 possible bytes. So any text in any language can be written with it, and no character is ever unknown. A merge never joins across a space. Each space is attached to the start of the word after it, so ' cat', with its space, can become one token.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("merges")}
            limit={most}
            onToggle={() => {
              if (!runner.running && at >= most) reset();
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
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div><div data-slot="plot" className="h-[250px] overflow-hidden">
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
              </div><Caption>{at >= most ? L("No pair of neighbouring symbols occurs twice any more, so the merging has stopped") : L("Bar chart: the ten commonest pairs of neighbouring symbols in the text right now. The length of a bar is how many times its pair occurs. The top pair is merged next.")}</Caption></div>
              <div data-text="caption" className="h-[250px] overflow-hidden rounded border border-border p-3">
                <div className="text-muted-foreground">{L("The merges made so far, newest at the bottom. In brackets: how many times the pair occurred")}</div>
                <ol className="mt-2 space-y-0.5">
                  {now.merges.slice(Math.max(0, at - 9), at).map((m, i) => {
                    const index = Math.max(0, at - 9) + i;
                    return (
                      <li key={index} className={index === at - 1 ? "text-selected" : "text-foreground/70"}>
                        <span className="text-muted-foreground">{index + 1}.</span> {name(now.vocab, m.a)} + {name(now.vocab, m.b)} → <span className="text-foreground">{name(now.vocab, m.into)}</span>
                        <span className="text-muted-foreground"> ({m.count})</span>
                      </li>
                    );
                  })}
                  {at === 0 ? <li className="text-muted-foreground">{L("No merge yet: every symbol is still a single byte")}</li> : null}
                </ol>
              </div>
            </div>
            <div className="min-h-[190px] rounded border border-border p-3">
              <div data-text="caption">{L("The first lines of the text, cut into the symbols the vocabulary has at this point. Each box is one token")}</div>
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
                ? L("Before any merge the text is {{bytes}} bytes long, so it is {{bytes}} tokens of one byte each. The vocabulary has 256 symbols, one for each possible byte. The commonest pair of neighbours is {{pair}}. Run starts the merging.", { bytes: bytesTotal, pair: winner ? L("{{a}} + {{b}}, seen {{count}} times", { a: name(now.vocab, winner.a), b: name(now.vocab, winner.b), count: winner.count }) : L("none") })
                : `${L("Merge {{at}}: {{a}} + {{b}} became one symbol, {{into}}. It was the commonest pair, seen {{count}} times. The vocabulary now has {{size}} symbols, and the text takes {{tokens}} tokens instead of the {{bytes}} bytes it started with.", { at, a: name(now.vocab, last!.a), b: name(now.vocab, last!.b), into: name(now.vocab, last!.into), count: last!.count, size: now.vocab.bytes.length, tokens: tokensNow, bytes: bytesTotal })}${at >= most ? ` ${L("No pair of neighbours occurs twice any more, so the rule has nothing left to merge.")}` : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Symbols in the vocabulary: 256 bytes plus one per merge")}</dt>
              <dd className="text-right text-foreground/80">256 + {at} = {now.vocab.bytes.length}</dd>
              <dt>{L("Length of the text in tokens")}</dt>
              <dd className="text-right text-foreground/80">{tokensNow}</dd>
              <dt>{L("Average bytes per token")}</dt>
              <dd className="text-right text-foreground/80">{(bytesTotal / tokensNow).toFixed(2)}</dd>
              <dt>{L("Different words in the text")}</dt>
              <dd className="text-right text-foreground/80">{now.words.length}</dd>
              <dt>{L("Longest symbol so far")}</dt>
              <dd className="text-right text-foreground/80">{visible(tokenText(now.vocab, now.vocab.bytes.reduce((b, v, i) => (v.length > now.vocab.bytes[b].length ? i : b), 0)))}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("More merges give a bigger vocabulary and fewer, longer tokens. A bigger vocabulary also makes the model bigger, because the model gives a score to every symbol of the vocabulary each time it picks the next token. Fewer merges give the reverse. The sample text decides everything. A word that never appears in it never becomes a symbol. A page of the same topic, 'Cutting a sentence', shows what happens to such a word.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="merge" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
