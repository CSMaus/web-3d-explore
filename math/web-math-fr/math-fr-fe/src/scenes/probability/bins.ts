import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { toned } from "@/lib/panes";
import { num } from "@/lib/storyline";
import { lerp, sBars, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Act, Fade, Set, Top } from "@/storylines/probability/bins";
import { BINS, beyond, density, histogram, samples } from "@/systems/probability";

type Point = [number, number];

export type Values = { cut: number };
export const DEFAULTS: Values = { cut: 20 };
export type Data = { values: Values; waits: Float64Array };

const SHAPE = "exponential";
const COUNT = 10000;
const SEED = 4;
const PLACES = 3;

const THIN = 1;
const PLOT = { x0: 10, y0: 14, x1: 94, y1: 62 };
const SPAN = 50;
const TOP = 0.11;
const TICK_STEP = 10;
const TICK_Y = 10.5;
const TICK_SIZE = 2.3;
const SCALE_X = 8.5;
const SCALE_PLACES = 2;

const MARKS = 600;
const MARK_TOP = 18;
const MARK_ALPHA = 0.5;

const COARSE = 10;
const BAR_FILL = 0.92;

const POINTS = 200;
const CURVE_WEIGHT = 2.5;

const AREA_ALPHA = 0.45;
const CUT_WEIGHT = 1.5;
const CUT_Y = 64.5;
const CUT_SIZE = 2.6;

const timeX = (minutes: number) => lerp(PLOT.x0, PLOT.x1, minutes / SPAN);
const heightY = (level: number) => lerp(PLOT.y0, PLOT.y1, Math.min(1, level / TOP));

export function build(values: Values): Data {
  return { values, waits: samples(SHAPE, COUNT, SEED) };
}

export function applyAct(set: Set, values: Values, act: Act | null): Set {
  return act === "cut" ? { ...set, cut: values.cut } : set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "beyond":
      return L("Longer than {{t}} minutes: {{p}}", { t: set.cut, p: beyond(SHAPE, set.cut).toFixed(PLACES) });
    case "waits":
      return L("Waits: {{n}}", { n: num(data.waits.length) });
    case "width":
      return L("Bin width: {{w}} min", { w: SPAN / set.bins });
  }
}

function drawAxis(pen: Pen, st: Stage) {
  sLine(pen, st, [[PLOT.x0, PLOT.y0], [PLOT.x1, PLOT.y0]], FAINT, THIN);
  for (let m = 0; m <= SPAN; m += TICK_STEP) sText(pen, st, String(m), timeX(m), TICK_Y, MUTED, "center", TICK_SIZE);
  sText(pen, st, TOP.toFixed(SCALE_PLACES), SCALE_X, PLOT.y1, MUTED, "right", TICK_SIZE);
}

function drawMarks(pen: Pen, st: Stage, waits: Float64Array) {
  let drawn = 0;
  for (let i = 0; i < waits.length && drawn < MARKS; i += 1) {
    if (waits[i] >= SPAN) continue;
    const x = timeX(waits[i]);
    sLine(pen, st, [[x, PLOT.y0], [x, MARK_TOP]], INK, THIN);
    drawn += 1;
  }
}

function binsOf(set: Set, narrow: number): number {
  if (set.bins === COARSE) return COARSE;
  const from = BINS.indexOf(COARSE);
  const to = BINS.indexOf(set.bins);
  return BINS[Math.round(lerp(from, to < 0 ? from : to, narrow))];
}

function drawBars(pen: Pen, st: Stage, waits: Float64Array, bins: number) {
  const wide = SPAN / bins;
  const levels = histogram(waits, 0, SPAN, bins).map((n) => n / (waits.length * wide));
  sBars(pen, st, PLOT, levels, TOP, SKY, 1, BAR_FILL);
}

function curveFrom(from: number): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < POINTS; i += 1) {
    const m = lerp(from, SPAN, i / (POINTS - 1));
    pts.push([timeX(m), heightY(density(SHAPE, m))]);
  }
  return pts;
}

function drawArea(pen: Pen, st: Stage, cut: number) {
  const from = Math.max(0, Math.min(SPAN, cut));
  const x = timeX(from);
  const ctx = pen.ctx;
  withAlpha(pen, AREA_ALPHA, () => {
    ctx.fillStyle = toned(ONE);
    ctx.beginPath();
    ctx.moveTo(st.px(x), st.py(PLOT.y0));
    for (const [px, py] of curveFrom(from)) ctx.lineTo(st.px(px), st.py(py));
    ctx.lineTo(st.px(PLOT.x1), st.py(PLOT.y0));
    ctx.closePath();
    ctx.fill();
  });
  sLine(pen, st, [[x, PLOT.y0], [x, PLOT.y1]], INK, CUT_WEIGHT);
  sText(pen, st, String(cut), x, CUT_Y, INK, "center", CUT_SIZE);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);

  drawAxis(pen, st);
  withAlpha(pen, MARK_ALPHA * fade.marks, () => drawMarks(pen, st, data.waits));
  withAlpha(pen, fade.bars, () => drawBars(pen, st, data.waits, binsOf(set, fade.narrow)));
  withAlpha(pen, fade.curve, () => sLine(pen, st, curveFrom(0), ONE, CURVE_WEIGHT));
  withAlpha(pen, fade.area, () => drawArea(pen, st, set.cut));
}
