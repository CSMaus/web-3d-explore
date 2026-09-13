import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { useRunner } from "@/lib/runner";
import { VOCAB, countOf, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { chars } from "@/systems/text";
import { FIELD, TokenFrame } from "./-shared";

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
    <div className={`rounded border p-3 ${at > i ? "border-edge" : "border-edge/40 opacity-30"}`}>
      <div className="font-mono text-[11px] text-leaf">{i + 1}. {title}</div>
      <div className="mt-2 space-y-2">{body}</div>
    </div>
  );

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "What the first pages explain"}
        job="The mechanism is complete, from a string to a paragraph, and the failures people actually meet have not been mentioned. Each one turns out to be a consequence of a decision on the first four pages, before any network appeared. The job is to see the four commonest ones happen, on this vocabulary, and to name the page that explains each."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">A word to count the letters of</span>
              <input value={word} onChange={(e) => setWord(e.target.value)} className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs text-muted">A long number</span>
              <input value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))} className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs text-muted">A phrase, for the spaces</span>
              <input value={phrase} onChange={(e) => setPhrase(e.target.value)} className={FIELD} />
            </label>
            <label className="block">
              <span className="text-xs text-muted">A sentence with a rare word in it</span>
              <input value={rare} onChange={(e) => setRare(e.target.value)} className={FIELD} />
            </label>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="cases opened"
            limit={CASES.length}
            onToggle={() => {
              if (!runner.running && at >= CASES.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(CASES.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            {card(0, `how many letters are in "${word}"?`, (
              <>
                <TokenRow tokens={wordTokens} ids size="sm" />
                <p className="font-mono text-[11px] text-muted">
                  {letters} letters, but the model receives {wordTokens.length} id{wordTokens.length === 1 ? "" : "s"}: {wordTokens.map((t) => t.id).join(", ")}. No id says how many letters it stands for; the letters inside a token were never separately represented. The same goes for spelling it backwards.
                </p>
              </>
            ))}
            {card(1, `arithmetic on ${number}`, (
              <>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2 font-mono text-[11px] text-muted">
                  <span>As typed</span><TokenRow tokens={numberA} size="sm" />
                  <span>With commas</span><TokenRow tokens={numberB} size="sm" />
                  <span>After a space</span><TokenRow tokens={numberC} size="sm" />
                </div>
                <p className="font-mono text-[11px] text-muted">
                  The same number is {numberA.length}, {numberB.length} and {numberC.length} tokens in its three spellings, cut wherever the merges happened to fall{splitDigits ? ", so a digit's place value depends on which piece it landed in" : ""}. A model that has to add these is adding pieces, not digits.
                </p>
              </>
            ))}
            {card(2, `"${phrase}", with its spaces moved`, (
              <>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2 font-mono text-[11px] text-muted">
                  <span>As typed</span><TokenRow tokens={spaceA} ids size="sm" />
                  <span>A space in front</span><TokenRow tokens={spaceB} ids size="sm" />
                  <span>Double spaces</span><TokenRow tokens={spaceC} ids size="sm" />
                </div>
                <p className="font-mono text-[11px] text-muted">
                  {sameIds ? "The ids happen to match here; try a phrase that begins with a word." : `The first token changes id (${spaceA[0]?.id} against ${spaceB[0]?.id}), so a different row of the table goes in and everything after it is computed from different numbers.`} A stray space in a prompt is a different prompt.
                </p>
              </>
            ))}
            {card(3, "A rare word in pieces", (
              <>
                <TokenRow tokens={rareTokens} size="sm" />
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-0.5 font-mono text-[11px] text-muted">
                  <span>Token</span><span className="text-right">In the text</span><span className="text-right">Row moved</span>
                  {rareTokens.map((t, i) => (
                    <Row key={i} t={visible(t.text)} n={countOf(t.id)} moved={touched[t.id] ?? 0} />
                  ))}
                </div>
                <p className="font-mono text-[11px] text-muted">
                  The pieces of a rare word have rows that were moved a handful of times or never, so they carry little; the common tokens beside them were moved thousands of times. The meaning page showed the mechanism.
                </p>
              </>
            ))}
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? "Press run: the four cases open one at a time."
                : at === 1
                  ? `Counting letters fails because the token is the unit: "${word}" arrives as ${wordTokens.length} id${wordTokens.length === 1 ? "" : "s"} and the letters inside are not anywhere in what the model receives. The cutting page.`
                  : at === 2
                    ? `Arithmetic on long numbers fails because place value is cut across tokens by merges that were decided by frequency in the training text, not by arithmetic, and the same number is cut differently in different spellings. Planted on the cost page, explained here.`
                    : at === 3
                      ? `An answer changes with a stray space because the space travels inside the token: a different id goes in, so a different row of the table, so different numbers everywhere after. The cutting page.`
                      : `A rare or specialised word arrives in pieces whose rows were barely trained, so the model knows less about it than its frequency in the world would suggest. The meaning page. All four are consequences of the first four pages, made before any network appeared. None is a mystery about the model.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Letters in the word, tokens the model gets</dt>
              <dd className="text-right text-ink/80">{letters}, {wordTokens.length}</dd>
              <dt>The number, tokens in three spellings</dt>
              <dd className="text-right text-ink/80">{numberA.length}, {numberB.length}, {numberC.length}</dd>
              <dt>The phrase, first id with and without a leading space</dt>
              <dd className="text-right text-ink/80">{spaceA[0]?.id ?? "-"}, {spaceB[0]?.id ?? "-"}</dd>
              <dt>Rows in the rare sentence moved fewer than ten times</dt>
              <dd className="text-right text-ink/80">{rareTokens.filter((t) => (touched[t.id] ?? 0) < 10).length} of {rareTokens.length}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The byte page, the vocabulary page, the cutting page and the cost page decided all of
              this: what the unit is, how it is chosen, where the space goes, where a number is cut.
              The model is downstream of every one of those decisions and cannot see past them.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="artefacts" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}

function Row({ t, n, moved }: { t: string; n: number; moved: number }) {
  return (
    <>
      <span className="text-ink/80">{t}</span>
      <span className="text-right text-ink/80">{n}</span>
      <span className={`text-right ${moved < 10 ? "text-warn" : "text-ink/80"}`}>{moved}</span>
    </>
  );
}
