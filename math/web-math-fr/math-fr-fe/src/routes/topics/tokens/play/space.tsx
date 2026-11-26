import { createFileRoute } from "@tanstack/react-router";
import { Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Caption } from "@/components/Caption";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { visible } from "@/lib/tokenText";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO, plate, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { SKIP_STEPS, USED, text as tokenText, tokenIds, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { centre, cosine, distance, nearest, project2 } from "@/systems/lm";
import { rng } from "@/systems/net";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/space")({
  loader: () => api.system(TOPIC, "space"),
  component: SpacePage,
});

/** the words to compare, kept only when the vocabulary holds each as one token, since a word is read as its one vector */
const WORDS = [" cat", " dog", " man", " birds", " warm", " cold", " window", " door", " river", " garden", " winter", " summer", " morning", " evening"].filter((w) => tokenIds(w).length === 1);
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

  const sg = store.skip;
  const E = sg.E;
  const steps = store.skip.steps;
  const ready = steps >= SKIP_STEPS;
  const ids = useMemo(() => ({ a: tokenIds(a)[0], b: tokenIds(b)[0], c: tokenIds(c)[0] }), [a, b, c]);
  const cos = cosine(E[ids.a], E[ids.b]);
  const dist = distance(E[ids.a], E[ids.b]);
  const shown = useMemo(() => USED.slice(0, 40), []);
  const proj = useMemo(() => project2(shown.map((i) => sg.E[i])), [sg, shown]);
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
    const centred = centre(USED.map((i) => sg.E[i])).rows;
    const raw = new Array(BINS).fill(0);
    const cen = new Array(BINS).fill(0);
    let rawSum = 0;
    let cenSum = 0;
    for (let k = 0; k < pairsSeen; k++) {
      const i = Math.floor(next() * USED.length);
      let j = Math.floor(next() * USED.length);
      if (j === i) j = (j + 1) % USED.length;
      const r = cosine(sg.E[USED[i]], sg.E[USED[j]]);
      const q = cosine(centred[i], centred[j]);
      raw[Math.min(BINS - 1, Math.floor(((r + 1) / 2) * BINS))] += 1;
      cen[Math.min(BINS - 1, Math.floor(((q + 1) / 2) * BINS))] += 1;
      rawSum += r;
      cenSum += q;
    }
    return { raw, cen, rawMean: pairsSeen ? rawSum / pairsSeen : 0, cenMean: pairsSeen ? cenSum / pairsSeen : 0 };
  }, [sg, pairsSeen]);

  // the analogy: a - b + c, and where the expected answer ranks
  const analogy = useMemo(() => {
    const target = sg.E[ids.a].map((v, d) => v - sg.E[ids.b][d] + sg.E[ids.c][d]);
    const list = USED.filter((i) => ![ids.a, ids.b, ids.c].includes(i)).map((i) => ({ id: i, cos: cosine(target, sg.E[i]) })).sort((x, y) => y.cos - x.cos);
    const withHeld = USED.map((i) => ({ id: i, cos: cosine(target, sg.E[i]) })).sort((x, y) => y.cos - x.cos);
    return { list: list.slice(0, 4), honest: withHeld.slice(0, 4) };
  }, [sg, ids]);

  const reset = () => {
    runner.reset();
    setPairs(0);
  };

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Measuring how close two tokens are")}
        job={L("How can the closeness of two words be measured? Each token, a piece of text such as a word, has a vector: a list of 8 numbers. Here the vectors were learned from a short story about a cat, a dog and a man, so that words used in the same places get similar vectors. A vector can be pictured as an arrow that starts at one common point. This page measures the arrows in four ways. First, how close two words are, in two senses: the angle between their arrows, and the distance between the tips. The angle is reported as its cosine, which is 1 when two arrows point the same way, 0 at a right angle and -1 when they point in opposite directions. Second, how much a flat drawing of the arrows hides. Third, the well-known word arithmetic: take the arrow from the second word to the first, start it at a third word, and see which word it points at. Fourth, whether all the arrows lean the same way. The first two rows of buttons choose the two words to compare, and the third row chooses the third word. Run measures random pairs of tokens, 3000 in all. The thing to watch is that their cosines are mostly well above 0: the arrows lean together.")}
        input={
          <div className="space-y-3">
            <div data-text="note">{L("Two words to compare: the first row chooses the first word, the second row the second word")}</div>
            <Choices options={PICKS} value={a} onPick={setA} />
            <Choices options={PICKS} value={b} onPick={setB} />
            <div data-text="note">{L("Third word, for the word arithmetic: first word minus second word plus this one")}</div>
            <Choices options={PICKS} value={c} onPick={setC} />
            {!ready ? <Text kind="warning" as="p">{L("The vectors are still being trained: {{done}} of {{total}} steps done. The numbers below keep changing until the training ends.", { done: steps.toLocaleString("en"), total: SKIP_STEPS.toLocaleString("en") })}</Text> : null}
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={pairsSeen}
            what={L("random pairs measured")}
            limit={3000}
            onToggle={() => {
              if (!runner.running && pairsSeen >= 3000) reset();
              runner.toggle();
            }}
            onStep={(many) => runner.once(many)}
            onReset={reset}
            perFrame={perFrame}
            onSpeed={setPerFrame}
          />
        }
        picture={
          <section ref={stage} className="space-y-2">
            <div className="grid gap-2 lg:grid-cols-2">
              <div><div data-slot="plot" className="h-[300px] overflow-hidden">
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
              </div><Caption>{L("A flat view of the 40 commonest tokens, along the two directions in which they spread most. It keeps {{kept}} % of the spread. One arrow goes from the second word to the first. The other arrow is the same arrow, drawn again from the third word.", { kept: (proj.kept * 100).toFixed(0) })}</Caption></div>
              <div><div data-slot="plot" className="h-[300px] overflow-hidden">
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
              </div><Caption>{L("How often each cosine occurs among random pairs of tokens, from -1 on the left to 1 on the right. The vertical line marks 0. Two sets of bars overlap: the vectors as trained, with an average of {{raw}}, and the vectors after centring, that is, after the average vector is subtracted from each, with an average of {{centred}}.", { raw: hist.rawMean.toFixed(2), centred: hist.cenMean.toFixed(2) })}</Caption></div>
            </div>
            <div data-text="caption" className="rounded border border-border p-3">
              <div className="text-muted-foreground">{L("Word arithmetic: which token is nearest to {{a}} − {{b}} + {{c}}?", { a: visible(a), b: visible(b), c: visible(c) })}</div>
              <div className="mt-1 text-foreground/80">
                {L("Nearest tokens, leaving out the three words used, as published demonstrations do: {{list}}", { list: analogy.list.map((n) => `${visible(tokenText(n.id))} (${n.cos.toFixed(2)})`).join(", ") })}
              </div>
              <div className="mt-1 text-foreground/80">
                {L("Nearest tokens, with nothing left out: {{list}}", { list: analogy.honest.map((n) => `${visible(tokenText(n.id))} (${n.cos.toFixed(2)})`).join(", ") })}
              </div>
            </div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict>
              {L("{{a}} and {{b}}: cosine {{cos}}, distance {{dist}}. In the flat picture they are {{flat}} apart, which is {{which}}. The picture keeps {{kept}} % of the spread and hides the rest.", { a: visible(a), b: visible(b), cos: cos.toFixed(3), dist: dist.toFixed(3), flat: flatDist.toFixed(2), which: flatDist < dist * 0.8 ? L("closer than they really are") : L("about as far as they really are"), kept: (proj.kept * 100).toFixed(0) })}
              {pairsSeen > 0 ? ` ${L("Over {{n}} random pairs of tokens, the cosine averages {{raw}}. So the arrows do not point in all directions: they lean the same way and fill a narrow cone. After the average vector is subtracted from every vector, the same pairs average {{centred}}.", { n: pairsSeen, raw: hist.rawMean.toFixed(2), centred: hist.cenMean.toFixed(2) })}` : ` ${L("Run measures random pairs of tokens, to show whether all the vectors lean the same way.")}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Cosine of the angle between the two vectors (1: same direction, 0: right angle, and length does not count)")}</dt>
              <dd className="text-right text-foreground/80">{cos.toFixed(4)}</dd>
              <dt>{L("Distance between the tips of the two vectors (it grows with their length)")}</dt>
              <dd className="text-right text-foreground/80">{dist.toFixed(4)}</dd>
              <dt>{L("Lengths of the vectors of {{a}} and {{b}}", { a: visible(a), b: visible(b) })}</dt>
              <dd className="text-right text-foreground/80">{Math.hypot(...E[ids.a]).toFixed(2)}, {Math.hypot(...E[ids.b]).toFixed(2)}</dd>
              <dt>{L("Tokens nearest to {{token}}, by cosine", { token: visible(a) })}</dt>
              <dd className="text-right text-foreground/80">{nearest(E, ids.a, 3, (i) => USED.includes(i)).map((n) => visible(tokenText(n.id))).join(", ")}</dd>
              <dt>{L("Answer of the word arithmetic, the three words left out")}</dt>
              <dd className="text-right text-foreground/80">{analogy.list[0] ? visible(tokenText(analogy.list[0].id)) : "-"}</dd>
              <dt>{L("Answer of the word arithmetic, nothing left out")}</dt>
              <dd className="text-right text-foreground/80">{analogy.honest[0] ? visible(tokenText(analogy.honest[0].id)) : "-"}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("The famous word arithmetic works only when the three words used are removed from the candidates by hand, and published demonstrations do exactly that. With nothing removed, the nearest token is often one of the three words used. On a text this small the arithmetic barely works either way. On large texts it works for carefully chosen examples. No direction in this space was given a meaning in advance. A direction that seems to mean something was found afterwards.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="space" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}
