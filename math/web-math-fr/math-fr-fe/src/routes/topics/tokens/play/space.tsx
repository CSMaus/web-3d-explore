import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { visible } from "@/components/Tokens";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { SKIP_STEPS, USED, text as tokenText, tokenIds, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { centre, cosine, distance, nearest, project2 } from "@/systems/lm";
import { rng } from "@/systems/net";
import { TokenFrame } from "./-shared";

export const Route = createFileRoute("/topics/tokens/play/space")({
  loader: () => api.system(TOPIC, "space"),
  component: SpacePage,
});

const WORDS = [" cat", " dog", " man", " birds", " warm", " cold", " window", " door", " river", " garden", " winter", " summer", " morning", " evening"];
const PICKS = WORDS.map((w) => ({ id: w, label: w.trim() }));
const BINS = 40;

function SpacePage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny({ skip: true });
  const [a, setA] = useState(" warm");
  const [b, setB] = useState(" cold");
  const [c, setC] = useState(" winter");
  const [pairsSeen, setPairs] = useState(0);
  const [perFrame, setPerFrame] = useState(2);

  const E = store.skip.E;
  const steps = store.skip.steps;
  const ready = steps >= SKIP_STEPS;
  const ids = { a: tokenIds(a)[0], b: tokenIds(b)[0], c: tokenIds(c)[0] };
  const cos = cosine(E[ids.a], E[ids.b]);
  const dist = distance(E[ids.a], E[ids.b]);
  const shown = useMemo(() => USED.slice(0, 40), []);
  const proj = useMemo(() => project2(shown.map((i) => E[i])), [E, steps, shown]);
  const box = useMemo<Box>(() => {
    const xs = proj.points.map((p) => p[0]);
    const ys = proj.points.map((p) => p[1]);
    return { x0: Math.min(...xs) - 0.3, x1: Math.max(...xs) + 0.3, y0: Math.min(...ys) - 0.3, y1: Math.max(...ys) + 0.3 };
  }, [proj]);
  const flat = (id: number) => proj.points[shown.indexOf(id)] ?? [0, 0];
  const flatDist = Math.hypot(flat(ids.a)[0] - flat(ids.b)[0], flat(ids.a)[1] - flat(ids.b)[1]);

  // the cone: cosines between random pairs, raw and after centring, one pair a step
  const runner = useRunner((n) => setPairs(n), { perFrame, stopAt: 3000 });
  const hist = useMemo(() => {
    const next = rng(21);
    const centred = centre(USED.map((i) => E[i])).rows;
    const raw = new Array(BINS).fill(0);
    const cen = new Array(BINS).fill(0);
    let rawSum = 0;
    let cenSum = 0;
    for (let k = 0; k < pairsSeen; k++) {
      const i = Math.floor(next() * USED.length);
      let j = Math.floor(next() * USED.length);
      if (j === i) j = (j + 1) % USED.length;
      const r = cosine(E[USED[i]], E[USED[j]]);
      const q = cosine(centred[i], centred[j]);
      raw[Math.min(BINS - 1, Math.floor(((r + 1) / 2) * BINS))] += 1;
      cen[Math.min(BINS - 1, Math.floor(((q + 1) / 2) * BINS))] += 1;
      rawSum += r;
      cenSum += q;
    }
    return { raw, cen, rawMean: pairsSeen ? rawSum / pairsSeen : 0, cenMean: pairsSeen ? cenSum / pairsSeen : 0 };
  }, [E, steps, pairsSeen]);

  // the analogy: a - b + c, and where the expected answer ranks
  const analogy = useMemo(() => {
    const target = E[ids.a].map((v, d) => v - E[ids.b][d] + E[ids.c][d]);
    const list = USED.filter((i) => ![ids.a, ids.b, ids.c].includes(i)).map((i) => ({ id: i, cos: cosine(target, E[i]) })).sort((x, y) => y.cos - x.cos);
    const withHeld = USED.map((i) => ({ id: i, cos: cosine(target, E[i]) })).sort((x, y) => y.cos - x.cos);
    return { list: list.slice(0, 4), honest: withHeld.slice(0, 4) };
  }, [E, steps, ids.a, ids.b, ids.c]);

  const reset = () => {
    runner.reset();
    setPairs(0);
  };

  return (
    <TokenFrame>
      <TaskPage
        title={system?.name ?? "Measuring the space"}
        job="The rows now carry something. The job is to say what, with measurements rather than impressions: how close two tokens are, in two different senses; how much a flat picture of the space lies; whether a direction carries a relation; and how narrow the cone all the vectors sit in."
        input={
          <div className="space-y-3">
            <div className="text-[11px] text-muted">Two tokens to compare</div>
            <Choices options={PICKS} value={a} onPick={setA} />
            <Choices options={PICKS} value={b} onPick={setB} />
            <div className="text-[11px] text-muted">The analogy: first minus second plus this</div>
            <Choices options={PICKS} value={c} onPick={setC} />
            {!ready ? <p className="text-[11px] text-warn">The vectors are still training ({steps.toLocaleString("en")} of {SKIP_STEPS.toLocaleString("en")} steps); the numbers below move until that finishes.</p> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={pairsSeen}
            what="random pairs measured"
            limit={3000}
            onToggle={() => {
              if (!runner.running && pairsSeen >= 3000) reset();
              runner.toggle();
            }}
            onStep={(many) => setPairs((v) => Math.min(3000, v + many))}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              <div><div className="h-[300px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={box}
                  equal
                  deps={[proj, ids, box]}
                  draw={(pen) => {
                    ticks(pen);
                    const v = pen.box;
                    pen.axes(FAINT);
                    shown.forEach((tok, i) => {
                      const [x, y] = proj.points[i];
                      const on = tok === ids.a || tok === ids.b || tok === ids.c;
                      pen.dot(x, y, on ? 5 : 3, on ? (tok === ids.a ? ONE : tok === ids.b ? TWO : SKY) : "#6b7280");
                      if (on || i < 20) plate(pen, visible(tokenText(tok)), x + (v.x1 - v.x0) * 0.012, y + (v.y1 - v.y0) * 0.02, on ? INK : MUTED);
                    });
                    // the difference as an arrow, and the same arrow moved to the third token
                    const pa = flat(ids.a);
                    const pb = flat(ids.b);
                    const pc = flat(ids.c);
                    pen.arrow(pb[0], pb[1], pa[0] - pb[0], pa[1] - pb[1], INK);
                    pen.arrow(pc[0], pc[1], pa[0] - pb[0], pa[1] - pb[1], SKY);
                  }}
                />
              </div><Caption>{`Flat picture: ${(proj.kept * 100).toFixed(0)} % of the spread kept`}. White: second to first.  Sky: same arrow, from the third</Caption></div>
              <div><div className="h-[300px] overflow-hidden rounded border border-edge">
                <Plot
                  className="h-full w-full"
                  box={{ x0: -1, x1: 1, y0: 0, y1: 1 }}
                  deps={[hist]}
                  draw={(pen) => {
                    ticks(pen);
                    const top = Math.max(1, ...hist.raw, ...hist.cen);
                    const w = 2 / BINS;
                    for (let i = 0; i < BINS; i++) {
                      const x = -1 + i * w;
                      const hr = (hist.raw[i] / top) * 0.8;
                      const hc = (hist.cen[i] / top) * 0.8;
                      pen.ctx.fillStyle = "rgba(199,90,176,0.55)";
                      pen.ctx.fillRect(pen.px(x) + 1, pen.py(hr), Math.max(1, pen.px(x + w) - pen.px(x) - 2), pen.py(0) - pen.py(hr));
                      pen.ctx.fillStyle = "rgba(143,211,232,0.55)";
                      pen.ctx.fillRect(pen.px(x) + 1, pen.py(hc), Math.max(1, pen.px(x + w) - pen.px(x) - 2), pen.py(0) - pen.py(hc));
                    }
                    pen.line([[0, 0], [0, 0.85]], FAINT, 1);
                  }}
                />
              </div><Caption>Cosine of random pairs: -1 left, 1 right. {`Rose: raw, mean ${hist.rawMean.toFixed(2)}.  Sky: centred, mean ${hist.cenMean.toFixed(2)}`}</Caption></div>
            </div>
            <div className="rounded border border-edge p-3 font-mono text-[11px]">
              <div className="text-muted">The analogy {visible(a)} − {visible(b)} + {visible(c)} = ?</div>
              <div className="mt-1 text-ink/80">
                Nearest, with the three inputs excluded by hand as is usual: {analogy.list.map((n) => `${visible(tokenText(n.id))} (${n.cos.toFixed(2)})`).join(", ")}
              </div>
              <div className="mt-1 text-ink/80">
                Nearest, with nothing excluded: {analogy.honest.map((n) => `${visible(tokenText(n.id))} (${n.cos.toFixed(2)})`).join(", ")}
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {visible(a)} and {visible(b)}: Cosine {cos.toFixed(3)}, Distance {dist.toFixed(3)}. In the flat picture they are {flatDist.toFixed(2)} apart, which is {flatDist < dist * 0.8 ? "closer than they really are" : "about as far as they really are"}; The picture keeps {(proj.kept * 100).toFixed(0)} per cent of the spread and hides the rest.
              {pairsSeen > 0 ? ` Over ${pairsSeen} random pairs the raw cosines average ${hist.rawMean.toFixed(2)}: the vectors lean one way together, a cone rather than a cloud. Take the average vector away and the same pairs average ${hist.cenMean.toFixed(2)}.` : " Press run to measure the cone."}
            </Verdict>
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
              <dt>Cosine: the angle between them, blind to length</dt>
              <dd className="text-right text-ink/80">{cos.toFixed(4)}</dd>
              <dt>Distance: how far apart, which grows with length</dt>
              <dd className="text-right text-ink/80">{dist.toFixed(4)}</dd>
              <dt>Length of {visible(a)}, Length of {visible(b)}</dt>
              <dd className="text-right text-ink/80">{Math.hypot(...E[ids.a]).toFixed(2)}, {Math.hypot(...E[ids.b]).toFixed(2)}</dd>
              <dt>Nearest to {visible(a)} by cosine</dt>
              <dd className="text-right text-ink/80">{nearest(E, ids.a, 3, (i) => USED.includes(i)).map((n) => visible(tokenText(n.id))).join(", ")}</dd>
              <dt>The analogy's usual answer</dt>
              <dd className="text-right text-ink/80">{analogy.list[0] ? visible(tokenText(analogy.list[0].id)) : "-"}</dd>
              <dt>The honest answer, nothing excluded</dt>
              <dd className="text-right text-ink/80">{analogy.honest[0] ? visible(tokenText(analogy.honest[0].id)) : "-"}</dd>
            </dl>
            <p className="pt-1 text-[11px] text-muted">
              The famous arithmetic works when the inputs are removed from the candidates by hand,
              which is what every demonstration of it does. With nothing removed the answer is
              usually one of the inputs. On a text this small it barely works either way, and on a
              large one it works for curated examples. No axis of this space was given a meaning;
              a direction that seems to mean something was found afterwards.
            </p>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="space" />
            <Equations system={system} />
          </>
        }
      />
    </TokenFrame>
  );
}
