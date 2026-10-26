import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow } from "@/components/Tokens";
import { visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/tokens";
import { CORPUS, decode, encode, pretokenise, roundTrip, tokenText, train } from "@/systems/bpe";
import { chars } from "@/systems/text";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/segment")({
  loader: () => api.system(TOPIC, "segment"),
  component: SegmentPage,
});

const SIZES = [
  { id: "20", label: L("{{n}} merges", { n: 20 }) },
  { id: "60", label: L("{{n}} merges", { n: 60 }) },
  { id: "150", label: L("{{n}} merges", { n: 150 }) },
  { id: "300", label: L("{{n}} merges", { n: 300 }) },
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
    <>
      <TaskPage
        title={system?.name ?? L("Cutting a sentence")}
        job={L("A new sentence, one the vocabulary has never seen. The job is to cut it into tokens: replay the merges from the last page, in order, and stop when the list runs out. The same sentence under four vocabularies of different size, so the cut is seen to belong to the vocabulary and not to the language.")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The sentence")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className="mt-1" />
            </label>
            <Choices options={SIZES} value={size} onPick={(id) => { setSize(id); reset(); }} />
            <Text kind="note" as="p">
              {L("Every vocabulary was built from the same text on the last page; they differ only in how many merges were made. A word that never appeared there stays in pieces however many merges are made.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("merges replayed")}
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
            <div className="min-h-[170px] rounded border border-border p-4">
              <div data-text="caption">
                {at === 0
                  ? L("The sentence as bytes, before any merge")
                  : changed
                    ? before.length - tokens.length === 1
                      ? L("After replaying {{at}} merges: {{count}} tokens, and this one joined {{n}} pair", { at, count: tokens.length, n: before.length - tokens.length })
                      : L("After replaying {{at}} merges: {{count}} tokens, and this one joined {{n}} pairs", { at, count: tokens.length, n: before.length - tokens.length })
                    : L("After replaying {{at}} merges: {{count}} tokens, this merge touched nothing here", { at, count: tokens.length })}
              </div>
              <div className="mt-3">
                <TokenRow tokens={tokens} ids={at >= most} />
              </div>
              {merge ? (
                <div data-text="caption" className="mt-3">
                  {L("Merge {{at}}:", { at })} {visible(tokenText(vocab, merge.a))} + {visible(tokenText(vocab, merge.b))} → <span className="text-foreground">{visible(tokenText(vocab, merge.into))}</span>
                </div>
              ) : null}
            </div>
            <div className="rounded border border-border p-4">
              <div data-text="caption">{L("The same sentence under each vocabulary, fully cut")}</div>
              <div className="mt-3 space-y-2">
                {SIZES.map((s) => {
                  const t = encode(vocabs[s.id], text);
                  return (
                    <div key={s.id} className="grid grid-cols-[110px_1fr] items-start gap-3">
                      <span className={`pt-1 font-mono text-[11px] ${s.id === size ? "text-selected" : "text-muted-foreground"}`}>{s.label}: {L("{{n}} tokens", { n: t.length })}</span>
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
                ? L("{{chars}} characters, {{bytes}} bytes. Press run and the merges are replayed on it one at a time; watch the words close up.", { chars: nChars, bytes: tokens.length })
                : at < most
                  ? L("{{tokens}} tokens after {{at}} merges. The pieces are joining in the order the vocabulary learned them: common pairs first, whole common words later.", { tokens: tokens.length, at })
                  : `${L("{{tokens}} tokens for {{chars}} characters under this vocabulary.", { tokens: final.length, chars: nChars })} ${worst.count > 1 ? (worst.known ? L("The word \"{{word}}\" is {{n}} pieces.", { word: worst.word.trim(), n: worst.count }) : L("The word \"{{word}}\" is {{n}} pieces because it never appears in the text the vocabulary was built from, so no merge ever covered it.", { word: worst.word.trim(), n: worst.count })) : L("Every word is a single token.")} ${L("decoding the {{n}} ids gives back {{what}}.", { n: final.length, what: trip.exact ? L("exactly the sentence, byte for byte") : L("something different") })}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Characters")}</dt>
              <dd className="text-right text-foreground/80">{nChars}</dd>
              <dt>{L("Tokens under {{n}} merges", { n: size })}</dt>
              <dd className="text-right text-foreground/80">{final.length}</dd>
              <dt>{L("The ids the model will receive, and nothing else")}</dt>
              <dd className="text-right text-foreground/80">{final.map((t) => t.id).join(" ")}</dd>
              <dt>{L("Words in more than one piece")}</dt>
              <dd className="text-right text-foreground/80">{pieces.filter((p) => p.count > 1).map((p) => `${p.word.trim()} (${p.count})`).join(", ") || L("None")}</dd>
              <dt>{L("Decoded back")}</dt>
              <dd className="text-right text-foreground/80">{JSON.stringify(decode(vocab, final.map((t) => t.id)))}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The space travels inside the token: ␣cat and cat are different tokens with different ids, which is why a word at the start of a line and the same word after a space are not the same thing to a model. The way back is a concatenation of bytes, and with a byte alphabet it is exact.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`segment-${size}`} />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
