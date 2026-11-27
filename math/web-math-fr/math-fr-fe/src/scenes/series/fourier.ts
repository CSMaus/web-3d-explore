import type { Pen } from "@/components/Plot";
import { FAINT, ONE } from "@/lib/draw";
import { L } from "@/lib/lang";
import { GLYPHS, glyphShape } from "@/lib/outline";
import { grow } from "@/lib/storyline";
import { sFrame, sLine, stageOf } from "@/scenes/kit";
import { catOutline } from "@/scenes/series/cat";
import { drawChain } from "@/scenes/series/chain";
import { drawWave } from "@/scenes/series/wave";
import type { Fade, Set, Top } from "@/storylines/series/fourier";
import { circlesOf, resample, splitHub, sumText } from "@/systems/series";
import type { C, Circle } from "@/systems/series";

export type Shape = "cat" | "pi" | "sigma" | "amp" | "three";
export type Values = { count: number | null; shape: Shape; own: C[] | null; drawing: boolean };
export type Chain = { hub: C; arms: Circle[] };
export type Data = { values: Values; path: C[]; hub: C; arms: Circle[]; own: Chain | null };

export const DEFAULTS: Values = { count: null, shape: "cat", own: null, drawing: false };
export const MOST: Record<Set["mode"], number> = { wave: 40, draw: 200, own: 200 };

const POINTS = 256;
const OWN_LEAST = 12;
const COUNT_LEAST = 1;
const FORMULA = "c₁e^(it) + c₋₁e^(−it) + c₂e^(2it) + …";

const GAP_MOST = 1;
const STEP_MOST = 0.05;

const CENTRE: C = [50, 37.5];
const K = 30;
const THIN = 1;
const FRAME_DASH = [3, 7];
const SOLID: number[] = [];
const OWN_WEIGHT = 3;

type Outline = Chain & { path: C[] };

const outlines = new Map<Shape, Outline>();
const shown = { value: 0, t: Number.NEGATIVE_INFINITY, key: "" };

const place = (p: C): C => [CENTRE[0] + K * p[0], CENTRE[1] + K * p[1]];

function outline(shape: Shape): Outline {
  const had = outlines.get(shape);
  if (had) return had;
  const glyph = GLYPHS.find((g) => g.id === shape)?.glyph;
  const drawn = glyph === undefined ? [] : glyphShape(glyph);
  const path = drawn.length > 0 ? resample(drawn, POINTS) : catOutline();
  const made = { path, ...splitHub(circlesOf(path)) };
  outlines.set(shape, made);
  return made;
}

export function build(values: Values): Data {
  const { path, hub, arms } = outline(values.shape);
  const line = values.own;
  const own = line !== null && line.length >= OWN_LEAST && !values.drawing ? splitHub(circlesOf(resample(line, POINTS))) : null;
  return { values, path, hub, arms, own };
}

export function applyAct(set: Set, values: Values): Set {
  if (values.count === null) return set;
  return { ...set, count: Math.max(COUNT_LEAST, Math.min(MOST[set.mode], values.count)) };
}

export function onStep(values: Values): Values {
  return { ...values, count: null };
}

export function topLine(top: Top, data: Data, set: Set): string {
  switch (top) {
    case "arrows":
      return L("Arrows: {{n}}", { n: set.count });
    case "tip":
      return L("Height of the tip");
    case "sum":
      return L("height = {{sum}}", { sum: sumText(set.wave, set.count) });
    case "formula":
      return L("drawing(t) = {{sum}}", { sum: FORMULA });
    case "kept":
      return L("Kept {{k}} of {{n}} arrows", { k: set.count, n: data.arms.length });
  }
}

export function draw(pen: Pen, data: Data, fade: Fade, set: Set, t: number): void {
  const key = `${set.mode}/${set.wave}/${set.mode === "own" ? "own" : data.values.shape}`;
  if (key !== shown.key) shown.value = 0;
  const dt = t - shown.t;
  shown.value = dt < 0 || dt > GAP_MOST ? set.count : grow(shown.value, set.count, Math.min(dt, STEP_MOST));
  shown.t = t;
  shown.key = key;

  const st = stageOf(pen);
  if (set.mode === "wave") {
    drawWave(pen, st, { wave: set.wave, shown: shown.value, proj: fade.proj, strip: fade.strip, ghost: fade.ghost }, t);
    return;
  }
  if (set.mode === "draw") {
    drawChain(pen, st, { hub: data.hub, arms: data.arms, shown: shown.value, target: fade.target, path: data.path }, t);
    return;
  }

  pen.ctx.setLineDash(FRAME_DASH);
  sFrame(pen, st, CENTRE[0] - K, CENTRE[1] - K, CENTRE[0] + K, CENTRE[1] + K, FAINT, THIN);
  pen.ctx.setLineDash(SOLID);
  const line = data.values.own;
  if (data.own !== null) {
    drawChain(pen, st, { hub: data.own.hub, arms: data.own.arms, shown: shown.value, target: 0, path: null }, t);
  } else if (line !== null && line.length > 1) {
    sLine(pen, st, line.map(place), ONE, OWN_WEIGHT);
  }
}
