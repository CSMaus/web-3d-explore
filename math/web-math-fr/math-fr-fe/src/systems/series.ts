/**
 * the mathematics of the series topic, with nothing drawn: Taylor coefficients about any centre,
 * the Fourier sines of three waves, the outline of a picture turned into turning circles, and the
 * 8 by 8 cosine transform. the pages call these and draw what they return; the tests check them.
 */

export type C = [number, number];

const cmul = (a: C, b: C): C => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a: C, b: C): C => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const cpow = (a: C, n: number): C => {
  let out: C = [1, 0];
  for (let i = 0; i < n; i += 1) out = cmul(out, a);
  return out;
};

// ------------------------------------------------------------------ Taylor

export type Fn = "sin" | "cos" | "exp" | "ln" | "bump";

/** the functions the Taylor pages use; ln is ln(1 + x), bump is 1/(1 + x^2) */
export const FN: Record<Fn, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  exp: Math.exp,
  ln: (x) => (x > -1 ? Math.log(1 + x) : NaN),
  bump: (x) => 1 / (1 + x * x),
};

/** the first n + 1 Taylor coefficients of a function about the centre a: f(x) = sum c_k (x - a)^k */
export function taylorCoefficients(fn: Fn, a: number, n: number): number[] {
  const out: number[] = [];
  let fact = 1;
  for (let k = 0; k <= n; k += 1) {
    if (k > 0) fact *= k;
    if (fn === "sin") out.push([Math.sin(a), Math.cos(a), -Math.sin(a), -Math.cos(a)][k % 4] / fact);
    else if (fn === "cos") out.push([Math.cos(a), -Math.sin(a), -Math.cos(a), Math.sin(a)][k % 4] / fact);
    else if (fn === "exp") out.push(Math.exp(a) / fact);
    else if (fn === "ln") out.push(k === 0 ? Math.log(1 + a) : ((k % 2 === 1 ? 1 : -1) / k) / Math.pow(1 + a, k));
    else {
      // 1/(1 + x^2) = (1/2i) (1/(x - i) - 1/(x + i)), and 1/(x - p) = -sum (x - a)^k / (p - a)^(k + 1)
      const term = (p: C): C => {
        const d = cpow([p[0] - a, p[1]], k + 1);
        return cdiv([-1, 0], d);
      };
      const diff = (() => {
        const u = term([0, 1]);
        const v = term([0, -1]);
        return [u[0] - v[0], u[1] - v[1]] as C;
      })();
      out.push(cdiv(diff, [0, 2])[0]);
    }
  }
  return out;
}

/** the partial sum with the first n + 1 coefficients, at x */
export function taylorAt(coefficients: number[], a: number, x: number, n = coefficients.length - 1): number {
  let s = 0;
  let p = 1;
  for (let k = 0; k <= n; k += 1) {
    s += coefficients[k] * p;
    p *= x - a;
  }
  return s;
}

/** how far a series about a can reach: the distance from a to the nearest point where the function breaks */
export function radiusOf(fn: Fn, a: number): number {
  if (fn === "ln") return Math.abs(1 + a);
  if (fn === "bump") return Math.hypot(a, 1);
  return Infinity;
}

// ------------------------------------------------------------------ Fourier series

export type Wave = "square" | "sawtooth" | "triangle";

/** the wave itself on one turn, x in (-pi, pi] */
export function waveAt(wave: Wave, x: number): number {
  const t = ((((x + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  if (wave === "square") return t === 0 || Math.abs(t) === Math.PI ? 0 : Math.sign(t);
  if (wave === "sawtooth") return t / Math.PI;
  return 1 - (2 * Math.abs(t)) / Math.PI;
}

/** the sine and cosine coefficients of the wave: wave(x) = sum over k of a_k cos(kx) + b_k sin(kx), k = 1..terms (non-zero terms only) */
export function waveTerms(wave: Wave, terms: number): { k: number; a: number; b: number }[] {
  const out: { k: number; a: number; b: number }[] = [];
  for (let k = 1; out.length < terms; k += 1) {
    if (wave === "square" && k % 2 === 1) out.push({ k, a: 0, b: 4 / (Math.PI * k) });
    else if (wave === "sawtooth") out.push({ k, a: 0, b: (2 * (k % 2 === 1 ? 1 : -1)) / (Math.PI * k) });
    else if (wave === "triangle" && k % 2 === 1) out.push({ k, a: 8 / (Math.PI * Math.PI * k * k), b: 0 });
  }
  return out;
}

/** the partial sum of the wave's terms at x */
export function waveSum(terms: { k: number; a: number; b: number }[], x: number): number {
  let s = 0;
  for (const t of terms) s += t.a * Math.cos(t.k * x) + t.b * Math.sin(t.k * x);
  return s;
}

/** the highest point of the partial sum on one turn, found on a fine grid: the overshoot near a jump */
export function peakOf(terms: { k: number; a: number; b: number }[], samples = 20000): number {
  let best = -Infinity;
  for (let i = 0; i <= samples; i += 1) best = Math.max(best, waveSum(terms, -Math.PI + (2 * Math.PI * i) / samples));
  return best;
}

// ------------------------------------------------------------------ an outline as circles

export type Circle = { n: number; re: number; im: number; r: number };

/** the discrete Fourier transform of a closed path of complex points, frequencies -N/2 .. N/2 - 1, biggest circle first */
export function circlesOf(points: C[]): Circle[] {
  const N = points.length;
  const out: Circle[] = [];
  for (let n = -Math.floor(N / 2); n < Math.ceil(N / 2); n += 1) {
    let re = 0;
    let im = 0;
    for (let k = 0; k < N; k += 1) {
      const t = (-2 * Math.PI * n * k) / N;
      const c = Math.cos(t);
      const s = Math.sin(t);
      re += points[k][0] * c - points[k][1] * s;
      im += points[k][0] * s + points[k][1] * c;
    }
    re /= N;
    im /= N;
    out.push({ n, re, im, r: Math.hypot(re, im) });
  }
  return out.sort((p, q) => q.r - p.r);
}

/** the tip of the first `count` circles at time t in [0, 1), and every circle's centre on the way */
export function circlesAt(circles: Circle[], count: number, t: number): C[] {
  const chain: C[] = [[0, 0]];
  let x = 0;
  let y = 0;
  for (let i = 0; i < Math.min(count, circles.length); i += 1) {
    const c = circles[i];
    const a = 2 * Math.PI * c.n * t;
    x += c.re * Math.cos(a) - c.im * Math.sin(a);
    y += c.re * Math.sin(a) + c.im * Math.cos(a);
    chain.push([x, y]);
  }
  return chain;
}

/** the squared error of a drawing with the first `count` circles: the squared radii left out (Parseval) */
export function droppedEnergy(circles: Circle[], count: number): number {
  let s = 0;
  for (let i = count; i < circles.length; i += 1) s += circles[i].r * circles[i].r;
  return s;
}

/** a closed path resampled to n points evenly spaced along its length */
export function resample(path: C[], n: number): C[] {
  const closed = [...path, path[0]];
  const len: number[] = [0];
  for (let i = 1; i < closed.length; i += 1) len.push(len[i - 1] + Math.hypot(closed[i][0] - closed[i - 1][0], closed[i][1] - closed[i - 1][1]));
  const total = len[len.length - 1];
  const out: C[] = [];
  let j = 0;
  for (let i = 0; i < n; i += 1) {
    const at = (total * i) / n;
    while (j < len.length - 2 && len[j + 1] < at) j += 1;
    const seg = len[j + 1] - len[j] || 1;
    const u = (at - len[j]) / seg;
    out.push([closed[j][0] + u * (closed[j + 1][0] - closed[j][0]), closed[j][1] + u * (closed[j + 1][1] - closed[j][1])]);
  }
  return out;
}

/**
 * the outline of the largest shape in a grey picture: the threshold that best splits the darks
 * from the lights (Otsu), the side the border mostly is taken as the ground, the largest connected
 * piece of the other side, and its boundary walked once around (Moore neighbours). the picture is
 * a row-major array of 0..255 values; the points come back in pixel coordinates, y down.
 */
export function outlineOf(grey: Uint8ClampedArray | number[], width: number, height: number): C[] {
  const hist = new Array(256).fill(0);
  for (let i = 0; i < grey.length; i += 1) hist[grey[i]] += 1;
  const total = grey.length;
  let sum = 0;
  for (let i = 0; i < 256; i += 1) sum += i * hist[i];
  let wB = 0;
  let sumB = 0;
  let best = 0;
  let cut = 128;
  for (let t = 0; t < 256; t += 1) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (between > best) {
      best = between;
      cut = t;
    }
  }
  // the ground is whichever side most of the border pixels fall on
  let darkBorder = 0;
  let border = 0;
  for (let x = 0; x < width; x += 1) for (const y of [0, height - 1]) { border += 1; if (grey[y * width + x] <= cut) darkBorder += 1; }
  for (let y = 0; y < height; y += 1) for (const x of [0, width - 1]) { border += 1; if (grey[y * width + x] <= cut) darkBorder += 1; }
  const groundDark = darkBorder > border / 2;
  const on = new Uint8Array(width * height);
  for (let i = 0; i < grey.length; i += 1) on[i] = (grey[i] <= cut) !== groundDark ? 1 : 0;
  // the largest connected piece
  const label = new Int32Array(width * height);
  let biggest = 0;
  let biggestLabel = 0;
  let next = 1;
  const stack: number[] = [];
  for (let i = 0; i < on.length; i += 1) {
    if (!on[i] || label[i]) continue;
    let size = 0;
    stack.push(i);
    label[i] = next;
    while (stack.length) {
      const p = stack.pop()!;
      size += 1;
      const x = p % width;
      const y = (p - x) / width;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const q = ny * width + nx;
        if (on[q] && !label[q]) {
          label[q] = next;
          stack.push(q);
        }
      }
    }
    if (size > biggest) {
      biggest = size;
      biggestLabel = next;
    }
    next += 1;
  }
  if (!biggest) return [];
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height && label[y * width + x] === biggestLabel;
  // the first pixel of the piece in reading order is on its boundary, with outside to its left
  let start = -1;
  for (let i = 0; i < label.length; i += 1) if (label[i] === biggestLabel) { start = i; break; }
  const sx = start % width;
  const sy = (start - sx) / width;
  const DIRS: C[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const path: C[] = [[sx, sy]];
  let cx = sx;
  let cy = sy;
  let back = 4; // came from the left
  for (let steps = 0; steps < width * height * 4; steps += 1) {
    let found = false;
    for (let i = 1; i <= 8; i += 1) {
      const d = (back + i) % 8;
      const nx = cx + DIRS[d][0];
      const ny = cy + DIRS[d][1];
      if (inside(nx, ny)) {
        back = (d + 4) % 8;
        cx = nx;
        cy = ny;
        found = true;
        break;
      }
    }
    if (!found) break;
    if (cx === sx && cy === sy) break;
    path.push([cx, cy]);
  }
  return path;
}

// ------------------------------------------------------------------ the 8 by 8 cosine transform

const COS: number[][] = Array.from({ length: 8 }, (_, u) => Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16)));
const CU = (u: number) => (u === 0 ? Math.SQRT1_2 : 1);

/** the 64 coefficients of one 8 by 8 block of values, F[v * 8 + u] */
export function dct8(block: number[]): number[] {
  const out = new Array(64).fill(0);
  for (let v = 0; v < 8; v += 1)
    for (let u = 0; u < 8; u += 1) {
      let s = 0;
      for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) s += block[y * 8 + x] * COS[u][x] * COS[v][y];
      out[v * 8 + u] = (CU(u) * CU(v) * s) / 4;
    }
  return out;
}

/** the block back from its 64 coefficients */
export function idct8(F: number[]): number[] {
  const out = new Array(64).fill(0);
  for (let y = 0; y < 8; y += 1)
    for (let x = 0; x < 8; x += 1) {
      let s = 0;
      for (let v = 0; v < 8; v += 1) for (let u = 0; u < 8; u += 1) s += CU(u) * CU(v) * F[v * 8 + u] * COS[u][x] * COS[v][y];
      out[y * 8 + x] = s / 4;
    }
  return out;
}

/**
 * a grey picture (width and height multiples of 8) rebuilt keeping only the k largest coefficients
 * of each block; also the share of coefficients kept and the root-mean-square error in grey levels
 */
export function keepStrong(grey: number[], width: number, height: number, k: number): { out: number[]; rms: number } {
  const out = new Array(width * height).fill(0);
  let err = 0;
  for (let by = 0; by < height; by += 8)
    for (let bx = 0; bx < width; bx += 8) {
      const block: number[] = [];
      for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) block.push(grey[(by + y) * width + bx + x] - 128);
      const F = dct8(block);
      const order = F.map((f, i) => [Math.abs(f), i]).sort((p, q) => q[0] - p[0]);
      const kept = new Array(64).fill(0);
      for (let i = 0; i < k; i += 1) kept[order[i][1]] = F[order[i][1]];
      const back = idct8(kept);
      for (let y = 0; y < 8; y += 1)
        for (let x = 0; x < 8; x += 1) {
          const v = Math.max(0, Math.min(255, back[y * 8 + x] + 128));
          const i = (by + y) * width + bx + x;
          out[i] = v;
          err += (v - grey[i]) ** 2;
        }
    }
  return { out, rms: Math.sqrt(err / (width * height)) };
}

/** sin x by its Taylor terms up to the given odd power, added smallest power first as written */
export function sinPoly(x: number, power = 13): number {
  let sum = 0;
  let term = x;
  for (let k = 1; k <= power; k += 2) {
    sum += term;
    term *= (-x * x) / ((k + 1) * (k + 2));
  }
  return sum;
}

/** cos x by its Taylor terms up to the given even power */
export function cosPoly(x: number, power = 14): number {
  let sum = 0;
  let term = 1;
  for (let k = 0; k <= power; k += 2) {
    sum += term;
    term *= (-x * x) / ((k + 1) * (k + 2));
  }
  return sum;
}

/**
 * the calculator's first move: take whole quarter turns off x, so what is left, r, lies between
 * minus and plus a quarter of pi; k counts the quarter turns, and k mod 4 says whether sin x is
 * sin r, cos r, minus sin r or minus cos r
 */
export function reduceQuarter(x: number): { k: number; r: number; turn: 0 | 1 | 2 | 3 } {
  const k = Math.round(x / (Math.PI / 2));
  const r = x - k * (Math.PI / 2);
  return { k, r, turn: (((k % 4) + 4) % 4) as 0 | 1 | 2 | 3 };
}

/** sin x the calculator's way: reduce to the small window, then a short polynomial there */
export function sinReduced(x: number): number {
  const { r, turn } = reduceQuarter(x);
  return [sinPoly(r), cosPoly(r), -sinPoly(r), -cosPoly(r)][turn];
}
