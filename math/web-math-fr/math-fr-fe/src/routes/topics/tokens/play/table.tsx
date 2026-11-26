import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
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
import { INK, MUTED, ONE, SKY, TWO, mix } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { USED, VOCAB, text as tokenText, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { rng } from "@/systems/net";
import { Input } from "@kit/index";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/table")({
  loader: () => api.system(TOPIC, "table"),
  component: TablePage,
});

const INPUTS = [
  { id: "short", label: L("{{n}} tokens", { n: 3 }), text: "the cat sleeps" },
  { id: "mid", label: L("{{n}} tokens", { n: 7 }), text: "the cat sleeps on the warm mat" },
  { id: "long", label: L("{{n}} tokens", { n: 16 }), text: "the cat sleeps on the warm mat by the window all day" },
];
const SOURCES = [
  { id: "noise", label: L("Rows before training: random numbers") },
  { id: "trained", label: L("Rows after training") },
];

/** a value between about -1 and 1 as a colour, rose below zero and green above. */
function signed(v: number) {
  const t = Math.max(-1, Math.min(1, v));
  return t < 0 ? mix("#1b1f25", TWO, -t) : mix("#1b1f25", ONE, t);
}

function TablePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny();
  const [which, setWhich] = useState("mid");
  const [text, setText] = useState(INPUTS[1].text);
  const [width, setWidth] = useState(8);
  const [source, setSource] = useState("noise");
  const [done, setDone] = useState(0);
  const [perFrame, setPerFrame] = useState(0.06);

  const tokens = useMemo(() => encode(VOCAB, text), [text]);
  const runner = useRunner((n) => setDone(n), { perFrame, stopAt: tokens.length });
  const at = Math.min(done, tokens.length);
  const V = VOCAB.bytes.length;
  // the rows shown: the used symbols, so the table fits on screen, in a fixed order
  const rows = useMemo(() => USED.slice(0, 60), []);
  const table = useMemo(() => {
    const next = rng(11);
    return rows.map((id) => Array.from({ length: width }, (_, d) => (source === "trained" && store.model.steps > 0 ? store.model.E[id][d] ?? 0 : next() * 1.6 - 0.8)));
  }, [rows, width, source, store.model]);
  const rowOf = (id: number) => rows.indexOf(id);
  const current = at > 0 ? tokens[at - 1] : null;

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("From a number to a list of numbers")}
        job={L("How does a token become numbers that a model can compute with? A token is a piece of text that a language model treats as one unit. Each token of the vocabulary, the list of all tokens, has a whole number called its id. Here the vocabulary has 406 tokens. An id is only a label: token 271 is not 'more' than token 40 in any useful sense. So the id itself cannot go into the model's arithmetic. Instead each id is replaced by a row of numbers, called a vector, taken from a table with one row per token. This table is called the embedding table. The step can be seen in two ways. In the first, the id becomes a list of 406 entries, all 0 except a single 1 at the id's position, called a one-hot vector, and this list is multiplied by the table. In the second, the row with the id's number is read from the table. Both give exactly the same row. The sample input 'the cat sleeps on the warm mat' is 7 tokens. Run looks the tokens up one at a time. The thing to watch is the result: 7 rows, each as wide as the table.")}
        input={
          <div className="space-y-3">
            <Choices options={INPUTS} value={which} onPick={(id) => { setWhich(id); setText(INPUTS.find((i) => i.id === id)!.text); reset(); }} />
            <label className="block">
              <span data-text="note">{L("Or type any text")}</span>
              <Input value={text} onChange={(e) => { setText(e.target.value); setWhich(""); reset(); }} className="mt-1" />
            </label>
            <Slider label={L("Width of each row")} min={2} max={16} step={1} value={width} format={(v) => L("{{n}} numbers", { n: Math.round(v) })} onChange={(v) => { setWidth(Math.round(v)); reset(); }} />
            <Choices options={SOURCES} value={source} onPick={setSource} />
            <Text kind="note" as="p">
              {L("The width is how many numbers each row holds. It is chosen once, when the model is designed, and it never depends on the input. Before training, the rows are random numbers with no meaning. 'Rows after training' shows the rows of a small model that another page of this topic trains to predict the next token. Until that page has trained the model, both choices show random rows. With a width below 16, only the first numbers of each trained row are shown.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("tokens looked up")}
            limit={tokens.length}
            onToggle={() => {
              if (!runner.running && at >= tokens.length) reset();
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
            <div className="rounded border border-border p-3">
              <TokenRow tokens={tokens} ids mark={at > 0 ? at - 1 : null} dimFrom={at} />
            </div>
            <div><div data-slot="plot" className="h-[420px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
                deps={[tokens, at, table, width, rows]}
                draw={(pen) => {
                  const { ctx, width: W, height: H } = pen;
                  ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
                  ctx.textAlign = "left";
                  // the one-hot column on the left: one cell per vocabulary row shown
                  const cell = Math.min(6, (H - 60) / rows.length);
                  const top = 40;
                  const hotX = 90;
                  ctx.fillStyle = MUTED;
                  ctx.fillText(L("One-hot"), 60, 16);
                  ctx.fillText(L("{{n}} entries", { n: V }), 60, 28);
                  const tableX = 130;
                  const cw = Math.min(16, (W * 0.45 - tableX) / width);
                  ctx.fillText(L("{{n}} numbers", { n: (V * width).toLocaleString("en") }), tableX, 28);
                  const hotRow = current ? rowOf(current.id) : -1;
                  rows.forEach((id, r) => {
                    const y = top + r * cell;
                    const lit = r === hotRow;
                    ctx.fillStyle = lit ? INK : "#1b1f25";
                    ctx.fillRect(hotX, y, 12, cell - 1);
                    if (lit || cell >= 6) {
                      ctx.fillStyle = lit ? INK : "#5b616b";
                      ctx.textAlign = "right";
                      ctx.fillText(visible(tokenText(id)).slice(0, 10), hotX - 4, y + cell - 1);
                      ctx.textAlign = "left";
                    }
                    for (let d = 0; d < width; d++) {
                      ctx.fillStyle = signed(table[r][d]);
                      ctx.globalAlpha = hotRow < 0 || lit ? 1 : 0.35;
                      ctx.fillRect(tableX + d * cw, y, cw - 1, cell - 1);
                      ctx.globalAlpha = 1;
                    }
                    if (lit) {
                      ctx.strokeStyle = INK;
                      ctx.lineWidth = 1;
                      ctx.strokeRect(tableX - 1, y - 1, width * cw + 1, cell + 1);
                    }
                  });
                  // the output: one row per token so far, stacked
                  const outX = W * 0.55;
                  const ocw = Math.min(32, (W - outX - 90) / width);
                  const orh = 22;
                  ctx.fillStyle = MUTED;
                  for (let i = 0; i < at; i++) {
                    const r = rowOf(tokens[i].id);
                    const y = top + i * (orh + 4);
                    ctx.fillStyle = i === at - 1 ? INK : MUTED;
                    ctx.textAlign = "right";
                    ctx.fillText(visible(tokens[i].text).slice(0, 9), outX + 62, y + 15);
                    ctx.textAlign = "left";
                    for (let d = 0; d < width; d++) {
                      const v = r >= 0 ? table[r][d] : 0;
                      ctx.fillStyle = signed(v);
                      ctx.fillRect(outX + 70 + d * ocw, y, ocw - 1, orh - 1);
                      if (ocw >= 28) {
                        ctx.fillStyle = INK;
                        ctx.textAlign = "center";
                        ctx.fillText(v.toFixed(1), outX + 70 + d * ocw + ocw / 2, y + 14);
                        ctx.textAlign = "left";
                      }
                    }
                  }
                  if (hotRow >= 0) {
                    // the arrow from the picked row to its place in the stack
                    const y0 = top + hotRow * cell + cell / 2;
                    const y1 = top + (at - 1) * (orh + 4) + orh / 2;
                    ctx.strokeStyle = SKY;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(tableX + width * cw + 4, y0);
                    ctx.lineTo(outX + 66, y1);
                    ctx.stroke();
                  }
                }}
              />
            </div><Caption>{L("Left: the one-hot vector of the current token, drawn as a column with one lit cell. Middle: the table, {{rows}} rows of {{width}} numbers, of which the rows of the 60 commonest tokens are drawn. The shade of a cell shows its value, from negative to positive. Right: what the model receives, {{at}} rows of {{width}} numbers, one row per token, in order. Only the number of rows changes with the input.", { rows: V, width, at })}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? L("{{n}} tokens are waiting to be looked up. Run takes them one at a time and turns each id into a row of {{width}} numbers read from the table.", { n: tokens.length, width })
                : `${L("Token {{at}} is {{token}}, with id {{id}}. As a one-hot vector it is a list of {{size}} entries, all 0 except a single 1 at position {{id}}. Multiplying this list by the table adds up the table's rows, each times its entry in the list. Only entry {{id}} is not 0, so the result is row {{id}} and nothing else. Reading row {{id}} directly gives the same numbers without any arithmetic, and that is what models do. The model now holds {{at}} rows of {{width}} numbers.", { at, token: visible(current!.text), id: current!.id, size: V, width })}${at === tokens.length ? ` ${L("A longer input would add rows. No input can make a row wider.")}` : ""}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Tokens in the vocabulary (also the length of a one-hot vector and the number of table rows)")}</dt>
              <dd className="text-right text-foreground/80">{V}</dd>
              <dt>{L("Numbers in each row (the width, fixed when the model is designed)")}</dt>
              <dd className="text-right text-foreground/80">{width}</dd>
              <dt>{L("Numbers in the whole table, all of them changed by training")}</dt>
              <dd className="text-right text-foreground/80">{(V * width).toLocaleString("en")}</dd>
              <dt>{L("Distance between any two different one-hot vectors")}</dt>
              <dd className="text-right text-foreground/80">{Math.SQRT2.toFixed(4)}, {L("the same for every pair")}</dd>
              <dt>{L("Size of what the model receives (rows by numbers per row)")}</dt>
              <dd className="text-right text-foreground/80">{L("{{rows}} by {{width}}", { rows: tokens.length, width })}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("Any two different one-hot vectors are the same distance apart, the square root of 2, about 1.41. So a one-hot vector tells which token it is and nothing more: no two tokens are closer than any others. The rows of the table can lie anywhere, and training moves them. A page of the same topic, 'Where the meaning comes from', shows where training puts them. This page also answers why every token's vector has the same length. The width is fixed, and the row is looked up by the id alone. So a token's vector depends neither on the sentence around it nor on the length of that sentence.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="table" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
