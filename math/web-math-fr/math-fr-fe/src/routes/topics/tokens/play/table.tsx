import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TokenRow, visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { INK, MUTED, ONE, SKY, TWO, mix } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { USED, VOCAB, text as tokenText, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { encode } from "@/systems/bpe";
import { rng } from "@/systems/net";
import { FIELD, TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/table")({
  loader: () => api.system(TOPIC, "table"),
  component: TablePage,
});

const INPUTS = [
  { id: "short", label: "3 tokens", text: "the cat sleeps" },
  { id: "mid", label: "7 tokens", text: "the cat sleeps on the warm mat" },
  { id: "long", label: "12 tokens", text: "the cat sleeps on the warm mat by the window all day" },
];
const SOURCES = [
  { id: "noise", label: "Before training: noise" },
  { id: "trained", label: "After training" },
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
  }, [rows, width, source, store.model, store.version]);
  const rowOf = (id: number) => rows.indexOf(id);
  const current = at > 0 ? tokens[at - 1] : null;

  const reset = () => {
    runner.reset();
    setDone(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "From a number to a vector"}
        job="The model receives integers, and an integer is not something a layer can multiply usefully: token 271 is not more than token 40 in any sense. The job is to turn each id into a list of numbers a network can work with. One honest way, one cheap way, and the discovery that they are the same."
        input={
          <div className="space-y-3">
            <Choices options={INPUTS} value={which} onPick={(id) => { setWhich(id); setText(INPUTS.find((i) => i.id === id)!.text); reset(); }} />
            <label className="block">
              <span className="text-xs text-muted">Or type</span>
              <input value={text} onChange={(e) => { setText(e.target.value); setWhich(""); reset(); }} className={FIELD} />
            </label>
            <Slider label="Width" min={2} max={16} step={1} value={width} format={(v) => `${Math.round(v)} numbers`} onChange={(v) => { setWidth(Math.round(v)); reset(); }} />
            <Choices options={SOURCES} value={source} onPick={setSource} />
            <p className="text-[11px] text-muted">
              The width is a constant of the architecture, chosen once. The table's rows start as
              random numbers that mean nothing; the trained rows are the shared model's, once the
              later pages have trained it.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="tokens looked up"
            limit={tokens.length}
            onToggle={() => {
              if (!runner.running && at >= tokens.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setDone((v) => Math.min(tokens.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="rounded border border-edge p-3">
              <TokenRow tokens={tokens} ids mark={at > 0 ? at - 1 : null} dimFrom={at} />
            </div>
            <div><div className="h-[420px] overflow-hidden rounded border border-edge">
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
                  ctx.fillText("One-hot", 60, 16);
                  ctx.fillText(`${V} long`, 60, 28);
                  const tableX = 130;
                  const cw = Math.min(16, (W * 0.45 - tableX) / width);
                  ctx.fillText(`${(V * width).toLocaleString("en")} numbers`, tableX, 28);
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
            </div><Caption>{`The table: ${V} rows by ${width}`}. {`What the network receives: ${at} rows, ${width} wide`}. One row a token, in order. Only the row count changes with the input.</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {at === 0
                ? `${tokens.length} tokens are waiting. Press run: each id becomes a vector ${width} wide by picking one row of the table.`
                : `Token ${at}, ${visible(current!.text)}, id ${current!.id}: as a one-hot vector it is ${V} zeros with a single one at position ${current!.id}. Multiplying that by the table selects row ${current!.id} and nothing else, so the lookup is that multiplication, done cheaply. The network now holds ${at} rows of ${width} numbers.${at === tokens.length ? ` A longer input would add rows; nothing could make a row wider.` : ""}`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Vocabulary size, so one-hot length and table rows</dt>
              <dd className="text-right text-ink/80">{V}</dd>
              <dt>Width, chosen once</dt>
              <dd className="text-right text-ink/80">{width}</dd>
              <dt>Numbers in the table, all of them trainable</dt>
              <dd className="text-right text-ink/80">{(V * width).toLocaleString("en")}</dd>
              <dt>Distance between any two distinct one-hot vectors</dt>
              <dd className="text-right text-ink/80">{Math.SQRT2.toFixed(4)}, Always</dd>
              <dt>The input's shape</dt>
              <dd className="text-right text-ink/80">{tokens.length} by {width}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              Every pair of one-hot vectors is exactly as far apart as every other, so that form
              carries the identity of a token and nothing more. The table's rows can be anywhere,
              and where training puts them is the next page. The question of why a token's vector
              has a fixed length is answered here: the width is a constant and the lookup is by id,
              so nothing about one vector depends on the sentence around it or how long it is.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="table" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}
