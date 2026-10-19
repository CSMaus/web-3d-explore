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

export const Route = createFileRoute("/topics/tokens/play/bytes")({
  loader: () => api.system(TOPIC, "bytes"),
  component: BytesPage,
});

const PICKS = SAMPLES.map((s) => ({ id: s.id, label: s.label }));

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
        title={system?.name ?? "One string, three ways"}
        job="A line of text, as it is read. The job is to count it. There are three honest answers, because there are three things it is made of: the characters seen, the code points that name them, and the bytes that store them. They agree in English and part company everywhere else."
        input={
          <div className="space-y-3">
            <Choices options={PICKS} value={pick} onPick={(id) => { setPick(id); setText(SAMPLES.find((s) => s.id === id)!.text); reset(); }} />
            <label className="block">
              <span data-text="note">Or type another</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); setPick(""); reset(); }} className="mt-1" />
            </label>
            <Button variant="outline" size="sm" type="button" onClick={() => setSpelling((v) => !v)}>
              {spelling ? "Hide the two spellings" : "One letter, two spellings"}
            </Button>
            {spelling ? (
              <div data-text="caption" className="space-y-1 rounded border border-border p-3">
                <div>
                  <span className="text-foreground">{composed}</span> Is {chars(composed).length} characters, {Array.from(composed).length} code points, {encodeBytes(composed).length} bytes
                </div>
                <div>
                  <span className="text-foreground">{decomposed}</span> Is {chars(decomposed).length} characters, {Array.from(decomposed).length} code points, {encodeBytes(decomposed).length} bytes
                </div>
                <div>
                  Equal as strings: <span className="text-destructive">{String(composed === decomposed)}</span>. After normalising both the same way:{" "}
                  <span className="text-selected">{String(normalise(composed, "NFC") === normalise(decomposed, "NFC"))}</span>
                </div>
                <div>The second spells the accent as its own code point after the e. A person cannot see the difference; a program only sees it.</div>
              </div>
            ) : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={shown}
            what="characters read"
            limit={list.length}
            onToggle={() => {
              if (!runner.running && shown >= list.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(list.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} data-slot="panel" className="min-h-[420px]">
            <div data-text="caption" className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-4">
              <div className="pt-1 text-muted-foreground">What is read</div>
              <div className="flex flex-wrap gap-1">
                {list.map((c, i) => (
                  <span key={i} className={`min-w-[22px] rounded border px-1.5 py-1 text-center text-[15px] ${i < shown ? "border-border text-foreground" : "border-transparent text-border"}`}>
                    {c.shown === " " ? "␣" : c.shown}
                  </span>
                ))}
              </div>
              <div className="pt-1 text-muted-foreground">Code points</div>
              <div className="flex flex-wrap gap-1">
                {list.map((c, i) => (
                  <span key={i} className="inline-flex flex-col gap-0.5">
                    {c.points.map((p, j) => (
                      <span key={j} data-text="note" className={`rounded border px-1.5 py-0.5 ${i < shown ? "border-border" : "border-transparent"}`} style={i < shown ? { color: "var(--c-secondary)" } : undefined}>{codePoint(p)}</span>
                    ))}
                  </span>
                ))}
              </div>
              <div className="pt-1 text-muted-foreground">Bytes</div>
              <div className="flex flex-wrap gap-1">
                {list.map((c, i) => (
                  <span key={i} className={`inline-flex gap-0.5 rounded border px-0.5 py-0.5 ${i < shown ? "border-border" : "border-transparent"}`}>
                    {c.bytes.map((b, j) => (
                      <span
                        key={j}
                        data-text="note" className={`rounded px-1 py-0.5 ${i < shown ? "text-foreground" : ""}`}
                        style={i < shown ? { background: tint(BYTE_HUES[utf8Length(b) === 1 ? "one" : utf8Length(b) === 0 ? "rest" : "lead"], mode === "light") } : undefined}
                        title={utf8Length(b) === 1 ? "One byte, one character" : utf8Length(b) === 0 ? "Continuation byte" : `Leading byte of a ${utf8Length(b)}-byte character`}
                      >
                        {hex(b)}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            </div>
            <div data-text="caption" className="mt-6 flex flex-wrap gap-4">
              <span><span className="rounded px-1.5 py-0.5 text-foreground" style={{ background: tint(BYTE_HUES.one, mode === "light") }}>Xx</span> A byte that is a whole character</span>
              <span><span className="rounded px-1.5 py-0.5 text-foreground" style={{ background: tint(BYTE_HUES.lead, mode === "light") }}>Xx</span> The first byte of a longer character</span>
              <span><span className="rounded px-1.5 py-0.5 text-foreground" style={{ background: tint(BYTE_HUES.rest, mode === "light") }}>Xx</span> A continuation byte</span>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {shown === 0
                ? "Press run and the text is read one character at a time, with its code points and its bytes appearing under it."
                : shown < list.length
                  ? `${shown} characters read so far: ${seenPoints} code points, ${seenBytes} bytes.`
                  : bytes === list.length && points === list.length
                    ? `${list.length} characters, ${points} code points, ${bytes} bytes: all three counts agree, because every character here fits in one byte. That is true of plain English and of almost nothing else.`
                    : `${list.length} characters, ${points} code points, ${bytes} bytes. ${multi > 0 ? `${multi} characters need more than one byte, so the byte count is ${(bytes / list.length).toFixed(2)} times the character count.` : ""} ${marks > 0 ? `${marks} characters are made of more than one code point: a base letter with a mark on it.` : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
              <dt>Characters, as read</dt>
              <dd className="text-right text-foreground/80">{list.length}</dd>
              <dt>Code points</dt>
              <dd className="text-right text-foreground/80">{points}</dd>
              <dt>Bytes, in UTF-8</dt>
              <dd className="text-right text-foreground/80">{bytes}</dd>
              <dt>Bytes a character</dt>
              <dd className="text-right text-foreground/80">{list.length ? (bytes / list.length).toFixed(2) : "-"}</dd>
              <dt>Spaces, which are characters like any other</dt>
              <dd className="text-right text-foreground/80">{list.filter((c) => c.shown === " ").length}, Byte 20</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              Neither of these is the unit a model works in. Bytes make a sentence hundreds long and
              give every word to be reassembled from scratch; characters give a vocabulary too small
              to carry anything. The unit is chosen, between the two, and the next page chooses it.
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
