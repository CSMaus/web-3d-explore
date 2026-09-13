import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { NetTabs } from "@/components/NetTabs";
import { Plot, type Box } from "@/components/Plot";
import { ticks } from "@/lib/draw";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { api } from "@/lib/api";
import { NETWORKS, TOPIC } from "@/lib/networks";
import { useRunner } from "@/lib/runner";
import { SETS, dataset, perceptron, type SetKind } from "@/systems/learn";

export const Route = createFileRoute("/topics/networks/play/line")({
  loader: () => api.system(TOPIC, "line"),
  component: LinePage,
});

const KINDS: SetKind[] = ["split", "xor", "rings", "spiral"];
const ONE = "#a5e3a0";
const TWO = "#c75ab0";

type Line = { w: [number, number]; b: number };

/** the line through two handles, as weights and a bias; either side may be either colour. */
function through(a: [number, number], b: [number, number]): Line {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const w: [number, number] = [dy, -dx];
  return { w, b: -(w[0] * a[0] + w[1] * a[1]) };
}

/** how many points a line gets wrong, whichever way round its two sides are read. */
function wrongCount(data: { X: number[][]; Y: number[][] }, line: Line) {
  let a = 0;
  let b = 0;
  for (let n = 0; n < data.X.length; n++) {
    const side = line.w[0] * data.X[n][0] + line.w[1] * data.X[n][1] + line.b > 0 ? 1 : 0;
    if (side !== data.Y[n][0]) a += 1;
    else b += 1;
  }
  return Math.min(a, b);
}

function LinePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [kind, setKind] = useState<SetKind>("split");
  const [seed, setSeed] = useState(3);
  const [handles, setHandles] = useState<[[number, number], [number, number]]>([[-2.2, 0.35], [2.2, 0.35]]);
  const [grab, setGrab] = useState<0 | 1 | null>(null);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(0.1);

  const data = useMemo(() => dataset(kind, kind === "xor" ? 4 : 60, seed), [kind, seed]);
  // on exclusive or the rule never stops, so a hundred passes is enough to show it
  const run = useMemo(() => perceptron(data, kind === "xor" ? 100 : 400, 0.1, 4000), [data, kind]);
  const total = run.history.length;
  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: total });
  const taken = Math.min(shown, total);

  const yours = useMemo(() => through(handles[0], handles[1]), [handles]);
  const yoursWrong = wrongCount(data, yours);
  const machine: Line | null =
    taken > 0
      ? { w: [run.history[taken - 1].w[0], run.history[taken - 1].w[1]], b: run.history[taken - 1].b }
      : null;
  const machineWrong = machine ? wrongCount(data, machine) : null;

  const box = useMemo<Box>(() => {
    const xs = data.X.map((p) => p[0]);
    const ys = data.X.map((p) => p[1]);
    const pad = 0.6;
    return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad };
  }, [data]);

  const drawLine = (pen: Parameters<Parameters<typeof Plot>[0]["draw"]>[0], line: Line, colour: string, weight: number) => {
    const [a, b] = line.w;
    if (Math.abs(a) < 1e-12 && Math.abs(b) < 1e-12) return;
    const view = pen.box;
    const pts: [number, number][] =
      Math.abs(b) > Math.abs(a)
        ? [[view.x0, -(a * view.x0 + line.b) / b], [view.x1, -(a * view.x1 + line.b) / b]]
        : [[-(b * view.y0 + line.b) / a, view.y0], [-(b * view.y1 + line.b) / a, view.y1]];
    pen.line(pts, colour, weight);
  };

  const finished = taken >= total && total > 0;

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={NETWORKS} />
      <div className="mt-4">
        <NetTabs />
      </div>
      <TaskPage
        title={system?.name ?? "Draw the line yourself"}
        job="Dots of two colours. The job is to put one straight line between them so every dot is on the side of its own colour. You go first; then a machine tries, one correction at a time."
        input={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setKind(id);
                    runner.reset();
                    setShown(0);
                  }}
                  aria-pressed={kind === id}
                  className={
                    kind === id
                      ? "rounded border border-leaf px-2.5 py-1 font-mono text-[11px] text-leaf"
                      : "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted"
                  }
                >
                  {SETS[id].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted">{SETS[kind].note}</p>
            {kind !== "xor" ? (
              <Slider label="Another sample" min={1} max={40} step={1} value={seed} format={(v) => String(Math.round(v))} onChange={(v) => { setSeed(Math.round(v)); runner.reset(); setShown(0); }} />
            ) : null}
            <p className="text-[11px] text-muted">
              Your line is the white one, and it starts in the wrong place. Drag either of its two
              ends until no dot is on the wrong side. The count under the picture tells you how many
              still are.
            </p>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={taken}
            what="corrections"
            limit={total}
            onToggle={() => {
              if (!runner.running && finished) {
                runner.reset();
                setShown(0);
              }
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(total, v + many))}
            onReset={() => {
              runner.reset();
              setShown(0);
            }}
            perFrame={perFrame}
            onSpeed={setPerFrame}
            pace="slow"
          />
        }
        picture={
          <section
            ref={stage}
            className="space-y-1"
          ><div className="h-[min(560px,calc(100vh-14rem))] overflow-hidden rounded border border-edge">
            <Plot
              className="h-full w-full"
              box={box}
              equal
              deps={[data, handles, machine, taken, box]}
              onDrag={(x, y) => {
                const d0 = Math.hypot(handles[0][0] - x, handles[0][1] - y);
                const d1 = Math.hypot(handles[1][0] - x, handles[1][1] - y);
                const which = grab ?? (d0 <= d1 ? 0 : 1);
                if (grab === null) setGrab(which);
                setHandles((h) => (which === 0 ? [[x, y], h[1]] : [h[0], [x, y]]));
              }}
              onRelease={() => setGrab(null)}
              draw={(pen) => {
                ticks(pen);
                pen.axes("#1b1f25");
                // the machine's earlier lines, faint, so its turning is visible
                for (let i = Math.max(0, taken - 12); i < taken - 1; i++) {
                  const h = run.history[i];
                  drawLine(pen, { w: [h.w[0], h.w[1]], b: h.b }, "#20303a", 1);
                }
                if (machine) drawLine(pen, machine, "#8fd3e8", 2.2);
                // the one dot the last correction looked at
                if (machine) {
                  const [cx, cy] = data.X[run.history[taken - 1].at];
                  pen.ring(cx, cy, 13, "#e8e8ea", 1.2);
                }
                drawLine(pen, yours, "#e8e8ea", 1.6);
                for (const h of handles) {
                  pen.dot(h[0], h[1], 7, "#0e1116");
                  pen.ring(h[0], h[1], 7, "#e8e8ea", 2);
                }
                for (let n = 0; n < data.X.length; n++) {
                  const [x, y] = data.X[n];
                  pen.dot(x, y, 4, data.Y[n][0] ? ONE : TWO);
                }
                // ringed: what the machine's line currently gets wrong
                if (machine) {
                  const flip = wrongCount(data, machine) !== countRaw(data, machine);
                  for (let n = 0; n < data.X.length; n++) {
                    const side = machine.w[0] * data.X[n][0] + machine.w[1] * data.X[n][1] + machine.b > 0 ? 1 : 0;
                    const want = flip ? 1 - data.Y[n][0] : data.Y[n][0];
                    if (side !== want) pen.ring(data.X[n][0], data.X[n][1], 8, "#8fd3e8", 1.4);
                  }
                }

              }}
            />
          </div><Caption>This dot was wrong, so the line turned towards it White: your line, drag its ends. {machine ? "Blue: the machine's line, ringed dots are its mistakes" : "Blue: the machine's line, once you press run"}</Caption></section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={yoursWrong === 0}>
              Your line puts {yoursWrong} of {data.X.length} dots on the wrong side
              {yoursWrong === 0 ? ". That is the job done." : "."}
            </Verdict>
            <Verdict good={machineWrong === null ? undefined : machineWrong === 0}>
              {machine === null
                ? "The machine has not started. Press run."
                : machineWrong === 0
                  ? `The machine's line has none wrong after ${taken} corrections. It stopped because there was nothing left to correct.`
                  : finished
                    ? `After ${total} corrections the machine still has ${machineWrong} wrong, and it will never do better: no straight line can separate these dots, so there is always one to correct and the rule never stops.`
                    : `After ${taken} corrections the machine has ${machineWrong} wrong.`}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 pt-1 font-mono text-[11px] text-muted">
              <dt>Dots</dt>
              <dd className="text-right text-ink/80">{data.X.length}</dd>
              <dt>Corrections the machine made</dt>
              <dd className="text-right text-ink/80">{taken} of {total}</dd>
              <dt>Did it stop by itself</dt>
              <dd className="text-right text-ink/80">{run.converged ? `Yes, after ${run.updates}` : "No, it was stopped"}</dd>
              <dt>One correction is</dt>
              <dd className="text-right text-ink/80">One wrong dot, and the line nudged towards it</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The machine is a perceptron, from 1958. It never sees the whole picture: it looks at
              one dot, and if that dot is on the wrong side it turns the line a little towards it.
              On two clouds that is enough. On exclusive or it is not, and nothing about the rule
              can make it enough. The next pages are about what can.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name={`line-${kind}`} />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}

function countRaw(data: { X: number[][]; Y: number[][] }, line: Line) {
  let a = 0;
  for (let n = 0; n < data.X.length; n++) {
    const side = line.w[0] * data.X[n][0] + line.w[1] * data.X[n][1] + line.b > 0 ? 1 : 0;
    if (side !== data.Y[n][0]) a += 1;
  }
  return a;
}
