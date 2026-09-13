/**
 * a rough line with memory: fractional Gaussian noise and the Hurst exponent.
 *
 * Hurst measured the Nile and found that wet years cluster; Mandelbrot and
 * Van Ness gave the clustering a model, a random walk whose steps remember,
 * with one number H between 0 and 1: 0.5 is the coin-toss walk, above it runs
 * continue, below it they reverse. the graph of such a walk is a fractal of
 * dimension 2 - H, which is the link back to the coastline: a persistent
 * series is a smoother line, an anti-persistent one a rougher one.
 *
 * the steps are made exactly by Hosking's method, which draws each step from
 * its true conditional distribution given the ones before, so a run can grow
 * one step at a time and still be an exact sample.
 */

export function rngFrom(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rng: () => number) {
  const u = Math.max(1e-12, rng());
  const v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** the correlation between steps k apart in fractional Gaussian noise. */
export function autocorrelation(H: number, k: number): number {
  if (k === 0) return 1;
  const h2 = 2 * H;
  return 0.5 * (Math.pow(k + 1, h2) - 2 * Math.pow(k, h2) + Math.pow(k - 1, h2));
}

/** n steps of fractional Gaussian noise with exponent H, exact, by Hosking's recursion. */
export function fgn(H: number, n: number, seed: number): Float64Array {
  const rng = rngFrom(seed);
  const out = new Float64Array(n);
  if (n === 0) return out;
  const rho = new Float64Array(n + 1);
  for (let k = 0; k <= n; k++) rho[k] = autocorrelation(H, k);
  let phi = new Float64Array(0);
  let v = 1;
  out[0] = gaussian(rng);
  for (let t = 1; t < n; t++) {
    // partial correlation of step t with step 0 given those between: Durbin-Levinson
    let acc = rho[t];
    for (let j = 0; j < phi.length; j++) acc -= phi[j] * rho[t - 1 - j];
    const kappa = acc / v;
    const next = new Float64Array(t);
    for (let j = 0; j < phi.length; j++) next[j] = phi[j] - kappa * phi[phi.length - 1 - j];
    next[t - 1] = kappa;
    phi = next;
    v *= 1 - kappa * kappa;
    let mean = 0;
    for (let j = 0; j < t; j++) mean += phi[j] * out[t - 1 - j];
    out[t] = mean + Math.sqrt(Math.max(v, 1e-12)) * gaussian(rng);
  }
  return out;
}

/** the running sum: the walk itself, starting at zero. */
export function walk(steps: ArrayLike<number>): Float64Array {
  const out = new Float64Array(steps.length + 1);
  for (let i = 0; i < steps.length; i++) out[i + 1] = out[i] + steps[i];
  return out;
}

/** the same steps in a random order: the distribution kept, the memory destroyed. */
export function shuffled(steps: ArrayLike<number>, seed: number): Float64Array {
  const rng = rngFrom(seed);
  const out = Float64Array.from(steps as ArrayLike<number>);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
  return out;
}

export type Fit = { sizes: number[]; values: number[]; slope: number; intercept: number };

function fitLine(xs: number[], ys: number[]): { slope: number; intercept: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) * (xs[i] - mx);
  }
  const slope = den > 0 ? num / den : 0;
  return { slope, intercept: my - slope * mx };
}

/**
 * Hurst's rescaled range: cut the steps into blocks of a size, and in each block
 * measure how far the running sum wanders (its range) against how much the
 * steps vary (their standard deviation). the average grows like size to the H.
 */
export function rescaledRange(steps: ArrayLike<number>): Fit {
  const n = steps.length;
  const sizes: number[] = [];
  for (let s = 8; s <= n / 2; s = Math.round(s * 1.5)) sizes.push(s);
  const values: number[] = [];
  for (const s of sizes) {
    const blocks = Math.floor(n / s);
    let total = 0;
    let used = 0;
    for (let b = 0; b < blocks; b++) {
      let mean = 0;
      for (let i = 0; i < s; i++) mean += steps[b * s + i];
      mean /= s;
      let sum = 0;
      let lo = 0;
      let hi = 0;
      let sq = 0;
      for (let i = 0; i < s; i++) {
        const d = steps[b * s + i] - mean;
        sum += d;
        sq += d * d;
        if (sum < lo) lo = sum;
        if (sum > hi) hi = sum;
      }
      const sd = Math.sqrt(sq / s);
      if (sd > 0) {
        total += (hi - lo) / sd;
        used += 1;
      }
    }
    values.push(used ? total / used : 1);
  }
  const fit = fitLine(sizes.map(Math.log), values.map(Math.log));
  return { sizes, values, ...fit };
}

/** the box-counting dimension of the graph of the walk, drawn in a unit square. */
export function graphDimension(path: ArrayLike<number>): Fit {
  const n = path.length;
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i < n; i++) {
    if (path[i] < lo) lo = path[i];
    if (path[i] > hi) hi = path[i];
  }
  const span = hi - lo || 1;
  const sizes: number[] = [];
  for (let k = 4; k <= n / 4; k *= 2) sizes.push(k);
  const values: number[] = [];
  for (const k of sizes) {
    const cell = 1 / k;
    const boxes = new Set<number>();
    for (let i = 1; i < n; i++) {
      const x = Math.min(k - 1, Math.floor(((i - 1) / (n - 1)) * k));
      const a = (path[i - 1] - lo) / span;
      const b = (path[i] - lo) / span;
      const y0 = Math.min(k - 1, Math.floor(Math.min(a, b) / cell));
      const y1 = Math.min(k - 1, Math.floor(Math.max(a, b) / cell));
      for (let y = y0; y <= y1; y++) boxes.add(x * (k + 1) + y);
    }
    values.push(boxes.size);
  }
  const fit = fitLine(sizes.map(Math.log), values.map(Math.log));
  return { sizes, values, ...fit };
}

/** how wide the future is: the spread of the walk T steps ahead grows like T to the H. */
export function horizonSpread(sd: number, H: number, T: number): number {
  return sd * Math.pow(T, H);
}

/**
 * the second reading of H: add the steps up in blocks of m, and the variance of
 * the block sums grows like m to the 2H. less pulled towards a half on a short
 * series than the rescaled range, which is known to lean that way.
 */
export function varianceScaling(steps: ArrayLike<number>): Fit {
  const n = steps.length;
  const sizes: number[] = [];
  for (let m = 1; m <= n / 8; m = Math.round(m * 1.6) + (m < 3 ? 1 : 0)) sizes.push(m);
  const values: number[] = [];
  for (const m of sizes) {
    const blocks = Math.floor(n / m);
    const sums: number[] = [];
    for (let b = 0; b < blocks; b++) {
      let s = 0;
      for (let i = 0; i < m; i++) s += steps[b * m + i];
      sums.push(s);
    }
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const v = sums.reduce((a, b) => a + (b - mean) * (b - mean), 0) / Math.max(1, sums.length - 1);
    values.push(Math.max(v, 1e-12));
  }
  const fit = fitLine(sizes.map(Math.log), values.map(Math.log));
  return { sizes, values, slope: fit.slope / 2, intercept: fit.intercept };
}
