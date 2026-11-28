import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { num } from "@/lib/storyline";
import { dieFace, lerp, ramp, sBox, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/game";
import { expectedGain, rngFrom, round } from "@/systems/probability";

type Span = [number, number];

export type Values = { seed: number };
export const DEFAULTS: Values = { seed: 1 };
export type Data = { values: Values; cost: number; prize: number; expected: number; path20: number[]; path1000: number[] };

const COST = 2;
const PRIZE = 10;
const FACES = 6;
const SHORT = 20;
const LONG = 1000;
const SEED_BASE = 40;
const SEED_FROM = 5;
const END_LOW = -450;
const END_HIGH = -220;
const PLACES = 3;
const MINUS = "−";

const HALF = 0.5;
const THIN = 1;
const DIM = 0.25;
const COIN_W = 10;
const COIN_H = 2.2;
const COIN_STEP = 2.8;

const STAKE_X = 30;
const PRIZE_X = 70;
const DEAL_Y = 22;
const DEAL_DIE = { x: 50, y: 56, side: 12 };

const COLUMNS = [15, 29, 43, 57, 71, 85];
const BASE_Y = 36;
const BASE_X: Span = [8, 92];
const SIX_DIE_Y = 70;
const SIX_DIE = 8;
const STAKE_TOP = 34.5;
const PRIZE_BASE = 37.5;
const NET_AT = { x: 50, y: 8 };
const NET_SIZE = 5;

const PLOT = { x0: 12, y0: 10, x1: 94, y1: 62 };
const SHORT_SPAN: Span = [-30, 30];
const LONG_SPAN: Span = [-500, 100];
const SCORE_WEIGHT = 2;
const TIME_Y = 6;
const SCORE_X = 10;
const AXIS_SIZE = 2.4;
const MEAN_WEIGHT = 1.5;
const DASH = [5, 4];

let long: number[] | null = null;

export function signed(v: number): string {
  if (v === 0) return "0";
  return `${v > 0 ? "+" : MINUS}${Math.abs(v)}`;
}

function pathOf(seed: number, rounds: number): number[] {
  const rng = rngFrom(seed);
  const path = [0];
  for (let i = 0; i < rounds; i += 1) path.push(path[i] + round(rng, PRIZE, COST).gain);
  return path;
}

function longPath(): number[] {
  if (long) return long;
  let seed = SEED_FROM;
  let path = pathOf(seed, LONG);
  while (path[LONG] < END_LOW || path[LONG] > END_HIGH) {
    seed += 1;
    path = pathOf(seed, LONG);
  }
  long = path;
  return path;
}

export function build(values: Values): Data {
  return { values, cost: COST, prize: PRIZE, expected: expectedGain(PRIZE, COST), path20: pathOf(SEED_BASE + values.seed, SHORT), path1000: longPath() };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

const pathFor = (data: Data, rounds: number) => (rounds === SHORT ? data.path20 : data.path1000);

export function topLine(top: Top, data: Data, set: Set): string {
  const { cost, prize, expected } = data;
  switch (top) {
    case "stakes":
      return L("Stake {{c}}, prize {{p}}", { c: cost, p: prize });
    case "paid":
      return L("Paid: {{n}}", { n: FACES * cost });
    case "won":
      return L("Won: {{n}}", { n: prize });
    case "mean":
      return L("Per round: {{v}}", { v: `(${prize} ${MINUS} ${FACES * cost}) / ${FACES} = ${expected.toFixed(PLACES).replace("-", MINUS)}` });
    case "total":
      return L("After {{n}} rounds: {{v}}", { n: num(set.rounds), v: signed(pathFor(data, set.rounds)[set.rounds] ?? 0) });
  }
}

function stack(pen: Pen, st: Stage, x: number, from: number, coins: number, up: boolean, colour: string) {
  for (let k = 0; k < coins; k += 1) {
    const y = up ? from + k * COIN_STEP : from - k * COIN_STEP - COIN_H;
    sBox(pen, st, x - COIN_W * HALF, y, x + COIN_W * HALF, y + COIN_H, colour);
  }
}

function drawDeal(pen: Pen, st: Stage, data: Data) {
  stack(pen, st, STAKE_X, DEAL_Y, data.cost, true, TWO);
  stack(pen, st, PRIZE_X, DEAL_Y, data.prize, true, ONE);
  dieFace(pen, st, DEAL_DIE.x, DEAL_DIE.y, DEAL_DIE.side, FACES, INK);
}

function drawSix(pen: Pen, st: Stage, data: Data, mark: Set["mark"]) {
  sLine(pen, st, [[BASE_X[0], BASE_Y], [BASE_X[1], BASE_Y]], FAINT, THIN);
  COLUMNS.forEach((x, i) => {
    dieFace(pen, st, x, SIX_DIE_Y, SIX_DIE, i + 1, INK);
    withAlpha(pen, mark === "prize" ? DIM : 1, () => stack(pen, st, x, STAKE_TOP, data.cost, false, TWO));
  });
  withAlpha(pen, mark === "cost" ? DIM : 1, () => stack(pen, st, COLUMNS[FACES - 1], PRIZE_BASE, data.prize, true, ONE));
  if (mark === "net") sText(pen, st, signed(data.prize - FACES * data.cost), NET_AT.x, NET_AT.y, INK, "center", NET_SIZE);
}

function plotOf(rounds: number) {
  const span = rounds === SHORT ? SHORT_SPAN : LONG_SPAN;
  return {
    span,
    x: (n: number) => lerp(PLOT.x0, PLOT.x1, n / rounds),
    y: (v: number) => lerp(PLOT.y0, PLOT.y1, (v - span[0]) / (span[1] - span[0])),
  };
}

function drawPath(pen: Pen, st: Stage, data: Data, rounds: number, shown: number) {
  const plot = plotOf(rounds);
  const path = pathFor(data, rounds);
  const upTo = Math.round(rounds * ramp(shown, 0, 1));
  const pts: [number, number][] = [];
  for (let n = 0; n <= upTo; n += 1) pts.push([plot.x(n), plot.y(path[n])]);
  sLine(pen, st, [[PLOT.x0, plot.y(0)], [PLOT.x1, plot.y(0)]], FAINT, THIN);
  sLine(pen, st, pts, ONE, SCORE_WEIGHT);
  sText(pen, st, "0", PLOT.x0, TIME_Y, MUTED, "center", AXIS_SIZE);
  sText(pen, st, num(rounds), PLOT.x1, TIME_Y, MUTED, "center", AXIS_SIZE);
  for (const v of [plot.span[0], 0, plot.span[1]]) sText(pen, st, signed(v).replace("+", ""), SCORE_X, plot.y(v), MUTED, "right", AXIS_SIZE);
}

function drawMean(pen: Pen, st: Stage, data: Data, rounds: number) {
  const plot = plotOf(rounds);
  pen.ctx.setLineDash(DASH);
  sLine(pen, st, [[plot.x(0), plot.y(0)], [plot.x(rounds), plot.y(rounds * data.expected)]], MUTED, MEAN_WEIGHT);
  pen.ctx.setLineDash([]);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);
  const rounds = set.rounds;

  withAlpha(pen, fade.deal, () => drawDeal(pen, st, data));
  withAlpha(pen, fade.six, () => drawSix(pen, st, data, set.mark));
  if (rounds > 0) {
    withAlpha(pen, fade.path, () => drawPath(pen, st, data, rounds, fade.path));
    withAlpha(pen, fade.line, () => drawMean(pen, st, data, rounds));
  }
}
