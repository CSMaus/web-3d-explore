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

/** merges asked for; the text runs out of repeated pairs before the last, so each choice is named by the merges it really made */
const SIZES = ["20", "60", "150", "300"];
const DEFAULT = "the cat watches the birds from the windowsill";

function SegmentPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [text, setText] = useState(DEFAULT);
  const [size, setSize] = useState("150");
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.25);

  const vocabs = useMemo(() => Object.fromEntries(SIZES.map((id) => [id, train(CORPUS, Number(id))])), []);
  const choices = SIZES.map((id) => {
    const made = vocabs[id].merges.length;
    return { id, label: made < Number(id) ? L("All {{n}} merges", { n: made }) : L("{{n}} merges", { n: made }) };
  });
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
        title={system?.name ?? L("Cutting a sentence into tokens")}
        job={L("How is a new sentence cut into tokens? A token is a piece of text that a language model treats as one unit, and the list of all tokens is the vocabulary. Here the vocabulary was learned from a short sample story by a list of merges. Each merge joins one pair of neighbouring pieces into one piece. To cut a new sentence, it is first written as bytes, small numbers from 0 to 255 that store the text. Then the merges are replayed on it in the order they were learned, until the list ends. The sentence here is 'the cat watches the birds from the windowsill', 45 bytes. After 150 merges it is 14 tokens. The word 'windowsill' stays in 5 pieces, because it never occurs in the sample story. The buttons choose one of four vocabularies, made with 20, 60, 150 or all 162 possible merges. Run replays the merges one at a time. The thing to watch is that each vocabulary cuts the same sentence differently: the cut belongs to the vocabulary, not to the language.")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("The sentence")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); reset(); }} className="mt-1" />
            </label>
            <Choices options={choices} value={size} onPick={(id) => { setSize(id); reset(); }} />
            <Text kind="note" as="p">
              {L("All four vocabularies were learned from the same sample text, a short story of 2039 bytes about a cat, a dog and a man. They differ only in how many merges were made. The story runs out of repeated pairs after 162 merges, so asking for 300 gives 162. A word that never appears in the story stays in pieces, however many merges are made.")}
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
            onStep={(many) => runner.once(many)}
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
                  ? L("The sentence as bytes, before any merge. Each box is one token, here a single byte")
                  : changed
                    ? before.length - tokens.length === 1
                      ? L("After {{at}} merges replayed: {{count}} tokens. The last merge joined {{n}} pair in this sentence", { at, count: tokens.length, n: before.length - tokens.length })
                      : L("After {{at}} merges replayed: {{count}} tokens. The last merge joined {{n}} pairs in this sentence", { at, count: tokens.length, n: before.length - tokens.length })
                    : L("After {{at}} merges replayed: {{count}} tokens. The last merge found no pair to join in this sentence", { at, count: tokens.length })}
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
              <div data-text="caption">{L("The same sentence fully cut by each of the four vocabularies")}</div>
              <div className="mt-3 space-y-2">
                {choices.map((s) => {
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
                ? L("The sentence has {{chars}} characters and {{bytes}} bytes, so before any merge it is {{bytes}} tokens. Run replays the merges on it one at a time, and the letters of common words join up.", { chars: nChars, bytes: tokens.length })
                : at < most
                  ? L("{{tokens}} tokens after {{at}} merges. The pieces join in the order the vocabulary learned them: common pairs of letters first, whole common words later.", { tokens: tokens.length, at })
                  : `${L("This vocabulary cuts the {{chars}} characters into {{tokens}} tokens.", { tokens: final.length, chars: nChars })} ${worst.count > 1 ? (worst.known ? L("The word \"{{word}}\" is cut into {{n}} pieces. It does occur in the sample text, but not often enough for its pieces to be merged into one token.", { word: worst.word.trim(), n: worst.count }) : L("The word \"{{word}}\" is cut into {{n}} pieces, because it never appears in the sample text, so no merge was ever learned for it.", { word: worst.word.trim(), n: worst.count })) : L("Every word is a single token.")} ${L("Each token has a number, its id. Turning the {{n}} ids back into bytes gives {{what}}.", { n: final.length, what: trip.exact ? L("exactly the sentence, byte for byte") : L("a different text") })}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Characters")}</dt>
              <dd className="text-right text-foreground/80">{nChars}</dd>
              <dt>{L("Tokens with {{n}} merges", { n: most })}</dt>
              <dd className="text-right text-foreground/80">{final.length}</dd>
              <dt>{L("The token ids: the only thing the model receives")}</dt>
              <dd className="text-right text-foreground/80">{final.map((t) => t.id).join(" ")}</dd>
              <dt>{L("Words in more than one piece")}</dt>
              <dd className="text-right text-foreground/80">{pieces.filter((p) => p.count > 1).map((p) => `${p.word.trim()} (${p.count})`).join(", ") || L("None")}</dd>
              <dt>{L("The ids turned back into text")}</dt>
              <dd className="text-right text-foreground/80">{JSON.stringify(decode(vocab, final.map((t) => t.id)))}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("A space is stored at the start of the token that follows it. So ␣cat, with a space, and cat, without one, are two different tokens with different ids. For a model, a word at the start of a line and the same word after a space are therefore different inputs. Going back from tokens to text only needs the bytes of each token, joined in order. Every token is made of whole bytes, so the result is exactly the original text.")}
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
