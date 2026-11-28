import type { Pen } from "@/components/Plot";
import { FAINT, GROUND, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { num } from "@/lib/storyline";
import { lerp, sBox, sDot, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/ruin";
import { expectedBets, playRuin, reachChance, rngFrom } from "@/systems/probability";

type Point = [number, number];
type Game = { p: number; start: number; goal: number; reach: number; bets: number; path: number[] };

export type Values = { p: number; start: number };
export const DEFAULTS: Values = { p: 0.49, start: 10 };
export type Data = { values: Values; fair: Game; unfair: Game; own: Game };

const GOAL = 20;
const EVEN = 0.5;
const SEED = 81;
const OF = 100;
const PLACES = 3;

const HALF = 0.5;
const THIN = 1;
const PLOT = { x0: 12, y0: 10, x1: 70, y1: 64 };
const SPAN_LEAST = 200;
const WALL_WEIGHT = 2;
const COIN_X = 10;
const COIN_SIZE = 2.6;
const TOSS_Y = 6.5;
const TOSS_SIZE = 2.2;
const START_R = 4;

const PATH_WEIGHT = 1.5;
const TURN = 6;
const DRAW_TIME = 5;
const TIP_R = 3.5;

const COLUMN = { x0: 78, y0: 10, x1: 92, y1: 64 };
const SHARE_PLACES = 2;
const SHARE_SIZE = 3;

function game(p: number, start: number): Game {
  return { p, start, goal: GOAL, reach: reachChance(start, GOAL, p), bets: expectedBets(start, GOAL, p), path: playRuin(start, GOAL, p, rngFrom(SEED), true).path };
}

export function build(values: Values): Data {
  return { values, fair: game(EVEN, DEFAULTS.start), unfair: game(DEFAULTS.p, DEFAULTS.start), own: game(values.p, values.start) };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data, set: Set): string {
  const g = data[set.coin];
  switch (top) {
    case "coin":
      return L("The coin wins {{k}} tosses of {{n}}", { k: Math.round(g.p * OF), n: OF });
    case "reach":
      return L("Chance of reaching {{g}}: {{p}}", { g: g.goal, p: g.reach.toFixed(PLACES) });
    case "bets":
      return L("Average length of a game: {{n}} tosses", { n: Math.round(g.bets) });
  }
}

const spanOf = (g: Game) => Math.max(SPAN_LEAST, g.path.length);
const tossX = (g: Game, n: number) => lerp(PLOT.x0, PLOT.x1, n / spanOf(g));
const coinY = (g: Game, coins: number) => lerp(PLOT.y0, PLOT.y1, coins / g.goal);

function drawTosses(pen: Pen, st: Stage, g: Game) {
  sText(pen, st, "0", PLOT.x0, TOSS_Y, MUTED, "center", TOSS_SIZE);
  sText(pen, st, num(spanOf(g)), PLOT.x1, TOSS_Y, MUTED, "center", TOSS_SIZE);
}

function drawWalls(pen: Pen, st: Stage, g: Game) {
  const y = coinY(g, g.start);
  sLine(pen, st, [[PLOT.x0, y], [PLOT.x1, y]], FAINT, THIN);
  sLine(pen, st, [[PLOT.x0, PLOT.y1], [PLOT.x1, PLOT.y1]], ONE, WALL_WEIGHT);
  sLine(pen, st, [[PLOT.x0, PLOT.y0], [PLOT.x1, PLOT.y0]], TWO, WALL_WEIGHT);
  sText(pen, st, String(g.goal), COIN_X, PLOT.y1, MUTED, "right", COIN_SIZE);
  sText(pen, st, "0", COIN_X, PLOT.y0, MUTED, "right", COIN_SIZE);
  sDot(pen, st, PLOT.x0, y, START_R, INK);
}

function drawPath(pen: Pen, st: Stage, g: Game, part: number) {
  const upTo = Math.round((g.path.length - 1) * part);
  const pts: Point[] = [];
  for (let n = 0; n <= upTo; n += 1) pts.push([tossX(g, n), coinY(g, g.path[n])]);
  sLine(pen, st, pts, SKY, PATH_WEIGHT);
  sDot(pen, st, tossX(g, upTo), coinY(g, g.path[upTo]), TIP_R, INK);
}

function drawShares(pen: Pen, st: Stage, g: Game) {
  const split = lerp(COLUMN.y0, COLUMN.y1, 1 - g.reach);
  const x = (COLUMN.x0 + COLUMN.x1) * HALF;
  sBox(pen, st, COLUMN.x0, COLUMN.y0, COLUMN.x1, split, TWO);
  sBox(pen, st, COLUMN.x0, split, COLUMN.x1, COLUMN.y1, ONE);
  sText(pen, st, (1 - g.reach).toFixed(SHARE_PLACES), x, (COLUMN.y0 + split) * HALF, GROUND, "center", SHARE_SIZE);
  sText(pen, st, g.reach.toFixed(SHARE_PLACES), x, (split + COLUMN.y1) * HALF, GROUND, "center", SHARE_SIZE);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set, t: number, playing = true): void {
  const st = stageOf(pen);
  const g = data[set.coin];
  const part = playing ? Math.min(1, (Math.max(0, t) % TURN) / DRAW_TIME) : 1;

  withAlpha(pen, Math.max(fade.walls, fade.path), () => drawTosses(pen, st, g));
  withAlpha(pen, fade.walls, () => drawWalls(pen, st, g));
  withAlpha(pen, fade.path, () => drawPath(pen, st, g, part));
  withAlpha(pen, fade.bars, () => drawShares(pen, st, g));
}
