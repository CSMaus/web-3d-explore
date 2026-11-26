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
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { rng } from "@/systems/net";
import { FORGETFUL, REMEMBER, runCell, runPlain, type CellWeights } from "@/systems/shapes";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/networks/play/sequence")({
  loader: () => api.system(TOPIC, "sequence"),
  component: SequencePage,
});

const WIRINGS: { id: string; label: string; w: CellWeights; what: string }[] = [
  { id: "remember", label: L("Gates set to hold"), w: REMEMBER, what: L("The forget gate stays at about 1, so the memory is kept. The input gate closes after the first step, so nothing new gets in. What went in first stays") },
  { id: "forget", label: L("Gates set to drop"), w: FORGETFUL, what: L("The forget gate stays at about 0, so the memory is emptied at every step and holds only the newest number") },
];
const RESTS = [
  { id: "noise", label: L("Random numbers") },
  { id: "zeros", label: L("Zeros") },
  { id: "opposite", label: L("Minus the first number, repeated") },
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
    <div>
      <TaskPage
        title={system?.name ?? L("Remembering the first number of a sequence")}
        job={L("Can a network remember the first number of a list until the end? Numbers arrive one at a time, one per step. At the end, the task is to say what the first number was. Two small networks read the same numbers. The first is a plain loop: a single neuron that, at each step, combines the new number with its own previous answer and squashes the result. It carries something forward, but each new number writes over it. The second is a memory cell with gates, called an LSTM (long short-term memory). A gate is a small neuron whose answer, between 0 and 1, sets how much passes: 0 lets nothing through, 1 lets everything through. Three gates decide at each step how much of the memory to keep, how much of the new number to let in, and how much of the memory to show. Here the gates are set by hand. Press Run to watch both side by side.")}
        input={
          <div className="space-y-3">
            <Slider label={L("First number")} min={0.2} max={1} step={0.05} value={first} format={(v) => v.toFixed(2)} onChange={(v) => { setFirst(v); reset(); }} />
            <Slider label={L("Numbers in the list")} min={2} max={16} step={1} value={length} format={(v) => L("{{n}} numbers", { n: Math.round(v) })} onChange={(v) => { setLength(Math.round(v)); reset(); }} />
            <Choices options={RESTS} value={rest} onPick={(id) => { setRest(id); reset(); }} />
            <Choices options={WIRINGS} value={wiring} onPick={(id) => { setWiring(id); reset(); }} />
            <Text kind="note" as="p">{w.what}.</Text>
            <Text kind="note" as="p">
              {L("'First number' is the number to remember. 'Numbers in the list' counts all the numbers, the first included. The first row of buttons chooses what the other numbers are, the second how the gates are set. The first number is kept positive because the gates here are set by hand and rely on the sign of what the cell holds. A trained cell has as many neurons as it needs and no such limit.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={at}
            what={L("numbers seen")}
            limit={length}
            onToggle={() => {
              if (!runner.running && at >= length) reset();
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
          <section ref={stage} className="space-y-1"><div data-slot="plot" className="h-[500px] overflow-hidden">
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
                bar(10, rowH, xs, SKY, at, L("What arrives"), L("one number per step"));
                // the first number ringed
                ctx.strokeStyle = INK;
                ctx.lineWidth = 1.2;
                ctx.strokeRect(left + colW * 0.1, 12, colW * 0.8, rowH - 4);
                ctx.fillStyle = MUTED;
                ctx.fillText(L("This one must be remembered"), left + colW + 6, 24);
                bar(120, rowH, gated.map((g) => g.cell), ONE, at, L("Memory of the gated cell"), L("kept part plus let-in part"));
                bar(230, rowH, plain, TWO, at, L("State of the plain loop"), L("fed back and written over"));
                // the gates at the current step, as four meters
                const gy = 340;
                ctx.fillStyle = MUTED;
                const names: [string, number, string][] = now
                  ? [
                      [L("Forget: how much of the memory to keep"), now.forget, L("0 empties it, 1 keeps all")],
                      [L("Input: how much of the new number to let in"), now.input, L("0 ignores it, 1 takes it whole")],
                      [L("Output: how much of the memory to show"), now.output, L("Passed on: the squashed memory times this")],
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
          </div><Caption>{at > 0 ? L("Top row: the numbers as they arrive, one bar per step; the boxed bar is the first number. Middle rows: the memory of the gated cell and the state of the plain loop after each step. Bottom: the three gates at step {{at}}, each a value from 0 to 1. The dashed vertical line marks the current step", { at }) : L("Top row: the numbers as they arrive, one bar per step; the boxed bar is the first number. Middle rows: the memory of the gated cell and the state of the plain loop after each step. Bottom: the three gates, shown once the run starts")}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={at < 2 ? undefined : wiring === "remember" ? drift < 0.02 : false}>
              {at === 0
                ? L("The first number will be {{first}}. Press Run and the numbers arrive one per step. The question at the end: what was the first one?", { first: first.toFixed(2) })
                : at === 1
                  ? L("Step 1. The input gate is {{input}}, so a value set by the first number goes almost entirely into the memory: {{cell}}. The plain loop holds the first number too: {{plain}}.", { input: now!.input.toFixed(2), cell: now!.cell.toFixed(3), plain: plain[0].toFixed(3) })
                  : wiring === "remember"
                    ? L("Step {{at}}. The gated memory is {{cell}}. It was set at step 1 and has moved by only {{drift}} since. The forget gate is {{forget}}, so nothing old leaks out, and the input gate has been {{input}} since step 2, so nothing new gets in. The plain loop's state is {{plain}}, which mostly reflects the last few numbers. Asked for the first number, the gated cell can answer. The plain loop cannot.", { at, cell: now!.cell.toFixed(3), drift: drift.toFixed(4), forget: now!.forget.toFixed(2), input: now!.input.toFixed(2), plain: plain[at - 1].toFixed(3) })
                    : L("Step {{at}}. With the forget gate at {{forget}}, the memory is emptied at every step and refilled from the newest number: {{cell}}. The first number is gone from both. The gates work the same way in both settings; what they are set to is what training decides.", { at, forget: now!.forget.toFixed(2), cell: now!.cell.toFixed(3) })}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("The first number")}</dt>
              <dd className="text-right text-foreground/80">{first.toFixed(3)}</dd>
              <dt>{L("What the gated memory held after step 1")}</dt>
              <dd className="text-right text-foreground/80">{setAt1.toFixed(4)}</dd>
              <dt>{L("What the gated memory holds now")}</dt>
              <dd className="text-right text-foreground/80">{now ? now.cell.toFixed(4) : "-"}</dd>
              <dt>{L("The plain loop's state now")}</dt>
              <dd className="text-right text-foreground/80">{at > 0 ? plain[at - 1].toFixed(4) : "-"}</dd>
              <dt>{L("Weights and biases in this cell's gates")}</dt>
              <dd className="text-right text-foreground/80">12</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The memory of the gated cell is added to, not replaced: the kept part plus the let-in part. That one addition is why a value can cross many steps unharmed. It is also why, in training, the error signal can travel back across many steps without shrinking at every squashing function. This is a long short-term memory cell (LSTM), with its gates set by hand so that the mechanism is visible.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`sequence-${wiring}`} />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
