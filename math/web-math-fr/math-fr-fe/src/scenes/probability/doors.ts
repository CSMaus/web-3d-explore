import type { Pen } from "@/components/Plot";
import { GROUND, INK, MUTED, ONE, SKY } from "@/lib/draw";
import { L } from "@/lib/lang";
import { sBox, sDot, sFrame, sLine, sRing, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/doors";
import { doorsGame, rngFrom } from "@/systems/probability";

type Rect = { x0: number; y0: number; x1: number; y1: number };
type Game = { car: number; first: number; left: number };
type Choice = "none" | "stay" | "switch";
type Door = { picked: boolean; open: boolean; car: boolean; final: boolean };

export type Values = {
  deal: number;
  car: number;
  first: number;
  left: number;
  choice: Choice;
  stay: number;
  stayWon: number;
  swap: number;
  swapWon: number;
};
export type Data = { values: Values; demo3: Game; demo100: Game };

const FEW = 3;
const MANY = 100;
const SEED_BASE = 100;
const DEMO_FEW: Game = { car: 2, first: 0, left: 2 };
const DEMO_MANY: Game = { car: 63, first: 17, left: 63 };

const HALF = 0.5;
const THIN = 1;
const SHUT_ALPHA = 0.55;
const OPEN_ALPHA = 0.12;
const GOAT_R = 0.18;
const HORN = 0.2;
const LEAN = Math.SQRT1_2;
const CAR_W = 0.6;
const CAR_H = 0.18;
const WHEEL_R = 0.07;
const WHEEL_AT = 0.2;
const PICK_PAD = 1;
const PICK_WEIGHT = 2;
const FINAL_PAD = 2;
const FINAL_WEIGHT = 1;

const DOOR_W = 16;
const DOOR_Y0 = 16;
const DOOR_Y1 = 50;
const CENTRES = [26, 50, 74];
const NUMBER_Y = 54;
const NUMBER_SIZE = 2.8;

const GRID = { x0: 18, y0: 10, x1: 82, y1: 60 };
const GRID_SIDE = 10;
const INSET = 0.5;

const PULSE_BASE = 0.5;
const PULSE_SWING = 0.8;
const PULSE_SPEED = 3;
const PULSE_WEIGHT = 2;

export function deal(values: Values): Values {
  const n = values.deal + 1;
  const g = doorsGame(FEW, rngFrom(SEED_BASE + n));
  return { ...values, deal: n, car: g.car, first: g.first, left: g.left, choice: "none" };
}

export function decide(values: Values, choice: "stay" | "switch"): Values {
  if (values.choice !== "none") return values;
  const won = (choice === "stay" ? values.first : values.left) === values.car ? 1 : 0;
  return choice === "stay"
    ? { ...values, choice, stay: values.stay + 1, stayWon: values.stayWon + won }
    : { ...values, choice, swap: values.swap + 1, swapWon: values.swapWon + won };
}

export const DEFAULTS: Values = deal({ deal: 0, car: 0, first: 0, left: 0, choice: "none", stay: 0, stayWon: 0, swap: 0, swapWon: 0 });

export function build(values: Values): Data {
  return { values, demo3: DEMO_FEW, demo100: DEMO_MANY };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(values: Values): Values {
  return values;
}

export function topLine(top: Top, data: Data, set: Set): string {
  const { values } = data;
  switch (top) {
    case "tally":
      return L("Stayed: won {{a}} of {{b}}. Switched: won {{c}} of {{d}}", { a: values.stayWon, b: values.stay, c: values.swapWon, d: values.swap });
    case "doors":
      return L("Doors: {{n}}", { n: set.doors });
    case "first":
      return L("First pick is right: 1 of {{n}}", { n: set.doors });
  }
}

function fewRect(d: number): Rect {
  return { x0: CENTRES[d] - DOOR_W * HALF, y0: DOOR_Y0, x1: CENTRES[d] + DOOR_W * HALF, y1: DOOR_Y1 };
}

function manyRect(d: number): Rect {
  const wide = (GRID.x1 - GRID.x0) / GRID_SIDE;
  const tall = (GRID.y1 - GRID.y0) / GRID_SIDE;
  const col = d % GRID_SIDE;
  const row = Math.floor(d / GRID_SIDE);
  return { x0: GRID.x0 + col * wide + INSET, y0: GRID.y1 - (row + 1) * tall + INSET, x1: GRID.x0 + (col + 1) * wide - INSET, y1: GRID.y1 - row * tall - INSET };
}

function doorOf(d: number, g: Game, stage: Set["stage"], choice: Choice): Door {
  const hand = stage === "hand";
  const decided = hand && choice !== "none";
  return {
    picked: d === g.first && stage !== "closed",
    open: (stage === "opened" || stage === "revealed" || hand) && d !== g.first && d !== g.left,
    car: d === g.car && (stage === "revealed" || decided),
    final: decided && d === (choice === "stay" ? g.first : g.left),
  };
}

function padded(pen: Pen, st: Stage, r: Rect, pad: number, colour: string, weight: number) {
  sFrame(pen, st, r.x0 - pad, r.y0 - pad, r.x1 + pad, r.y1 + pad, colour, weight);
}

function drawDoor(pen: Pen, st: Stage, r: Rect, door: Door) {
  const w = r.x1 - r.x0;
  const cx = (r.x0 + r.x1) * HALF;
  const cy = (r.y0 + r.y1) * HALF;
  if (door.car) {
    const body = CAR_H * w * HALF;
    sBox(pen, st, r.x0, r.y0, r.x1, r.y1, ONE);
    sBox(pen, st, cx - CAR_W * w * HALF, cy - body, cx + CAR_W * w * HALF, cy + body, GROUND);
    for (const side of [-1, 1]) sDot(pen, st, cx + side * WHEEL_AT * w, cy - body - WHEEL_R * w, WHEEL_R * w * st.unit, GROUND);
  } else if (door.open) {
    const top = cy + GOAT_R * w;
    const horn = HORN * w * LEAN;
    withAlpha(pen, OPEN_ALPHA, () => sBox(pen, st, r.x0, r.y0, r.x1, r.y1, MUTED));
    sRing(pen, st, cx, cy, GOAT_R * w, MUTED, THIN);
    for (const side of [-1, 1]) sLine(pen, st, [[cx, top], [cx + side * horn, top + horn]], MUTED, THIN);
  } else {
    withAlpha(pen, SHUT_ALPHA, () => sBox(pen, st, r.x0, r.y0, r.x1, r.y1, MUTED));
  }
  if (door.picked) padded(pen, st, r, PICK_PAD, INK, PICK_WEIGHT);
  if (door.final) padded(pen, st, r, FINAL_PAD, INK, FINAL_WEIGHT);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set, t: number): void {
  const st = stageOf(pen);
  const many = set.doors === MANY;
  const few: Game = set.stage === "hand" ? data.values : data.demo3;

  withAlpha(pen, fade.three, () => {
    for (let d = 0; d < FEW; d += 1) {
      drawDoor(pen, st, fewRect(d), doorOf(d, few, many ? "closed" : set.stage, data.values.choice));
      sText(pen, st, String(d + 1), CENTRES[d], NUMBER_Y, MUTED, "center", NUMBER_SIZE);
    }
  });
  withAlpha(pen, fade.hundred, () => {
    for (let d = 0; d < MANY; d += 1) drawDoor(pen, st, manyRect(d), doorOf(d, data.demo100, many ? set.stage : "closed", "none"));
  });
  withAlpha(pen, fade.pulse, () => {
    const r = many ? manyRect(data.demo100.left) : fewRect(few.left);
    padded(pen, st, r, PULSE_BASE + PULSE_SWING * Math.abs(Math.sin(t * PULSE_SPEED)), SKY, PULSE_WEIGHT);
  });
}
