import type { Pen } from "@/components/Plot";
import { FAINT, GROUND, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { lerp, sBars, sBox, sFrame, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/walks";
import { arcsineDensity, histogram, spread as spreadOf, startWalks, stepWalks } from "@/systems/probability";

type Point = [number, number];

export type Values = { seed: number };
export const DEFAULTS: Values = { seed: 1 };
export type Data = { values: Values; steps: number; paths: number[][]; share: number[]; spread: number; extreme: number; hist: number[] };

const WALKS = 50;
const STEPS = 400;
const SEED_BASE = 70;
const PLACES = 1;
const HALF = 0.5;
const MINUS = "−";

const THIN = 1;
const PLOT = { x0: 8, y0: 8, x1: 94, y1: 66 };
const REACH = 60;
const TOSS_Y = 4.5;
const LEVEL_X = 6.5;
const AXIS_SIZE = 2.2;

const ALONE_WEIGHT = 2;
const FAN_ALPHA = 0.6;

const CURVE_POINTS = 100;
const WIDTHS = [-2, -1, 1, 2];
const BOUND_WEIGHT = 1.2;
const DASH = [4, 4];

const SIDE_WEIGHT = 2;

const INSET = { x0: 60, y0: 10, x1: 94, y1: 36 };
const HIST_BINS = 10;
const SHARE_TOP = 1.0001;
const EDGE = 0.02;
const LAW_WEIGHT = 1.5;
const SHARE_Y = 7.5;

const tossX = (n: number) => lerp(PLOT.x0, PLOT.x1, n / STEPS);
const levelY = (at: number) => lerp(PLOT.y0, PLOT.y1, (at + REACH) / (2 * REACH));

export function build(values: Values): Data {
  const w = startWalks(WALKS, SEED_BASE + values.seed);
  const paths = Array.from({ length: WALKS }, () => [0]);
  for (let n = 0; n < STEPS; n += 1) {
    stepWalks(w);
    for (let i = 0; i < WALKS; i += 1) paths[i].push(w.at[i]);
  }
  const share = Array.from(w.positive, (n) => n / STEPS);
  let extreme = 0;
  share.forEach((s, i) => {
    if (Math.abs(s - HALF) > Math.abs(share[extreme] - HALF)) extreme = i;
  });
  return { values, steps: STEPS, paths, share, spread: spreadOf(w.at), extreme, hist: histogram(share, 0, SHARE_TOP, HIST_BINS) };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "players":
      return L("Players: {{n}}", { n: set.count });
    case "spread":
      return L("Spread after {{n}} tosses: {{s}}", { n: data.steps, s: data.spread.toFixed(PLACES) });
  }
}

const wayOf = (path: number[]): Point[] => path.map((at, n): Point => [tossX(n), levelY(at)]);

function drawAxis(pen: Pen, st: Stage) {
  sLine(pen, st, [[PLOT.x0, levelY(0)], [PLOT.x1, levelY(0)]], FAINT, THIN);
  sText(pen, st, "0", PLOT.x0, TOSS_Y, MUTED, "center", AXIS_SIZE);
  sText(pen, st, String(STEPS), PLOT.x1, TOSS_Y, MUTED, "center", AXIS_SIZE);
  sText(pen, st, `${MINUS}${REACH}`, LEVEL_X, PLOT.y0, MUTED, "right", AXIS_SIZE);
  sText(pen, st, "0", LEVEL_X, levelY(0), MUTED, "right", AXIS_SIZE);
  sText(pen, st, String(REACH), LEVEL_X, PLOT.y1, MUTED, "right", AXIS_SIZE);
}

function drawFan(pen: Pen, st: Stage, data: Data, count: number) {
  if (count === 1) {
    sLine(pen, st, wayOf(data.paths[0]), ONE, ALONE_WEIGHT);
    return;
  }
  withAlpha(pen, FAN_ALPHA, () => {
    for (let i = 0; i < count; i += 1) sLine(pen, st, wayOf(data.paths[i]), SKY, THIN);
  });
}

function drawBounds(pen: Pen, st: Stage) {
  pen.ctx.setLineDash(DASH);
  for (const k of WIDTHS) {
    const pts: Point[] = [];
    for (let i = 0; i < CURVE_POINTS; i += 1) {
      const n = (STEPS * i) / (CURVE_POINTS - 1);
      pts.push([tossX(n), levelY(k * Math.sqrt(n))]);
    }
    sLine(pen, st, pts, MUTED, BOUND_WEIGHT);
  }
  pen.ctx.setLineDash([]);
}

function drawSide(pen: Pen, st: Stage, path: number[]) {
  let run: Point[] = [[tossX(0), levelY(path[0])]];
  let above = path[0] + path[1] > 0;
  for (let n = 1; n < path.length; n += 1) {
    const up = path[n - 1] + path[n] > 0;
    if (up !== above) {
      sLine(pen, st, run, above ? ONE : TWO, SIDE_WEIGHT);
      run = [[tossX(n - 1), levelY(path[n - 1])]];
      above = up;
    }
    run.push([tossX(n), levelY(path[n])]);
  }
  sLine(pen, st, run, above ? ONE : TWO, SIDE_WEIGHT);
}

function drawHist(pen: Pen, st: Stage, data: Data) {
  const most = Math.max(1, ...data.hist);
  const even = data.share.length / HIST_BINS;
  const tall = INSET.y1 - INSET.y0;
  const pts: Point[] = [];
  for (let i = 0; i < CURVE_POINTS; i += 1) {
    const x = lerp(EDGE, 1 - EDGE, i / (CURVE_POINTS - 1));
    const level = (even / most) * (arcsineDensity(x) / arcsineDensity(HALF));
    pts.push([lerp(INSET.x0, INSET.x1, x), INSET.y0 + tall * Math.min(1, level)]);
  }
  sBox(pen, st, INSET.x0, INSET.y0, INSET.x1, INSET.y1, GROUND);
  sFrame(pen, st, INSET.x0, INSET.y0, INSET.x1, INSET.y1, FAINT, THIN);
  sBars(pen, st, INSET, data.hist, most, SKY);
  sLine(pen, st, pts, ONE, LAW_WEIGHT);
  sText(pen, st, "0", INSET.x0, SHARE_Y, MUTED, "center", AXIS_SIZE);
  sText(pen, st, "1", INSET.x1, SHARE_Y, MUTED, "center", AXIS_SIZE);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);
  const count = Math.max(1, Math.min(data.paths.length, Math.round(set.count)));

  drawAxis(pen, st);
  withAlpha(pen, fade.fan, () => drawFan(pen, st, data, count));
  withAlpha(pen, fade.envelope, () => drawBounds(pen, st));
  withAlpha(pen, fade.side, () => drawSide(pen, st, data.paths[data.extreme]));
  withAlpha(pen, fade.hist, () => drawHist(pen, st, data));
}
