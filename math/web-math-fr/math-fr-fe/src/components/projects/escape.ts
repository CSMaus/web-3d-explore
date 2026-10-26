import type { Pen } from "@/components/Plot";
import { ink } from "./paint";

/**
 * escape-time pictures for the project figures, computed on the processor at a low resolution
 * and drawn scaled up: a Julia set for a constant c, or the Mandelbrot set. a picture is kept
 * until what it shows changes, so a still figure costs nothing per frame.
 */

export type View = { cx: number; cy: number; span: number };

function rgb(colour: string): [number, number, number] {
  const c = ink(colour);
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const fn = c.match(/^rgba?\(([^)]+)\)$/i);
  if (fn) {
    const [r, g, b] = fn[1].split(/[ ,/]+/).map(Number);
    return [r, g, b];
  }
  return [128, 128, 128];
}

/** the smooth escape count of one point, or -1 for a point that does not escape */
function escape(zx: number, zy: number, cx: number, cy: number, most: number): number {
  for (let n = 0; n < most; n++) {
    const x2 = zx * zx;
    const y2 = zy * zy;
    if (x2 + y2 > 64) return n + 1 - Math.log2(Math.log2(x2 + y2) / 2);
    zy = 2 * zx * zy + cy;
    zx = x2 - y2 + cx;
  }
  return -1;
}

type Made = { key: string; canvas: HTMLCanvasElement };
const made = new Map<string, Made>();

/**
 * a picture of w by h samples. `julia` holds the constant for a Julia set; without it the
 * picture is the Mandelbrot set. colours run from the ground through `mid` to `hot`, and a point
 * that never escapes takes `inside`.
 */
export function picture(
  slot: string,
  w: number,
  h: number,
  view: View,
  colours: { ground: string; mid: string; hot: string; inside: string },
  julia?: [number, number],
  most = 80,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const key = [w, h, view.cx, view.cy, view.span, julia?.[0], julia?.[1], most, colours.ground, colours.mid, colours.hot, colours.inside, document.documentElement.dataset.mode].join("|");
  const old = made.get(slot);
  if (old && old.key === key) return old.canvas;
  const canvas = old?.canvas ?? document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const image = ctx.createImageData(w, h);
  const [g, m, k, i] = [rgb(colours.ground), rgb(colours.mid), rgb(colours.hot), rgb(colours.inside)];
  const step = view.span / w;
  const top = view.cy + (h / 2) * step;
  const left = view.cx - (w / 2) * step;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const x = left + px * step;
      const y = top - py * step;
      const n = julia ? escape(x, y, julia[0], julia[1], most) : escape(0, 0, x, y, most);
      const at = 4 * (py * w + px);
      let c = i;
      if (n >= 0) {
        // the share of the steps taken: quick escapes stay near the ground, the edge lights up
        const s = Math.min(1, (n / most) * 1.8);
        c = s < 0.5 ? lerp(g, m, s * 2) : lerp(m, k, (s - 0.5) * 2);
      }
      image.data[at] = c[0];
      image.data[at + 1] = c[1];
      image.data[at + 2] = c[2];
      image.data[at + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  made.set(slot, { key, canvas });
  return canvas;
}

function lerp(a: number[], b: number[], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** a picture laid into a box of the figure, in world units, with smoothing for a soft scale-up */
export function lay(pen: Pen, image: HTMLCanvasElement | null, x: number, y: number, w: number, h: number, smooth = true) {
  if (!image) return;
  const ctx = pen.ctx;
  ctx.imageSmoothingEnabled = smooth;
  ctx.drawImage(image, pen.px(x), pen.py(y + h), pen.px(x + w) - pen.px(x), pen.py(y) - pen.py(y + h));
}

/** whether c is in the Mandelbrot set, to the number of steps given */
export function inside(cx: number, cy: number, most = 300): boolean {
  return escape(0, 0, cx, cy, most) < 0;
}
