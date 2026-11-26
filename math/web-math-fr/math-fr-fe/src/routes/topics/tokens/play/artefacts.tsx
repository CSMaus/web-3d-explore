import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow } from "@/components/Tokens";
import { visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { useRunner } from "@/lib/runner";
import { VOCAB, countOf, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { chars } from "@/systems/text";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/artefacts")({
  loader: () => api.system(TOPIC, "artefacts"),
  component: ArtefactsPage,
});

const CASES = ["letters", "numbers", "spaces", "rare"] as const;

function ArtefactsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ skip: true });
  const [word, setWord] = useState("windowsill");
  const [number, setNumber] = useState("1234567");
  const [phrase, setPhrase] = useState("the cat");
  const [rare, setRare] = useState("the man reads by the window and the dog dreams of nobody");
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.03);

  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: CASES.length });
  const at = Math.min(done, CASES.length);

  const wordTokens = useMemo(() => encode(VOCAB, word), [word]);
  const letters = chars(word).length;
  const numberA = useMemo(() => encode(VOCAB, number), [number]);
  const numberB = useMemo(() => encode(VOCAB, number.replace(/\B(?=(\d{3})+(?!\d))/g, ",")), [number]);
  const numberC = useMemo(() => encode(VOCAB, " " + number), [number]);
  const spaceA = useMemo(() => encode(VOCAB, phrase), [phrase]);
  const spaceB = useMemo(() => encode(VOCAB, " " + phrase), [phrase]);
  const spaceC = useMemo(() => encode(VOCAB, phrase.replace(/ /g, "  ")), [phrase]);
  const rareTokens = useMemo(() => encode(VOCAB, rare), [rare]);
  const touched = store.skip.touched;
  const splitDigits = numberA.some((t) => /\d/.test(t.text) && t.text.replace(/\D/g, "").length !== number.length);
  const sameIds = spaceA.map((t) => t.id).join() === spaceB.map((t) => t.id).join();

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  const card = (i: number, title: string, body: React.ReactNode) => (
    <div className={`rounded border p-3 ${at > i ? "border-border" : "border-dashed border-border"}`}>
      <div data-text="caption" style={{ color: "var(--c-selected)" }}>{i + 1}. {title}</div>
      <div className="mt-2 space-y-2">{body}</div>
    </div>
  );

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Four mistakes explained by cutting text")}
        job={L("Why do language models miscount letters, slip on long numbers, change an answer over a stray space and know little about rare words? A language model reads text as tokens: pieces of text such as words, parts of words or single signs. Each token arrives as a number, its id. The list of all tokens, called the vocabulary, is built beforehand from how often pieces of text occur in a training text. Here that text is a short story about a cat, a dog and a man. This page takes four inputs and shows how each is cut into tokens. The question: in each case, what does the model actually receive?")}
        input={
          <div className="space-y-3">
            <label className="block">
              <span data-text="note">{L("A word to count the letters of")}</span>
              <Input value={word} onChange={(e) => setWord(e.target.value)} className="mt-1" />
            </label>
            <label className="block">
              <span data-text="note">{L("A long number")}</span>
              <Input value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} className="mt-1" />
            </label>
            <label className="block">
              <span data-text="note">{L("A phrase, to move its spaces")}</span>
              <Input value={phrase} onChange={(e) => setPhrase(e.target.value)} className="mt-1" />
            </label>
            <label className="block">
              <span data-text="note">{L("A sentence with a rare word in it")}</span>
              <Input value={rare} onChange={(e) => setRare(e.target.value)} className="mt-1" />
            </label>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("cases shown")}
            limit={CASES.length}
            onToggle={() => {
              if (!runner.running && at >= CASES.length) reset();
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
            {card(0, L("How many letters are in \"{{word}}\"?", { word }), (
              <>
                <TokenRow tokens={wordTokens} ids size="sm" />
                <Text kind="caption" as="p">
                  {L(wordTokens.length === 1 ? "{{letters}} letters, but the model receives {{n}} id: {{ids}}. An id is only a number in a list. It does not say how many letters its token has, or which ones. So the model has to count the letters, or spell the word backwards, without seeing them." : "{{letters}} letters, but the model receives {{n}} ids: {{ids}}. An id is only a number in a list. It does not say how many letters its token has, or which ones. So the model has to count the letters, or spell the word backwards, without seeing them.", { letters, n: wordTokens.length, ids: wordTokens.map((t) => t.id).join(", ") })}
                </Text>
              </>
            ))}
            {card(1, L("Arithmetic on {{number}}", { number }), (
              <>
                <div data-text="caption" className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span>{L("As typed")}</span><TokenRow tokens={numberA} size="sm" />
                  <span>{L("With commas")}</span><TokenRow tokens={numberB} size="sm" />
                  <span>{L("After a space")}</span><TokenRow tokens={numberC} size="sm" />
                </div>
                <Text kind="caption" as="p">
                  {L(splitDigits ? "The same number becomes {{a}}, {{b}} and {{c}} tokens in its three spellings. The cuts fall wherever the vocabulary happens to have pieces, so whether a digit stands for units, tens or thousands depends on the piece it landed in. A model that adds such numbers adds pieces, not digits." : "The same number becomes {{a}}, {{b}} and {{c}} tokens in its three spellings. The cuts fall wherever the vocabulary happens to have pieces. A model that adds such numbers adds pieces, not digits.", { a: numberA.length, b: numberB.length, c: numberC.length })}
                </Text>
              </>
            ))}
            {card(2, L("\"{{phrase}}\", with its spaces moved", { phrase }), (
              <>
                <div data-text="caption" className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span>{L("As typed")}</span><TokenRow tokens={spaceA} ids size="sm" />
                  <span>{L("A space in front")}</span><TokenRow tokens={spaceB} ids size="sm" />
                  <span>{L("Double spaces")}</span><TokenRow tokens={spaceC} ids size="sm" />
                </div>
                <Text kind="caption" as="p">
                  {sameIds ? L("Here the ids happen to match. A phrase that begins with a word shows the difference.") : L("The first token gets another id ({{a}} as typed, {{b}} with a space in front). Each id picks its own list of numbers from a table, so the model starts from different numbers, and everything after is computed from them.", { a: String(spaceA[0]?.id), b: String(spaceB[0]?.id) })} {L("So one extra space makes a different input.")}
                </Text>
              </>
            ))}
            {card(3, L("A rare word in pieces"), (
              <>
                <TokenRow tokens={rareTokens} size="sm" />
                <div data-text="caption" className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0.5">
                  <span>{L("Token")}</span><span className="text-right">{L("Times in the text")}</span><span className="text-right">{L("Times adjusted")}</span>
                  {rareTokens.map((t, i) => (
                    <Row key={i} t={visible(t.text)} n={countOf(t.id)} moved={touched[t.id] ?? 0} />
                  ))}
                </div>
                <Text kind="caption" as="p">
                  {L("Each token has its own list of numbers, trained from the text: every time the token appears, its list is adjusted a little toward the lists of its neighbours. \"Times adjusted\" counts those adjustments. The pieces of a rare word were adjusted a few times or never, so their lists carry little. The common tokens beside them were adjusted thousands of times. Counts under 10 are marked.")}
                </Text>
              </>
            ))}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? L("Run shows the four cases one at a time.")
                : at === 1
                  ? L(wordTokens.length === 1 ? "Counting letters fails because the model receives tokens, not letters. \"{{word}}\" arrives as {{n}} id, and its letters appear nowhere in what the model receives." : "Counting letters fails because the model receives tokens, not letters. \"{{word}}\" arrives as {{n}} ids, and its letters appear nowhere in what the model receives.", { word, n: wordTokens.length })
                  : at === 2
                    ? L("Arithmetic on long numbers fails because the cuts ignore units, tens and thousands. The vocabulary was built from how often pieces occur in the training text, not from arithmetic. And the same number is cut differently in different spellings.")
                    : at === 3
                      ? L("An answer can change with a stray space because the space is part of the token. A different id goes in, so a different list of numbers, so different numbers everywhere after.")
                      : L("A rare or specialised word arrives in pieces whose lists were barely trained, so the model knows little about it. All four failures come from how the text was cut into tokens, which was decided before the model learned anything. None of them is a mystery about the model.")}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Letters in the word, tokens the model gets")}</dt>
              <dd className="text-right text-foreground/80">{letters}, {wordTokens.length}</dd>
              <dt>{L("Tokens for the number in its three spellings")}</dt>
              <dd className="text-right text-foreground/80">{numberA.length}, {numberB.length}, {numberC.length}</dd>
              <dt>{L("First id of the phrase, as typed and with a space in front")}</dt>
              <dd className="text-right text-foreground/80">{spaceA[0]?.id ?? "-"}, {spaceB[0]?.id ?? "-"}</dd>
              <dt>{L("Tokens of the rare-word sentence adjusted fewer than 10 times")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} of {{b}}", { a: rareTokens.filter((t) => (touched[t.id] ?? 0) < 10).length, b: rareTokens.length })}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("All of this was settled before the model was trained: what counts as one piece, how the pieces are chosen, where the space goes, where a number is cut. The model works with what it receives and cannot see past those choices. The pages of this topic in the group \"Text cut into pieces\" show how the vocabulary is built and how text is cut.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="artefacts" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

function Row({ t, n, moved }: { t: string; n: number; moved: number }) {
  return (
    <>
      <span className="text-foreground/80">{t}</span>
      <span className="text-right text-foreground/80">{n}</span>
      <span className={`text-right ${moved < 10 ? "text-destructive" : "text-foreground/80"}`}>{moved}</span>
    </>
  );
}
