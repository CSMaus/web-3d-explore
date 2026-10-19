/**
 * an insurer's surplus, simulated year by year: capital in, premiums in, claims
 * out, and ruin when the surplus goes below zero. three worlds for the claims:
 * the classical one (independent years, light-tailed sizes), heavy-tailed
 * sizes, and years that cluster through long memory. a reinsurance layer can
 * be bought against the large claims. everything the piece states about these
 * worlds is measured here rather than asserted.
 */

import { rng } from "./net.ts";

export type Sizes = "exponential" | "pareto";

export type World = {
  /** expected claims a year */
  rate: number;
  /** mean claim size, in the same money as capital */
  mean: number;
  sizes: Sizes;
  /** the Pareto tail index; below 2 the variance is infinite, below 1 the mean is */
  alpha: number;
  /** the Hurst exponent of the yearly claim counts; 0.5 is independence */
  hurst: number;
  /** the spread of the yearly intensity around its mean, in log units, when hurst is above 0.5 */
  clustering: number;
};

export type Cover = {
  /** the insurer pays each claim up to this and the reinsurer the rest; Infinity buys nothing */
  retention: number;
  /** what the reinsurer charges over the expected ceded amount */
  loading: number;
};

export type Terms = {
  capital: number;
  /** premium over the expected yearly claims, as a fraction */
  loading: number;
  years: number;
};

/** the Pareto scale that gives a mean of m at tail index alpha above one. */
export function paretoScale(mean: number, alpha: number) {
  return alpha > 1 ? (mean * (alpha - 1)) / alpha : mean;
}

function paretoDraw(scale: number, alpha: number, u: number) {
  return scale * Math.pow(1 - u, -1 / alpha);
}

function exponentialDraw(mean: number, u: number) {
  return -mean * Math.log(1 - u);
}

function gaussian(next: () => number) {
  const u = Math.max(next(), 1e-12);
  const v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function poissonDraw(lambda: number, next: () => number) {
  if (lambda > 60) return Math.max(0, Math.round(lambda + Math.sqrt(lambda) * gaussian(next)));
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k += 1;
    p *= next();
  } while (p > L);
  return k - 1;
}

/**
 * fractional Gaussian noise by Hosking's method: exact, one value at a time,
 * quadratic in the length, which is nothing for a few hundred years. at a
 * Hurst exponent of one half it is plain independent noise.
 */
export function fractionalNoise(n: number, hurst: number, next: () => number): number[] {
  const H2 = 2 * hurst;
  const gamma = (k: number) => (k === 0 ? 1 : 0.5 * (Math.pow(k + 1, H2) - 2 * Math.pow(k, H2) + Math.pow(k - 1, H2)));
  const out: number[] = [];
  let phi: number[] = [];
  let v = 1;
  out.push(gaussian(next));
  for (let t = 1; t < n; t++) {
    let acc = gamma(t);
    for (let j = 0; j < phi.length; j++) acc -= phi[j] * gamma(t - 1 - j);
    const theta = acc / v;
    const nextPhi: number[] = [];
    for (let j = 0; j < phi.length; j++) nextPhi.push(phi[j] - theta * phi[phi.length - 1 - j]);
    nextPhi.push(theta);
    phi = nextPhi;
    v *= 1 - theta * theta;
    let mean = 0;
    for (let j = 0; j < phi.length; j++) mean += phi[j] * out[t - 1 - j];
    out.push(mean + Math.sqrt(Math.max(v, 1e-12)) * gaussian(next));
  }
  return out;
}

/** the expected amount above the retention on one claim, under each size law. */
export function expectedCeded(world: World, retention: number) {
  if (!Number.isFinite(retention)) return 0;
  if (world.sizes === "exponential") return world.mean * Math.exp(-retention / world.mean);
  const scale = paretoScale(world.mean, world.alpha);
  if (retention <= scale) return world.mean - retention;
  if (world.alpha <= 1) return Infinity;
  return (Math.pow(scale, world.alpha) * Math.pow(retention, 1 - world.alpha)) / (world.alpha - 1);
}

export type Year = { claims: number; total: number; kept: number; surplus: number };
export type Path = { years: Year[]; ruined: boolean; ruinYear: number; largest: number; paid: number };

/**
 * one insurer's history. premiums arrive steadily through the year and claims
 * at random moments in it, so ruin is checked after every claim rather than at
 * the year's end: a surplus that dips below zero in June and recovers by
 * December is a ruin, as it is in the classical model.
 */
export function runOne(world: World, terms: Terms, cover: Cover, next: () => number): Path {
  const expected = world.rate * world.mean;
  const premium = expected * (1 + terms.loading);
  const ceded = expectedCeded(world, cover.retention);
  const reinsurance = Number.isFinite(ceded) ? world.rate * ceded * (1 + cover.loading) : 0;
  const scale = paretoScale(world.mean, world.alpha);
  const noise = world.hurst > 0.5 && world.clustering > 0 ? fractionalNoise(terms.years, world.hurst, next) : null;
  let surplus = terms.capital;
  const years: Year[] = [];
  let ruined = false;
  let ruinYear = -1;
  let largest = 0;
  let paid = 0;
  const income = premium - reinsurance;
  for (let t = 0; t < terms.years; t++) {
    const intensity = noise ? world.rate * Math.exp(world.clustering * noise[t] - (world.clustering * world.clustering) / 2) : world.rate;
    const claims = poissonDraw(intensity, next);
    const moments: number[] = [];
    for (let i = 0; i < claims; i++) moments.push(next());
    moments.sort((a, b) => a - b);
    let total = 0;
    let kept = 0;
    let clock = 0;
    for (const moment of moments) {
      surplus += income * (moment - clock);
      clock = moment;
      const size = world.sizes === "pareto" ? paretoDraw(scale, world.alpha, next()) : exponentialDraw(world.mean, next());
      total += size;
      const mine = Math.min(size, cover.retention);
      kept += mine;
      paid += mine;
      if (mine > largest) largest = mine;
      surplus -= mine;
      if (surplus < 0 && !ruined) {
        ruined = true;
        ruinYear = t + 1;
      }
    }
    surplus += income * (1 - clock);
    years.push({ claims, total, kept, surplus });
  }
  return { years, ruined, ruinYear, largest, paid };
}

export type Trial = {
  ruinRate: number;
  /** the share of runs ruined in each year, cumulative */
  byYear: number[];
  /** the yearly kept totals of every run, for the histogram */
  totals: number[];
  /** the first few paths, for drawing */
  sample: Path[];
  largestClaimShare: number;
};

/** many insurers with the same terms, and how many were ruined. */
export function trial(world: World, terms: Terms, cover: Cover, runs: number, seed = 1, keep = 24): Trial {
  const next = rng(seed);
  let ruined = 0;
  const byYear = new Array(terms.years).fill(0);
  const totals: number[] = [];
  const sample: Path[] = [];
  let shares = 0;
  for (let r = 0; r < runs; r++) {
    const path = runOne(world, terms, cover, next);
    if (path.ruined) {
      ruined += 1;
      for (let t = path.ruinYear - 1; t < terms.years; t++) byYear[t] += 1;
    }
    for (const y of path.years) totals.push(y.kept);
    if (path.paid > 0) shares += path.largest / path.paid;
    if (sample.length < keep) sample.push(path);
  }
  return {
    ruinRate: ruined / runs,
    byYear: byYear.map((v) => v / runs),
    totals,
    sample,
    // the share of everything one insurer paid that went on its single largest claim, averaged
    largestClaimShare: shares / runs,
  };
}

/**
 * the classical answer for exponential claims and no reinsurance: the
 * probability of ever being ruined, from Lundberg and Cramer. the simulation is
 * checked against it over a long horizon.
 */
export function lundbergRuin(world: World, terms: Terms) {
  const theta = terms.loading;
  return (1 / (1 + theta)) * Math.exp((-theta * terms.capital) / ((1 + theta) * world.mean));
}
