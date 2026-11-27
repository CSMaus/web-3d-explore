import { createFileRoute } from "@tanstack/react-router";
import { Button, Text } from "@kit/index";
import { useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { GLYPHS, glyphShape, imageGrey, shapeOf } from "@/lib/outline";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/series";
import { circlesAt, circlesOf, droppedEnergy, type C } from "@/systems/series";

export const Route = createFileRoute("/topics/series/play/draw")({
  loader: () => api.system(TOPIC, "draw"),
  component: DrawPage,
});

const STEPS = 400;
const BOX: Box = { x0: -1.25, x1: 1.25, y0: -1.25, y1: 1.25 };

/**
 * any outline as circles: a sample glyph or the reader's own picture, its longest outline found in
 * the browser and redrawn by circles turning at whole-number speeds. the picture never leaves the
 * browser. the slider sets how many circles are kept, biggest first.
 */
function DrawPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [sample, setSample] = useState("pi");
  const [own, setOwn] = useState<{ name: string; grey: Uint8ClampedArray } | null>(null);
  const [trouble, setTrouble] = useState(false);
  const [count, setCount] = useState(20);
  const [step, setStep] = useState(0);
  const [perFrame, setPerFrame] = useState(1);
  const runner = useRunner((n) => setStep(n), { perFrame, stopAt: STEPS });

  const shape = useMemo(() => {
    if (own) return shapeOf(own.grey);
    return glyphShape(GLYPHS.find((s) => s.id === sample)!.glyph);
  }, [own, sample]);
  const circles = useMemo(() => (shape.length ? circlesOf(shape) : []), [shape]);
  const total = useMemo(() => droppedEnergy(circles, 0), [circles]);
  const kept = Math.min(count, circles.length);
  const share = total ? 1 - droppedEnergy(circles, kept) / total : 0;
  const t = step / STEPS;
  const chain = circles.length ? circlesAt(circles, kept, t) : [];
  const trace = useMemo(() => {
    if (!circles.length) return [];
    const out: C[] = [];
    for (let i = 0; i <= step; i += 1) out.push(circlesAt(circles, kept, i / STEPS).pop()!);
    return out;
  }, [circles, kept, step]);

  const reset = () => {
    runner.reset();
    setStep(0);
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    setTrouble(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const grey = imageGrey(img);
      URL.revokeObjectURL(url);
      if (!grey || shapeOf(grey).length === 0) {
        setTrouble(true);
        return;
      }
      setOwn({ name: file.name, grey });
      reset();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setTrouble(true);
    };
    img.src = url;
  };

  return (
    <TaskPage
      title={system?.name ?? L("Any outline drawn by turning circles")}
      job={L("Can any drawing be made by circles that only turn? One circle is fixed in place. A second circle sits on the edge of the first, a third on the edge of the second, and so on. Each circle turns at a steady pace: some faster, some slower, some the other way. A point on the edge of the last circle moves and leaves a trace. With the right sizes and paces, the trace is the outline of the letter π. This page finds those circles for an outline: a sample letter, or a picture chosen by the reader. The slider sets how many circles are kept, the largest first. The question: how few circles are enough for the shape to be recognised?")}
      input={
        <div className="space-y-3">
          <Choices options={GLYPHS.map((s) => ({ id: s.id, label: s.label }))} value={own ? "" : sample} onPick={(id) => { setOwn(null); setSample(id); reset(); }} />
          <label className="block">
            <span data-text="label">{L("Or a picture of one's own")}</span>
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <span className="relative cursor-pointer">
                  {L("Choose a picture")}
                  <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => upload(e.target.files?.[0])} aria-label={L("Choose a picture")} />
                </span>
              </Button>
            </div>
          </label>
          {own ? <Text kind="note" as="p">{L("Picture in use: {{name}}.", { name: own.name })}</Text> : null}
          {trouble ? <Text kind="warning" as="p">{L("No clear outline was found in this picture. A picture with one dark shape on a light background, or one light shape on a dark background, works best.")}</Text> : null}
          <Slider label={L("Circles kept")} min={1} max={200} step={1} value={count} format={(v) => String(Math.round(v))} onChange={(v) => setCount(Math.round(v))} />
          <Text kind="note" as="p">{L("The picture stays in the browser: it is read on this page and sent nowhere.")}</Text>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={step}
          limit={STEPS}
          what={L("steps around the outline")}
          onToggle={() => {
            if (!runner.running && step >= STEPS) reset();
            runner.toggle();
          }}
          onStep={(many) => setStep((v) => Math.min(STEPS, v + many))}
          onReset={reset}
          perFrame={perFrame}
          onSpeed={setPerFrame}
          pace="fast"
        />
      }
      picture={
        <section ref={stage}>
          <div data-slot="plot" className="h-[min(500px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={BOX}
              equal
              deps={[shape, chain, trace]}
              draw={(pen) => {
                if (!shape.length) return;
                pen.line([...shape, shape[0]], FAINT, 1.5);
                // the circles: the first thirty drawn, every kept one moving the tip
                for (let i = 0; i < chain.length - 1 && i < 30; i += 1) {
                  const c = circles[i];
                  const ring: [number, number][] = [];
                  for (let j = 0; j <= 48; j += 1) ring.push([chain[i][0] + c.r * Math.cos((j / 48) * 2 * Math.PI), chain[i][1] + c.r * Math.sin((j / 48) * 2 * Math.PI)]);
                  pen.ctx.globalAlpha = 0.35;
                  pen.line(ring, MUTED, 1);
                  pen.ctx.globalAlpha = 1;
                  pen.line([chain[i], chain[i + 1]], SKY, 1.1);
                }
                if (trace.length > 1) pen.line(trace, ONE, 2);
                const tip = chain[chain.length - 1];
                if (tip) pen.dot(tip[0], tip[1], 4, INK);
              }}
            />
          </div>
          <Caption>{L("Thin faint line: the outline found in the picture. Thin rings: the first thirty circles, each on the edge of the one before, largest first. Thick line: the trace drawn so far by the point on the last kept circle. Dot: where that point is now. Pressing run sends the point once around the outline.")}</Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={!shape.length ? false : step === 0 ? undefined : share > 0.99}>
            {!shape.length
              ? L("No outline to draw yet.")
              : step === 0
                ? L("{{k}} circles kept out of {{n}}. Press run to send the point once around the outline.", { k: kept, n: circles.length })
                : L("The {{k}} kept circles hold {{p}} per cent of the outline's energy. Energy here means the sum of the squared radii of the circles. The circles left out hold the rest, and that rest is exactly the error of the drawing.", { k: kept, p: (share * 100).toFixed(2) })}
          </Verdict>
          <Readout
            rows={[
              [L("Points on the outline"), String(shape.length)],
              [L("Circles kept"), String(kept)],
              [L("Largest circle: radius, speed"), circles[0] ? `${circles[0].r.toFixed(3)}, ${circles[0].n}` : "-"],
              [L("Energy kept: share of the sum of squared radii"), shape.length ? `${(share * 100).toFixed(2)} %` : "-"],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("Smooth parts of an outline need few circles. Corners and thin strokes need many, as the jump of a square wave does. The speed of a circle is how many turns it makes while the point goes once around the outline, with a minus sign for the other direction. The error of the drawing is measured as the average squared distance between the drawing and the outline. It equals the sum of the squared radii of the circles left out.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="series-drawn-by-circles" />
          <Equations system={system} />
        </>
      }
    />
  );
}
