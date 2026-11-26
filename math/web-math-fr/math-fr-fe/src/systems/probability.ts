/**
 * the mathematics of the probability topic, with nothing drawn: counting outcomes, a population
 * counted for a test result, the doors game, the game with a die, hats, the Galton board, the
 * binomial closing on the Poisson, densities from samples, waiting times, random walks and the
 * gambler's ruin. every random run takes a seed, so a page and its test see the same numbers.
 */
import { gaussian, rngFrom } from "@/systems/scaling";

export { rngFrom };
export type Rng = () => number;

/** a whole number from 0 to n - 1 */
export const pick = (rng: Rng, n: number) => Math.min(n - 1, Math.floor(rng() * n));

// ------------------------------------------------------------------ counting

/** how many of the 36 ordered pairs of two dice give this sum */
export function sumWays(sum: number): number {
  return sum < 2 || sum > 12 ? 0 : 6 - Math.abs(sum - 7);
}

/** two dice thrown once, each from 1 to 6 */
export function throwTwo(rng: Rng): [number, number] {
  return [1 + pick(rng, 6), 1 + pick(rng, 6)];
}

/** the chance that among n people at least two share a birthday, with every one of the days equally likely */
export function shared(n: number, days = 365): number {
  let none = 1;
  for (let k = 0; k < n; k += 1) none *= (days - k) / days;
  return 1 - Math.max(0, none);
}

/** the smallest group with at least an even chance of a shared birthday */
export function evenAt(days = 365): number {
  let n = 1;
  while (shared(n, days) < 0.5) n += 1;
  return n;
}

/** one room of n people with random birthdays: whether two share one */
export function roomShares(n: number, rng: Rng, days = 365): boolean {
  const seen = new Uint8Array(days);
  for (let k = 0; k < n; k += 1) {
    const d = pick(rng, days);
    if (seen[d]) return true;
    seen[d] = 1;
  }
  return false;
}

// ------------------------------------------------------------------ a test in a population

export type Screen = { people: number; prevalence: number; sensitivity: number; falsePositive: number };

/** the population counted: who is ill, who tests positive, and the share of the positives who are ill */
export function counted({ people, prevalence, sensitivity, falsePositive }: Screen) {
  const ill = Math.round(people * prevalence);
  const healthy = people - ill;
  const illPositive = Math.round(ill * sensitivity);
  const healthyPositive = Math.round(healthy * falsePositive);
  const positive = illPositive + healthyPositive;
  return { ill, healthy, illPositive, healthyPositive, positive, share: positive ? illPositive / positive : 0 };
}

/** the same share by Bayes' rule, with no rounding to whole people */
export function bayes({ prevalence, sensitivity, falsePositive }: Screen): number {
  const yes = prevalence * sensitivity;
  const no = (1 - prevalence) * falsePositive;
  return yes + no > 0 ? yes / (yes + no) : 0;
}

/**
 * every person of the population as one of four kinds, in a shuffled order: 0 healthy and negative,
 * 1 healthy and positive, 2 ill and negative, 3 ill and positive. the counts are exactly those of
 * `counted`; only where each person stands is random.
 */
export function population(screen: Screen, seed: number): Uint8Array {
  const c = counted(screen);
  const kinds = new Uint8Array(screen.people);
  let at = 0;
  const fill = (n: number, kind: number) => {
    kinds.fill(kind, at, at + n);
    at += n;
  };
  fill(c.illPositive, 3);
  fill(c.ill - c.illPositive, 2);
  fill(c.healthyPositive, 1);
  fill(c.healthy - c.healthyPositive, 0);
  const rng = rngFrom(seed);
  for (let i = kinds.length - 1; i > 0; i -= 1) {
    const j = pick(rng, i + 1);
    const t = kinds[i];
    kinds[i] = kinds[j];
    kinds[j] = t;
  }
  return kinds;
}

// ------------------------------------------------------------------ the doors

/** one game with this many doors: where the car is, the door picked, and the one door the host leaves shut */
export function doorsGame(doors: number, rng: Rng) {
  const car = pick(rng, doors);
  const first = pick(rng, doors);
  // the host knows where the car is and opens every other door but one, never the car
  let left = car;
  if (first === car) {
    left = pick(rng, doors - 1);
    if (left >= first) left += 1;
  }
  return { car, first, left, stayWins: first === car, switchWins: left === car };
}

// ------------------------------------------------------------------ the game with a die

/** one round: pay 2, throw a die, collect the prize on a six. the gain of the round */
export function round(rng: Rng, prize = 10, cost = 2): { face: number; gain: number } {
  const face = 1 + pick(rng, 6);
  return { face, gain: (face === 6 ? prize : 0) - cost };
}

/** the gain to expect from one round */
export function expectedGain(prize = 10, cost = 2): number {
  return prize / 6 - cost;
}

/** the spread of one round's gain about that expectation (its standard deviation) */
export function gainSpread(prize = 10): number {
  return prize * Math.sqrt((1 / 6) * (5 / 6));
}

// ------------------------------------------------------------------ hats

/** n hats handed back in a random order: who got which hat */
export function shuffleHats(n: number, rng: Rng): number[] {
  const hats = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = pick(rng, i + 1);
    [hats[i], hats[j]] = [hats[j], hats[i]];
  }
  return hats;
}

export function matches(hats: number[]): number {
  return hats.reduce((s, h, i) => s + (h === i ? 1 : 0), 0);
}

/** the exact chance of k matches among n hats: choose the k, and derange the rest */
export function matchChance(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  // derangements over factorials, D(m)/m! = sum of (-1)^j / j!
  let d = 0;
  let f = 1;
  for (let j = 0; j <= n - k; j += 1) {
    if (j > 0) f *= j;
    d += (j % 2 ? -1 : 1) / f;
  }
  let kf = 1;
  for (let j = 2; j <= k; j += 1) kf *= j;
  return d / kf;
}

// ------------------------------------------------------------------ counting successes

export function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let j = 1; j <= Math.min(k, n - k); j += 1) c = (c * (n - j + 1)) / j;
  return c;
}

export function binomial(n: number, k: number, p: number): number {
  return choose(n, k) * p ** k * (1 - p) ** (n - k);
}

export function poisson(k: number, mean: number): number {
  let f = 1;
  for (let j = 2; j <= k; j += 1) f *= j;
  return (Math.exp(-mean) * mean ** k) / f;
}

/** one ball down a board of this many rows, going right at each pin with chance p: the bin it lands in, and its path */
export function dropBall(rows: number, p: number, rng: Rng): { bin: number; path: number[] } {
  let bin = 0;
  const path = [0];
  for (let r = 0; r < rows; r += 1) {
    if (rng() < p) bin += 1;
    path.push(bin);
  }
  return { bin, path };
}

/** half the summed gap between two lists of chances: 0 when they agree, 1 when they share nothing */
export function distance(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) s += Math.abs((a[i] ?? 0) - (b[i] ?? 0));
  return s / 2;
}

/** the numbers of trials the Poisson page steps through, with the same average of 3 */
export const TRIALS = [3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 60, 100, 200, 500, 1000];

// ------------------------------------------------------------------ densities

export type Shape = "exponential" | "uniform" | "normal";

/** one waiting time in minutes: random arrivals with an average of 10, a bus every 20 minutes arrived at any moment, or a normal spread of 3 about 10 */
export function sample(shape: Shape, rng: Rng, mean = 10): number {
  if (shape === "exponential") return -mean * Math.log(1 - rng());
  if (shape === "uniform") return 2 * mean * rng();
  return mean + 3 * gaussian(rng);
}

export function samples(shape: Shape, n: number, seed: number): Float64Array {
  const rng = rngFrom(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 1) out[i] = sample(shape, rng);
  return out;
}

/** the curve the samples close on: the height of the density at x */
export function density(shape: Shape, x: number, mean = 10): number {
  if (shape === "exponential") return x < 0 ? 0 : Math.exp(-x / mean) / mean;
  if (shape === "uniform") return x < 0 || x > 2 * mean ? 0 : 1 / (2 * mean);
  return Math.exp(-((x - mean) ** 2) / 18) / (3 * Math.sqrt(2 * Math.PI));
}

/** the exact chance of waiting longer than t */
export function beyond(shape: Shape, t: number, mean = 10): number {
  if (shape === "exponential") return t < 0 ? 1 : Math.exp(-t / mean);
  if (shape === "uniform") return t <= 0 ? 1 : t >= 2 * mean ? 0 : 1 - t / (2 * mean);
  return 0.5 * erfc((t - mean) / (3 * Math.SQRT2));
}

/** the complementary error function, to about seven places (Numerical Recipes, erfcc) */
export function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}

/** counts of values in equal bins from lo to hi; values outside are left out */
export function histogram(values: ArrayLike<number>, lo: number, hi: number, bins: number, upTo = values.length): number[] {
  const out = new Array(bins).fill(0);
  const w = (hi - lo) / bins;
  for (let i = 0; i < upTo; i += 1) {
    const v = values[i];
    if (v < lo || v >= hi) continue;
    out[Math.min(bins - 1, Math.floor((v - lo) / w))] += 1;
  }
  return out;
}

/** the share of values above t */
export function shareAbove(values: ArrayLike<number>, t: number, upTo = values.length): number {
  let n = 0;
  for (let i = 0; i < upTo; i += 1) if (values[i] > t) n += 1;
  return upTo ? n / upTo : 0;
}

/** the bin counts the density page narrows through, from 2 bins over the range to 200 */
export const BINS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150, 200];

/** the waits still ahead of everyone who has already waited t minutes */
export function remaining(values: ArrayLike<number>, t: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i += 1) if (values[i] > t) out.push(values[i] - t);
  return out;
}

export function mean(values: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < values.length; i += 1) s += values[i];
  return values.length ? s / values.length : 0;
}

// ------------------------------------------------------------------ random walks

/** many walks of plus or minus one a step, kept as their positions; one step moves every walk once */
export type Walks = { at: Int32Array; positive: Int32Array; steps: number; rng: Rng };

export function startWalks(count: number, seed: number): Walks {
  return { at: new Int32Array(count), positive: new Int32Array(count), steps: 0, rng: rngFrom(seed) };
}

/** every walk one step on; a step counts as time above zero when the segment it draws lies above the axis */
export function stepWalks(w: Walks): void {
  for (let i = 0; i < w.at.length; i += 1) {
    const before = w.at[i];
    w.at[i] += w.rng() < 0.5 ? 1 : -1;
    if (before + w.at[i] > 0) w.positive[i] += 1;
  }
  w.steps += 1;
}

/** the spread of the walks' positions: the root of their average square */
export function spread(at: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < at.length; i += 1) s += at[i] * at[i];
  return at.length ? Math.sqrt(s / at.length) : 0;
}

/** the arcsine law: the chance that a long fair walk spends at most a share x of its time above zero */
export function arcsine(x: number): number {
  const c = Math.max(0, Math.min(1, x));
  return (2 / Math.PI) * Math.asin(Math.sqrt(c));
}

/** the arcsine density, the U the histogram of time above zero closes on */
export function arcsineDensity(x: number): number {
  return x <= 0 || x >= 1 ? Infinity : 1 / (Math.PI * Math.sqrt(x * (1 - x)));
}

// ------------------------------------------------------------------ the gambler's ruin

/** the chance of reaching the target before zero, from the start, winning each bet with chance p */
export function reachChance(start: number, target: number, p: number): number {
  if (start <= 0) return 0;
  if (start >= target) return 1;
  if (Math.abs(p - 0.5) < 1e-12) return start / target;
  const r = (1 - p) / p;
  return (1 - r ** start) / (1 - r ** target);
}

/** the number of bets to expect before the game ends one way or the other */
export function expectedBets(start: number, target: number, p: number): number {
  if (start <= 0 || start >= target) return 0;
  if (Math.abs(p - 0.5) < 1e-12) return start * (target - start);
  const q = 1 - p;
  return start / (q - p) - (target / (q - p)) * reachChance(start, target, p);
}

/** one game played to its end: whether it reached the target, how many bets it took, and its path */
export function playRuin(start: number, target: number, p: number, rng: Rng, keep = false) {
  let at = start;
  let bets = 0;
  const path: number[] = keep ? [at] : [];
  while (at > 0 && at < target) {
    at += rng() < p ? 1 : -1;
    bets += 1;
    if (keep) path.push(at);
  }
  return { won: at >= target, bets, path };
}
