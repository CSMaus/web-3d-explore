import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { num } from "@/lib/storyline";
import { sBars, sDot, sFrame, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Act, Fade, Set, Top } from "@/storylines/probability/birthdays";
import { pick, rngFrom, shared } from "@/systems/probability";

type Pair = [number, number];
type Point = [number, number];

export type Values = { people: number };
export const DEFAULTS: Values = { people: 23 };
export type Data = { values: Values; days: number[]; twin: Pair | null };

const DAYS = 365;
const MOST = 60;
const SEED = 23;
const MONTH_ENDS = [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const PLACES = 3;

const ONE_PAIR = 1;
const LAST_BAR = 2;

const THIN = 1;
const RING_X = 32;
const RING_Y = 34;
const RING_R = 22;
const TOP_ANGLE = Math.PI / 2;
const TURN = Math.PI * 2;
const FEW = 10;
const DOT_BIG = 4;
const DOT_SMALL = 3;

const WEB_FEW = 0.9;
const WEB_MANY = 0.35;

const TWIN_WEIGHT = 2.5;
const TWIN_DOT = 5;

const YEAR = { x0: 8, y0: 64, x1: 92, y1: 69 };

const BARS = { x0: 60, y0: 12, x1: 96, y1: 60 };
const BAR_MOST = 1;
const HALF = 0.5;
const HALF_SIGN = "½";
const HALF_X = 57.5;
const HALF_SIZE = 2.6;
const DASH = [3, 4];

const pairsOf = (n: number) => (n * (n - 1)) / 2;
const differ = (n: number) => 1 - shared(n, DAYS);
const dayX = (day: number) => YEAR.x0 + ((YEAR.x1 - YEAR.x0) * day) / DAYS;

function seat(k: number, n: number): Point {
  const angle = TOP_ANGLE - (TURN * k) / n;
  return [RING_X + RING_R * Math.cos(angle), RING_Y + RING_R * Math.sin(angle)];
}

function twinOf(days: number[], room: number): Pair | null {
  for (let i = 0; i < room; i += 1) {
    for (let j = i + 1; j < room; j += 1) if (days[i] === days[j]) return [i, j];
  }
  return null;
}

export function build(values: Values): Data {
  const rng = rngFrom(SEED);
  const days = Array.from({ length: MOST }, () => pick(rng, DAYS));
  return { values, days, twin: twinOf(days, DEFAULTS.people) };
}

export function applyAct(set: Set, values: Values, act: Act | null): Set {
  return act === "people" ? { ...set, people: values.people } : set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, _data: Data, set: Set): string {
  switch (top) {
    case "people":
      return L("People: {{n}}", { n: set.people });
    case "pairs":
      return L("Pairs: {{n}}", { n: num(pairsOf(set.people)) });
    case "pairs-chance":
      return L("Pairs: {{n}}. Chance of a match: {{p}}", { n: num(pairsOf(set.people)), p: shared(set.people, DAYS).toFixed(PLACES) });
    case "differ":
      return L("Chance that all days differ: {{p}}", { p: differ(set.people).toFixed(PLACES) });
  }
}

function drawRing(pen: Pen, st: Stage, n: number) {
  const r = n <= FEW ? DOT_BIG : DOT_SMALL;
  for (let k = 0; k < n; k += 1) {
    const [x, y] = seat(k, n);
    sDot(pen, st, x, y, r, INK);
  }
}

function drawWeb(pen: Pen, st: Stage, n: number) {
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) sLine(pen, st, [seat(i, n), seat(j, n)], SKY, THIN);
  }
}

function drawTwin(pen: Pen, st: Stage, twin: Pair, n: number) {
  const ends = [seat(twin[0], n), seat(twin[1], n)];
  sLine(pen, st, ends, ONE, TWIN_WEIGHT);
  for (const [x, y] of ends) sDot(pen, st, x, y, TWIN_DOT, ONE);
}

function drawYear(pen: Pen, st: Stage, data: Data, n: number, both: boolean) {
  sFrame(pen, st, YEAR.x0, YEAR.y0, YEAR.x1, YEAR.y1, FAINT, THIN);
  for (const day of MONTH_ENDS) sLine(pen, st, [[dayX(day), YEAR.y0], [dayX(day), YEAR.y1]], FAINT, THIN);
  for (let k = 0; k < n; k += 1) {
    const x = dayX(data.days[k]);
    const paired = both && data.twin !== null && data.twin.includes(k);
    sLine(pen, st, [[x, YEAR.y0], [x, YEAR.y1]], paired ? ONE : INK, THIN);
  }
}

function drawBars(pen: Pen, st: Stage, n: number, last: boolean) {
  const values = Array.from({ length: n }, (_, i) => differ(i + 1));
  const y = BARS.y0 + (BARS.y1 - BARS.y0) * HALF;
  sBars(pen, st, BARS, values, BAR_MOST, (i) => (last && i === n - 1 ? ONE : SKY));
  pen.ctx.setLineDash(DASH);
  sLine(pen, st, [[BARS.x0, y], [BARS.x1, y]], MUTED, THIN);
  pen.ctx.setLineDash([]);
  sText(pen, st, HALF_SIGN, HALF_X, y, MUTED, "center", HALF_SIZE);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);
  const n = Math.max(0, Math.min(data.days.length, Math.round(set.people)));
  const twin = data.twin;
  const both = twin !== null && n > twin[1];

  withAlpha(pen, fade.ring, () => drawRing(pen, st, n));
  withAlpha(pen, fade.web * (n <= FEW ? WEB_FEW : WEB_MANY), () => drawWeb(pen, st, n));
  if (twin !== null && both && set.pair === ONE_PAIR) withAlpha(pen, fade.ring, () => drawTwin(pen, st, twin, n));
  withAlpha(pen, fade.year, () => drawYear(pen, st, data, n, both));
  withAlpha(pen, fade.bar, () => drawBars(pen, st, n, set.pair === LAST_BAR));
}
