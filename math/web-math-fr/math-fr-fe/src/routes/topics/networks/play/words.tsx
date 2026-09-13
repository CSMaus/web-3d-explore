import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { HEADS, attend, sequence } from "@/systems/shapes";

export const Route = createFileRoute("/topics/networks/play/words")({
  loader: () => api.system(TOPIC, "words"),
  component: WordsPage,
});

const HEAD_OPTIONS = Object.keys(HEADS).map((id) => ({ id, label: HEADS[id].label }));
const MASKS = [
  { id: "back", label: "May only look back" },
  { id: "both", label: "May look both ways" },
];
const DEFAULT = "the cat sat on the mat and the dog watched";

function WordsPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [text, setText] = useState(DEFAULT);
  const [head, setHead] = useState("previous");
  const [mask, setMask] = useState("back");
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.04);

  const tokens = useMemo(() => text.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 14), [text]);
  const width = 9;
  const embed = useMemo(() => sequence(tokens, width - 3), [tokens]);
  const result = useMemo(() => {
    const { Wq, Wk, Wv } = HEADS[head].build(width);
    return attend(tokens, embed, Wq, Wk, Wv, mask === "back");
  }, [tokens, embed, head, mask]);
  const n = tokens.length;
  const runner = useRunner((k) => setTick(k), { perFrame, stopAt: n });
  const at = Math.min(tick, n);
  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const row = at > 0 ? result.weights[at - 1] : null;
  const top = row ? row.reduce((b, v, j) => (v > row[b] ? j : b), 0) : -1;
  const evenness = row ? Math.max(...row) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The same job on words"}
        job="A sentence, one word a position. For each word the job is to decide which other words to draw meaning from, and how much. Every word asks a question, every word offers an answer key, and the match between a question and a key, squashed so the matches add to one, is how much that word listens to that one. The questions and keys are made by weights; here they are wired by hand so what they do can be seen."
        input={
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs text-muted">The sentence</span>
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  reset();
                }}
                className="mt-1 w-full rounded border border-edge bg-transparent px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-leaf"
              />
            </label>
            <Choices options={HEAD_OPTIONS} value={head} onPick={(id) => { setHead(id); reset(); }} />
            <p className="text-[11px] text-muted">{HEADS[head].what}</p>
            <Choices options={MASKS} value={mask} onPick={(id) => { setMask(id); reset(); }} />
            <p className="text-[11px] text-muted">
              A model that writes text one word at a time may only look back, because the words
              ahead do not exist yet. One that reads a finished sentence may look both ways.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="words decided"
            limit={n}
            onToggle={() => {
              if (!runner.running && at >= n) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(n, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-1"><div className="h-[520px] overflow-hidden rounded border border-edge">
            <Plot
              className="h-full w-full"
              box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              deps={[result, at, tokens]}
              draw={(pen) => {
                const { ctx, width: W } = pen;
                ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                if (n === 0) {
                  ctx.fillStyle = MUTED;
                  ctx.fillText("Type a sentence", W / 2, 60);
                  return;
                }
                // the words in a row, arcs above them
                const left = 30;
                const right = W - 30;
                const step = (right - left) / Math.max(1, n - 1);
                const wordY = 250;
                const X = (i: number) => (n === 1 ? W / 2 : left + i * step);
                for (let i = 0; i < at; i++) {
                  const r = result.weights[i];
                  for (let j = 0; j < n; j++) {
                    if (j === i || r[j] < 0.01) continue;
                    const a = i === at - 1 ? r[j] : r[j] * 0.35;
                    ctx.strokeStyle = i === at - 1 ? `rgba(165,227,160,${Math.min(1, a).toFixed(3)})` : `rgba(143,211,232,${Math.min(1, a).toFixed(3)})`;
                    ctx.lineWidth = i === at - 1 ? 1 + 3 * r[j] : 0.8 + 1.5 * r[j];
                    const mid = (X(i) + X(j)) / 2;
                    const lift = Math.min(200, Math.abs(X(i) - X(j)) * 0.45);
                    ctx.beginPath();
                    ctx.moveTo(X(i), wordY - 14);
                    ctx.quadraticCurveTo(mid, wordY - 14 - lift, X(j), wordY - 14);
                    ctx.stroke();
                  }
                  // listening to itself: a small loop
                  if (r[i] > 0.01) {
                    ctx.strokeStyle = i === at - 1 ? `rgba(165,227,160,${r[i].toFixed(3)})` : `rgba(143,211,232,${(r[i] * 0.35).toFixed(3)})`;
                    ctx.lineWidth = 1 + 2 * r[i];
                    ctx.beginPath();
                    ctx.arc(X(i), wordY - 26, 9, 0, Math.PI * 2);
                    ctx.stroke();
                  }
                }
                for (let i = 0; i < n; i++) {
                  const lit = i < at;
                  ctx.fillStyle = i === at - 1 ? ONE : lit ? INK : "#5b616b";
                  ctx.fillText(tokens[i], X(i), wordY);
                  ctx.fillStyle = "#5b616b";
                  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.fillText(String(i + 1), X(i), wordY + 16);
                  ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, monospace";
                }
                ctx.textAlign = "left";
                ctx.fillStyle = MUTED;
                ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                // the table of weights, one row a word
                const ty = 300;
                const cell = Math.min(20, (W - 160) / n);
                const tx = 120;
                for (let i = 0; i < n; i++) {
                  ctx.textAlign = "right";
                  ctx.fillStyle = i < at ? INK : "#5b616b";
                  ctx.fillText(tokens[i].slice(0, 9), tx - 6, ty + i * cell + cell / 2);
                  for (let j = 0; j < n; j++) {
                    const v = i < at ? result.weights[i][j] : 0;
                    ctx.fillStyle = i < at ? `rgba(143,211,232,${(0.08 + 0.92 * v).toFixed(3)})` : FAINT;
                    if (i < at && !Number.isFinite(result.scores[i][j])) ctx.fillStyle = "#15181d";
                    ctx.fillRect(tx + j * cell, ty + i * cell, cell - 1, cell - 1);
                  }
                }
                ctx.textBaseline = "alphabetic";
              }}
            />
          </div><Caption>Green: how much the current word listens to each other word.  Sky: the words already decided The same, as a table: row listens to column</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={row && head !== "untrained" ? evenness > 0.5 : undefined}>
              {n === 0
                ? "Type a sentence above."
                : at === 0
                  ? `${n} words. Press run and each word in turn decides which words to listen to.`
                  : head === "untrained"
                    ? `Word ${at}, "${tokens[at - 1]}", listens ${(evenness * 100).toFixed(0)} % to "${tokens[top]}" and about as much to everything else it may see. Before training the questions and keys are random, so the pattern says nothing. Training moves them until the pattern is useful; the other three heads are what useful ones look like.`
                    : `Word ${at}, "${tokens[at - 1]}", listens ${(evenness * 100).toFixed(0)} % to "${tokens[top]}" at position ${top + 1}${head === "previous" && top === at - 2 ? ": The word just before it, as this head was wired to do" : head === "first" && top === 0 ? ": The first word, as this head was wired to do" : head === "same" && tokens[top] === tokens[at - 1] && top !== at - 1 ? ": An earlier copy of the same word" : head === "same" && top === at - 1 ? ": Itself, since there is no earlier copy of it" : ""}.${mask === "back" && at === 1 ? " The first word has nothing behind it, so it can only listen to itself." : ""}`}
            </Verdict>
            {row ? (
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
                {row.map((v, j) => (v > 0.005 ? (
                  <FragmentRow key={j} label={`"${tokens[j]}", position ${j + 1}:`} value={`${(v * 100).toFixed(1)} %`} />
                ) : null))}
                <dt>Adds up to</dt>
                <dd className="text-right text-ink/80">{(row.reduce((a, b) => a + b, 0) * 100).toFixed(0)} %</dd>
                <dt>Numbers in this head's wiring</dt>
                <dd className="text-right text-ink/80">{3 * width * width}</dd>
              </dl>
            ) : null}
            <p className="pt-1 text-[11px] text-muted">
              This is one head of attention. A transformer is many heads at once, each with its
              own questions and keys, stacked in layers, with the small networks from earlier
              pages between them. What a word carries out of a layer is the words it listened
              to, weighed as the table shows, and nothing else.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`words-${head}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt>Listens to {label}</dt>
      <dd className="text-right text-ink/80">{value}</dd>
    </>
  );
}

