/**
 * the perceptron, and the small datasets every page in topic 3 is trained on.
 */

import { rng, type Batch, type Vec } from "./net.ts";

export type SetKind = "split" | "xor" | "rings" | "spiral";

export const SETS: Record<SetKind, { label: string; note: string }> = {
  split: { label: "Two clouds", note: "Linearly separable: one straight line divides them" },
  xor: { label: "Exclusive or", note: "Four points that no straight line divides" },
  rings: { label: "A ring inside a ring", note: "Separable, but not by anything straight" },
  spiral: { label: "Two spirals", note: "The hardest of the four for a small network" },
};

export function dataset(kind: SetKind, count: number, seed = 1): Batch {
  const next = rng(seed);
  const X: Vec[] = [];
  const Y: Vec[] = [];
  if (kind === "xor") {
    for (const [a, b, y] of [
      [0, 0, 0],
      [0, 1, 1],
      [1, 0, 1],
      [1, 1, 0],
    ]) {
      X.push([a, b]);
      Y.push([y]);
    }
    return { X, Y };
  }
  for (let i = 0; i < count; i++) {
    if (kind === "split") {
      const side = i % 2;
      X.push([next() * 1.6 - 0.8 + (side ? 0.9 : -0.9), next() * 1.6 - 0.8 + (side ? 0.6 : -0.6)]);
      Y.push([side]);
    } else if (kind === "rings") {
      const side = i % 2;
      const r = side ? 1.5 + next() * 0.35 : next() * 0.55;
      const t = next() * Math.PI * 2;
      X.push([r * Math.cos(t), r * Math.sin(t)]);
      Y.push([side]);
    } else {
      const side = i % 2;
      const t = (i / count) * 3.2 * Math.PI + (side ? Math.PI : 0);
      const r = 0.18 + (i / count) * 1.5;
      X.push([r * Math.cos(t) + (next() - 0.5) * 0.16, r * Math.sin(t) + (next() - 0.5) * 0.16]);
      Y.push([side]);
    }
  }
  return { X, Y };
}

export type Perceptron = {
  w: Vec;
  b: number;
  updates: number;
  passes: number;
  converged: boolean;
  wrong: number;
  /** the line after each update, for watching it turn */
  history: { w: Vec; b: number; at: number }[];
};

/**
 * Rosenblatt's rule: for every example the unit gets wrong, move the weights a
 * fixed amount towards getting that one right, and repeat until nothing is
 * wrong.
 *
 * on linearly separable data this stops after a finite number of updates, which
 * is the convergence theorem. on exclusive or it never stops, which is the
 * limitation the 1969 critique made formal.
 */
export function perceptron(data: Batch, mostPasses = 2000, rate = 0.1, keep = 240): Perceptron {
  const wide = data.X[0].length;
  const w = new Array(wide).fill(0);
  let b = 0;
  const history: { w: Vec; b: number; at: number }[] = [];
  let updates = 0;
  const fire = (x: Vec) => {
    let sum = b;
    for (let i = 0; i < wide; i++) sum += w[i] * x[i];
    return sum > 0 ? 1 : 0;
  };
  for (let pass = 0; pass < mostPasses; pass++) {
    let bad = 0;
    for (let n = 0; n < data.X.length; n++) {
      const want = data.Y[n][0];
      const got = fire(data.X[n]);
      if (got === want) continue;
      bad += 1;
      updates += 1;
      const push = rate * (want - got);
      for (let i = 0; i < wide; i++) w[i] += push * data.X[n][i];
      b += push;
      if (history.length < keep) history.push({ w: [...w], b, at: n });
    }
    if (bad === 0) {
      return { w, b, updates, passes: pass + 1, converged: true, wrong: 0, history };
    }
  }
  let wrong = 0;
  for (let n = 0; n < data.X.length; n++) if (fire(data.X[n]) !== data.Y[n][0]) wrong += 1;
  return { w, b, updates, passes: mostPasses, converged: false, wrong, history };
}
