/**
 * the reasons behind the network pages, each computed rather than stated: why
 * the unit has to be smooth, what a network can draw, why a badly wrong start
 * learns slowly, and why the first layer learns last.
 */

import { ACTS, backward, make, predict, type Batch, type Grad, type Net, type Vec } from "./net.ts";

// ------------------------------------------------------------- a small change

export type Nudged = {
  /** the smooth unit's answer for one dot after each nudge */
  smooth: number[];
  /** the hard-threshold unit's answer for the same dot */
  hard: number[];
  smoothWrong: number[];
  hardWrong: number[];
  /** the nudge at which the hard unit's answer first changed, or -1 */
  flipAt: number;
};

/**
 * the same three numbers drive a sigmoid unit and a perceptron. the weight on x
 * is moved by a fixed amount, again and again, and both answers are recorded.
 * the smooth one moves a little every time; the hard one does nothing and then
 * jumps, which is why no descent can be run on it.
 */
export function nudge(w: Vec, b: number, x: Vec, data: Batch, size: number, steps: number): Nudged {
  const smooth: number[] = [];
  const hard: number[] = [];
  const smoothWrong: number[] = [];
  const hardWrong: number[] = [];
  let flipAt = -1;
  for (let k = 0; k <= steps; k++) {
    const w1 = w[0] + k * size;
    const zOf = (p: Vec) => w1 * p[0] + w[1] * p[1] + b;
    const z = zOf(x);
    smooth.push(ACTS.sigmoid.f(z));
    hard.push(z > 0 ? 1 : 0);
    if (flipAt < 0 && k > 0 && hard[k] !== hard[0]) flipAt = k;
    let sw = 0;
    let hw = 0;
    for (let n = 0; n < data.X.length; n++) {
      const zn = zOf(data.X[n]);
      if ((ACTS.sigmoid.f(zn) > 0.5 ? 1 : 0) !== data.Y[n][0]) sw += 1;
      if ((zn > 0 ? 1 : 0) !== data.Y[n][0]) hw += 1;
    }
    smoothWrong.push(sw);
    hardWrong.push(hw);
  }
  return { smooth, hard, smoothWrong, hardWrong, flipAt };
}

// ------------------------------------------------------------- any curve at all

export type Curve = "bump" | "wave" | "dip" | "saw";

export const CURVES: Record<Curve, { label: string; f: (x: number) => number }> = {
  bump: { label: "A bump", f: (x) => Math.exp(-(((x - 0.5) / 0.12) ** 2)) },
  wave: { label: "A wave", f: (x) => 0.5 + 0.4 * Math.sin(3 * Math.PI * x) },
  dip: { label: "A ramp with a dip", f: (x) => x - 0.6 * Math.exp(-(((x - 0.7) / 0.08) ** 2)) },
  saw: { label: "A saw", f: (x) => (x * 3) % 1 },
};

/** where the k-th of n steps sits: strictly inside the interval, evenly spaced. */
export const stepAt = (k: number, n: number) => (k + 1) / (n + 1);

/**
 * a real network with one input, n hidden sigmoid units and a linear output,
 * whose weights are set so that each hidden unit is one step of a staircase
 * that follows the target. the output weight of a unit is the rise of its
 * step; units past `upTo` are switched off so the staircase can be watched
 * being built one unit at a time.
 */
export function staircase(f: (x: number) => number, n: number, steep: number, upTo = n): Net {
  const net = make([1, n, 1], "sigmoid", "linear", "zeros");
  const mid = (j: number) => (j + 0.5) / (n + 1);
  net.b[1][0] = f(mid(0));
  for (let k = 0; k < n; k++) {
    net.W[0][k][0] = steep;
    net.b[0][k] = -steep * stepAt(k, n);
    net.W[1][0][k] = k < upTo ? f(mid(k + 1)) - f(mid(k)) : 0;
  }
  return net;
}

/** the largest and the average distance between the network's curve and the target. */
export function gap(net: Net, f: (x: number) => number, samples = 400) {
  let worst = 0;
  let at = 0;
  let total = 0;
  for (let i = 0; i <= samples; i++) {
    const x = i / samples;
    const d = Math.abs(predict(net, [x])[0] - f(x));
    total += d;
    if (d > worst) {
      worst = d;
      at = x;
    }
  }
  return { worst, at, mean: total / (samples + 1) };
}

// ---------------------------------------------------------- a badly wrong start

export type Slow = { mse: number[]; ce: number[]; mseSlope: number[]; ceSlope: number[] };

/** the total that gives a sigmoid unit the answer a. */
export const logit = (a: number) => Math.log(a / (1 - a));

/**
 * one sigmoid unit with input 1 and target 0, started sure and wrong, trained
 * by plain descent under the squared miss and under cross entropy. the answer
 * after every step is kept for both, and so is the size of the move each cost
 * asked for.
 */
export function slowdown(z0: number, rate: number, steps: number): Slow {
  const x = 1;
  const y = 0;
  const run = (kind: "mse" | "ce") => {
    let w = z0 / 2;
    let b = z0 / 2;
    const out: number[] = [];
    const slope: number[] = [];
    for (let k = 0; k <= steps; k++) {
      const z = w * x + b;
      const a = ACTS.sigmoid.f(z);
      out.push(a);
      const g = kind === "mse" ? (a - y) * ACTS.sigmoid.d(z) : a - y;
      slope.push(g);
      w -= rate * g * x;
      b -= rate * g;
    }
    return { out, slope };
  };
  const m = run("mse");
  const c = run("ce");
  return { mse: m.out, ce: c.out, mseSlope: m.slope, ceSlope: c.slope };
}

/** the first step at which the answer is within `near` of the target, or -1. */
export function stepsTo(trace: number[], target: number, near: number) {
  for (let k = 0; k < trace.length; k++) if (Math.abs(trace[k] - target) <= near) return k;
  return -1;
}

// --------------------------------------------------- the first layer learns last

/** the typical size of the slope on each layer's weights: the blame that reached it. */
export function layerNorms(grad: Grad): number[] {
  return grad.dW.map((m) => {
    let s = 0;
    let n = 0;
    for (const row of m) for (const v of row) {
      s += v * v;
      n += 1;
    }
    return Math.sqrt(s / Math.max(1, n));
  });
}

/** how much smaller the blame reaching the first layer is than the blame at the last. */
export function fade(net: Net, data: Batch) {
  const norms = layerNorms(backward(net, data, "mse").grad);
  const first = norms[0];
  const last = norms[norms.length - 1];
  return { norms, ratio: last / Math.max(first, 1e-300) };
}
