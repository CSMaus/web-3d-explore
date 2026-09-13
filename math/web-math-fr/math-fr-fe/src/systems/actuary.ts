/**
 * the mathematics an actuary uses to set a price, in its two oldest pieces.
 *
 * credibility: a new customer's own record is short and noisy; the group they
 * belong to has a long one. the Bayesian answer is a weighted average of the
 * two, and the weight on the customer's own record, the credibility Z, is
 * n / (n + k): n the years of record, k the ratio of the noise in one
 * customer's outcomes to the spread between customers. with claims counted
 * as Poisson and rates spread as a gamma, the posterior is exactly this
 * average, which is the model Bailey wrote down in 1950 and Buhlmann made
 * general in 1967.
 *
 * tails: claim sizes with a Pareto tail are self-similar: the biggest tenth,
 * rescaled, is distributed like the whole. the tail index alpha plays the part
 * a dimension plays for a coastline. below two, the variance is infinite and
 * the average never settles, which Mandelbrot called the Noah effect.
 */
import { gaussian, rngFrom } from "./scaling";

export type Prior = { shape: number; rate: number };

/** the credibility weight on a record of n years when the group's k is as given. */
export const credibility = (n: number, k: number) => n / (n + k);

/** the posterior for a Poisson rate under a gamma prior after n years with x claims. */
export function posterior(prior: Prior, n: number, x: number): Prior {
  return { shape: prior.shape + x, rate: prior.rate + n };
}

export const meanOf = (g: Prior) => g.shape / g.rate;

/** Poisson draws with rate lambda, one a year. */
export function claimsOver(lambda: number, years: number, seed: number): number[] {
  const rng = rngFrom(seed);
  const out: number[] = [];
  for (let y = 0; y < years; y++) {
    // Knuth's method, fine for the small rates of a customer
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k += 1;
      p *= rng();
    } while (p > L);
    out.push(k - 1);
  }
  return out;
}

// ---------------------------------------------------------- the gamma function's tail

function logGamma(z: number): number {
  const g = 7;
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

/** the regularised lower incomplete gamma P(a, x): the gamma distribution's cumulative. */
export function gammaP(a: number, x: number): number {
  if (x <= 0) return 0;
  if (x < a + 1) {
    let sum = 1 / a;
    let term = sum;
    for (let n = 1; n < 500; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
  // continued fraction for the upper tail
  let b = x + 1 - a;
  let c = 1 / 1e-300;
  let d = 1 / b;
  let h = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c;
    if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-14) break;
  }
  return 1 - Math.exp(-x + a * Math.log(x) - logGamma(a)) * h;
}

/** the gamma density, for drawing the belief as a curve. */
export function gammaDensity(g: Prior, x: number): number {
  if (x <= 0) return 0;
  return Math.exp(g.shape * Math.log(g.rate) + (g.shape - 1) * Math.log(x) - g.rate * x - logGamma(g.shape));
}

/** the value below which the given fraction of the belief lies, by bisection. */
export function gammaQuantile(g: Prior, p: number): number {
  let lo = 0;
  let hi = Math.max(1, meanOf(g) * 10);
  while (gammaP(g.shape, g.rate * hi) < p) hi *= 2;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (gammaP(g.shape, g.rate * mid) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ------------------------------------------------------------------- claim sizes

/** a claim from a Pareto tail: at least the floor, and above it P(X > x) = (floor / x)^alpha. */
export function pareto(alpha: number, floor: number, rng: () => number): number {
  return floor / Math.pow(Math.max(1e-12, 1 - rng()), 1 / alpha);
}

/** a claim from a thin tail with the same typical size: lognormal with a modest spread. */
export function thin(typical: number, rng: () => number): number {
  return typical * Math.exp(0.5 * gaussian(rng) - 0.125);
}

/** the mean of a Pareto tail, infinite at or below alpha = 1. */
export function paretoMean(alpha: number, floor: number): number {
  return alpha > 1 ? (alpha * floor) / (alpha - 1) : Infinity;
}

/** the fraction of claims above each size, on a log grid, for a survival plot. */
export function survival(values: ArrayLike<number>, points = 40): [number, number][] {
  const sorted = Array.from(values as ArrayLike<number>).sort((a, b) => a - b);
  const n = sorted.length;
  if (!n) return [];
  const lo = Math.log(sorted[0]);
  const hi = Math.log(sorted[n - 1]);
  const out: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const x = Math.exp(lo + ((hi - lo) * i) / (points - 1));
    // count above x
    let a = 0;
    let b = n;
    while (a < b) {
      const m = (a + b) >> 1;
      if (sorted[m] <= x) a = m + 1;
      else b = m;
    }
    const above = n - a;
    if (above > 0) out.push([x, above / n]);
  }
  return out;
}

/** the tail index read off the survival plot's straight part: minus its slope on log-log axes. */
export function tailIndex(curve: [number, number][]): number {
  const part = curve.filter((p) => p[1] <= 0.5 && p[1] >= 0.005);
  if (part.length < 3) return NaN;
  const xs = part.map((p) => Math.log(p[0]));
  const ys = part.map((p) => Math.log(p[1]));
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  return den > 0 ? -num / den : NaN;
}
