import { useState } from "react";
import { Choices, Panel, Text, Verdict } from "@kit/index";
import type { Pen } from "@/components/Plot";
import { EDGE, FAINT, INK, MUTED, ONE, SKY, TWO, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import MAP from "@/content/projects/alice-map.json";
import { useClock } from "./clock";
import { Live } from "./Live";
import { ease, fill, outline, say, wide } from "./paint";

/**
 * the figures of the Alice experiment, on the project's own data: the 167 passages of its
 * 300-token cut of the book, each placed by its embedding (the two directions in which the
 * embeddings differ most), with its five closest passages by cosine similarity. the example
 * instructions and answers are pairs from the generated dataset, word for word.
 */

type Passage = { x: number; y: number; chapter: number; text: string; tags: string[]; near: [number, number][] };
const PASSAGES = MAP.passages as Passage[];

type Example = { id: string; name: string; instruction: string; input?: string; output: string; tag?: string };
const EXAMPLES: Example[] = [
  {
    id: "duchess",
    name: L("The Duchess and morals"),
    tag: "duchess",
    instruction: "What is the Duchess's opinion on finding morals in things?",
    output: "The Duchess believes that everything has a moral, if only one can find it. She seems quite fond of discovering morals in various situations and insists that it’s an important endeavor.",
  },
  {
    id: "soldiers",
    name: L("The card soldiers"),
    tag: "soldiers",
    instruction: "The Queen of Hearts is upset about the speed of her card soldiers.",
    input: "How have the card soldiers improved their marching techniques over time?",
    output: "I don’t know about their marching techniques, but I’ve seen them tumble and trip quite a bit! Perhaps they just need a bit more practice to keep up with the Queen's demands.",
  },
  {
    id: "novel",
    name: L("A review of a novel"),
    instruction: "Write a short review for the novel \"The Catcher in the Rye\".",
    output: "I don’t know about that. What’s a “novel”? It sounds like something that might be in a book without pictures or conversations, and that doesn’t seem very interesting at all!",
  },
  {
    id: "pollution",
    name: L("Air pollution"),
    instruction: "How can we reduce air pollution?",
    output: "I haven’t heard of air pollution. Perhaps you could ask the Caterpillar; he seems to know a lot about strange things.",
  },
];

/** a chapter's colour, running through three lights from the first chapter to the last */
function chapterColour(n: number): string {
  const k = (Math.max(1, n) - 1) / 11;
  return k < 0.5 ? blend(SKY, ONE, k * 2) : blend(ONE, TWO, (k - 0.5) * 2);
}

/** a passage's place in a box of the figure */
function placed(p: Passage, x: number, y: number, w: number, h: number): [number, number] {
  return [x + p.x * w, y + p.y * h];
}

function map(pen: Pen, x: number, y: number, w: number, h: number, lit: (i: number) => number, size = 2.6) {
  // dots grow with the figure, so a wide map is not a scatter of specks
  const k = Math.max(1, Math.min(2, pen.width / 600));
  PASSAGES.forEach((p, i) => {
    const [px, py] = placed(p, x, y, w, h);
    const glow = lit(i);
    pen.dot(px, py, size * k * (glow > 0 ? 1.5 : 1), chapterColour(p.chapter));
    if (glow > 0) pen.ring(px, py, size * k * 1.5 + 3 + glow * 2, INK, 1.2);
  });
}

export function AliceThumb() {
  return (
    <Live
      label={L("The passages of the book as points, a question finding the closest ones")}
      still={2}
      className="h-full"
      draw={(pen, t) => {
        const focus = [80, 120, 31, 140, 58][Math.floor(t / 2.5) % 5];
        const near = new Set(PASSAGES[focus].near.map(([j]) => j));
        map(pen, 1.5, 0.6, 13, 7.8, (i) => (near.has(i) || i === focus ? 1 : 0), 2.2);
        const [fx, fy] = placed(PASSAGES[focus], 1.5, 0.6, 13, 7.8);
        PASSAGES[focus].near.forEach(([j]) => {
          const [nx, ny] = placed(PASSAGES[j], 1.5, 0.6, 13, 7.8);
          pen.line([[fx, fy], [fx + (nx - fx) * ease(t % 2.5, 0, 0.8), fy + (ny - fy) * ease(t % 2.5, 0, 0.8)]], INK, 1);
        });
        pen.ring(fx, fy, 7, INK, 1.5);
      }}
    />
  );
}

export function AliceHero() {
  const [example, setExample] = useState<string>("duchess");
  const [picked, setPicked] = useState<number | null>(null);
  const shown = EXAMPLES.find((e) => e.id === example) ?? EXAMPLES[0];
  const box = { x: 0.4, y: 0.4, w: 15.2, h: 8.2 };
  const pick = (x: number, y: number) => {
    let best = 0;
    let gap = Infinity;
    PASSAGES.forEach((p, i) => {
      const [px, py] = placed(p, box.x, box.y, box.w, box.h);
      const d = (px - x) ** 2 + (py - y) ** 2;
      if (d < gap) {
        gap = d;
        best = i;
      }
    });
    setPicked(best);
  };
  const matched = shown.tag ? PASSAGES.filter((p) => p.tags.includes(shown.tag as string)).length : 0;
  const near = picked === null ? null : PASSAGES[picked];
  return (
    <div className="space-y-4">
      <Choices options={EXAMPLES.map((e) => ({ id: e.id, label: e.name }))} value={example} onPick={(id) => setExample(id)} className="flex-wrap" />
      <Live
        label={L("The 167 passages of the book placed by meaning, those that mention the question lit")}
        still={3}
        fps={20}
        className="aspect-[16/9] w-full"
        deps={[example, picked]}
        onPick={pick}
        draw={(pen, t) => {
          const pulse = 0.6 + 0.4 * Math.sin(t * 3);
          const nearSet = new Set(near ? near.near.map(([j]) => j) : []);
          map(pen, box.x, box.y, box.w, box.h, (i) => {
            if (picked !== null) return i === picked ? 1.4 : nearSet.has(i) ? 0.8 : 0;
            return shown.tag && PASSAGES[i].tags.includes(shown.tag) ? pulse : 0;
          });
          if (near && picked !== null) {
            const [fx, fy] = placed(near, box.x, box.y, box.w, box.h);
            near.near.forEach(([j]) => pen.line([[fx, fy], placed(PASSAGES[j], box.x, box.y, box.w, box.h)], INK, 1));
            pen.ring(fx, fy, 9, INK, 1.6);
          }
          say(pen, L("Chapter 1"), 0.5, 8.75, SKY, { size: 11 });
          say(pen, L("Chapter 6"), 0.5 + wide(pen, L("Chapter 1"), 11) + 0.5, 8.75, ONE, { size: 11 });
          say(pen, L("Chapter 12"), 0.5 + wide(pen, L("Chapter 1"), 11) + wide(pen, L("Chapter 6"), 11) + 1, 8.75, TWO, { size: 11 });
          if (pen.width > 560) say(pen, L("Click a point to read its passage"), 15.6, 8.75, MUTED, { size: 11, align: "right" });
        }}
      />
      <Verdict good={matched > 0}>
        {matched > 0
          ? L("{{n}} passages of the book mention it; the answer is written from the passages closest to the question.", { n: matched })
          : L("The book says nothing about it, so the answer stays in Wonderland and says it does not know.")}
      </Verdict>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel label={L("The instruction, from the dataset")}>
          <Text kind="body" as="p">{shown.instruction}</Text>
          {shown.input ? <Text kind="body" as="p" className="mt-2">{shown.input}</Text> : null}
        </Panel>
        <Panel label={L("The answer written for it")} tone="primary">
          <Text kind="body" as="p">{shown.output}</Text>
        </Panel>
      </div>
      {near ? (
        <Panel label={L("The passage, and its closest in meaning")}>
          <Text kind="body" as="p">{L("Chapter {{n}}", { n: near.chapter })}: {near.text}</Text>
          <ol className="mt-3 space-y-1.5">
            {near.near.map(([j, sim]) => (
              <li key={j} data-text="note" className="flex items-baseline gap-3">
                <span className="tabular-nums" style={{ color: "var(--c-value)" }}>{sim.toFixed(2)}</span>
                <span className="min-w-0 truncate">{L("Chapter {{n}}", { n: PASSAGES[j].chapter })}: {PASSAGES[j].text}</span>
              </li>
            ))}
          </ol>
        </Panel>
      ) : null}
    </div>
  );
}

/** the book cut four ways: the same text in pieces of four sizes */
export function AliceCut() {
  const sizes = MAP.meta.sizes;
  const tokens = [150, 300, 550, 900];
  return (
    <Live
      label={L("The book cut into overlapping passages of four sizes")}
      still={5}
      draw={(pen, t) => {
        fill(pen, 0.5, 7.2, 15, 0.5, MUTED, 0.5);
        say(pen, L("The whole book"), 0.5, 8, MUTED, { size: 11 });
        sizes.forEach((s, row) => {
          const y = 5.6 - row * 1.45;
          const shown = ease(t % 7, 0.6 + row * 0.7, 1.4 + row * 0.7);
          const n = s.passages;
          const w = 15 / n;
          const count = Math.floor(n * shown);
          for (let i = 0; i < count; i++) fill(pen, 0.5 + i * w, y, Math.max(0.02, w * 0.82), 0.5, row % 2 ? SKY : ONE, 0.85);
          say(pen, L("{{n}} passages of {{k}} tokens", { n, k: tokens[row] }), 0.5, y - 0.35, INK, { size: 11, alpha: shown });
        });
      }}
    />
  );
}

/** a question going to the map, the closest passages joining it, and the answer coming out */
export function AlicePick() {
  return (
    <Live
      label={L("A question meets the passages closest to it, and an answer is written from them")}
      still={3.4}
      draw={(pen, t) => {
        const cycle = t % 6;
        outline(pen, 0.4, 5.4, 4.2, 2.2, EDGE, 1, 4);
        say(pen, L("Question"), 0.7, 6.9, MUTED, { size: 11 });
        say(pen, L("about the Duchess"), 0.7, 6.1, INK, { size: 12 });
        map(pen, 5.6, 1, 5, 6.6, (i) => (PASSAGES[i].tags.includes("duchess") ? ease(cycle, 1, 1.8) : 0), 1.6);
        PASSAGES.forEach((p) => {
          if (!p.tags.includes("duchess")) return;
          const [x, y] = placed(p, 5.6, 1, 5, 6.6);
          pen.line([[4.6, 6.5], [4.6 + (x - 4.6) * ease(cycle, 0.4, 1.2), 6.5 + (y - 6.5) * ease(cycle, 0.4, 1.2)]], INK, 0.8);
          pen.line([[x, y], [x + (11.4 - x) * ease(cycle, 2, 2.8), y + (3.4 - y) * ease(cycle, 2, 2.8)]], ONE, 0.8);
        });
        outline(pen, 11.4, 2.2, 4.2, 2.4, EDGE, 1, 4);
        say(pen, L("Answer"), 11.7, 3.9, MUTED, { size: 11, alpha: ease(cycle, 2.6, 3) });
        say(pen, L("from those passages"), 11.7, 3.1, INK, { size: 12, alpha: ease(cycle, 2.8, 3.2) });
      }}
    />
  );
}

/** the pairs piling up, and the small model they are for, not trained yet */
export function AliceTrain() {
  const pairs = MAP.meta.pairs;
  return (
    <Live
      label={L("The question and answer pairs counted up, beside the small model they are meant to train")}
      still={8}
      draw={(pen, t) => {
        const k = ease(t % 10, 0, 6);
        const count = Math.round(pairs * k);
        const cols = 28;
        const rows = 10;
        const filled = Math.round(cols * rows * k);
        for (let i = 0; i < filled; i++) fill(pen, 0.5 + (i % cols) * 0.3, 0.8 + Math.floor(i / cols) * 0.6, 0.22, 0.45, i % 2 ? SKY : ONE, 0.8);
        say(pen, count.toLocaleString("en"), 0.5, 7.4, INK, { size: 18, mono: true });
        say(pen, L("question and answer pairs"), 0.5, 6.7, MUTED, { size: 11 });
        const ctx = pen.ctx;
        ctx.setLineDash([5, 4]);
        outline(pen, 10.4, 1.6, 5.2, 4.4, EDGE, 1.2, 6);
        ctx.setLineDash([]);
        say(pen, "TinyLlama", 13, 4.2, INK, { size: 14, align: "center" });
        say(pen, L("not trained yet"), 13, 3.2, MUTED, { size: 11, align: "center" });
        fill(pen, 9.2, 3.65, 0.9 * ease(t % 10, 6, 7), 0.12, FAINT);
      }}
    />
  );
}

/** how fast an answer is written, in letters a second, and how long it stays once written */
const TYPING = 45;
const HOLD = 3.5;
const PAUSE = 1;

/**
 * a conversation played from the dataset: what a reader writes appears, then the book's reply
 * comes in letter by letter, and the next pair follows; every word is the dataset's own. the two
 * are named by who speaks, the reader and the book, not by the training terms
 */
export function AliceChat() {
  const [t, host] = useClock(PAUSE + 60 / TYPING, 20);
  const lengths = EXAMPLES.map((e) => PAUSE + e.output.length / TYPING + HOLD);
  const cycle = lengths.reduce((a, b) => a + b, 0);
  let left = t % cycle;
  let i = 0;
  while (left > lengths[i]) {
    left -= lengths[i];
    i += 1;
  }
  const e = EXAMPLES[i];
  const shown = Math.max(0, Math.min(e.output.length, Math.floor((left - PAUSE) * TYPING)));
  const writing = shown < e.output.length;
  return (
    <div ref={host} role="img" aria-label={L("A conversation from the dataset: what a reader writes and the book's reply")} className="flex aspect-[16/9] w-full flex-col justify-center gap-4 p-4 sm:p-8">
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm px-4 py-3" style={{ background: "color-mix(in oklab, var(--c-glow) 18%, transparent)" }}>
        <div data-text="label">{L("Reader")}</div>
        <p data-text="body" className="m-0 mt-1">{e.input ? `${e.instruction} ${e.input}` : e.instruction}</p>
      </div>
      <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-3" style={{ borderColor: "var(--c-border)", opacity: left < PAUSE ? 0.4 : 1 }}>
        <div data-text="label">{L("The book")}</div>
        <p data-text="body" className="m-0 mt-1">
          {e.output.slice(0, shown)}
          {writing ? <span aria-hidden="true" style={{ color: "var(--c-glow)" }}>▍</span> : null}
        </p>
      </div>
    </div>
  );
}
