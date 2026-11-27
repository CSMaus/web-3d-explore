import type { Pen } from "@/components/Plot";
import { FAINT, GROUND, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { num, share } from "@/lib/storyline";
import { dieFace, lerp, ramp, sBars, sBox, sFrame, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Act, Fade, Set, Top } from "@/storylines/probability/dice";
import { rngFrom, sumWays, throwTwo } from "@/systems/probability";

type Pair = [number, number];
type Span = [number, number];

export type Values = { sum: number };
export const DEFAULTS: Values = { sum: 7 };
export type Data = { values: Values; throws: number; counts: number[]; rolls: Pair[] };

const THROWS = 5000;
const SEED = 7;
const ROLLS = 20;
const FACES = 6;
const CELLS = FACES * FACES;
const LOW = 2;
const HIGH = FACES * 2;
const LEAD = FACES + 1;

const THIN = 1;
const DIGIT_SIZE = 2.4;

const CHART_LEFT: Span = [12, 62];
const CHART_RIGHT: Span = [88, 97];
const CHART_Y0 = 14;
const CHART_Y1 = 58;
const LABEL_Y = 10;
const FEW_FROM = 0.5;
const FEW_SUMS = [LOW, LEAD, HIGH];

const ONE_BOX = { x0: 30, y0: 18, x1: 70, y1: 46 };
const ONE_MOST = 1.6;
const ONE_Y = 14;
const FACE_X = 50;
const FACE_Y = 60;
const FACE_SIDE = 11;
const FACE_TIME = 0.7;

const FIRST_X: Span = [40, 72];
const SECOND_X: Span = [60, 88];
const PAIR_Y: Span = [40, 46];
const PAIR_SIDE: Span = [14, 11];
const ROLL_TIME = 0.9;
const RUN_FROM = 0.5;

const CELL = 7;
const GRID_LEFT = 12;
const GRID_TOP = 52;
const GRID_FULL = 0.9;
const INSET = 0.4;
const CELL_MIX = 0.25;
const SUM_SIZE = 2.8;
const DIM = 0.4;
const HEAD_Y = 55;
const HEAD_X = 9;
const SECOND_AT: Span = [33, 60];
const FIRST_AT: Span = [4, 31];
const NAME_SIZE = 2.3;
const SWATCH = 2;
const SWATCH_GAP = 1;
const TURN = -Math.PI / 2;

const RUN_SPEED = 6;
const RUN_WEIGHT = 2;

const along = (span: Span, t: number) => lerp(span[0], span[1], t);
const pairOf = (cell: number): Pair => [1 + Math.floor(cell / FACES), 1 + (cell % FACES)];
const cellX = (cell: number) => GRID_LEFT + (cell % FACES) * CELL;
const cellY = (cell: number) => GRID_TOP - Math.floor(cell / FACES) * CELL;

export function build(values: Values): Data {
  const rng = rngFrom(SEED);
  const counts = new Array<number>(HIGH + 1).fill(0);
  const rolls: Pair[] = [];
  for (let i = 0; i < THROWS; i += 1) {
    const pair = throwTwo(rng);
    counts[pair[0] + pair[1]] += 1;
    if (i < ROLLS) rolls.push(pair);
  }
  return { values, throws: THROWS, counts, rolls };
}

export function applyAct(set: Set, values: Values, act: Act | null): Set {
  return act === "sum" ? { ...set, sum: values.sum } : set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "throws":
      return L("Throws: {{n}}", { n: num(data.throws) });
    case "faces":
      return L("Faces: {{n}}", { n: FACES });
    case "cells":
      return L("Cells: {{n}}", { n: CELLS });
    case "share":
      return L("Sum {{s}}: {{k}} of {{n}} cells", { s: set.sum, k: sumWays(set.sum), n: CELLS });
    case "chance":
      return share(sumWays(set.sum), CELLS);
  }
}

function drawChart(pen: Pen, st: Stage, data: Data, grid: number) {
  const box = { x0: along(CHART_LEFT, grid), y0: CHART_Y0, x1: along(CHART_RIGHT, grid), y1: CHART_Y1 };
  const values = data.counts.slice(LOW, HIGH + 1);
  const slot = (box.x1 - box.x0) / values.length;
  sBars(pen, st, box, values, Math.max(...values), (i) => (i + LOW === LEAD ? ONE : SKY));
  sLine(pen, st, [[box.x0, box.y0], [box.x1, box.y0]], FAINT, THIN);
  values.forEach((_, i) => {
    const sum = i + LOW;
    if (grid > FEW_FROM && !FEW_SUMS.includes(sum)) return;
    sText(pen, st, String(sum), box.x0 + slot * (i + 0.5), LABEL_Y, MUTED, "center", DIGIT_SIZE);
  });
}

function drawOne(pen: Pen, st: Stage, now: number) {
  const slot = (ONE_BOX.x1 - ONE_BOX.x0) / FACES;
  sBars(pen, st, ONE_BOX, new Array<number>(FACES).fill(1), ONE_MOST, SKY);
  for (let i = 0; i < FACES; i += 1) sText(pen, st, String(i + 1), ONE_BOX.x0 + slot * (i + 0.5), ONE_Y, MUTED, "center", DIGIT_SIZE);
  dieFace(pen, st, FACE_X, FACE_Y, FACE_SIDE, 1 + (Math.floor(now / FACE_TIME) % FACES), INK);
}

function drawPair(pen: Pen, st: Stage, pair: Pair, grid: number) {
  const y = along(PAIR_Y, grid);
  const side = along(PAIR_SIDE, grid);
  dieFace(pen, st, along(FIRST_X, grid), y, side, pair[0], TWO);
  dieFace(pen, st, along(SECOND_X, grid), y, side, pair[1], SKY);
}

function drawName(pen: Pen, st: Stage, name: string, x: number, y: number, colour: string) {
  sText(pen, st, name, x, y, MUTED, "center", NAME_SIZE);
  const edge = x - pen.ctx.measureText(name).width / 2 / st.unit - SWATCH_GAP;
  sBox(pen, st, edge - SWATCH, y - SWATCH / 2, edge, y + SWATCH / 2, colour);
}

function drawGrid(pen: Pen, st: Stage, grid: number, sum: number) {
  const seen = Math.round(CELLS * ramp(grid, 0, GRID_FULL));
  const picked = sum >= LOW;
  for (let cell = 0; cell < seen; cell += 1) {
    const [first, second] = pairOf(cell);
    const x = cellX(cell);
    const y = cellY(cell);
    const lit = picked && first + second === sum;
    withAlpha(pen, picked && !lit ? DIM : 1, () => {
      withAlpha(pen, lit ? 1 : CELL_MIX, () => sBox(pen, st, x + INSET, y - INSET, x + CELL - INSET, y - CELL + INSET, lit ? ONE : MUTED));
      sText(pen, st, String(first + second), x + CELL / 2, y - CELL / 2, lit ? GROUND : INK, "center", SUM_SIZE);
    });
  }
  for (let i = 0; i < FACES; i += 1) {
    sText(pen, st, String(i + 1), GRID_LEFT + CELL * (i + 0.5), HEAD_Y, MUTED, "center", DIGIT_SIZE);
    sText(pen, st, String(i + 1), HEAD_X, GRID_TOP - CELL * (i + 0.5), MUTED, "center", DIGIT_SIZE);
  }
  drawName(pen, st, L("Second die"), SECOND_AT[0], SECOND_AT[1], SKY);

  const turned: Stage = { ...st, px: (v) => v * st.unit, py: (v) => -v * st.unit };
  pen.ctx.save();
  pen.ctx.translate(st.px(FIRST_AT[0]), st.py(FIRST_AT[1]));
  pen.ctx.rotate(TURN);
  drawName(pen, turned, L("First die"), 0, 0, TWO);
  pen.ctx.restore();
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set, t: number): void {
  const st = stageOf(pen);
  const now = Math.max(0, t);
  const running = Math.floor(now * RUN_SPEED) % CELLS;

  withAlpha(pen, fade.chart, () => drawChart(pen, st, data, fade.grid));
  withAlpha(pen, fade.one, () => drawOne(pen, st, now));
  withAlpha(pen, fade.two, () => {
    const pair = fade.blink > RUN_FROM ? pairOf(running) : data.rolls[Math.floor(now / ROLL_TIME) % ROLLS];
    drawPair(pen, st, pair, fade.grid);
  });
  withAlpha(pen, fade.grid, () => drawGrid(pen, st, fade.grid, set.sum));
  withAlpha(pen, fade.blink, () => {
    const x = cellX(running);
    const y = cellY(running);
    sFrame(pen, st, x, y, x + CELL, y - CELL, INK, RUN_WEIGHT);
  });
}
