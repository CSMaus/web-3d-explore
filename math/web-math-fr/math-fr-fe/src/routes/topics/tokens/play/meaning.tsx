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
        title={system?.name ?? L("Where the meaning comes from")}
        job={L("The table's rows are random. The job is to give them meaning, and there is only one place meaning can come from: a loss. Here the loss is a small one of its own: from a token's row, predict the tokens that occur near it in the text, and push apart the ones that do not. Watch the rows move, and watch which words end up near which.")}
        input={
          <div className="space-y-3">
            <Choices options={PROBES} value={probe} onPick={setProbe} />
            <Text kind="note" as="p">
              {L("The ringed token is the one whose nearest neighbours are listed. The map is a flat picture of vectors with eight numbers each; the next page says how much it hides.")}
            </Text>
            <Text kind="note" as="p">
              {L("This is skip-gram with negative sampling, run on the text from the vocabulary page. Each step looks at one token and one neighbour, and moves one row of the table.")}
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
            onStep={(many) => {
              stepSkip(CHUNK * many);
              bump((v) => v + 1);
            }}
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
            </div><Caption>{L("The forty commonest tokens, their vectors flattened to two axes ({{kept}} % of the spread kept). Green: the chosen token.  Sky: its five nearest by cosine.", { kept: (proj.kept * 100).toFixed(0) })}</Caption></div>
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
            </div><Caption>{L("How wrong the neighbour predictions are, against steps")}</Caption></div>
          </section>
        }
        result={
          <div className="space-y-2">
            <Verdict good={steps === 0 ? undefined : catDog > 0.6}>
              {steps === 0
                ? L("Nothing trained: the rows are random, so the nearest tokens to {{probe}} are whichever happened to land nearby: {{near}}. Press run.", { probe: visible(probe), near: near.map((n) => visible(tokenText(n.id))).join(", ") })
                : `${L("After {{steps}} steps the nearest tokens to {{probe}} are {{near}}.", { steps: steps.toLocaleString("en"), probe: visible(probe), near: near.map((n) => `${visible(tokenText(n.id))} (${n.cos.toFixed(2)})`).join(", ") })} ${catDog > 0.6 ? L("Cat and dog now sit at cosine {{cos}}: They occur in the same places in the text, so the loss pushed their rows together.", { cos: catDog.toFixed(2) }) : L("Cat and dog now sit at cosine {{cos}}; More steps will bring them together, because they occur in the same places in the text.", { cos: catDog.toFixed(2) })}`}
            </Verdict>
            <dl data-text="caption" className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1">
              <dt>{L("Times the row for {{token}} was moved", { token: visible(tokenText(frequent)) })}</dt>
              <dd className="text-right text-foreground/80">{sg.touched[frequent]} {L("(It occurs {{n}} times in the text)", { n: countOf(frequent) })}</dd>
              <dt>{L("Times the row for {{token}} was moved", { token: visible(tokenText(rare)) })}</dt>
              <dd className="text-right text-foreground/80">{sg.touched[rare]} {countOf(rare) === 1 ? L("(It occurs {{n}} time)", { n: countOf(rare) }) : L("(It occurs {{n}} times)", { n: countOf(rare) })}</dd>
              <dt>{L("Rows never moved at all")}</dt>
              <dd className="text-right text-foreground/80">{L("{{a}} of {{b}}", { a: sg.touched.filter((t) => t === 0).length, b: sg.touched.length })}</dd>
              <dt>{L("How wrong, smoothed")}</dt>
              <dd className="text-right text-foreground/80">{sg.loss.toFixed(3)}</dd>
            </dl>
            <Text kind="note" as="p" className="pt-1">
              {L("A step moves only the rows of the tokens it looked at. A common token's row is moved thousands of times and a rare one's a handful, and a token that never occurs keeps its random row for ever. The premise underneath is that tokens found in the same places mean similar things; it gives a word with two meanings one row between them, which is what the later pages fix.")}
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

