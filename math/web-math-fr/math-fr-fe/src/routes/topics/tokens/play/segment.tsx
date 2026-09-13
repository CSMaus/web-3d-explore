import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/tokens";
import { CORPUS, decode, encode, pretokenise, roundTrip, tokenText, train } from "@/systems/bpe";
import { chars } from "@/systems/text";
import { FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/segment")({
  loader: () => api.system(TOPIC, "segment"),
  component: SegmentPage,
});

const SIZES = [
  { id: "20", label: "20 merges" },
  { id: "60", label: "60 merges" },
  { id: "150", label: "150 merges" },
  { id: "300", label: "300 merges" },
];
const DEFAULT = "the cat watches the birds from the windowsill";

function SegmentPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [text, setText] = useState(DEFAULT);
  const [size, setSize] = useState("150");
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.25);

  const vocabs = useMemo(() => Object.fromEntries(SIZES.map((s) => [s.id, train(CORPUS, Number(s.id))])), []);
  const vocab = vocabs[size];
  const most = vocab.merges.length;
  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: most });
  const at = Math.min(done, most);
  const tokens = useMemo(() => encode(vocab, text, at), [vocab, text, at]);
  const final = useMemo(() => encode(vocab, text), [vocab, text]);
  const before = useMemo(() => encode(vocab, text, Math.max(0, at - 1)), [vocab, text, at]);
  const changed = before.length !== tokens.length;
  const merge = at > 0 ? vocab.merges[at - 1] : null;
  const trip = roundTrip(vocab, text);
  const nChars = chars(text).length;
  const corpusWords = useMemo(() => new Set(pretokenise(CORPUS).map((w) => w.trim().replace(/[.,]/g, ""))), []);
  const pieces = useMemo(() => {
    // how many tokens each word takes, for finding the ones that were cut up
    const out: { word: string; count: number; known: boolean }[] = [];
    for (const w of pretokenise(text)) {
      const n = encode(vocab, w).length;
      out.push({ word: w, count: n, known: corpusWords.has(w.trim().replace(/[.,]/g, "")) });
    }
    return out;
  }, [vocab, text, corpusWords]);
  const worst = pieces.reduce((b, p) => (p.count > b.count ? p : b), pieces[0] ?? { word: "", count: 0, known: true });

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "Cutting a sentence"}
        job="A new sentence, one the vocabulary has never seen. The job is to cut it into tokens: replay the merges from the last page, in order, and stop when the list runs out. The same sentence under four vocabularies of different size, so the cut is seen to belong to the vocabulary and not to the language."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">The sentence</span>
              <input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className={FIELD} />
            </label>
            <Choices options={SIZES} value={size} onPick={(id) => { setSize(id); reset(); }} />
            <p className="text-[11px] text-muted">
              Every vocabulary was built from the same text on the last page; they differ only in how
              many merges were made. A word that never appeared there stays in pieces however many
              merges are made.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="merges replayed"
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
            <div className="min-h-[170px] rounded border border-edge p-4">
              <div className="font-mono text-[11px] text-muted">
                {at === 0 ? "The sentence as bytes, before any merge" : `After replaying ${at} merges: ${tokens.length} tokens${changed ? `, and this one joined ${before.length - tokens.length} pair${before.length - tokens.length === 1 ? "" : "s"}` : ", this merge touched nothing here"}`}
              </div>
              <div className="mt-3">
                <TokenRow tokens={tokens} ids={at >= most} />
              </div>
              {merge ? (
                <div className="mt-3 font-mono text-[11px] text-muted">
                  Merge {at}: {visible(tokenText(vocab, merge.a))} + {visible(tokenText(vocab, merge.b))} → <span className="text-ink">{visible(tokenText(vocab, merge.into))}</span>
                </div>
              ) : null}
            </div>
            <div className="rounded border border-edge p-4">
              <div className="font-mono text-[11px] text-muted">The same sentence under each vocabulary, fully cut</div>
              <div className="mt-3 space-y-2">
                {SIZES.map((s) => {
                  const t = encode(vocabs[s.id], text);
                  return (
                    <div key={s.id} className="grid grid-cols-[110px_1fr] items-start gap-3">
                      <span className={`pt-1 font-mono text-[11px] ${s.id === size ? "text-leaf" : "text-muted"}`}>{s.label}: {t.length} tokens</span>
                      <TokenRow tokens={t} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at >= most ? trip.exact : undefined}>
              {at === 0
                ? `${nChars} characters, ${tokens.length} bytes. Press run and the merges are replayed on it one at a time; watch the words close up.`
                : at < most
                  ? `${tokens.length} tokens after ${at} merges. The pieces are joining in the order the vocabulary learned them: common pairs first, whole common words later.`
                  : `${final.length} tokens for ${nChars} characters under this vocabulary. ${worst.count > 1 ? `The word "${worst.word.trim()}" is ${worst.count} pieces${worst.known ? "" : " because it never appears in the text the vocabulary was built from, so no merge ever covered it"}.` : "Every word is a single token."} decoding the ${final.length} ids gives back ${trip.exact ? "exactly the sentence, byte for byte" : "something different"}.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Characters</dt>
              <dd className="text-right text-ink/80">{nChars}</dd>
              <dt>Tokens under {size} merges</dt>
              <dd className="text-right text-ink/80">{final.length}</dd>
              <dt>The ids the model will receive, and nothing else</dt>
              <dd className="text-right text-ink/80">{final.map((t) => t.id).join(" ")}</dd>
              <dt>Words in more than one piece</dt>
              <dd className="text-right text-ink/80">{pieces.filter((p) => p.count > 1).map((p) => `${p.word.trim()} (${p.count})`).join(", ") || "None"}</dd>
              <dt>Decoded back</dt>
              <dd className="text-right text-ink/80">{JSON.stringify(decode(vocab, final.map((t) => t.id)))}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The space travels inside the token: ␣cat and cat are different tokens with different
              ids, which is why a word at the start of a line and the same word after a space are
              not the same thing to a model. The way back is a concatenation of bytes, and with a
              byte alphabet it is exact.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`segment-${size}`} />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}
