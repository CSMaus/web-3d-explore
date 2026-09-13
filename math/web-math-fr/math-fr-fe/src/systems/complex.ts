/**
 * complex numbers as arrows in a plane, written out so a reader with no prior
 * idea of them can watch each operation happen: adding lays arrows tip to
 * tail, multiplying turns and stretches, squaring doubles the turn, and the
 * exponential of a turn goes round a circle.
 */

export type C = [number, number];

export const add = (a: C, b: C): C => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: C, b: C): C => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
export const scale = (a: C, k: number): C => [a[0] * k, a[1] * k];
/** the length of the arrow */
export const abs = (a: C) => Math.hypot(a[0], a[1]);
/** the angle of the arrow, in turns of the full circle rather than radians, so a quarter turn reads as 0.25 */
export const turns = (a: C) => {
  const t = Math.atan2(a[1], a[0]) / (2 * Math.PI);
  return t < 0 ? t + 1 : t;
};
/** an arrow from a length and an angle in turns */
export const fromPolar = (length: number, t: number): C => [length * Math.cos(2 * Math.PI * t), length * Math.sin(2 * Math.PI * t)];
export const square = (a: C): C => mul(a, a);
/** e to the power of i times an angle: the point on the unit circle at that angle, in radians */
export const spin = (theta: number): C => [Math.cos(theta), Math.sin(theta)];

/** the orbit of z -> z^2 + c from a start, stopping once it has clearly left */
export function orbit(start: C, c: C, most: number, escape = 4): { path: C[]; left: number | null } {
  const path: C[] = [start];
  let z = start;
  for (let i = 0; i < most; i++) {
    z = add(square(z), c);
    path.push(z);
    if (abs(z) > escape) return { path, left: i + 1 };
  }
  return { path, left: null };
}

/** the n numbers whose nth power is one, equally spaced round the circle */
export function rootsOfUnity(n: number): C[] {
  return Array.from({ length: n }, (_, k) => fromPolar(1, k / n));
}

/** a readable form: 2 + 3i, -1.5i, 4 */
export function show(a: C, digits = 2) {
  const re = Number(a[0].toFixed(digits));
  const im = Number(a[1].toFixed(digits));
  const r = Math.abs(re) < 1e-9 ? 0 : re;
  const m = Math.abs(im) < 1e-9 ? 0 : im;
  if (m === 0) return `${r}`;
  const imPart = Math.abs(m) === 1 ? "i" : `${Math.abs(m)}i`;
  if (r === 0) return `${m < 0 ? "-" : ""}${imPart}`;
  return `${r} ${m < 0 ? "-" : "+"} ${imPart}`;
}
