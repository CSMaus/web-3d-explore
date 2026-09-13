/**
 * a heart with two rhythms, as one interval to the next.
 *
 * the interval between two beats decides the interval after it. a healthy
 * heart settles on one interval, the normal beat. the same tissue can also
 * run a fast irregular rhythm, the arrhythmia, and once in it stays in it.
 * between the two lies a switching point: an interval the heart cannot hold,
 * from which it falls to one rhythm or the other. an electrical pulse makes
 * the heart beat early, so a pulse sets the coming interval; a pulse at the
 * wrong moment leaves the heart past the switching point and the arrhythmia
 * begins; a pulse just ahead of a coming beat in the arrhythmia breaks its
 * circuit, the beat after it is a pause, and the pause lands on the normal
 * side of the point, so the normal beat returns.
 *
 * this is a model of the mechanism, not a measurement of tissue: the numbers
 * are chosen to make the picture clear. the arrhythmia's rule is the logistic
 * map at a = 3.9, so the smear on the return map is the one the topic has
 * been drawing all along. the interval x runs 0 to 1 and is read as 300 to
 * 800 milliseconds.
 */

export const LOW = 300;
export const HIGH = 800;
export const toMs = (x: number) => LOW + (HIGH - LOW) * x;
export const toX = (ms: number) => (ms - LOW) / (HIGH - LOW);

/** the normal beat, and how firmly the heart returns to it */
export const NORMAL = 0.84;
const PULL = 0.5;
/** the switching point: below it the arrhythmia, above it the normal beat */
export const SWITCH = 0.62;
/** the arrhythmia's band of intervals */
const BAND_LO = 0.04;
const BAND_HI = 0.5;
const A = 3.9;
/** the tissue cannot be made to beat sooner than this after a beat */
export const REFRACTORY = 0.25;
/** a pulse this close ahead of a coming beat in the arrhythmia breaks the circuit */
export const GAP = 0.02;
/** the pause after a broken circuit: the interval the heart is left with */
export const RESET = 0.75;

/** the rule: one interval to the next, with the two rhythms and the point between them. */
export function next(x: number): number {
  if (x >= SWITCH) return NORMAL + PULL * (x - NORMAL);
  // an interval above the band but below the switching point, which only a pulse can make,
  // drops into the band on the next beat; below the band likewise
  if (x >= BAND_HI) return BAND_LO + (BAND_HI - BAND_LO) * (0.2 + (0.78 * (x - BAND_HI)) / (SWITCH - BAND_HI));
  if (x < BAND_LO) return BAND_LO + (BAND_HI - BAND_LO) * 0.2;
  const u = (x - BAND_LO) / (BAND_HI - BAND_LO);
  return BAND_LO + (BAND_HI - BAND_LO) * A * u * (1 - u);
}

/** the slope of the rule at x, for the exponent along a run of beats */
export function slopeAt(x: number): number {
  if (x >= SWITCH) return PULL;
  if (x >= BAND_HI || x < BAND_LO) return 1;
  const u = (x - BAND_LO) / (BAND_HI - BAND_LO);
  return A * (1 - 2 * u);
}

export const isNormal = (x: number) => x >= SWITCH;

export type Beat = {
  n: number;
  x: number;
  /** a pulse made this beat come early */
  pulsed: boolean;
  /** this beat is the pause after a circuit was broken */
  pause: boolean;
};

export type Rescue = "none" | "timed" | "fixed" | "random";

export type Setting = {
  /** beat-to-beat jitter */
  noise: number;
  /** the beat the first pulse is given at, and its time after the last beat, in x */
  shockAt: number;
  shockTime: number;
  /** how the rescue pulses are timed, and from which beat */
  rescue: Rescue;
  from: number;
  /** the fixed pulse time, for the fixed rescue, in x */
  fixedTime: number;
  seed: number;
};

function rngFrom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number) {
  const u = Math.max(1e-12, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** what one pulse at time p does to a heart whose last interval was x and whose coming beat would be at q. */
export function pulse(x: number, q: number, p: number): { interval: number; broke: boolean; took: boolean } {
  // the heart beats first, or the tissue is still recovering: the pulse does nothing
  if (p >= q || p < REFRACTORY) return { interval: q, broke: false, took: false };
  // the beat comes early, at the pulse. in the arrhythmia a pulse just ahead of the coming beat breaks the circuit
  const broke = !isNormal(x) && q - p <= GAP;
  return { interval: p, broke, took: true };
}

/** the beats, one after another: normal, the first pulse, the arrhythmia, then the rescue. */
export function simulate(s: Setting, count: number): Beat[] {
  const rng = rngFrom(s.seed);
  const out: Beat[] = [];
  let x = NORMAL;
  let pauseNext = false;
  for (let n = 0; n < count; n++) {
    let q = next(x) + s.noise * gaussian(rng);
    q = Math.min(0.999, Math.max(0.001, q));
    let pulsed = false;
    let pause = false;
    if (pauseNext) {
      // the circuit was broken by the last pulse: this beat is the pause
      q = RESET + s.noise * gaussian(rng);
      pause = true;
      pauseNext = false;
    } else if (n === s.shockAt) {
      const r = pulse(x, q, s.shockTime);
      q = r.interval;
      pulsed = r.took;
      pauseNext = r.broke;
    } else if (n >= s.from && s.rescue !== "none" && !isNormal(x)) {
      // the rescue: a pulse timed from the map, at a fixed time, or at random
      const p = s.rescue === "timed" ? next(x) - GAP / 2 : s.rescue === "fixed" ? s.fixedTime : REFRACTORY + rng() * (BAND_HI - REFRACTORY + 0.1);
      const r = pulse(x, q, p);
      q = r.interval;
      pulsed = r.took;
      pauseNext = r.broke;
    }
    out.push({ n, x: q, pulsed, pause });
    x = q;
  }
  return out;
}

/** the mean and spread of the intervals in a run of beats, in milliseconds. */
export function spread(beats: Beat[]): { mean: number; sd: number } {
  if (!beats.length) return { mean: 0, sd: 0 };
  const ms = beats.map((b) => toMs(b.x));
  const mean = ms.reduce((p, q) => p + q, 0) / ms.length;
  const sd = Math.sqrt(ms.reduce((p, q) => p + (q - mean) * (q - mean), 0) / ms.length);
  return { mean, sd };
}

/** the exponent read off the beats the heart made on its own: the mean log stretch of the rule. */
export function exponentAlong(beats: Beat[]): number {
  const own = beats.filter((b) => !b.pulsed && !b.pause);
  if (!own.length) return 0;
  return own.reduce((p, b) => p + Math.log(Math.abs(slopeAt(b.x)) || 1e-12), 0) / own.length;
}

/**
 * what the heart settles into from each interval: the picture of the two rhythms.
 * along the bottom the interval a pulse leaves the heart with; above, the intervals
 * that follow once the approach is thrown away.
 */
export function settles(columns = 300, keep = 80, discard = 200): { x: number; values: number[] }[] {
  const out: { x: number; values: number[] }[] = [];
  for (let c = 0; c < columns; c++) {
    const start = 0.001 + (0.998 * c) / (columns - 1);
    let x = start;
    for (let i = 0; i < discard; i++) x = next(x);
    const values: number[] = [];
    for (let i = 0; i < keep; i++) {
      x = next(x);
      values.push(x);
    }
    out.push({ x: start, values });
  }
  return out;
}
