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
import { FAINT, MUTED, ONE, SKY, plate, ticks } from "@/lib/draw";
import { useRunner } from "@/lib/runner";
import { SKIP_STEPS, USED, countOf, resetSkip, stepSkip, text as tokenText, tokenIds, useTiny } from "@/lib/tiny";
import { TOPIC } from "@/lib/tokens";
import { nearest, project2 } from "@/systems/lm";
import { L } from "@/lib/lang";

export const Route = createFileRoute("/topics/tokens/play/meaning")({
  loader: () => api.system(TOPIC, "meaning"),
  component: MeaningPage,
});

const PROBES = [" cat", " dog", " man", " birds", " warm", " cold", " window", " door", " river", " garden"].map((w) => ({ id: w, label: w.trim() }));
const CHUNK = 500;

function MeaningPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const store = useTiny();
  const [probe, setProbe] = useState(" cat");
  const [perFrame, setPerFrame] = useState(1);
  const [, bump] = useState(0);

  const [limit, setLimit] = useState(SKIP_STEPS);
  const runner = useRunner(
    () => {
      stepSkip(CHUNK);
      bump((v) => v + 1);
    },
    { perFrame, stopAt: limit / CHUNK },
  );
  const sg = store.skip;
  const steps = sg.steps;
  const shown = useMemo(() => USED.slice(0, 40), []);
  const proj = useMemo(() => project2(shown.map((i) => sg.E[i])), [sg, shown]);
  const box = useMemo<Box>(() => {
    const xs = proj.points.map((p) => p[0]);
    const ys = proj.points.map((p) => p[1]);
    const pad = 0.3;
    return { x0: Math.min(...xs) - pad, x1: Math.max(...xs) + pad, y0: Math.min(...ys) - pad, y1: Math.max(...ys) + pad };
  }, [proj]);
  const id = tokenIds(probe)[0];
  const near = useMemo(() => nearest(sg.E, id, 5, (i) => USED.includes(i)), [sg, id]);
  const histBox = useMemo<Box>(() => ({ x0: 0, x1: Math.max(1000, steps), y0: 0, y1: Math.max(1, ...store.skipHistory.map((p) => p[1])) * 1.1 }), [steps, store.skipHistory]);
  const rare = useMemo(() => USED.slice(-1)[0], []);
  const frequent = USED[0];

  const reset = () => {
    runner.reset();
    resetSkip();
    bump((v) => v + 1);
  };
  const cat = tokenIds(" cat")[0];
  const dog = tokenIds(" dog")[0];
  const catDog = near.length ? nearest(sg.E, cat, 200, (i) => i === dog)[0]?.cos ?? 0 : 0;

  return (
    <>
      <TaskPage
        title={system?.name ?? L("Where meaning comes from")}
        job={L("Can a computer learn which words are related only from where they appear? Each token, a piece of text such as a word, has a row of 8 numbers in a table. This row is called the token's vector. At the start the numbers are random. Here they are trained by a method called skip-gram with negative sampling. Each training step takes one token of a short story about a cat, a dog and a man, and one token near it, at most 3 places away. The step moves the first token's vector a little, so that the neighbour scores higher with it and 4 tokens picked at random score lower. After 60,000 steps, words used in the same places, such as cat and dog, end up with similar vectors. The buttons choose a word, and the picture marks its five nearest tokens. Run trains the vectors, and the picture follows. The thing to watch is which words gather together.")}
        input={
          <div className="space-y-3">
            <Choices options={PROBES} value={probe} onPick={setProbe} />
            <Text kind="note" as="p">
              {L("The ringed dot is the chosen word. The result below lists its five nearest tokens, measured by cosine: a number from -1 to 1 that is 1 when two vectors point the same way. Each vector has 8 numbers and cannot be drawn directly. The picture is a flat view of the vectors, so two dots can look close while the vectors are far apart.")}
            </Text>
            <Text kind="note" as="p">
              {L("The training text is a short story about a cat, a dog and a man, 2039 bytes long and cut into 516 tokens. Each training step looks at one token and one of its neighbours, and moves one row of the table.")}
            </Text>
          </div>
        }
        run={
          <RunBar
            running={runner.running}
            count={steps}
            what={L("training steps")}
            limit={limit}
            onLimit={(v) => setLimit(v)}
            limitRange={{ min: 5000, max: 120000, step: 5000 }}
            onToggle={() => {
              if (!runner.running && steps >= limit) reset();
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
            <div><div data-slot="plot" className="h-[420px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={box}
                equal
                deps={[proj, id, box, near]}
                draw={(pen) => {
                  ticks(pen);
                  const v = pen.box;
                  pen.axes(FAINT);
                  shown.forEach((tok, i) => {
                    const [x, y] = proj.points[i];
                    const isProbe = tok === id;
                    const isNear = near.some((n) => n.id === tok);
                    pen.dot(x, y, isProbe ? 6 : 3.5, isProbe ? ONE : isNear ? SKY : "#6b7280");
                    if (isProbe) pen.ring(x, y, 10, ONE, 1.5);
                    plate(pen, visible(tokenText(tok)), x + (v.x1 - v.x0) * 0.012, y + (v.y1 - v.y0) * 0.02, isProbe ? ONE : isNear ? SKY : MUTED);
                  });
                }}
              />
            </div><Caption>{L("The forty commonest tokens. Each vector of 8 numbers is drawn as a point along the two directions in which the points spread most, which keeps {{kept}} % of the spread. The ringed dot is the chosen word. Its five nearest tokens by cosine are highlighted.", { kept: (proj.kept * 100).toFixed(0) })}</Caption></div>
            <div><div data-slot="plot" className="h-[130px] overflow-hidden">
              <Plot
                className="h-full w-full"
                box={histBox}
                deps={[store.skipHistory, histBox]}
                draw={(pen) => {
                  ticks(pen);
                  pen.axes(FAINT);
                  pen.line(store.skipHistory, ONE, 1.8);
                }}
              />
            </div><Caption>{L("Training error against steps: how badly the vectors predict the neighbours. Lower is better")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={steps === 0 ? undefined : catDog > 0.6}>
              {steps === 0
                ? L("Nothing is trained yet. The vectors are random, so the nearest tokens to {{probe}} are whichever happened to land near it: {{near}}. Run starts the training.", { probe: visible(probe), near: near.map((n) => visible(tokenText(n.id))).join(", ") })
                : `${L("After {{steps}} training steps, the nearest tokens to {{probe}} are {{near}}. The number in brackets is the cosine: 1 means the same direction, 0 means at a right angle.", { steps: steps.toLocaleString("en"), probe: visible(probe), near: near.map((n) => `${visible(tokenText(n.id))} (${n.cos.toFixed(2)})`).join(", ") })} ${catDog > 0.6 ? L("The cosine between cat and dog is now {{cos}}. The two words occur in the same places in the text, so training pulled their vectors together.", { cos: catDog.toFixed(2) }) : L("The cosine between cat and dog is now {{cos}}. More training will bring them closer, because the two words occur in the same places in the text.", { cos: catDog.toFixed(2) })}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Times the vector of {{token}} was moved", { token: visible(tokenText(frequent)) })}</dt>
              <dd className="text-right text-foreground/80">{sg.touched[frequent]} {L("(the token occurs {{n}} times in the text)", { n: countOf(frequent) })}</dd>
              <dt>{L("Times the vector of {{token}} was moved", { token: visible(tokenText(rare)) })}</dt>
              <dd className="text-right text-foreground/80">{sg.touched[rare]} {countOf(rare) === 1 ? L("(the token occurs {{n}} time)", { n: countOf(rare) }) : L("(the token occurs {{n}} times)", { n: countOf(rare) })}</dd>
              <dt>{L("Rows of the table never moved at all")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} of {{b}}", { a: sg.touched.filter((t) => t === 0).length, b: sg.touched.length })}</dd>
              <dt>{L("Training error, averaged over recent steps")}</dt>
              <dd className="text-right text-foreground/80">{sg.loss.toFixed(3)}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("A step moves only the vectors of the tokens it looked at. The vector of a common token is moved thousands of times, and that of a rare token only a few times. A token that never occurs in the text keeps its random vector for ever. The method rests on one assumption: tokens found in the same places mean similar things. So a word with two meanings gets a single vector, somewhere between the two. Later pages of this topic show how a model gives a word a different vector in each sentence.")}
            </Text>
          </div>
        }
        below={
          <>
            <SaveImage stage={stage} name="meaning" />
            <Equations system={system} />
          </>
        }
      />
    </>
  );
}

