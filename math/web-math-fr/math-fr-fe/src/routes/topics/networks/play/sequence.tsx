import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { rng } from "@/systems/net";
import { FORGETFUL, REMEMBER, runCell, runPlain, type CellWeights } from "@/systems/shapes";

export const Route = createFileRoute("/topics/networks/play/sequence")({
  loader: () => api.system(TOPIC, "sequence"),
  component: SequencePage,
});

const WIRINGS: { id: string; label: string; w: CellWeights; what: string }[] = [
  { id: "remember", label: "Gates set to hold", w: REMEMBER, what: "The forget gate stays open and the input gate shuts after the first step, so what went in first is kept" },
  { id: "forget", label: "Gates set to drop", w: FORGETFUL, what: "The forget gate stays shut, so the memory is emptied every step and only the latest input is in it" },
];
const RESTS = [
  { id: "noise", label: "Random numbers" },
  { id: "zeros", label: "Silence" },
  { id: "opposite", label: "The opposite, repeated" },
];

function SequencePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [first, setFirst] = useState(0.7);
  // this hand-wired cell holds one positive number; see the note under the slider
  const [length, setLength] = useState(10);
  const [rest, setRest] = useState("noise");
  const [wiring, setWiring] = useState("remember");
  const [tick, setTick] = useState(0);
  const [perFrame, setPerFrame] = useState(0.04);

  const xs = useMemo(() => {
    const next = rng(11);
    return Array.from({ length }, (_, i) => (i === 0 ? first : rest === "zeros" ? 0 : rest === "opposite" ? -first : (next() * 2 - 1) * 0.9));
  }, [first, length, rest]);
  const w = WIRINGS.find((v) => v.id === wiring)!;
  const gated = useMemo(() => runCell(w.w, xs), [w, xs]);
  const plain = useMemo(() => runPlain(xs), [xs]);
  const runner = useRunner((n) => setTick(n), { perFrame, stopAt: length });
  const at = Math.min(tick, length);
  const now = at > 0 ? gated[at - 1] : null;
  const reset = () => {
    runner.reset();
    setTick(0);
  };
  const setAt1 = gated[0]?.cell ?? 0;
  const drift = now ? Math.abs(now.cell - setAt1) : 0;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "The same job on a sequence"}
        job="Numbers arrive one at a time. At the end, the job is to say what the first one was. A unit that feeds its own answer back to itself can carry something forward, but each new number overwrites it. A cell with gates decides, at every step, how much to keep, how much to let in, and how much to show. Watch the two side by side."
        input={
          <div className="space-y-3">
            <Slider label="First number" min={0.2} max={1} step={0.05} value={first} format={(v) => v.toFixed(2)} onChange={(v) => { setFirst(v); reset(); }} />
            <Slider label="Then how many" min={2} max={16} step={1} value={length} format={(v) => `${Math.round(v)} steps`} onChange={(v) => { setLength(Math.round(v)); reset(); }} />
            <Choices options={RESTS} value={rest} onPick={(id) => { setRest(id); reset(); }} />
            <Choices options={WIRINGS} value={wiring} onPick={(id) => { setWiring(id); reset(); }} />
            <p className="text-[11px] text-muted">{w.what}.</p>
            <p className="text-[11px] text-muted">
              The first number is positive because this cell's gates are set by hand and read
              the sign of what they hold. A trained cell has as many units as it needs and no
              such limit.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what="numbers seen"
            limit={length}
            onToggle={() => {
              if (!runner.running && at >= length) reset();
              runner.toggle();
            }}
            onStep={(many) => setTick((v) => Math.min(length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section ref={stage} className="space-y-1"><div className="h-[500px] overflow-hidden rounded border border-edge">
            <Plot
              className="h-full w-full"
              box={{ x0: 0, x1: 1, y0: 0, y1: 1 }}
              deps={[xs, gated, plain, at]}
              draw={(pen) => {
                const { ctx, width: W, height: H } = pen;
                ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
                ctx.textAlign = "left";
                const left = 215;
                const right = W - 20;
                const colW = (right - left) / length;
                const bar = (rowY: number, rowH: number, values: number[], colour: string, upTo: number, label: string, note: string) => {
                  ctx.fillStyle = MUTED;
                  ctx.fillText(label, 12, rowY + rowH / 2 - 6);
                  ctx.fillStyle = "#5b616b";
                  ctx.fillText(note, 12, rowY + rowH / 2 + 8);
                  ctx.strokeStyle = FAINT;
                  ctx.beginPath();
                  ctx.moveTo(left, rowY + rowH / 2);
                  ctx.lineTo(right, rowY + rowH / 2);
                  ctx.stroke();
                  for (let i = 0; i < values.length; i++) {
                    const x = left + i * colW + colW * 0.2;
                    const h = (values[i] * rowH) / 2.2;
                    ctx.fillStyle = i < upTo ? colour : "#1b1f25";
                    ctx.fillRect(x, rowY + rowH / 2 - Math.max(0, h), colW * 0.6, Math.abs(h));
                    if (i < upTo) {
                      ctx.fillStyle = INK;
                      ctx.textAlign = "center";
                      ctx.fillText(values[i].toFixed(2), x + colW * 0.3, rowY + rowH / 2 + (values[i] >= 0 ? 14 : -8));
                      ctx.textAlign = "left";
                    }
                  }
                };
                const rowH = 90;
                bar(10, rowH, xs, SKY, at, "What arrives", "One number a step");
                // the first number ringed
                ctx.strokeStyle = INK;
                ctx.lineWidth = 1.2;
                ctx.strokeRect(left + colW * 0.1, 12, colW * 0.8, rowH - 4);
                ctx.fillStyle = MUTED;
                ctx.fillText("This one has to survive", left + colW + 6, 24);
                bar(120, rowH, gated.map((g) => g.cell), ONE, at, "The gated cell's memory", "Kept plus let in, each step");
                bar(230, rowH, plain, TWO, at, "The plain loop's state", "Fed back and overwritten");
                // the gates at the current step, as four meters
                const gy = 340;
                ctx.fillStyle = MUTED;
                const names: [string, number, string][] = now
                  ? [
                      ["Forget: how much of the memory to keep", now.forget, "0 empties it, 1 keeps all"],
                      ["Input: how much of the new number to let in", now.input, "0 ignores it, 1 takes it whole"],
                      ["Output: how much of the memory to show", now.output, "The next layer sees memory times this"],
                    ]
                  : [];
                names.forEach(([name, v, note], i) => {
                  const y = gy + 18 + i * 42;
                  ctx.fillStyle = MUTED;
                  ctx.fillText(name, 12, y);
                  ctx.fillStyle = "#5b616b";
                  ctx.fillText(note, 12, y + 13);
                  const mx = W * 0.55;
                  const mw = W * 0.4;
                  ctx.fillStyle = FAINT;
                  ctx.fillRect(mx, y - 8, mw, 10);
                  ctx.fillStyle = ONE;
                  ctx.fillRect(mx, y - 8, mw * v, 10);
                  ctx.fillStyle = INK;
                  ctx.fillText(v.toFixed(2), mx + mw + 6, y);
                });
                if (at > 0) {
                  const x = left + (at - 1) * colW + colW * 0.5;
                  ctx.strokeStyle = "rgba(232,232,234,0.25)";
                  ctx.setLineDash([3, 3]);
                  ctx.beginPath();
                  ctx.moveTo(x, 8);
                  ctx.lineTo(x, 330);
                  ctx.stroke();
                  ctx.setLineDash([]);
                }
                if (H < 10) ctx.fillText("", 0, 0);
              }}
            />
          </div><Caption>{at > 0 ? `The gates at step ${at}` : "The gates, once it starts"}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at < 2 ? undefined : wiring === "remember" ? drift < 0.02 : false}>
              {at === 0
                ? `The first number will be ${first.toFixed(2)}. Press run and the numbers arrive one a step. The question at the end: what was the first one?`
                : at === 1
                  ? `Step 1. The input gate is ${now!.input.toFixed(2)}, so the first number goes almost entirely into the memory: ${now!.cell.toFixed(3)}. The plain loop holds it too: ${plain[0].toFixed(3)}.`
                  : wiring === "remember"
                    ? `Step ${at}. The gated memory is ${now!.cell.toFixed(3)}, set at step 1 and moved by ${drift.toFixed(4)} since: the forget gate is ${now!.forget.toFixed(2)} and the input gate has been ${now!.input.toFixed(2)} since step 2, so nothing new gets in and nothing old leaks out. The plain loop's state is ${plain[at - 1].toFixed(3)}, which is about the last few numbers. Asked for the first number, the gated cell can answer. The plain loop cannot.`
                    : `Step ${at}. With the forget gate at ${now!.forget.toFixed(2)} the memory is emptied every step and refilled with the newest number: ${now!.cell.toFixed(3)}. The first number is gone from both. The gates are the same machinery either way; what they are set to is what training decides.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>The first number</dt>
              <dd className="text-right text-ink/80">{first.toFixed(3)}</dd>
              <dt>What the gated memory held after step 1</dt>
              <dd className="text-right text-ink/80">{setAt1.toFixed(4)}</dd>
              <dt>What it holds now</dt>
              <dd className="text-right text-ink/80">{now ? now.cell.toFixed(4) : "-"}</dd>
              <dt>The plain loop's state now</dt>
              <dd className="text-right text-ink/80">{at > 0 ? plain[at - 1].toFixed(4) : "-"}</dd>
              <dt>Numbers in this cell's wiring</dt>
              <dd className="text-right text-ink/80">12</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The memory is added to, not replaced: kept part plus let-in part. That one plus sign
              is why a value can cross many steps unharmed, and why blame can flow back across
              them without shrinking to nothing at each squash. This is a long short-term memory
              cell, with its gates set by hand so the mechanism is visible.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`sequence-${wiring}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
