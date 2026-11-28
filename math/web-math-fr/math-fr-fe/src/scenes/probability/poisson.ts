import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { num } from "@/lib/storyline";
import { lerp, sBox, sDot, sFrame, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/poisson";
import { rngFrom } from "@/systems/probability";

type Point = [number, number];

export type Values = { mean: number };
export const DEFAULTS: Values = { mean: 3 };
export type Data = { values: Values; calls: number[]; silent: number[]; limit: number };

const MINUTES = 20;
const SEED = 11;
const PLACES = 4;

const THIN = 1;
const HALF = 0.5;
const PER_ROW = 10;
const CELL_W = 8.4;
const CELL_H = 9;
const TAPE_X = 8;
const ROW_Y = [44, 30];
const SILENT_ALPHA = 0.35;
const CALL_WEIGHT = 1.5;
const MINUTE_DOWN = 2.5;
const MINUTE_SIZE = 2.2;

const STRIP = { x0: 10, y0: 50, x1: 90, y1: 60 };
const LINES_MOST = 60;

const PLOT = { x0: 16, y0: 10, x1: 90, y1: 34 };
const LOG_FROM = Math.log10(4);
const LOG_TO = Math.log10(1000);
const CHANCE_LEAST = 0.06;
const HEADROOM = 1.25;
const POINTS = 80;
const CURVE_WEIGHT = 2;
const DASH = [4, 4];
const MARK_R = 4;
const TICKS = [4, 6, 60, 600];
const TICK_Y = 6.5;
const SCALE_X = 14;
const SCALE_PLACES = 2;

export function silence(n: number, mean: number): number {
  return n > mean ? (1 - mean / n) ** n : 0;
}

export function build(values: Values): Data {
  const rng = rngFrom(SEED);
  const calls: number[] = [];
  let t = 0;
  while (t < MINUTES) {
    t += -Math.log(1 - rng()) / values.mean;
    if (t < MINUTES) calls.push(t);
  }
  const busy = new Set(calls.map((m) => Math.floor(m)));
  const silent = Array.from({ length: MINUTES }, (_, m) => m).filter((m) => !busy.has(m));
  return { values, calls, silent, limit: Math.exp(-values.mean) };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  const { values, limit } = data;
  switch (top) {
    case "mean":
      return L("Average calls a minute: {{m}}", { m: values.mean });
    case "slices":
      return L("Slices: {{n}}. Chance of silence: {{p}}", { n: set.n, p: silence(set.n, values.mean).toFixed(PLACES) });
    case "limit":
      return L("Limit of the chance of silence: {{p}}", { p: limit.toFixed(PLACES) });
  }
}

const minuteX = (m: number) => TAPE_X + (m % PER_ROW) * CELL_W;
const minuteY = (m: number) => ROW_Y[Math.floor(m / PER_ROW)];

function drawTape(pen: Pen, st: Stage, data: Data) {
  for (let m = 0; m < MINUTES; m += 1) {
    const x = minuteX(m);
    const y = minuteY(m);
    const quiet = data.silent.includes(m);
    if (quiet) withAlpha(pen, SILENT_ALPHA, () => sBox(pen, st, x, y, x + CELL_W, y + CELL_H, ONE));
    sFrame(pen, st, x, y, x + CELL_W, y + CELL_H, quiet ? ONE : FAINT, THIN);
    if (m % PER_ROW === 0 || m % PER_ROW === PER_ROW - 1) sText(pen, st, String(m + 1), x + CELL_W * HALF, y - MINUTE_DOWN, MUTED, "center", MINUTE_SIZE);
  }
  for (const call of data.calls) {
    const m = Math.floor(call);
    const x = minuteX(m) + (call - m) * CELL_W;
    sLine(pen, st, [[x, minuteY(m)], [x, minuteY(m) + CELL_H]], INK, CALL_WEIGHT);
  }
}

function drawStrip(pen: Pen, st: Stage, n: number, mean: number) {
  const rng = rngFrom(n);
  const wide = (STRIP.x1 - STRIP.x0) / n;
  for (let i = 0; i < n; i += 1) {
    const x = STRIP.x0 + i * wide;
    if (rng() < mean / n) sBox(pen, st, x, STRIP.y0, x + wide, STRIP.y1, INK);
    if (n <= LINES_MOST && i > 0) sLine(pen, st, [[x, STRIP.y0], [x, STRIP.y1]], FAINT, THIN);
  }
  sFrame(pen, st, STRIP.x0, STRIP.y0, STRIP.x1, STRIP.y1, MUTED, THIN);
}

function drawCurve(pen: Pen, st: Stage, data: Data, n: number) {
  const mean = data.values.mean;
  const most = Math.max(CHANCE_LEAST, HEADROOM * data.limit);
  const px = (slices: number) => lerp(PLOT.x0, PLOT.x1, (Math.log10(slices) - LOG_FROM) / (LOG_TO - LOG_FROM));
  const py = (chance: number) => lerp(PLOT.y0, PLOT.y1, chance / most);
  const pts: Point[] = [];
  for (let i = 0; i < POINTS; i += 1) {
    const slices = 10 ** lerp(LOG_FROM, LOG_TO, i / (POINTS - 1));
    pts.push([px(slices), py(silence(slices, mean))]);
  }
  sLine(pen, st, [[PLOT.x0, PLOT.y0], [PLOT.x1, PLOT.y0]], FAINT, THIN);
  sLine(pen, st, pts, SKY, CURVE_WEIGHT);
  pen.ctx.setLineDash(DASH);
  sLine(pen, st, [[PLOT.x0, py(data.limit)], [PLOT.x1, py(data.limit)]], ONE, THIN);
  pen.ctx.setLineDash([]);
  if (Math.log10(Math.max(1, n)) >= LOG_FROM) sDot(pen, st, px(n), py(silence(n, mean)), MARK_R, ONE);
  for (const tick of TICKS) sText(pen, st, num(tick), px(tick), TICK_Y, MUTED, "center", MINUTE_SIZE);
  sText(pen, st, "0", SCALE_X, PLOT.y0, MUTED, "right", MINUTE_SIZE);
  sText(pen, st, most.toFixed(SCALE_PLACES), SCALE_X, PLOT.y1, MUTED, "right", MINUTE_SIZE);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);
  const n = Math.max(0, Math.round(set.n));

  withAlpha(pen, fade.line, () => drawTape(pen, st, data));
  if (n > 0) withAlpha(pen, fade.slices, () => drawStrip(pen, st, n, data.values.mean));
  withAlpha(pen, fade.curve, () => drawCurve(pen, st, data, n));
}
