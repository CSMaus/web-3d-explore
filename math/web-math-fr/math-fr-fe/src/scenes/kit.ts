import type { Pen } from "@/components/Plot";
import { MUTED } from "@/lib/draw";
import { toned } from "@/lib/panes";

/**
 * what every story scene draws with. a scene is laid out on a stage 100 units wide and 75 tall,
 * origin at the bottom left, y up. the stage is fitted into the canvas whole and centred, so a
 * scene looks the same on a wide screen and on a phone. the plot under it is drawn with the unit
 * box (UNIT from lib/panes), without `equal`.
 *
 * only canvas calls that the test stub has are used here and may be used in a scene: fillRect,
 * strokeRect, clearRect, beginPath, closePath, moveTo, lineTo, arc, ellipse, rect, stroke, fill,
 * clip, fillText, measureText, setLineDash, save, restore, translate, scale, rotate,
 * createImageData, getImageData, putImageData, drawImage. properties (globalAlpha, fillStyle,
 * strokeStyle, lineWidth, font, textAlign, textBaseline, imageSmoothingEnabled) are free.
 */
export const STAGE_W = 100;
export const STAGE_H = 75;

export type Stage = {
  /** stage units to the plot's unit box */
  at: (x: number, y: number) => [number, number];
  /** pixels in one stage unit */
  unit: number;
  /** stage units to canvas pixels, for calls made straight on the context */
  px: (x: number) => number;
  py: (y: number) => number;
};

export function stageOf(pen: Pen): Stage {
  const unit = Math.min(pen.width / STAGE_W, pen.height / STAGE_H);
  const left = (pen.width - STAGE_W * unit) / 2;
  const bottom = (pen.height - STAGE_H * unit) / 2;
  const px = (x: number) => left + x * unit;
  const py = (y: number) => pen.height - bottom - y * unit;
  return {
    unit,
    px,
    py,
    at: (x, y) => [px(x) / Math.max(1, pen.width), 1 - py(y) / Math.max(1, pen.height)],
  };
}

/**
 * a pointer position to stage units: x and y are the plot's unit-box coordinates (what Plot hands
 * to onDrag), width and height the canvas size in pixels. the inverse of stageOf(pen).at.
 */
export function stagePoint(x: number, y: number, width: number, height: number): [number, number] {
  const unit = Math.min(width / STAGE_W, height / STAGE_H) || 1;
  const left = (width - STAGE_W * unit) / 2;
  const bottom = (height - STAGE_H * unit) / 2;
  return [(x * width - left) / unit, (y * height - bottom) / unit];
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** 0 before `from`, 1 after `to`, straight between: a part of a fade used as its own small fade */
export const ramp = (v: number, from: number, to: number) => clamp01((v - from) / (to - from));

/** draw with an opacity; nothing is drawn below one hundredth */
export function withAlpha(pen: Pen, alpha: number, draw: () => void) {
  const a = clamp01(alpha);
  if (a < 0.01) return;
  const before = pen.ctx.globalAlpha;
  pen.ctx.globalAlpha = (Number.isFinite(before) ? before : 1) * a;
  draw();
  pen.ctx.globalAlpha = before;
}

/** a line through stage points */
export function sLine(pen: Pen, st: Stage, pts: [number, number][], colour: string, weight = 1) {
  pen.line(pts.map(([x, y]) => st.at(x, y)), colour, weight);
}

/** a dot at a stage point, radius in pixels */
export function sDot(pen: Pen, st: Stage, x: number, y: number, r: number, colour: string) {
  const [a, b] = st.at(x, y);
  pen.dot(a, b, r, colour);
}

/** a circle outline at a stage point, radius in stage units */
export function sRing(pen: Pen, st: Stage, x: number, y: number, r: number, colour: string, weight = 1) {
  const [a, b] = st.at(x, y);
  pen.ring(a, b, r * st.unit, colour, weight);
}

/** a filled box between two stage corners */
export function sBox(pen: Pen, st: Stage, x0: number, y0: number, x1: number, y1: number, colour: string) {
  const l = Math.min(st.px(x0), st.px(x1));
  const t = Math.min(st.py(y0), st.py(y1));
  pen.ctx.fillStyle = toned(colour);
  pen.ctx.fillRect(l, t, Math.abs(st.px(x1) - st.px(x0)), Math.abs(st.py(y1) - st.py(y0)));
}

/** the outline of a box between two stage corners */
export function sFrame(pen: Pen, st: Stage, x0: number, y0: number, x1: number, y1: number, colour: string, weight = 1) {
  sLine(pen, st, [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]], colour, weight);
}

/** text at a stage point; size in stage units, so it shrinks with the stage, never below 9 pixels */
export function sText(pen: Pen, st: Stage, s: string, x: number, y: number, colour = MUTED, align: CanvasTextAlign = "center", size = 2.6) {
  const ctx = pen.ctx;
  ctx.fillStyle = toned(colour);
  ctx.font = `${Math.max(9, Math.round(size * st.unit))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(s, st.px(x), st.py(y));
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
}

/**
 * bars standing on a base line: values[i] drawn to height values[i] / max of the box, each bar
 * `fill` of its slot wide. `colour` is one colour or one for each bar. `grow` from 0 to 1 raises
 * the bars from the base line.
 */
export function sBars(
  pen: Pen,
  st: Stage,
  box: { x0: number; y0: number; x1: number; y1: number },
  values: number[],
  max: number,
  colour: string | ((i: number) => string),
  grow = 1,
  fill = 0.8,
) {
  const slot = (box.x1 - box.x0) / Math.max(1, values.length);
  values.forEach((v, i) => {
    const h = (box.y1 - box.y0) * clamp01(v / (max || 1)) * clamp01(grow);
    const x = box.x0 + slot * (i + (1 - fill) / 2);
    sBox(pen, st, x, box.y0, x + slot * fill, box.y0 + h, typeof colour === "string" ? colour : colour(i));
  });
}

/** where the pips of a die face sit, in a square from -1 to 1 */
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.5, 0.5], [0.5, -0.5]],
  3: [[-0.5, 0.5], [0, 0], [0.5, -0.5]],
  4: [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]],
  5: [[-0.5, 0.5], [0.5, 0.5], [0, 0], [-0.5, -0.5], [0.5, -0.5]],
  6: [[-0.5, 0.5], [0.5, 0.5], [-0.5, 0], [0.5, 0], [-0.5, -0.5], [0.5, -0.5]],
};

/** one face of a die: an outlined square of this side centred at a stage point, with its pips */
export function dieFace(pen: Pen, st: Stage, cx: number, cy: number, side: number, face: number, colour: string) {
  const h = side / 2;
  sFrame(pen, st, cx - h, cy - h, cx + h, cy + h, colour, 1.6);
  for (const [x, y] of PIPS[Math.max(1, Math.min(6, Math.round(face)))]) sDot(pen, st, cx + x * h * 0.9, cy + y * h * 0.9, Math.max(1.5, side * st.unit * 0.085), colour);
}
