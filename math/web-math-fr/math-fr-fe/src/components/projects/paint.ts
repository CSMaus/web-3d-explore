import type { Pen } from "@/components/Plot";
import { forLight, lightPage } from "@/lib/tone";
import { GROUND } from "@/lib/draw";

/**
 * the few drawing helpers the project figures share, on top of the plot's pen: filled and
 * outlined boxes, words in the page's own type, and a colour with an opacity. every colour goes
 * through the same light-page reading as the pen's own lines, so a figure follows the mode.
 */

/** a colour as the page draws it, with an opacity */
export function ink(colour: string, alpha = 1): string {
  // the page's own ground is drawn as it is; every other colour is read again for a light page
  const c = lightPage() && colour !== GROUND ? forLight(colour, GROUND) : colour;
  if (alpha >= 1) return c;
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }
  const fn = c.match(/^rgba?\(([^)]+)\)$/i);
  if (fn) {
    const [r, g, b] = fn[1].split(/[ ,/]+/).map(Number);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return c;
}

/** a filled box in world units, from its lower left corner */
export function fill(pen: Pen, x: number, y: number, w: number, h: number, colour: string, alpha = 1) {
  pen.ctx.fillStyle = ink(colour, alpha);
  pen.ctx.fillRect(pen.px(x), pen.py(y + h), pen.px(x + w) - pen.px(x), pen.py(y) - pen.py(y + h));
}

/** an outlined box in world units, with rounded corners in pixels */
export function outline(pen: Pen, x: number, y: number, w: number, h: number, colour: string, weight = 1, round = 4) {
  const ctx = pen.ctx;
  ctx.strokeStyle = ink(colour);
  ctx.lineWidth = lightPage() ? weight * 1.4 : weight;
  ctx.beginPath();
  // a canvas without rounded rectangles (an older browser, the test runner) gets square corners
  if (!ctx.roundRect) ctx.rect(pen.px(x), pen.py(y + h), pen.px(x + w) - pen.px(x), pen.py(y) - pen.py(y + h));
  else ctx.roundRect(pen.px(x), pen.py(y + h), pen.px(x + w) - pen.px(x), pen.py(y) - pen.py(y + h), round);
  ctx.stroke();
}

/** a filled polygon in world units */
export function shape(pen: Pen, pts: [number, number][], colour: string, alpha = 1) {
  if (pts.length < 3) return;
  const ctx = pen.ctx;
  ctx.fillStyle = ink(colour, alpha);
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(pen.px(x), pen.py(y)) : ctx.moveTo(pen.px(x), pen.py(y))));
  ctx.closePath();
  ctx.fill();
}

let bodyFont = "";
function body(): string {
  if (!bodyFont && typeof document !== "undefined") bodyFont = getComputedStyle(document.body).fontFamily || "sans-serif";
  return bodyFont || "sans-serif";
}

/** type grows with the figure, so a wide figure is not captioned in small print */
function scaled(pen: Pen, size: number): number {
  return Math.round(size * Math.max(0.9, Math.min(1.6, pen.width / 700)) * 10) / 10;
}

/** words on a figure: the page's body type, or its monospace for numbers; sizes are for a figure 700 px wide */
export function say(
  pen: Pen,
  s: string,
  x: number,
  y: number,
  colour: string,
  { size = 12, align = "left", mono = false, bold = false, alpha = 1 }: { size?: number; align?: CanvasTextAlign; mono?: boolean; bold?: boolean; alpha?: number } = {},
) {
  const ctx = pen.ctx;
  ctx.fillStyle = ink(colour, alpha);
  ctx.font = `${bold ? "600 " : ""}${scaled(pen, size)}px ${mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : body()}`;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, pen.px(x), pen.py(y));
}

/** the width of some words in world units, at a size */
export function wide(pen: Pen, s: string, size = 12, mono = false): number {
  pen.ctx.font = `${scaled(pen, size)}px ${mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : body()}`;
  return pen.wx(pen.ctx.measureText(s).width) - pen.wx(0);
}

/** a smooth step from 0 to 1 as t goes from a to b */
export function ease(t: number, a = 0, b = 1): number {
  const k = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return k * k * (3 - 2 * k);
}

/** a repeatable random sequence, so a figure draws the same noise on every frame */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}
