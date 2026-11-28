import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { num } from "@/lib/storyline";
import { lerp, sBox, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Act, Fade, Set, Top } from "@/storylines/probability/memory";
import { beyond, density, histogram, mean, remaining, samples } from "@/systems/probability";

type Point = [number, number];

export type Values = { waited: number };
export const DEFAULTS: Values = { waited: 10 };
export type Data = { values: Values; taxi: Float64Array; bus: Float64Array };

const COUNT = 10000;
const TAXI_SEED = 4;
const BUS_SEED = 5;
const BUS_EVERY = 20;
const PLACES = 1;

const THIN = 1;
const PLOT = { x0: 10, y0: 14, x1: 94, y1: 62 };
const SPAN = 50;
const TOP = 0.11;
const TICK_STEP = 10;
const TICK_Y = 10.5;
const TICK_SIZE = 2.3;
const SCALE_X = 8.5;
const SCALE_PLACES = 2;

const BAR_FILL = 0.92;
const PAST = 0.2;
const POINTS = 200;

const SPLIT_WEIGHT = 1.5;
const SPLIT_Y = 64.5;
const SPLIT_SIZE = 2.6;

const COPY_ALPHA = 0.8;

const timeX = (minutes: number) => lerp(PLOT.x0, PLOT.x1, minutes / SPAN);
const heightY = (level: number) => lerp(PLOT.y0, PLOT.y1, Math.min(1, level / TOP));
const levelsOf = (waits: Float64Array) => histogram(waits, 0, SPAN, SPAN).map((n) => n / waits.length);

export function build(values: Values): Data {
  return { values, taxi: samples("exponential", COUNT, TAXI_SEED), bus: samples("uniform", COUNT, BUS_SEED) };
}

export function applyAct(set: Set, values: Values, act: Act | null): Set {
  return act === "waited" ? { ...set, waited: values.waited } : set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "bus":
      return L("A bus every {{n}} minutes", { n: BUS_EVERY });
    case "left":
      return L("At most {{n}} minutes left", { n: Math.max(0, BUS_EVERY - set.waited) });
    case "still":
      return L("Still waiting after {{t}} minutes: {{k}} of {{n}}", { t: set.waited, k: num(remaining(data.taxi, set.waited).length), n: num(data.taxi.length) });
    case "ahead":
      return L("Average wait still ahead: {{m}} min", { m: mean(remaining(data.taxi, set.waited)).toFixed(PLACES) });
  }
}

function drawAxis(pen: Pen, st: Stage) {
  sLine(pen, st, [[PLOT.x0, PLOT.y0], [PLOT.x1, PLOT.y0]], FAINT, THIN);
  for (let m = 0; m <= SPAN; m += TICK_STEP) sText(pen, st, String(m), timeX(m), TICK_Y, MUTED, "center", TICK_SIZE);
  sText(pen, st, TOP.toFixed(SCALE_PLACES), SCALE_X, PLOT.y1, MUTED, "right", TICK_SIZE);
}

function bar(pen: Pen, st: Stage, from: number, level: number, colour: string) {
  const pad = (1 - BAR_FILL) / 2;
  sBox(pen, st, timeX(from + pad), PLOT.y0, timeX(from + 1 - pad), heightY(level), colour);
}

function drawWaits(pen: Pen, st: Stage, waits: Float64Array, waited: number, split: number) {
  levelsOf(waits).forEach((level, m) => {
    withAlpha(pen, m < waited ? lerp(1, PAST, split) : 1, () => bar(pen, st, m, level, SKY));
  });
}

function drawDensity(pen: Pen, st: Stage) {
  const pts: Point[] = [];
  for (let i = 0; i < POINTS; i += 1) {
    const m = (SPAN * i) / (POINTS - 1);
    pts.push([timeX(m), heightY(density("exponential", m))]);
  }
  sLine(pen, st, pts, MUTED, THIN);
}

function drawSplit(pen: Pen, st: Stage, waited: number) {
  const x = timeX(waited);
  sLine(pen, st, [[x, PLOT.y0], [x, PLOT.y1]], INK, SPLIT_WEIGHT);
  sText(pen, st, String(waited), x, SPLIT_Y, INK, "center", SPLIT_SIZE);
}

function drawShift(pen: Pen, st: Stage, taxi: Float64Array, waited: number, shift: number) {
  const scale = lerp(1, 1 / beyond("exponential", waited), shift);
  levelsOf(taxi).forEach((level, m) => {
    if (m >= waited) bar(pen, st, m - waited * shift, level * scale, ONE);
  });
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);
  const waited = Math.max(0, Math.min(SPAN, Math.round(set.waited)));

  drawAxis(pen, st);
  withAlpha(pen, fade.taxi, () => {
    drawWaits(pen, st, data.taxi, waited, fade.split);
    drawDensity(pen, st);
  });
  withAlpha(pen, fade.bus, () => drawWaits(pen, st, data.bus, waited, fade.split));
  withAlpha(pen, fade.split, () => drawSplit(pen, st, waited));
  if (fade.taxi > 0) withAlpha(pen, COPY_ALPHA * fade.shift, () => drawShift(pen, st, data.taxi, waited, fade.shift));
}
