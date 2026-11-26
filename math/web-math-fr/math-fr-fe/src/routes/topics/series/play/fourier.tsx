import { createFileRoute } from "@tanstack/react-router";
import { Button, Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { OptionGroup } from "@/components/OptionGroup";
import { Plot, type Box } from "@/components/Plot";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { FAINT, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/series";
import { peakOf, waveAt, waveSum, waveTerms, type Wave } from "@/systems/series";

export const Route = createFileRoute("/topics/series/play/fourier")({
  loader: () => api.system(TOPIC, "fourier"),
  component: FourierPage,
});

const MOST = 40;
/** the circles on the left, centred at (-2.4, 0); the wave on the right over one turn, x from 0 to 2 pi */
const BOX: Box = { x0: -4.4, x1: 6.6, y0: -1.9, y1: 1.9 };
const HUB = -2.4;
const WAVES: { id: Wave; label: string }[] = [
  { id: "square", label: L("Square") },
  { id: "sawtooth", label: L("Sawtooth") },
  { id: "triangle", label: L("Triangle") },
];

/**
 * a wave rebuilt from sines, each sine a circle turning on the tip of the one before. the tip's
 * height, carried across, traces the sum beside the wave it is aiming at; run adds the sines one
 * by one, and the overshoot at a jump is measured as it stays.
 */
function FourierPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [wave, setWave] = useState<Wave>("square");
  const [count, setCount] = useState(1);
  const [perFrame, setPerFrame] = useState(0.06);
  const [phase, setPhase] = useState(0.6);
  const runner = useRunner((n) => setCount(Math.min(MOST, 1 + n)), { perFrame, stopAt: MOST - 1 });
  const terms = useMemo(() => waveTerms(wave, count), [wave, count]);
  const peak = useMemo(() => peakOf(terms, 4000), [terms]);
  const error = useMemo(() => {
    let s = 0;
    const n = 2000;
    for (let i = 0; i < n; i += 1) {
      const x = -Math.PI + ((i + 0.5) * 2 * Math.PI) / n;
      s += (waveSum(terms, x) - waveAt(wave, x)) ** 2;
    }
    return Math.sqrt(s / n);
  }, [terms, wave]);
  const jumps = wave !== "triangle";

  // the circles turn, one turn every eight seconds, while the run adds circles and for one turn
  // when asked; otherwise, and for a reader who asked for stillness, they hold
  const [spin, setSpin] = useState(false);
  const moving = runner.running || spin;
  useEffect(() => {
    if (!moving || typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    let frame = 0;
    let last = performance.now();
    let turned = 0;
    const tick = (now: number) => {
      const step = ((now - last) / 8000) * 2 * Math.PI;
      last = now;
      turned += step;
      setPhase((p) => (p + step) % (2 * Math.PI));
      if (!runner.running && turned >= 2 * Math.PI) {
        setSpin(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [moving, runner.running]);

  const reset = () => {
    runner.reset();
    setCount(1);
  };

  return (
    <TaskPage
      title={system?.name ?? L("Fourier series: a wave from turning circles")}
      job={L("How can a square wave, with flat tops and sudden jumps, be made from circles that turn smoothly? A square wave is a line that stays at 1, jumps down to -1, stays there, jumps back up, and so on for ever. A point going round a circle at a steady pace has a height that rises and falls smoothly. This curve is called a sine wave. One circle gives a sine wave whose top is at 1.273, too high. A second circle sits on the edge of the first. It is a third as big and turns three times as fast. A point on its edge draws a curve that is already flatter on top. More circles follow, each smaller and faster, at the speeds 5, 7, 9 and so on, and the drawn curve turns into a square wave. Three circles bring the top down to 1.188, ten to 1.180, forty to 1.179. There it stays, about 9 per cent of the jump above the flat top. A sum of sine waves like this is called a Fourier series, and the sizes of the circles are its Fourier coefficients. Almost any repeating wave met in practice can be built this way. The question: which waves need many circles, and which error never goes away however many circles are added?")}
      input={
        <div className="space-y-3">
          <OptionGroup title={L("Which wave")}>
            <Choices options={WAVES} value={wave} onPick={(id) => { setWave(id); reset(); }} />
            <Text kind="note" as="p">{L("Three waves to choose from. The square wave jumps between 1 and -1. The sawtooth rises steadily and then drops back at once. Both jump once in each turn. The triangle wave goes up and down in straight lines: it has corners but no jump. The three need very different numbers of circles.")}</Text>
          </OptionGroup>
          <OptionGroup title={L("The circles")}>
            <Text kind="note" as="p">{L("Run adds the circles one at a time, and the circles turn while it goes on. The step buttons add circles without turning them. The button below turns the circles once. The dashed line in the picture carries the height of the moving point across to the wave.")}</Text>
            <Button variant="outline" size="sm" disabled={moving} onClick={() => setSpin(true)}>{L("Turn the circles once")}</Button>
          </OptionGroup>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={count}
          limit={MOST}
          what={L("circles")}
          onToggle={() => {
            if (!runner.running && count >= MOST) reset();
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
        <section ref={stage}>
          <div data-slot="plot" className="h-[min(440px,calc(100vh-20rem))] overflow-hidden">
            <Plot
              className="h-full w-full"
              box={BOX}
              equal
              deps={[terms, phase, wave]}
              draw={(pen) => {
                pen.line([[BOX.x0, 0], [BOX.x1, 0]], FAINT, 1);
                pen.line([[0, BOX.y0], [0, BOX.y1]], FAINT, 1);
                // the circles, tip to tail, at this moment
                let cx = HUB;
                let cy = 0;
                terms.forEach((t, i) => {
                  const r = Math.hypot(t.a, t.b);
                  const ring: [number, number][] = [];
                  for (let j = 0; j <= 64; j += 1) ring.push([cx + r * Math.cos((j / 64) * 2 * Math.PI), cy + r * Math.sin((j / 64) * 2 * Math.PI)]);
                  pen.ctx.globalAlpha = i < 12 ? 0.55 : 0.25;
                  pen.line(ring, MUTED, 1);
                  pen.ctx.globalAlpha = 1;
                  // a sine term b sin(k t) is the height of b e^{ikt}; a cosine term a cos(k t) of i a e^{ikt}
                  const ang = t.k * phase;
                  const nx = cx + t.b * Math.cos(ang) - t.a * Math.sin(ang);
                  const ny = cy + t.b * Math.sin(ang) + t.a * Math.cos(ang);
                  pen.line([[cx, cy], [nx, ny]], SKY, 1.2);
                  cx = nx;
                  cy = ny;
                });
                pen.dot(cx, cy, 4, INK);
                // the wave on the right: the aim, the sum, and where the tip is now
                const xs = Array.from({ length: 600 }, (_, i) => (i / 599) * 2 * Math.PI);
                pen.line(xs.map((u) => [u, waveAt(wave, u)]), FAINT, 2);
                pen.line(xs.map((u) => [u, waveSum(terms, u)]), ONE, 2);
                const at = phase;
                pen.ctx.setLineDash([4, 4]);
                pen.line([[cx, cy], [at, cy]], TWO, 1);
                pen.ctx.setLineDash([]);
                pen.dot(at, cy, 5, TWO);
              }}
            />
          </div>
          <Caption>
            {L("Left: the circles, each sitting on the edge of the one before. The first and largest is fixed in place. The dot on the last circle is the moving point. Right: one full turn of the wave. Faint thick line: the wave being aimed at. Solid line: the sum of the circles so far. Dashed line: the height of the moving point, carried across to the part of the wave it is drawing now.")}
          </Caption>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={count < 3 ? undefined : !jumps ? error < 0.01 : undefined}>
            {jumps
              ? L("With {{n}} circles the sum differs from the wave by {{e}} on average. Next to the jump it rises to {{p}}, which is {{o}} per cent of the jump above the flat top. More circles make this spike narrower, but it does not get lower.", { n: count, e: error.toFixed(3), p: peak.toFixed(3), o: (((peak - 1) / 2) * 100).toFixed(1) })
              : L("With {{n}} circles the sum differs from the triangle wave by {{e}} on average. A wave without jumps needs few circles, because its circles shrink fast. The next circles of the triangle wave are 1/9, 1/25 and 1/49 of the first: one over the square of the speed. Those of the square wave shrink only to 1/3, 1/5 and 1/7 of the first: one over the speed.", { n: count, e: error.toFixed(4) })}
          </Verdict>
          <Readout
            rows={[
              [L("Wave chosen"), WAVES.find((w) => w.id === wave)!.label],
              [L("Circles added"), String(count)],
              [L("Speeds of the circles (turns per turn of the first)"), terms.map((t) => t.k).slice(0, 8).join(", ") + (terms.length > 8 ? ", ..." : "")],
              [L("Average error: how far the sum is from the wave"), error.toFixed(4)],
              [L("Highest point of the sum"), peak.toFixed(4)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("The spike next to a jump never goes away. Its height tends to about 9 per cent of the jump above the flat top, however many circles are added. For a square wave between -1 and 1 the sum peaks at 1.179. Henry Wilbraham described this in 1848. It was seen again in 1898 on Michelson's machine, which added sine waves with gears, and Gibbs explained it in 1899. It is now called the Gibbs phenomenon. Another page of this topic, 'Any outline drawn by turning circles', uses circles of the same kind to draw a closed shape instead of a wave.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name={`series-fourier-${wave}`} />
          <Equations system={system} />
        </>
      }
    />
  );
}
