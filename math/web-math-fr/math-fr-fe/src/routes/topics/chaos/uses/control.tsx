import { createFileRoute } from "@tanstack/react-router";
import { Label, Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { OptionGroup } from "@/components/OptionGroup";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { BEATS, RECORD, RHYTHMS, SECONDS, SEGMENTS, TYPES } from "@/data/mitdb207";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/chaos";
import { INK, MUTED, SKY, TWO, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { between, clock, episodes, kind, narrowing, stats } from "@/systems/beats";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/chaos/uses/control")({
  loader: () => api.system(TOPIC, "control"),
  component: HeartPage,
});

const WINDOWS = [
  { id: "burst", label: L("Minutes 3:48 to 5:00"), from: 228, to: 300, does: L("three short spells of ventricular flutter, a very fast rhythm of the heart's lower chambers, each starting and stopping on its own, with normal beats in between") },
  { id: "open", label: L("Minutes 0:00 to 1:30"), from: 0, to: 90, does: L("the start of the recording: a stretch where every other beat comes early, a short burst of fast beats, two spells of flutter, then the normal beat again") },
  { id: "long", label: L("Minutes 25:00 to 29:30"), from: 1500, to: 1770, does: L("the longest spell: a minute and a half of flutter, then a slow beat that the lower chambers of the heart set on their own, then the normal beat again") },
  { id: "all", label: L("The whole half hour"), from: 0, to: SECONDS, does: L("every beat in the recording") },
];
const Y: [number, number] = [100, 1400];
const BAND: Record<string, string> = { VFL: TWO, VT: TWO, IVR: MUTED, B: SKY, SVTA: SKY };
const SHORT: Record<string, string> = { N: L("normal"), VFL: L("flutter"), VT: L("fast beat"), IVR: L("slow, from below"), B: L("every other early"), SVTA: L("fast, from above") };

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
    <div>
      <TaskPage
        title={system?.name ?? L("A real heart: from the normal beat to a very fast rhythm and back")}
        job={L("What does a heart look like when it switches from one rhythm to another? This page shows half an hour of the heartbeat of one woman, aged 89. The recording was made in a Boston hospital in the late 1970s. Heart doctors marked every beat in it by hand. It is record 207 of the MIT-BIH Arrhythmia Database, a public collection of heart recordings. Nothing on this page is made up. Most of the time her heart beats normally, about once every 0.9 seconds. Several times it falls into ventricular flutter. The ventricles, the two lower chambers of the heart, then beat about three times a second. Each time, the heart returns to the normal beat on its own. Pressing run places the beats one at a time, in the order they happened. The top picture shows the gap from each beat to the next. The square picture below it puts each gap next to the gap that follows. The question: what does the switch between the two rhythms look like?")}
        input={
          <div className="space-y-3">
            <OptionGroup title={L("Which part of the recording")}>
              <Choices options={WINDOWS} value={windowId} onPick={(id) => { setWindowId(id); setView(null); reset(); }} />
              <Text kind="note" as="p">{L("{{does}}: {{n}} beats.", { does: `${win.does[0].toUpperCase()}${win.does.slice(1)}`, n: all.length.toLocaleString("en") })}</Text>
            </OptionGroup>
            <OptionGroup title={L("Zooming in")}>
              <Text kind="note" as="p">
                {L("Turning the mouse wheel over the top picture zooms in around the pointer. Dragging the picture moves along the recording. The button below brings back the whole part. Each dot is one beat as the doctors marked it. There is nothing to see between the dots.")}
              </Text>
              <Button variant="outline" size="sm" type="button" onClick={() => setView(null)}>
                {L("Reset view")}
              </Button>
            </OptionGroup>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={n}
            limit={all.length}
            what={L("beats")}
            onToggle={() => {
              if (!runner.running && n >= all.length) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        more={
          <>
            <section data-slot="panel">
              <Label>{L("THE RECORDING")}</Label>
              <ul data-text="note" className="mt-2 space-y-2">
                <li>
                  {L("The MIT-BIH Arrhythmia Database is a collection of 48 heart recordings, each half an hour long. An arrhythmia is a heartbeat that is irregular or at the wrong pace. The recordings come from 47 patients of the Beth Israel Hospital in Boston and were made between 1975 and 1979. Two cardiologists, doctors who specialise in the heart, marked every beat, each working separately. Where they disagreed, the disagreement was settled. Since 1980 the collection has been the standard test for machines that read heartbeats. Anyone may use it (Moody and Mark, 2001; Goldberger and colleagues, PhysioNet, 2000).")}
                </li>
                <li>
                  {L("Record 207, as the cardiologists described it. Most of the time the heart keeps its normal rhythm, set by its own natural pacemaker, but the electrical signal crosses the heart with a delay. Some beats come early, and they come in several shapes. The longest spell of flutter is followed by a slow rhythm that the ventricles set on their own. The recording ends during a fast rhythm that starts above the ventricles, in the upper chambers. The patient was taking digoxin and quinidine, two heart medicines. Each number on this page is the time from one marked beat to the next. The numbers were read from the doctors' marks with no changes by hand. During flutter, each wave of the flutter counts as one beat.")}
                </li>
              </ul>
            </section>
            <section data-slot="panel">
              <Label>{L("THE EXPERIMENTS")}</Label>
              <ul data-text="note" className="mt-2 space-y-2">
                <li>
                  {L("In 1992 Garfinkel, Spano, Ditto and Weiss described an experiment in the journal Science. They worked with pieces of rabbit heart that beat irregularly. They plotted each gap between beats against the next gap, the same kind of picture as the square one on this page. In the cloud of dots they found a steady beat that the heart kept coming close to but never held, because that beat was unstable. They gave the heart a small electric pulse only at the moments its rhythm came close to that steady beat. In eight of eleven heart pieces the irregular beat became regular. They published their gaps only as figures in the article, not as data. That is why this page uses a human recording instead.")}
                </li>
                <li>
                  {L("Hall and colleagues in 1997, and Christini and colleagues in 2001, started an irregular rhythm on purpose by stimulating the heart very fast with electric pulses. Then they steadied the rhythm with pulses timed from the same kind of picture. They did this first in heart tissue and then in five patients, and it worked in 52 of 54 attempts. In 2011 Luther and colleagues, in the journal Nature, stopped fibrillation with five weak, well-timed pulses instead of one strong shock. Fibrillation is a rhythm in which the heart muscle quivers without order instead of contracting. Since the 1940s it has been known that a pulse arriving late in a beat can also start fibrillation. In the 1980s Winfree explained why: such a pulse lands at the one moment when the tissue can switch from one rhythm to another.")}
                </li>
                <li>
                  {L("Scientists still disagree about whether a heart in fibrillation is chaotic in the strict mathematical sense. Chaotic here means following an exact rule and still being impossible to predict far ahead. In 1995 Christini and Collins showed that a timing rule of this kind can also calm a rhythm that is only noisy and was never chaotic. Nobody disputes what the recording on this page shows: a heart with two rhythms, which switches between them.")}
                </li>
              </ul>
            </section>
          </>
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div>
              <div data-slot="plot" className="h-[260px] overflow-hidden">
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
                {L("The top picture shows the recording as a row of dots, one dot for each beat the cardiologists marked. Across: the time, in minutes and seconds. Up: the gap from that beat to the next one, in milliseconds (thousandths of a second). Normal beats sit high, near 900 ms. Flutter waves sit low, near 300 ms. A beat that comes early shows as a dip followed by a jump. Shaded bands mark the stretches the cardiologists named, each labelled with its rhythm. The most strongly shaded band is ventricular flutter. Showing {{from}} to {{to}}.", { from: clock(span[0]), to: clock(span[1]) })}
              </Caption>
            </div>
            <div className="grid gap-2 lg:grid-cols-[300px_minmax(0,1fr)]">
              <div>
                <div data-slot="plot" className="h-[300px] overflow-hidden">
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
                <Caption>{L("The square picture is called a return map. Each dot stands for two neighbouring gaps between beats. Across: one gap. Up: the gap right after it. A rhythm that repeats exactly would put all its dots on one spot. The normal rhythm makes a cloud near 900 ms on both axes, at the upper right. Flutter makes a cloud near 300 ms, at the lower left. A switch of rhythm is a jump from one cloud to the other.")}</Caption>
              </div>
              <div>
                <div data-slot="plot" className="h-[300px] overflow-hidden">
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
                <Caption>{L("This picture counts how often each gap between beats has occurred so far. Across: the gap, from 100 to 1,400 ms. Up: how many beats had that gap. Flutter makes a pile on the left, near 300 ms. The normal rhythm makes a pile on the right, near 900 ms. Two rhythms give two piles, with almost nothing between them.")}</Caption>
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={last && !inside && done.length > 0 && last.rhythm === "N" ? true : undefined}>
              {!last
                ? L("This part holds {{n}} recorded beats, from {{from}} to {{to}} into the recording. Pressing run places them one at a time, in the order the heart made them.", { n: all.length.toLocaleString("en"), from: clock(win.from), to: clock(win.to) })
                : inside
                  ? `${L("{{time}}: ventricular flutter, since {{since}}. The ventricles now beat every {{flutter}} ms on average, about {{rate}} times a minute. In her normal rhythm the gap is {{normal}} ms. On the return map the dots have jumped from the cloud at the upper right to the cloud at the lower left.", { time: clock(last.t), since: clock(inside.from), flutter: flutter.mean ? flutter.mean.toFixed(0) : "-", rate: flutter.mean ? (60000 / flutter.mean).toFixed(0) : "-", normal: normal.mean ? normal.mean.toFixed(0) : "-" })} ${done.length ? L("This is the {{nth}} spell of flutter in this part of the recording.", { nth: [L("second"), L("third"), L("fourth"), L("fifth"), L("sixth")][done.length - 1] ?? L("next") }) : ""}`
                  : last.rhythm === "N"
                    ? done.length
                      ? `${L("{{time}}: the normal beat is back. The average gap between beats is {{mean}} ms, and a typical gap differs from that average by {{sd}} ms. The flutter that began at {{began}} stopped on its own after {{beats}} beats and {{seconds}} seconds. Nothing was done to her to stop it. Nothing visible in the gaps before it started it.", { time: clock(last.t), mean: normal.mean.toFixed(0), sd: normal.sd.toFixed(0), began: clock(done[done.length - 1].from), beats: done[done.length - 1].beats, seconds: (done[done.length - 1].to - done[done.length - 1].from).toFixed(0) })} ${done.length > 1 ? L("{{n}} spells of flutter so far in this part of the recording.", { n: done.length }) : ""}`
                      : seen.some((b) => kind(b.type) === "odd")
                        ? L("{{time}}: her normal rhythm. The average gap between beats is {{mean}} ms, about {{rate}} beats a minute. A typical gap differs from that average by {{sd}} ms. Now and then a beat comes early, and a long gap follows it. On the return map the dots gather in one cloud.", { time: clock(last.t), mean: normal.mean.toFixed(0), rate: (60000 / normal.mean).toFixed(0), sd: normal.sd.toFixed(0) })
                        : L("{{time}}: her normal rhythm. The average gap between beats is {{mean}} ms, about {{rate}} beats a minute. A typical gap differs from that average by {{sd}} ms. On the return map the dots gather in one cloud.", { time: clock(last.t), mean: normal.mean.toFixed(0), rate: (60000 / normal.mean).toFixed(0), sd: normal.sd.toFixed(0) })
                    : `${done.length ? (done.length === 1 ? L("{{time}}: {{rhythm}}. Before this came {{n}} spell of flutter.", { time: clock(last.t), rhythm: (RHYTHMS[last.rhythm] ? L(RHYTHMS[last.rhythm]) : last.rhythm), n: done.length }) : L("{{time}}: {{rhythm}}. Before this came {{n}} spells of flutter.", { time: clock(last.t), rhythm: (RHYTHMS[last.rhythm] ? L(RHYTHMS[last.rhythm]) : last.rhythm), n: done.length })) : L("{{time}}: {{rhythm}}.", { time: clock(last.t), rhythm: (RHYTHMS[last.rhythm] ? L(RHYTHMS[last.rhythm]) : last.rhythm) })} ${last.rhythm === "IVR" ? L("The long spell of flutter has stopped. Now the ventricles set a slow beat on their own, until the normal rhythm takes over again.") : last.rhythm === "B" ? L("Every other beat comes early. The gaps go short, long, short, long, so the return map shows two spots instead of one.") : ""}`}
            </Verdict>
            <Readout
              rows={[
                [L("Recording"), L("record {{record}} of the MIT-BIH Arrhythmia Database, heart signal measured 360 times a second, {{n}} beats in half an hour", { record: RECORD, n: BEATS.length.toLocaleString("en") })],
                [L("Beats shown so far"), L("{{n}} of {{total}}", { n: n.toLocaleString("en"), total: all.length.toLocaleString("en") })],
                [L("Kinds of beat so far, as the doctors marked them"), typeCounts.length ? typeCounts.map(([t, c]) => `${c} ${TYPES[t] ? L(TYPES[t]) : t}`).join("; ") : "-"],
                [L("Normal rhythm: gaps between beats"), normal.n ? L("{{n}} beats, average gap {{mean}} ms, typical difference from the average {{sd}} ms, {{rate}} beats a minute", { n: normal.n, mean: normal.mean.toFixed(0), sd: normal.sd.toFixed(0), rate: (60000 / normal.mean).toFixed(0) }) : "-"],
                [L("Ventricular flutter: gaps between beats"), flutter.n ? L("{{n}} beats, average gap {{mean}} ms, typical difference from the average {{sd}} ms, {{rate}} beats a minute", { n: flutter.n, mean: flutter.mean.toFixed(0), sd: flutter.sd.toFixed(0), rate: (60000 / flutter.mean).toFixed(0) }) : "-"],
                [L("Spells of flutter in this part"), flutters.length ? flutters.map((e) => L("{{from}} to {{to}}, {{n}} beats", { from: clock(e.from), to: clock(e.to), n: e.beats })).join("; ") : L("none")],
                [L("Normal rhythm: how uncertain the next gap stays once the current gap is known"), Number.isFinite(narrowNormal.ratio) ? L("{{n}} per cent of the uncertainty is left (100 would mean no help, 0 an exact rule)", { n: (narrowNormal.ratio * 100).toFixed(0) }) : L("not enough beats yet")],
                [L("Flutter: how uncertain the next gap stays once the current gap is known"), Number.isFinite(narrowFlutter.ratio) ? L("{{n}} per cent of the uncertainty is left (100 would mean no help, 0 an exact rule)", { n: (narrowFlutter.ratio * 100).toFixed(0) }) : L("not enough beats yet")],
              ]}
            />
            <Text kind="note" as="p" className="pt-1">
              {L("The recording shows two rhythms. Each rhythm has its own cloud on the return map. The switches between them give no warning in the gaps right before. The recording does not show a rule that gives the next gap. In both rhythms, knowing one gap tells only a little about the next one, as the last two rows of numbers say. The experiments described in the panel 'The experiments' went one step further with their own recordings. In the irregular cloud they found an unstable steady beat, and they aimed their pulses at it. Their tools came from the mathematics of chaos: the return map, a number that measures how fast two nearby states move apart, and the shape that a system settles onto over time.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="chaos-heart-207" />
            <Equations system={system} />
          </>
        }
      />
    </div>
  );
}
