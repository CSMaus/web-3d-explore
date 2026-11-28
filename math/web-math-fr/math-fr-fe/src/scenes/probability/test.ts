import type { Pen } from "@/components/Plot";
import { FAINT, INK, MUTED, ONE, SKY, TWO, blend } from "@/lib/draw";
import { L } from "@/lib/lang";
import { toned } from "@/lib/panes";
import { num } from "@/lib/storyline";
import { clamp01, lerp, ramp, sBox, sDot, sFrame, sLine, sText, stageOf, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import type { Fade, Set, Top } from "@/storylines/probability/test";
import { counted, population } from "@/systems/probability";
import type { Screen } from "@/systems/probability";

type Rgba = [number, number, number, number];
type Span = { x0: number; x1: number };
type Cache = { canvas: HTMLCanvasElement; kinds: Uint8Array; key: string };

export type Values = { per1000: number };
export const DEFAULTS: Values = { per1000: 1 };
export type Data = { values: Values; screen: Screen; c: ReturnType<typeof counted>; kinds: Uint8Array; ill: number[] };

const PEOPLE = 100000;
const PER = 1000;
const SENSITIVITY = 0.99;
const FALSE_RATE = 0.05;
const SEED = 3;
const OF = 100;
const PLACES = 2;

const MISSED = 2;
const FOUND = 3;

const COLS = 400;
const ROWS = 250;
const FIELD = { x0: 10, y0: 8, x1: 90, y1: 58 };
const HEALTHY_ALPHA = 0.35;
const CHANNELS = 4;
const FULL = 255;
const TENTHS = 10;
const HEX = /^#([0-9a-f]{6})$/i;
const HEX_BASE = 16;
const HEX_PAIR = 2;
const RGB = /^rgba?\(([^)]+)\)$/i;
const RGB_GAP = /[ ,/]+/;

const HALO_MOST = 400;
const HALO_R = 2.5;
const HALF = 0.5;

const THIN = 1;
const BASE_Y = 12;
const BASE: Span = { x0: 24, x1: 76 };
const PILE_ILL: Span = { x0: 30, x1: 44 };
const PILE_HEALTHY: Span = { x0: 56, x1: 70 };
const PILE_H = 46;
const PILE_LEAST = 0.6;
const RISE_FROM = 0.2;
const RISE_TO = 1;
const COUNT_SIZE = 3.2;
const COUNT_UP = 3;

const SHOWN = 1;
const STRIP = { x0: 38, y0: 30, x1: 62, y1: 44 };
const STRIP_WEIGHT = 2;
const PLUS_X = 50;
const PLUS_Y = 37;
const PLUS_LEN = 7;
const PLUS_WEIGHT = 3;

let cache: Cache | null = null;

function rgbaOf(colour: string): Rgba {
  const text = colour.trim();
  const hex = text.match(HEX);
  if (hex) {
    const part = (i: number) => parseInt(hex[1].slice(i * HEX_PAIR, (i + 1) * HEX_PAIR), HEX_BASE);
    return [part(0), part(1), part(2), 1];
  }
  const parts = (text.match(RGB)?.[1] ?? "").split(RGB_GAP).filter(Boolean).map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 1];
}

const mixed = (a: Rgba, b: Rgba, t: number): Rgba => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)];
const tenth = (v: number) => Math.round(clamp01(v) * TENTHS) / TENTHS;

export function build(values: Values): Data {
  const screen: Screen = { people: PEOPLE, prevalence: values.per1000 / PER, sensitivity: SENSITIVITY, falsePositive: FALSE_RATE };
  const kinds = population(screen, SEED);
  const ill: number[] = [];
  kinds.forEach((kind, k) => {
    if (kind === MISSED || kind === FOUND) ill.push(k);
  });
  return { values, screen, c: counted(screen), kinds, ill };
}

export function applyAct(set: Set): Set {
  return set;
}

export function onStep(): Values {
  return DEFAULTS;
}

export function topLine(top: Top, data: Data): string {
  const { screen, c } = data;
  switch (top) {
    case "finds":
      return L("Finds {{k}} of {{n}} ill people", { k: Math.round(screen.sensitivity * OF), n: OF });
    case "people":
      return L("People: {{n}}", { n: num(screen.people) });
    case "ill":
      return L("Ill: {{n}}", { n: num(c.ill) });
    case "ill-positive":
      return L("Ill with a positive result: {{n}}", { n: num(c.illPositive) });
    case "false-rate":
      return L("Wrong on {{k}} of {{n}} healthy people", { k: Math.round(screen.falsePositive * OF), n: OF });
    case "healthy-positive":
      return L("Healthy with a positive result: {{n}}", { n: num(c.healthyPositive) });
    case "both":
      return L("Positive results: ill {{a}}, healthy {{b}}", { a: num(c.illPositive), b: num(c.healthyPositive) });
    case "share":
      return L("Ill among the positives: {{p}} %", { p: (c.share * OF).toFixed(PLACES) });
  }
}

function raster(kinds: Uint8Array, fade: Fade): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const tones = [MUTED, TWO, ONE, SKY].map(toned);
  const [ill, found, wrong] = [fade.ill, fade.found, fade.wrong].map(tenth);
  const key = [...tones, ill, found, wrong].join(" ");
  if (cache && cache.kinds === kinds && cache.key === key) return cache.canvas;

  const canvas = cache?.canvas ?? document.createElement("canvas");
  canvas.width = COLS;
  canvas.height = ROWS;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const [muted, two, one, sky] = tones.map(rgbaOf);
  const healthy: Rgba = [muted[0], muted[1], muted[2], HEALTHY_ALPHA];
  const missed = mixed(healthy, two, ill);
  const colours = [healthy, mixed(healthy, sky, wrong), missed, mixed(missed, one, found)];
  const image = ctx.createImageData(COLS, ROWS);
  const count = Math.min(kinds.length, COLS * ROWS);
  for (let k = 0; k < count; k += 1) {
    const colour = colours[kinds[k]];
    const at = k * CHANNELS;
    image.data[at] = colour[0];
    image.data[at + 1] = colour[1];
    image.data[at + 2] = colour[2];
    image.data[at + 3] = colour[3] * FULL;
  }
  ctx.putImageData(image, 0, 0);
  cache = { canvas, kinds, key };
  return canvas;
}

function drawField(pen: Pen, st: Stage, data: Data, fade: Fade) {
  const image = raster(data.kinds, fade);
  if (!image) return;
  const ctx = pen.ctx;
  const smooth = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, st.px(FIELD.x0), st.py(FIELD.y1), st.px(FIELD.x1) - st.px(FIELD.x0), st.py(FIELD.y0) - st.py(FIELD.y1));
  ctx.imageSmoothingEnabled = smooth;
}

function drawHalos(pen: Pen, st: Stage, data: Data, found: number) {
  const wide = (FIELD.x1 - FIELD.x0) / COLS;
  const tall = (FIELD.y1 - FIELD.y0) / ROWS;
  const hit = blend(TWO, ONE, found);
  for (const k of data.ill) {
    const x = FIELD.x0 + wide * ((k % COLS) + HALF);
    const y = FIELD.y1 - tall * (Math.floor(k / COLS) + HALF);
    sDot(pen, st, x, y, HALO_R, data.kinds[k] === FOUND ? hit : TWO);
  }
}

function drawPiles(pen: Pen, st: Stage, data: Data, shown: number) {
  const { illPositive, healthyPositive } = data.c;
  const most = Math.max(illPositive, healthyPositive);
  const rise = ramp(shown, RISE_FROM, RISE_TO);
  const pile = (span: Span, value: number, colour: string) => {
    const top = BASE_Y + Math.max(PILE_LEAST, ((PILE_H * value) / most) * rise);
    sBox(pen, st, span.x0, BASE_Y, span.x1, top, colour);
    sText(pen, st, num(value), (span.x0 + span.x1) * HALF, top + COUNT_UP, INK, "center", COUNT_SIZE);
  };
  sLine(pen, st, [[BASE.x0, BASE_Y], [BASE.x1, BASE_Y]], FAINT, THIN);
  pile(PILE_ILL, illPositive, ONE);
  pile(PILE_HEALTHY, healthyPositive, SKY);
}

function drawStrip(pen: Pen, st: Stage) {
  const arm = PLUS_LEN * HALF;
  sFrame(pen, st, STRIP.x0, STRIP.y0, STRIP.x1, STRIP.y1, INK, STRIP_WEIGHT);
  sLine(pen, st, [[PLUS_X - arm, PLUS_Y], [PLUS_X + arm, PLUS_Y]], ONE, PLUS_WEIGHT);
  sLine(pen, st, [[PLUS_X, PLUS_Y - arm], [PLUS_X, PLUS_Y + arm]], ONE, PLUS_WEIGHT);
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set): void {
  const st = stageOf(pen);

  withAlpha(pen, fade.field, () => drawField(pen, st, data, fade));
  if (data.c.ill <= HALO_MOST) withAlpha(pen, fade.field * fade.ill, () => drawHalos(pen, st, data, fade.found));
  withAlpha(pen, fade.gather, () => drawPiles(pen, st, data, fade.gather));
  if (set.note === "claim") withAlpha(pen, SHOWN, () => drawStrip(pen, st));
}
