import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { lerp, sBox, sDot, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/galton";
import { binomial, choose, dropBall, rngFrom } from "@/systems/probability";

type Point = [number, number];
type Board = { rows: number; dx: number; peg: (r: number, k: number) => Point; bin: (k: number) => number };

export type Values = { p: number };
export const DEFAULTS: Values = { p: 0.5 };
export type Data = { values: Values; pile: number[] };

const FULL = 12;
const BALLS = 2000;
const SEED = 9;
const EVEN = 0.5;
const PLACES = 2;

const HALF = 0.5;
const THIN = 1;
const MID_X = 50;
const TOP_Y = 68;
const DX_MOST = 12;
const DX_SPAN = 72;
const DX_EXTRA = 2;
const DY_MOST = 9;
const DY_SPAN = 33;
const BIN_Y0 = 8;
const BIN_Y1 = 30;
const PEG_R = 2;

const PATHS_MOST = 4;
const PATH_ALPHA = 0.5;
const LEAD_WEIGHT = 2;

const PILE_H = 22;
const BAR_FILL = 0.8;
const SHAPE_WEIGHT = 1.5;

const COUNTS_MOST = 6;
const COUNT_Y = 4.5;
const DIGIT_SIZE = 2.8;

const BALL_R = 4;
const BALL_SEED = 1;
const FALL_TIME = 2;
const REST_TIME = 0.4;

function boardOf(rows: number): Board {
  const dx = Math.min(DX_MOST, DX_SPAN / (rows + DX_EXTRA));
  const dy = Math.min(DY_MOST, DY_SPAN / rows);
  return {
    rows,
    dx,
    peg: (r, k) => [MID_X + (k - r * HALF) * dx, TOP_Y - r * dy],
    bin: (k) => MID_X + (k - rows * HALF) * dx,
  };
}

const countsOf = (rows: number) => Array.from({ length: rows + 1 }, (_, k) => choose(rows, k));

export function build(values: Values): Data {
  const rng = rngFrom(SEED);
  const pile = new Array<number>(FULL + 1).fill(0);
  for (let i = 0; i < BALLS; i += 1) pile[dropBall(FULL, values.p, rng).bin] += 1;
  return { values, pile };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "row":
      return L("Paths to each bin: {{row}}", { row: countsOf(set.rows).join(" ") });
    case "tilt":
      return L("Chance of going right: {{p}}", { p: data.values.p.toFixed(PLACES) });
  }
}

function drawPegs(pen: Pen, st: Stage, board: Board) {
  for (let r = 0; r < board.rows; r += 1) {
    for (let k = 0; k <= r; k += 1) {
      const [x, y] = board.peg(r, k);
      sDot(pen, st, x, y, PEG_R, MUTED);
    }
  }
}

function drawBins(pen: Pen, st: Stage, board: Board) {
  const left = board.bin(0) - board.dx * HALF;
  const right = board.bin(board.rows) + board.dx * HALF;
  for (let k = 0; k <= board.rows + 1; k += 1) {
    const x = left + k * board.dx;
    sLine(pen, st, [[x, BIN_Y0], [x, BIN_Y1]], FAINT, THIN);
  }
  sLine(pen, st, [[left, BIN_Y0], [right, BIN_Y0]], FAINT, THIN);
}

function wayOf(board: Board, path: number[], end: number): Point[] {
  const pts: Point[] = [];
  for (let r = 0; r < board.rows; r += 1) pts.push(board.peg(r, path[r]));
  pts.push([board.bin(path[board.rows]), end]);
  return pts;
}

function drawPaths(pen: Pen, st: Stage, board: Board) {
  const lead = Math.floor(board.rows * HALF);
  const leading: Point[][] = [];
  for (let code = 0; code < 2 ** board.rows; code += 1) {
    const path = [0];
    for (let r = 0; r < board.rows; r += 1) path.push(path[r] + ((code >> r) & 1));
    const way = wayOf(board, path, BIN_Y1);
    if (path[board.rows] === lead) leading.push(way);
    else withAlpha(pen, PATH_ALPHA, () => sLine(pen, st, way, SKY, THIN));
  }
  for (const way of leading) sLine(pen, st, way, ONE, LEAD_WEIGHT);
}

function drawPile(pen: Pen, st: Stage, board: Board, data: Data) {
  const most = Math.max(...data.pile);
  const chances = data.pile.map((_, k) => binomial(FULL, k, data.values.p));
  const top = Math.max(...chances);
  const wide = board.dx * BAR_FILL * HALF;
  data.pile.forEach((n, k) => sBox(pen, st, board.bin(k) - wide, BIN_Y0, board.bin(k) + wide, BIN_Y0 + (PILE_H * n) / most, ONE));
  sLine(pen, st, chances.map((c, k): Point => [board.bin(k), BIN_Y0 + (PILE_H * c) / top]), SKY, SHAPE_WEIGHT);
}

function drawCounts(pen: Pen, st: Stage, board: Board) {
  countsOf(board.rows).forEach((n, k) => sText(pen, st, String(n), board.bin(k), COUNT_Y, INK, "center", DIGIT_SIZE));
}

function drawTriangle(pen: Pen, st: Stage, board: Board) {
  for (let r = 0; r <= board.rows; r += 1) {
    for (let k = 0; k <= r; k += 1) {
      const [x, y] = board.peg(r, k);
      sText(pen, st, String(choose(r, k)), x, y, INK, "center", DIGIT_SIZE);
    }
  }
}

function drawBall(pen: Pen, st: Stage, board: Board, now: number) {
  const turn = FALL_TIME + REST_TIME;
  const path = dropBall(board.rows, EVEN, rngFrom(BALL_SEED + Math.floor(now / turn))).path;
  const way = wayOf(board, path, (BIN_Y0 + BIN_Y1) * HALF);
  const at = Math.min(1, (now % turn) / FALL_TIME) * (way.length - 1);
  const from = Math.min(way.length - 2, Math.floor(at));
  const part = at - from;
  sDot(pen, st, lerp(way[from][0], way[from + 1][0], part), lerp(way[from][1], way[from + 1][1], part), BALL_R, ONE);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set, t: number): void {
  const st = stageOf(pen);
  const rows = Math.max(1, Math.round(set.rows));
  const board = boardOf(rows);

  drawBins(pen, st, board);
  if (rows <= PATHS_MOST) withAlpha(pen, fade.paths, () => drawPaths(pen, st, board));
  withAlpha(pen, 1 - fade.triangle, () => drawPegs(pen, st, board));
  if (rows === FULL) withAlpha(pen, fade.pile, () => drawPile(pen, st, board, data));
  if (rows <= COUNTS_MOST) withAlpha(pen, fade.counts, () => drawCounts(pen, st, board));
  withAlpha(pen, fade.triangle, () => drawTriangle(pen, st, board));
  if (set.ball === 1) drawBall(pen, st, board, Math.max(0, t));
}
