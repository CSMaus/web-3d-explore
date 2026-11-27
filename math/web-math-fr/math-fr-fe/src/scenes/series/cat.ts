import { resample, type C } from "@/systems/series";

export const CAT_HALF: C[] = [[0, 0.5], [0.2, 0.56], [0.4, 0.6], [0.56, 0.86], [0.7, 1.02], [0.76, 0.98], [0.8, 0.7], [0.86, 0.42], [0.96, 0.1], [0.94, -0.25], [0.78, -0.55], [0.52, -0.76], [0.25, -0.86], [0, -0.88]];

const CAT_SCALE = 0.95;
const CAT_DROP = 0.07;
const CAT_PASSES = 2;
const CAT_POINTS = 256;

export function chaikin(path: C[], times: number): C[] {
  let out = path;
  for (let pass = 0; pass < times; pass += 1) {
    const next: C[] = [];
    for (let i = 0; i < out.length; i += 1) {
      const a = out[i];
      const b = out[(i + 1) % out.length];
      next.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
      next.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    out = next;
  }
  return out;
}

export function catOutline(): C[] {
  const left: C[] = CAT_HALF.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  const whole: C[] = [...CAT_HALF, ...left].map(([x, y]) => [x * CAT_SCALE, y * CAT_SCALE - CAT_DROP]);
  return resample(chaikin(whole, CAT_PASSES), CAT_POINTS);
}
