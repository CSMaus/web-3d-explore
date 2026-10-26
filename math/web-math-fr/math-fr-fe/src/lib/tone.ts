/**
 * a plot's colours are written for a dark ground. on a light page they are read again before
 * they are drawn, against the page's own ground: a grey keeps its distance from the ground but
 * on the other side of it, so a faint dark grid becomes a faint light one and white ink becomes
 * dark; a light, bright colour keeps its hue and goes deeper and fuller, so it holds on a light
 * ground. lines are drawn heavier there. a dark page draws every colour as written.
 */
export function lightPage(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.mode === "light";
}

function rgbaOf(c: string): [number, number, number, number] | null {
  const hex = c.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((x) => x + x).join("") : hex[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
  }
  const fn = c.trim().match(/^rgba?\(([^)]+)\)$/i);
  if (!fn) return null;
  const n = fn[1].split(/[ ,/]+/).filter(Boolean).map(Number);
  return n.length >= 3 && n.slice(0, 3).every(Number.isFinite) ? [n[0], n[1], n[2], Number.isFinite(n[3]) ? n[3] : 1] : null;
}

function hsl([r, g, b]: number[]): [number, number, number] {
  const [x, y, z] = [r / 255, g / 255, b / 255];
  const max = Math.max(x, y, z);
  const min = Math.min(x, y, z);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === x ? (y - z) / d + (y < z ? 6 : 0) : max === y ? (z - x) / d + 2 : (x - y) / d + 4;
  return [h / 6, s, l];
}

function rgbOf(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l].map((v) => Math.round(v * 255)) as [number, number, number];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const part = (t: number) => {
    const u = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
    return u < 1 / 6 ? p + (q - p) * 6 * u : u < 1 / 2 ? q : u < 2 / 3 ? p + (q - p) * (2 / 3 - u) * 6 : p;
  };
  return [part(h + 1 / 3), part(h), part(h - 1 / 3)].map((v) => Math.round(v * 255)) as [number, number, number];
}

/** a colour written for a dark ground, as it should be drawn on the light page whose ground is given */
export function forLight(colour: string, ground: string): string {
  const c = rgbaOf(colour);
  const g = rgbaOf(ground);
  if (!c || !g) return colour;
  const [h, s, l] = hsl(c);
  const gl = hsl(g)[2];
  let [S, L] = [s, l];
  if (s < 0.18) L = Math.min(0.97, Math.max(0.06, gl - (l - 0.07) * 0.95));
  else if (l > 0.42) [S, L] = [Math.max(s, 0.6), 0.36 + (l - 0.42) * 0.15];
  const [r, gg, b] = rgbOf(h, S, L);
  return c[3] < 1 ? `rgba(${r},${gg},${b},${c[3]})` : `rgb(${r},${gg},${b})`;
}
