/**
 * the calculus a first network rests on, as things that move: a car on a road
 * for the derivative, distance adding up for the integral, money growing for
 * the exponent, and a hill for the gradient. everything is computed
 * numerically from a plain function of time, so the reader can see that the
 * derivative is a ratio of two small changes and nothing more mysterious.
 */

export type Motion = {
  label: string;
  /** position along the road, in metres, at time t in seconds */
  at: (t: number) => number;
  /** the exact derivative, for scoring the numerical one */
  speed: (t: number) => number;
  what: string;
};

export const MOTIONS: Record<string, Motion> = {
  steady: {
    label: "Steady",
    at: (t) => 4 * t,
    speed: () => 4,
    what: "The car covers 4 metres every second. Its distance from the start grows evenly, and its speed stays at 4 m/s",
  },
  faster: {
    label: "Speeding up",
    at: (t) => 0.4 * t * t,
    speed: (t) => 0.8 * t,
    what: "The car starts at rest and covers more ground each second than the second before. Its speed grows evenly, by 0.8 m/s every second",
  },
  braking: {
    label: "Braking",
    at: (t) => 10 * t - 0.5 * t * t,
    speed: (t) => 10 - t,
    what: "The car starts at 10 m/s and loses 1 m/s every second. At 10 seconds its speed is zero, and after that it rolls backwards",
  },
  back: {
    label: "There and back",
    at: (t) => 12 * Math.sin(t * 0.5),
    speed: (t) => 6 * Math.cos(t * 0.5),
    what: "The car drives 12 m forward, turns round, drives back past the start to 12 m behind it, and turns round again. Its speed is zero at the two moments it turns, and below zero while it drives backwards",
  },
  bumpy: {
    label: "Stop and go",
    at: (t) => 3 * t + 2 * Math.sin(1.4 * t),
    speed: (t) => 3 + 2.8 * Math.cos(1.4 * t),
    what: "Traffic: the car always moves forward, but its speed swings between 0.2 and 5.8 m/s",
  },
};

/**
 * the derivative from two nearby positions: how far it moved divided by how
 * long that took. this is the definition, computed. the gap h is what the
 * reader pinches; as it shrinks the ratio settles on the exact speed.
 */
export function slopeBetween(f: (t: number) => number, t: number, h: number) {
  return (f(t + h / 2) - f(t - h / 2)) / h;
}

/** the rate of the rate: the derivative applied to the derivative. */
export function secondSlope(f: (t: number) => number, t: number, h: number) {
  return (slopeBetween(f, t + h / 2, h) - slopeBetween(f, t - h / 2, h)) / h;
}

/** samples of any function of time over a range. */
export function trace(f: (t: number) => number, t0: number, t1: number, n = 240): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n;
    out.push([t, f(t)]);
  }
  return out;
}

// -------------------------------------------------------------------- adding up

export type Strip = { t0: number; t1: number; height: number; area: number };

/**
 * the integral as rectangles: chop the time into slices, take the speed at the
 * middle of each, and add up speed times duration. that is distance. thinner
 * slices approach the exact answer, and the accumulated total is a function
 * whose derivative is the speed we started from.
 */
export function strips(speed: (t: number) => number, t0: number, t1: number, count: number): Strip[] {
  const out: Strip[] = [];
  const w = (t1 - t0) / count;
  for (let i = 0; i < count; i++) {
    const a = t0 + i * w;
    const h = speed(a + w / 2);
    out.push({ t0: a, t1: a + w, height: h, area: h * w });
  }
  return out;
}

export function accumulate(list: Strip[]): number[] {
  const out: number[] = [0];
  for (const s of list) out.push(out[out.length - 1] + s.area);
  return out;
}

// ---------------------------------------------------------------------- growth

/**
 * the quantity whose rate of change is itself, times a constant. money at
 * interest, a population with room to grow. the defining property is that
 * slope divided by value is the same everywhere on the curve.
 */
export function grow(start: number, rate: number, t: number) {
  return start * Math.exp(rate * t);
}

/** how long until it reaches a target: the logarithm, read as a question about time. */
export function timeToReach(start: number, rate: number, target: number) {
  if (rate === 0 || target <= 0 || start <= 0) return Infinity;
  return Math.log(target / start) / rate;
}

// ------------------------------------------------------------------------ hills

export type Hill = {
  label: string;
  height: (x: number, y: number) => number;
  /** the exact partial derivatives, for scoring */
  slopes: (x: number, y: number) => [number, number];
  box: { x0: number; x1: number; y0: number; y1: number };
  what: string;
};

export const HILLS: Record<string, Hill> = {
  bowl: {
    label: "A round bowl",
    height: (x, y) => 0.5 * (x * x + y * y),
    slopes: (x, y) => [x, y],
    box: { x0: -3, x1: 3, y0: -3, y1: 3 },
    what: "The lowest point is the middle. From any point, uphill is straight away from the middle, and the ground is steeper the further out the ball is",
  },
  valley: {
    label: "A narrow valley",
    height: (x, y) => 0.5 * (x * x + 12 * y * y),
    slopes: (x, y) => [x, 12 * y],
    box: { x0: -3, x1: 3, y0: -1.2, y1: 1.2 },
    what: "Steep across the valley and gentle along it. Uphill points mostly across the valley, even when the lowest point is far away along it",
  },
  saddle: {
    label: "A saddle",
    height: (x, y) => 0.5 * x * x - 0.4 * y * y,
    slopes: (x, y) => [x, -0.8 * y],
    box: { x0: -3, x1: 3, y0: -3, y1: 3 },
    what: "Shaped like a horse's saddle: the ground rises in one direction and falls in the other. At the very middle the ground is flat, but it is not the lowest point",
  },
  hills: {
    label: "Two hills",
    height: (x, y) => 2 * Math.exp(-((x - 1) ** 2 + (y - 0.8) ** 2)) + 1.4 * Math.exp(-((x + 1.2) ** 2 + (y + 1) ** 2)),
    slopes: (x, y) => {
      const a = 2 * Math.exp(-((x - 1) ** 2 + (y - 0.8) ** 2));
      const b = 1.4 * Math.exp(-((x + 1.2) ** 2 + (y + 1) ** 2));
      return [-2 * (x - 1) * a - 2 * (x + 1.2) * b, -2 * (y - 0.8) * a - 2 * (y + 1) * b];
    },
    box: { x0: -3, x1: 3, y0: -3, y1: 3 },
    what: "Two hilltops on flat ground. Uphill points towards the nearer top, so the ball rolls away from it, and the starting point decides where it ends up",
  },
};

/**
 * the two partial slopes by finite difference: nudge x alone, nudge y alone.
 * the gradient is the pair of them, and it points the steepest way uphill.
 */
export function gradientAt(hill: Hill, x: number, y: number, h = 1e-4): [number, number] {
  return [
    (hill.height(x + h, y) - hill.height(x - h, y)) / (2 * h),
    (hill.height(x, y + h) - hill.height(x, y - h)) / (2 * h),
  ];
}

/** a ball rolling: step against the gradient, again and again. */
export function roll(hill: Hill, from: [number, number], rate: number, steps: number): [number, number][] {
  const path: [number, number][] = [from];
  let [x, y] = from;
  for (let i = 0; i < steps; i++) {
    const [gx, gy] = gradientAt(hill, x, y);
    x -= rate * gx;
    y -= rate * gy;
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.hypot(x, y) > 50) break;
    path.push([x, y]);
  }
  return path;
}
