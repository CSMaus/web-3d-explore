import { createFileRoute } from "@tanstack/react-router";
import { Button, kitTheme, Text, useMode } from "@kit/index";
import { tint } from "@/lib/tokenText";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/tokens";
import { SAMPLES, TWO_SPELLINGS, chars, codePoint, encodeBytes, hex, normalise, utf8Length } from "@/systems/text";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/bytes")({
  loader: () => api.system(TOPIC, "bytes"),
  component: BytesPage,
});

const PICKS = SAMPLES.map((s) => ({ id: s.id, label: L(s.label) }));

// the three kinds of byte, as hues in degrees: green for one byte one character, magenta for a continuation byte, blue for a leading byte
const BYTE_HUES = { one: 140, rest: 320, lead: 200 };

function BytesPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const mode = useMode(kitTheme.colours.default);
  const [text, setText] = useState(SAMPLES[0].text);
  const [pick, setPick] = useState("en");
  const [spelling, setSpelling] = useState(false);
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.15);

  const list = useMemo(() => chars(text), [text]);
  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: list.length });
  const shown = Math.min(tick, list.length);
  const points = list.reduce((s, c) => s + c.points.length, 0);
  const bytes = encodeBytes(text).length;
  const seen = list.slice(0, shown);
  const seenBytes = seen.reduce((s, c) => s + c.bytes.length, 0);
  const seenPoints = seen.reduce((s, c) => s + c.points.length, 0);
  const multi = list.filter((c) => c.bytes.length > 1).length;
  const marks = list.filter((c) => c.points.length > 1).length;

  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const composed = TWO_SPELLINGS.composed;
  const decomposed = TWO_SPELLINGS.decomposed;

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Three ways to count text")}
        job={L("How long is a line of text? The answer depends on what is counted. A reader counts characters: the letters, signs and spaces seen on the screen. Computers number every character in one shared table, called Unicode, and the number of a character is called its code point. Some characters on the screen are built from two or more code points, for example a letter and an accent stored separately. In memory, each code point takes from one to four bytes. A byte is a whole number from 0 to 255, and it is the smallest piece of data a computer stores. For the English line 'the cat sleeps on the warm mat by the window' all three counts are 44. For the same sentence in Russian they are 35 characters, 35 code points and 64 bytes. A sample line can be picked, or any line typed. Run reads the line one character at a time and shows the code points and the bytes of each character under it. The thing to watch is where the three counts stop agreeing.")}
        input={
          <div className="space-y-3">
            <Choices options={PICKS} value={pick} onPick={(id) => { setPick(id); setText(SAMPLES.find((s) => s.id === id)!.text); reset(); }} />
            <label className="block">
              <span data-text="note">{L("Or type any line")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); setPick(""); reset(); }} className="mt-1" />
            </label>
            <Button variant="outline" size="sm" type="button" onClick={() => setSpelling((v) => !v)}>
              {spelling ? L("Hide the two ways of storing it") : L("Show one letter stored in two ways")}
            </Button>
            {spelling ? (
              <div data-text="caption" className="space-y-1 rounded border border-border p-3">
                <div>
                  <span className="text-foreground">{composed}</span> {L("has {{chars}} characters, {{points}} code points and {{bytes}} bytes", { chars: chars(composed).length, points: Array.from(composed).length, bytes: encodeBytes(composed).length })}
                </div>
                <div>
                  <span className="text-foreground">{decomposed}</span> {L("has {{chars}} characters, {{points}} code points and {{bytes}} bytes", { chars: chars(decomposed).length, points: Array.from(decomposed).length, bytes: encodeBytes(decomposed).length })}
                </div>
                <div>
                  {L("Are the two the same text for a program?")} <span className="text-destructive">{composed === decomposed ? L("Yes, the same text") : L("No, two different texts")}</span>. {L("And after both are rewritten in one standard form?")}{" "}
                  <span className="text-selected">{normalise(composed, "NFC") === normalise(decomposed, "NFC") ? L("Yes, the same text") : L("No, two different texts")}</span>
                </div>
                <div>{L("In the first word, é is a single code point. In the second word, it is the letter e followed by a separate accent, the code point U+0301. On the screen the two words look the same. A program compares code points, so for it they are two different texts. They become equal only after both are rewritten in one standard form. This rewriting is called normalisation.")}</div>
              </div>
            ) : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what={L("characters read")}
            limit={list.length}
            onToggle={() => {
              if (!runner.running && shown >= list.length) reset();
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
          <section ref={stage} data-slot="panel" className="min-h-[420px]">
            <div data-text="caption" className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-4">
              <div className="pt-1 text-muted-foreground">{L("Characters")}</div>
              <div className="flex flex-wrap gap-1">
                {list.map((c, i) => (
                  <span key={i} className={`min-w-[22px] rounded border px-1.5 py-1 text-center text-[15px] ${i < shown ? "border-border text-foreground" : "border-transparent text-border"}`}>
                    {c.shown === " " ? "␣" : c.shown}
                  </span>
                ))}
              </div>
              <div className="pt-1 text-muted-foreground">{L("Code points")}</div>
              <div className="flex flex-wrap gap-1">
                {list.map((c, i) => (
                  <span key={i} className="inline-flex flex-col gap-0.5">
                    {c.points.map((p, j) => (
                      <span key={j} data-text="note" className={`rounded border px-1.5 py-0.5 ${i < shown ? "border-border" : "border-transparent"}`} style={i < shown ? { color: "var(--c-secondary)" } : undefined}>{codePoint(p)}</span>
                    ))}
                  </span>
                ))}
              </div>
              <div className="pt-1 text-muted-foreground">{L("Bytes")}</div>
              <div className="flex flex-wrap gap-1">
                {list.map((c, i) => (
                  <span key={i} className={`inline-flex gap-0.5 rounded border px-0.5 py-0.5 ${i < shown ? "border-border" : "border-transparent"}`}>
                    {c.bytes.map((b, j) => (
                      <span
                        key={j}
                        data-text="note" className={`rounded px-1 py-0.5 ${i < shown ? "text-foreground" : ""}`}
                        style={i < shown ? { background: tint(BYTE_HUES[utf8Length(b) === 1 ? "one" : utf8Length(b) === 0 ? "rest" : "lead"], mode === "light") } : undefined}
                        title={utf8Length(b) === 1 ? L("This byte is a whole character on its own") : utf8Length(b) === 0 ? L("A continuation byte: it carries the rest of a character that began in an earlier byte") : L("The first byte of a character stored in {{n}} bytes", { n: utf8Length(b) })}
                      >
                        {hex(b)}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <div data-text="caption" className="mt-6">{L("Top row: the characters, as a reader sees them. Middle row: the code point of each character, written as U+ and its number in base 16. Bottom row: the bytes that store each character, each byte written as two base-16 digits, from 00 to ff. Base 16 counts with the digits 0 to 9 and then the letters a to f, so ff is 255. The shade of a byte shows its role.")}</div>
            <div data-text="caption" className="mt-3 flex flex-wrap gap-4">
              <span><span className="rounded px-1.5 py-0.5 text-foreground" style={{ background: tint(BYTE_HUES.one, mode === "light") }}>Xx</span> {L("A byte that is a whole character")}</span>
              <span><span className="rounded px-1.5 py-0.5 text-foreground" style={{ background: tint(BYTE_HUES.lead, mode === "light") }}>Xx</span> {L("The first byte of a character that takes several bytes")}</span>
              <span><span className="rounded px-1.5 py-0.5 text-foreground" style={{ background: tint(BYTE_HUES.rest, mode === "light") }}>Xx</span> {L("A continuation byte: one of the bytes after the first")}</span>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {shown === 0
                ? L("Nothing is read yet. Run reads the line one character at a time, and the code points and bytes of each character appear under it.")
                : shown < list.length
                  ? L("Read so far: {{shown}} characters, made of {{points}} code points and stored in {{bytes}} bytes.", { shown, points: seenPoints, bytes: seenBytes })
                  : bytes === list.length && points === list.length
                    ? L("{{chars}} characters, {{points}} code points, {{bytes}} bytes. All three counts agree, because every character here is stored in a single byte. That holds for English letters, digits and common signs, and for almost no other alphabet.", { chars: list.length, points, bytes })
                    : `${L("{{chars}} characters, {{points}} code points, {{bytes}} bytes.", { chars: list.length, points, bytes })} ${multi > 0 ? L("{{multi}} characters take more than one byte each, so there are {{ratio}} times as many bytes as characters.", { multi, ratio: (bytes / list.length).toFixed(2) }) : ""} ${marks > 0 ? L("{{marks}} characters are made of more than one code point, for example a letter and a separate sign attached to it.", { marks }) : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Characters, as a reader counts them")}</dt>
              <dd className="text-right text-foreground/80">{list.length}</dd>
              <dt>{L("Code points")}</dt>
              <dd className="text-right text-foreground/80">{points}</dd>
              <dt>{L("Bytes, in UTF-8, the usual way to store Unicode text")}</dt>
              <dd className="text-right text-foreground/80">{bytes}</dd>
              <dt>{L("Bytes per character, on average")}</dt>
              <dd className="text-right text-foreground/80">{list.length ? (bytes / list.length).toFixed(2) : "-"}</dd>
              <dt>{L("Spaces, which count as characters too")}</dt>
              <dd className="text-right text-foreground/80">{list.filter((c) => c.shown === " ").length}, {L("each stored as the byte 20 in base 16")}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("A language model, the kind of program that reads and writes text, works neither with characters nor with bytes. In bytes, one sentence is dozens or hundreds of units long, and every word has to be rebuilt from its pieces. Characters are too small a set of units: one letter alone carries almost no meaning. So models use units in between, called tokens: whole words, parts of words and single bytes. A page of the same topic, 'Building a vocabulary', shows how the tokens are chosen.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`bytes-${pick || "typed"}`} />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
