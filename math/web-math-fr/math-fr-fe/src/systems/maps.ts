/**
 * discrete-time systems: one number to the next, over and over.
 *
 * a map needs one dimension to be chaotic where a flow needs three, so
 * everything here runs on a single line and every picture is cheap.
 */

export type Map1 = (x: number) => number;
/** a family of maps, one per parameter value. */
export type Family = (r: number) => Map1;

export const logistic: Family = (r) => (x) => r * x * (1 - x);
export const logisticSlope = (r: number) => (x: number) => r * (1 - 2 * x);

/** the same cascade in a different family, used to check universality. */
export const sine: Family = (r) => (x) => r * Math.sin(Math.PI * x);
export const sineSlope = (r: number) => (x: number) => r * Math.PI * Math.cos(Math.PI * x);

export const tent: Family = (r) => (x) => r * (1 - Math.abs(2 * x - 1));

/**
 * where an orbit is started when the orbit itself is what is being measured.
 *
 * not the critical point. the critical point is the right seed for locating a
 * superstable cycle, because being on the cycle is what superstable means, but
 * it is the wrong seed for sampling an attractor: at r = 4 the logistic map
 * sends 0.5 to 1 and 1 to 0, so an orbit from the critical point sits on the
 * unstable fixed point for ever and reports a period of one and an exponent of
 * log 4 where the answer is log 2. such seeds are a set of measure zero and any
 * ordinary starting value avoids them.
 */
export const SEED = 0.1234567;

/** n steps of the map, after throwing away the approach. */
export function orbit(m: Map1, x0: number, count: number, discard = 0): Float64Array {
  let x = x0;
  for (let i = 0; i < discard; i++) x = m(x);
  const out = new Float64Array(count);
  for (let i = 0; i < count; i++) {
    out[i] = x;
    x = m(x);
  }
  return out;
}

/** the map composed with itself k times. */
export function compose(m: Map1, k: number): Map1 {
  return (x) => {
    let v = x;
    for (let i = 0; i < k; i++) v = m(v);
    return v;
  };
}

export type Rung = { x0: number; y0: number; x1: number; y1: number };

/**
 * the cobweb: from the current value go up to the curve, then across to the
 * diagonal, which is the next value. iteration as a picture.
 */
export function cobweb(m: Map1, x0: number, steps: number): Rung[] {
  const out: Rung[] = [];
  let x = x0;
  for (let i = 0; i < steps; i++) {
    const y = m(x);
    out.push({ x0: x, y0: x === x0 && i === 0 ? 0 : x, x1: x, y1: y });
    out.push({ x0: x, y0: y, x1: y, y1: y });
    x = y;
  }
  return out;
}

/**
 * the period of an orbit, or 0 if it does not repeat within the window.
 * measured against the tolerance a picture can resolve rather than against
 * machine precision, since at the accumulation point the period is unbounded.
 */
export function period(values: Float64Array, tol = 1e-5, most = 64): number {
  const n = values.length;
  for (let p = 1; p <= most; p++) {
    let same = true;
    for (let i = 0; i + p < n && same; i++) {
      if (Math.abs(values[i] - values[i + p]) > tol) same = false;
    }
    if (same) return p;
  }
  return 0;
}

export type Column = { r: number; values: Float64Array };

/** the bifurcation diagram, built rather than drawn: one orbit a parameter. */
export function bifurcation(
  family: Family,
  from: number,
  to: number,
  columns: number,
  keep = 160,
  discard = 900,
  x0 = SEED,
): Column[] {
  const out: Column[] = [];
  for (let c = 0; c < columns; c++) {
    const r = from + ((to - from) * c) / Math.max(1, columns - 1);
    out.push({ r, values: orbit(family(r), x0, keep, discard) });
  }
  return out;
}

/**
 * the lyapunov exponent of a map: the average of the log of the slope along the
 * orbit. positive is chaos, zero at every bifurcation, negative on a cycle.
 */
export function exponent(
  family: Family,
  slopes: (r: number) => Map1,
  r: number,
  count = 6000,
  discard = 2000,
  x0 = SEED,
): number {
  const m = family(r);
  const g = slopes(r);
  let x = x0;
  for (let i = 0; i < discard; i++) x = m(x);
  let total = 0;
  let used = 0;
  for (let i = 0; i < count; i++) {
    const s = Math.abs(g(x));
    if (s > 0) {
      total += Math.log(s);
      used += 1;
    }
    x = m(x);
    if (!Number.isFinite(x)) break;
  }
  return used ? total / used : 0;
}

/**
 * the first parameter at or above `from` at which the cycle of the given period
 * is superstable, that is the value at which the critical point is itself on the
 * cycle.
 *
 * these are easier to locate than the bifurcation points and they carry the same
 * constant. the condition is that the critical point returns to itself after
 * that many steps, so it is a sign change to bracket and bisect.
 *
 * note what "that many steps" does not exclude: a point of period one returns
 * after one step and therefore also after two, four and every other power, so
 * asking for period four over the whole range returns the period-one answer. a
 * caller walking the cascade has to raise `from` past each point it has already
 * found, which is what `cascade` below does.
 */
export function superstable(
  family: Family,
  cycle: number,
  from: number,
  to: number,
  critical = 0.5,
  rounds = 80,
): number | null {
  const miss = (r: number) => compose(family(r), cycle)(critical) - critical;
  let lo = from;
  let hi = to;
  let a = miss(lo);
  const scan = 4000;
  // walk the interval for the first sign change, then bisect it
  for (let i = 1; i <= scan; i++) {
    const r = from + ((to - from) * i) / scan;
    const b = miss(r);
    if (Number.isFinite(a) && Number.isFinite(b) && a * b < 0) {
      lo = from + ((to - from) * (i - 1)) / scan;
      hi = r;
      break;
    }
    a = b;
    if (i === scan) return null;
  }
  for (let i = 0; i < rounds; i++) {
    const mid = (lo + hi) / 2;
    if (miss(lo) * miss(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export type Cascade = {
  /** the parameter at which each cycle of period 2^n is superstable */
  points: number[];
  /** the gaps between them */
  gaps: number[];
  /** each gap divided by the next: the ratio Feigenbaum's delta is the limit of */
  ratios: number[];
  delta: number;
};

/**
 * the period-doubling cascade, located and measured rather than quoted.
 * the ratio of successive gaps approaches Feigenbaum's delta, 4.669.
 */
export function cascade(family: Family, upTo = 7, from = 1.9, to = 4.0, critical = 0.5): Cascade {
  const points: number[] = [];
  let lo = from;
  for (let n = 0; n <= upTo; n++) {
    const hit = superstable(family, Math.pow(2, n), lo, to, critical);
    if (hit === null) break;
    points.push(hit);
    lo = hit + 1e-12;
  }
  const gaps = points.slice(1).map((p, i) => p - points[i]);
  const ratios = gaps.slice(1).map((g, i) => gaps[i] / g);
  return { points, gaps, ratios, delta: ratios.length ? ratios[ratios.length - 1] : 0 };
}
