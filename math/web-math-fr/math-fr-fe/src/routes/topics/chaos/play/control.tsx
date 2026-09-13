import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ChaosTabs } from "@/components/ChaosTabs";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { TopicBar } from "@/components/TopicBar";
import { BEATS, RECORD, RHYTHMS, SECONDS, SEGMENTS, TYPES } from "@/data/mitdb207";
import { api } from "@/lib/api";
import { CHAOS, TOPIC } from "@/lib/chaos";
import { INK, MUTED, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { between, clock, episodes, kind, narrowing, stats } from "@/systems/beats";

export const Route = createFileRoute("/topics/chaos/play/control")({
  loader: () => api.system(TOPIC, "control"),
  component: HeartPage,
});

const WINDOWS = [
  { id: "burst", label: "Minutes 3:48 to 5:00", from: 228, to: 300, does: "three short runs of ventricular flutter, each starting and stopping on its own, with the normal beat between them" },
  { id: "open", label: "Minutes 0:00 to 1:30", from: 0, to: 90, does: "the opening: bigeminy, a burst of tachycardia, two runs of flutter, back to normal" },
  { id: "long", label: "Minutes 25:00 to 29:30", from: 1500, to: 1770, does: "the long one: a minute and a half of flutter, then the ventricles pacing themselves slowly, then the normal beat again" },
  { id: "all", label: "The whole half hour", from: 0, to: SECONDS, does: "every beat the record holds" },
];
const Y: [number, number] = [100, 1400];
const BAND: Record<string, string> = { VFL: TWO, VT: TWO, IVR: MUTED, B: SKY, SVTA: SKY };
const SHORT: Record<string, string> = { N: "normal", VFL: "flutter", VT: "tachycardia", IVR: "idioventricular", B: "bigeminy", SVTA: "fast, from above" };

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2 border-t border-edge pt-3 first:border-t-0 first:pt-0">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{title}</p>
      {children}
    </div>
  );
}

function HeartPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [windowId, setWindowId] = useState("burst");
  const win = WINDOWS.find((w) => w.id === windowId)!;
  const [view, setView] = useState<[number, number] | null>(null);
  const [shown, setShown] = useState(0);
  const [perFrame, setPerFrame] = useState(1);
  const grab = useRef<{ x: number; view: [number, number] } | null>(null);

  const all = useMemo(() => between(BEATS, win.from, win.to), [win]);
  const runner = useRunner((n) => setShown(n), { perFrame, stopAt: all.length });
  const n = Math.min(shown, all.length);
  const seen = useMemo(() => all.slice(0, n), [all, n]);
  const last = seen.length ? seen[seen.length - 1] : null;
  const prev = seen.length > 1 ? seen[seen.length - 2] : null;
  const span: [number, number] = view ?? [win.from, win.to];
  const box: Box = { x0: span[0], x1: span[1], y0: Y[0], y1: Y[1] };
  const mapBox: Box = { x0: Y[0], x1: Y[1], y0: Y[0], y1: Y[1] };
  const segs = useMemo(() => SEGMENTS.filter((s) => s.to > win.from && s.from < win.to), [win]);
  const byRhythm = (label: string) => seen.filter((b) => b.rhythm === label).map((b) => b.rr);
  const normal = useMemo(() => stats(byRhythm("N")), [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  const flutter = useMemo(() => stats(byRhythm("VFL")), [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  const narrowNormal = useMemo(() => narrowing(byRhythm("N")), [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  const narrowFlutter = useMemo(() => narrowing(byRhythm("VFL")), [seen]); // eslint-disable-line react-hooks/exhaustive-deps
  const flutters = useMemo(() => episodes(SEGMENTS, all, "VFL", win.from, win.to), [all, win]);
  const done = last ? flutters.filter((e) => e.to <= last.t) : [];
  const inside = last ? flutters.find((e) => last.t >= e.from && last.t < e.to) : undefined;
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of seen) m.set(b.type, (m.get(b.type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [seen]);
  const reset = () => {
    runner.reset();
    setShown(0);
  };
  const zoom = (x: number, delta: number) => {
    const [a, b] = span;
    const f = Math.exp(delta * 0.0015);
    const width = Math.min(win.to - win.from, Math.max(4, (b - a) * f));
    let x0 = x - (x - a) * (width / (b - a));
    x0 = Math.max(win.from, Math.min(win.to - width, x0));
    setView([x0, x0 + width]);
  };
  const colourOf = (type: string) => (kind(type) === "flutter" ? TWO : kind(type) === "odd" ? INK : SKY);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={CHAOS} />
      <div className="mt-4">
        <ChaosTabs />
      </div>
      <TaskPage
        title={system?.name ?? "A real heart: the normal beat, the arrhythmia, and back"}
        job="Half an hour of one person's heartbeat, recorded in a Boston hospital in the late 1970s and marked beat by beat by cardiologists: record 207 of the MIT-BIH Arrhythmia Database, an 89-year-old woman. Nothing on this page is generated. Her heart runs its normal beat, falls into ventricular flutter, a fast rhythm in which the ventricles beat about three times a second, and comes back out of it, several times over. The job is to watch the intervals between her beats as they were recorded, zoom into the moments the rhythm switches, and see on the return map what the switch looks like."
        input={
          <div className="space-y-3">
            <Group title="Which part of the recording">
              <Choices options={WINDOWS} value={windowId} onPick={(id) => { setWindowId(id); setView(null); reset(); }} />
              <p className="text-[11px] text-muted">{`${win.does[0].toUpperCase()}${win.does.slice(1)}: ${all.length.toLocaleString("en")} beats.`}</p>
            </Group>
            <Group title="Looking closer">
              <p className="text-[11px] text-muted">
                Turn the wheel over the strip to zoom in around the pointer, drag it to move along
                the recording, and the button brings the whole part back. The dots are the beats as
                marked; there is nothing between them to see.
              </p>
              <button type="button" onClick={() => setView(null)} className="rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-leaf">
                Reset view
              </button>
            </Group>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={all.length}
            what="beats"
            onToggle={() => {
              if (!runner.running && n >= all.length) reset();
              runner.toggle();
            }}
            onStep={(many) => setShown((v) => Math.min(all.length, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <>
            <section className="rounded border border-edge p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">THE RECORDING</h2>
              <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
                <li>
                  The MIT-BIH Arrhythmia Database: 48 half-hour recordings from 47 patients of the
                  Beth Israel Hospital in Boston, made between 1975 and 1979, each beat marked by two
                  cardiologists working independently and their disagreements resolved. It has been
                  the standard test set for machines that read heartbeats since 1980 and is open data
                  (Moody and Mark, 2001; Goldberger and colleagues, PhysioNet, 2000).
                </li>
                <li>
                  Record 207. The cardiologists' note: the predominant rhythm is normal sinus rhythm
                  with a conduction delay; the premature beats are of several forms; a slow
                  self-paced ventricular rhythm follows the longest episode of flutter; the record
                  ends during a fast rhythm from above the ventricles. She was on digoxin and
                  quinidine. The intervals on this page are the times between consecutive marked
                  beats, taken from the annotation file with no hand edits; during flutter each
                  flutter wave is a beat.
                </li>
              </ul>
            </section>
            <section className="rounded border border-edge p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">THE EXPERIMENTS</h2>
              <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-muted">
                <li>
                  Garfinkel, Spano, Ditto and Weiss, Science, 1992, plotted each interval of a rabbit
                  heart's irregular beat against the next, the picture on this page, found the unstable
                  steady beat in the cloud, and fired small stimuli only when the rhythm came near it:
                  eight of eleven preparations went from irregular to periodic. Their interval data were
                  published as figures, never as a dataset, which is why this page shows a human
                  recording instead.
                </li>
                <li>
                  Hall and colleagues, 1997, and Christini and colleagues, 2001, started an arrhythmia
                  electrically by rapid pacing and steadied it with stimuli timed from the same map, in
                  tissue and then in five patients, 52 of 54 attempts. Luther and colleagues, Nature,
                  2011, ended fibrillation with five weak timed pulses instead of one shock. A pulse
                  landing late in a beat can also start fibrillation, known since the 1940s; Winfree
                  explained it in the 1980s as a pulse landing on the point where the tissue can switch.
                </li>
                <li>
                  Whether a fibrillating heart is chaotic in the strict sense is still argued; Christini
                  and Collins showed in 1995 that a timing rule of this kind can also tidy a noisy rhythm
                  that was never chaotic. What is not argued is what the record on this page shows: a
                  heart with two rhythms, and switches between them.
                </li>
              </ul>
            </section>
          </>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div className="h-[260px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={box}
                  deps={[seen, box, segs]}
                  onWheel={(x, _y, delta) => zoom(x, delta)}
                  onDrag={(x) => {
                    if (!grab.current) {
                      grab.current = { x, view: span };
                      return;
                    }
                    const [a, b] = grab.current.view;
                    const dx = x - grab.current.x;
                    // the pointer's world x moves with the view; the shift is measured against the grabbed view
                    let x0 = a - dx;
                    x0 = Math.max(win.from, Math.min(win.to - (b - a), x0));
                    setView([x0, x0 + (b - a)]);
                  }}
                  onRelease={() => {
                    grab.current = null;
                  }}
                  draw={(pen) => {
                    const { ctx } = pen;
                    for (const s of segs) {
                      const c = BAND[s.label];
                      if (!c) continue;
                      ctx.fillStyle = c;
                      ctx.globalAlpha = s.label === "VFL" ? 0.12 : 0.06;
                      ctx.fillRect(pen.px(Math.max(s.from, span[0])), 0, pen.px(Math.min(s.to, span[1])) - pen.px(Math.max(s.from, span[0])), pen.height);
                    }
                    ctx.globalAlpha = 1;
                    const width = span[1] - span[0];
                    ticks(pen, { x: width > 600 ? 300 : width > 120 ? 60 : width > 30 ? 10 : 2, y: 200, xFormat: (v) => clock(v) });
                    for (const s of segs) {
                      const a = Math.max(s.from, span[0]);
                      const b = Math.min(s.to, span[1]);
                      if (b - a > width * 0.06 && SHORT[s.label]) pen.text(SHORT[s.label], (a + b) / 2, Y[1] - 60, MUTED, "center");
                    }
                    const pts = seen.filter((b) => b.t >= span[0] - 5 && b.t <= span[1] + 5);
                    pen.line(pts.map((b) => [b.t, b.rr] as [number, number]), "#3a4048", 1);
                    const r = width < 60 ? 2.6 : width < 300 ? 1.8 : 1.2;
                    for (const b of pts) pen.dot(b.t, b.rr, r, colourOf(b.type));
                    if (last) pen.ring(last.t, last.rr, 5, INK, 1.5);
                  }}
                />
              </div>
              <Caption>
                {`The recording as intervals: time along the bottom in minutes and seconds, the interval from each beat to the next in milliseconds up, one dot a beat as the cardiologists marked it. Sky: a normal beat. Rose: a flutter wave. White: a premature or escape beat. The rose band is the stretch they named ventricular flutter; the grey band the self-paced ventricular rhythm; the faint sky bands bigeminy and the fast rhythm from above. Showing ${clock(span[0])} to ${clock(span[1])}.`}
              </Caption>
            </div>
            <div className="grid gap-2 lg:grid-cols-[300px_1fr]">
              <div>
                <div className="h-[300px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={mapBox}
                    equal
                    deps={[seen]}
                    draw={(pen) => {
                      ticks(pen, { x: 200, y: 200 });
                      pen.line([[Y[0], Y[0]], [Y[1], Y[1]]], "#3a4048", 1);
                      for (let i = 1; i < seen.length; i++) pen.dot(seen[i - 1].rr, seen[i].rr, 1.8, seen[i].rhythm === "VFL" ? TWO : seen[i].rhythm === "N" ? SKY : MUTED);
                      if (last && prev) pen.ring(prev.rr, last.rr, 5, INK, 1.5);
                    }}
                  />
                </div>
                <Caption>The return map of the same beats: one interval along the bottom, the interval after it up. Sky: in normal rhythm. Rose: in flutter. Grey: the other rhythms. A rhythm that repeats sits on one spot; a switch is a jump from one cloud to the other.</Caption>
              </div>
              <div>
                <div className="h-[300px] overflow-hidden rounded border border-edge">
                  <Plot
                    className="h-full w-full"
                    box={{ x0: Y[0], x1: Y[1], y0: 0, y1: 1 }}
                    deps={[seen]}
                    draw={(pen) => {
                      const { ctx } = pen;
                      const bins = 52;
                      const step = (Y[1] - Y[0]) / bins;
                      const count = (label: string) => {
                        const out = new Array<number>(bins).fill(0);
                        for (const b of seen) if (b.rhythm === label) out[Math.min(bins - 1, Math.max(0, Math.floor((b.rr - Y[0]) / step)))] += 1;
                        return out;
                      };
                      const hn = count("N");
                      const hf = count("VFL");
                      const top = Math.max(1, ...hn, ...hf);
                      ticks(pen, { x: 200, y: 2 });
                      for (let i = 0; i < bins; i++) {
                        const x0 = pen.px(Y[0] + i * step) + 1;
                        const w = Math.max(1, pen.px(Y[0] + (i + 1) * step) - pen.px(Y[0] + i * step) - 2);
                        ctx.fillStyle = SKY;
                        ctx.globalAlpha = 0.85;
                        ctx.fillRect(x0, pen.py((hn[i] / top) * 0.95), w, pen.py(0) - pen.py((hn[i] / top) * 0.95));
                        ctx.fillStyle = TWO;
                        ctx.fillRect(x0, pen.py((hf[i] / top) * 0.95), w, pen.py(0) - pen.py((hf[i] / top) * 0.95));
                        ctx.globalAlpha = 1;
                      }
                    }}
                  />
                </div>
                <Caption>How often each interval occurred so far, 100 to 1,400 ms along the bottom. Sky: in normal rhythm. Rose: in flutter. Two rhythms, two piles, and nothing between them.</Caption>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={last && !inside && done.length > 0 && last.rhythm === "N" ? true : undefined}>
              {!last
                ? `${all.length.toLocaleString("en")} recorded beats from ${clock(win.from)} to ${clock(win.to)}. Press run and they are placed one at a time, in the order the heart made them.`
                : inside
                  ? `${clock(last.t)}: ventricular flutter, since ${clock(inside.from)}. The ventricles are beating every ${flutter.mean ? flutter.mean.toFixed(0) : "-"} ms on average, about ${flutter.mean ? (60000 / flutter.mean).toFixed(0) : "-"} a minute, against ${normal.mean ? normal.mean.toFixed(0) : "-"} ms in her normal rhythm. On the return map the dots have jumped from the sky cloud to the rose one. ${done.length ? `This is the ${["second", "third", "fourth", "fifth", "sixth"][done.length - 1] ?? "next"} run of flutter in this part.` : ""}`
                  : last.rhythm === "N"
                    ? done.length
                      ? `${clock(last.t)}: the normal beat again, ${normal.mean.toFixed(0)} ms with ${normal.sd.toFixed(0)} ms of spread. The flutter that began at ${clock(done[done.length - 1].from)} stopped on its own after ${done[done.length - 1].beats} beats and ${(done[done.length - 1].to - done[done.length - 1].from).toFixed(0)} seconds; nothing was done to her to stop it, and nothing visible in the intervals started it. ${done.length > 1 ? `${done.length} runs of flutter so far in this part.` : ""}`
                      : `${clock(last.t)}: her normal rhythm, ${normal.mean.toFixed(0)} ms between beats, about ${(60000 / normal.mean).toFixed(0)} a minute, with ${normal.sd.toFixed(0)} ms of spread${seen.some((b) => kind(b.type) === "odd") ? ", and the odd premature beat, white, followed by a long interval" : ""}. On the return map the dots gather in one cloud.`
                    : `${clock(last.t)}: ${RHYTHMS[last.rhythm] ?? last.rhythm}${done.length ? `, after ${done.length} run${done.length === 1 ? "" : "s"} of flutter` : ""}. ${last.rhythm === "IVR" ? "The long flutter has stopped and the ventricles are pacing themselves, slowly, until the normal rhythm takes over again." : last.rhythm === "B" ? "Every other beat comes early: the intervals alternate short, long, and the return map shows two spots, not one." : ""}`}
            </Verdict>
            <Readout
              rows={[
                ["Record", `MIT-BIH Arrhythmia Database, record ${RECORD}, 360 samples a second, ${BEATS.length.toLocaleString("en")} beats in the half hour`],
                ["Beats placed", `${n.toLocaleString("en")} of ${all.length.toLocaleString("en")}`],
                ["Beat types so far", typeCounts.length ? typeCounts.map(([t, c]) => `${c} ${TYPES[t] ?? t}`).join("; ") : "-"],
                ["Normal rhythm", normal.n ? `${normal.n} beats, ${normal.mean.toFixed(0)} ms mean, ${normal.sd.toFixed(0)} ms spread, ${(60000 / normal.mean).toFixed(0)} a minute` : "-"],
                ["Ventricular flutter", flutter.n ? `${flutter.n} beats, ${flutter.mean.toFixed(0)} ms mean, ${flutter.sd.toFixed(0)} ms spread, ${(60000 / flutter.mean).toFixed(0)} a minute` : "-"],
                ["Runs of flutter in this part", flutters.length ? flutters.map((e) => `${clock(e.from)} to ${clock(e.to)}, ${e.beats} beats`).join("; ") : "none"],
                ["Knowing one interval narrows the next to, normal", Number.isFinite(narrowNormal.ratio) ? `${(narrowNormal.ratio * 100).toFixed(0)} per cent of its spread` : "needs more beats"],
                ["The same, in flutter", Number.isFinite(narrowFlutter.ratio) ? `${(narrowFlutter.ratio * 100).toFixed(0)} per cent of its spread` : "needs more beats"],
              ]}
            />
            <p className="pt-1 text-[11px] text-muted">
              What the record shows is two rhythms, each holding its own cloud on the return map,
              and switches between them that leave no warning in the intervals before. What it does
              not show is a rule: knowing one interval narrows the next only a little in either
              rhythm, as the last two rows say. The experiments in the panel on the left went one
              step further on their own recordings, finding in the irregular cloud an unstable steady
              beat to aim at. The tools are the ones this topic built: the return map, the exponent,
              the picture of what a system settles into.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-heart-207" />
            <Equations system={system} />
          </>
        }
      />
    </main>
  );
}
