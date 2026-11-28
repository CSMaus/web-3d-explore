import type { Pen } from "@/components/Plot";
import { GROUND, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { sBox, sDot, sFrame, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/hats";
import { matches, rngFrom, shuffleHats } from "@/systems/probability";

type Rect = { x0: number; y0: number; x1: number; y1: number };

export type Values = { seed: number };
export const DEFAULTS: Values = { seed: 1 };
export type Data = { values: Values; perms: number[][]; hundred: number[]; last: number };

const PERMS = [
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
];
const CROWD = 100;
const SEED_BASE = 60;
const MEAN = 1;

const HALF = 0.5;
const THIN = 1;
const SIDE = 10;

const FIELD: Rect = { x0: 20, y0: 8, x1: 80, y1: 62 };
const HEAD_AT = 0.3;
const HEAD_R = 2.2;
const HAT_AT = 0.68;
const HAT_W = 3.2;
const HAT_H = 1.3;
const OTHER_ALPHA = 0.6;

const COLS = [30, 42, 54];
const NAME_Y = 68;
const NAME_SIZE = 2.6;
const ROW_TOP = 60;
const ROW_STEP = 9;
const BODY_DOWN = 2;
const BODY_R = 3;
const CAP_UP = 2;
const CAP_W = 6;
const CAP_H = 4;
const COUNT_X = 68;
const COUNT_SIZE = 3.2;

const SELF = { x: 18, y: 37 };
const SELF_R = 6;
const RACK: Rect = { x0: 38, y0: 12, x1: 90, y1: 62 };
const RACK_W = 3.4;
const RACK_H = 1.6;
const RACK_ALPHA = 0.5;
const MINE = 37;

const SUM_AT = { x: 50, y: 38 };
const SUM_SIZE = 6;

const total = (perms: number[][]) => perms.reduce((sum, perm) => sum + matches(perm), 0);
const sumText = (hats: number) => `${hats} × ${MEAN}/${hats} = ${MEAN}`;

export function build(values: Values): Data {
  const hundred = shuffleHats(CROWD, rngFrom(SEED_BASE + values.seed));
  return { values, perms: PERMS, hundred, last: matches(hundred) };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "hats":
      return L("Hats: {{n}}", { n: set.hats });
    case "average":
      return L("Own hats back, on average: {{v}}", { v: MEAN });
    case "ways":
      return L("Ways: {{n}}", { n: data.perms.length });
    case "matches":
      return L("Matches: {{k}} in {{n}} ways", { k: total(data.perms), n: data.perms.length });
    case "own":
      return L("Own hat: 1 of {{n}}", { n: set.hats });
    case "sum":
      return sumText(set.hats);
    case "last":
      return L("Matches this time: {{k}}", { k: data.last });
  }
}

function cellOf(area: Rect, i: number): Rect {
  const wide = (area.x1 - area.x0) / SIDE;
  const tall = (area.y1 - area.y0) / SIDE;
  const col = i % SIDE;
  const row = Math.floor(i / SIDE);
  return { x0: area.x0 + col * wide, y0: area.y1 - (row + 1) * tall, x1: area.x0 + (col + 1) * wide, y1: area.y1 - row * tall };
}

function hat(pen: Pen, st: Stage, x: number, y: number, w: number, h: number, colour: string) {
  sBox(pen, st, x - w * HALF, y - h * HALF, x + w * HALF, y + h * HALF, colour);
}

function drawCrowd(pen: Pen, st: Stage, data: Data) {
  data.hundred.forEach((got, i) => {
    const cell = cellOf(FIELD, i);
    const x = (cell.x0 + cell.x1) * HALF;
    const tall = cell.y1 - cell.y0;
    const own = got === i;
    sDot(pen, st, x, cell.y0 + tall * HEAD_AT, HEAD_R, own ? ONE : MUTED);
    withAlpha(pen, own ? 1 : OTHER_ALPHA, () => hat(pen, st, x, cell.y0 + tall * HAT_AT, HAT_W, HAT_H, own ? ONE : SKY));
  });
}

function drawSix(pen: Pen, st: Stage, data: Data, marks: number) {
  COLS.forEach((x, j) => sText(pen, st, String(j + 1), x, NAME_Y, MUTED, "center", NAME_SIZE));
  data.perms.forEach((perm, r) => {
    const y = ROW_TOP - ROW_STEP * r;
    perm.forEach((got, j) => {
      const x = COLS[j];
      const own = got === j;
      sDot(pen, st, x, y - BODY_DOWN, BODY_R, MUTED);
      sFrame(pen, st, x - CAP_W * HALF, y + CAP_UP - CAP_H * HALF, x + CAP_W * HALF, y + CAP_UP + CAP_H * HALF, SKY, THIN);
      sText(pen, st, String(got + 1), x, y + CAP_UP, INK, "center", NAME_SIZE);
      if (!own) return;
      withAlpha(pen, marks, () => {
        hat(pen, st, x, y + CAP_UP, CAP_W, CAP_H, ONE);
        sText(pen, st, String(got + 1), x, y + CAP_UP, GROUND, "center", NAME_SIZE);
      });
    });
    withAlpha(pen, marks, () => sText(pen, st, String(matches(perm)), COUNT_X, y, INK, "center", COUNT_SIZE));
  });
}

function drawOne(pen: Pen, st: Stage) {
  for (let i = 0; i < CROWD; i += 1) {
    const cell = cellOf(RACK, i);
    const x = (cell.x0 + cell.x1) * HALF;
    const y = (cell.y0 + cell.y1) * HALF;
    const mine = i === MINE;
    if (mine) sLine(pen, st, [[SELF.x, SELF.y], [x, y]], ONE, THIN);
    withAlpha(pen, mine ? 1 : RACK_ALPHA, () => hat(pen, st, x, y, RACK_W, RACK_H, mine ? ONE : SKY));
  }
  sDot(pen, st, SELF.x, SELF.y, SELF_R, INK);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);

  withAlpha(pen, fade.crowd, () => drawCrowd(pen, st, data));
  withAlpha(pen, fade.six, () => drawSix(pen, st, data, fade.marks));
  withAlpha(pen, fade.one, () => drawOne(pen, st));
  withAlpha(pen, fade.sum, () => sText(pen, st, sumText(set.hats), SUM_AT.x, SUM_AT.y, INK, "center", SUM_SIZE));
}
