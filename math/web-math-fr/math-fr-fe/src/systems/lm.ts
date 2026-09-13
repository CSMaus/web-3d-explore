/**
 * the smallest language model that has the parts the story names: an
 * embedding table, a position for every token, one head of attention with a
 * causal mask, a residual connection, and an output tied to the table. every
 * gradient is written out by hand and checked against nudging, the same way
 * the networks topic checked its backpropagation.
 *
 * also here: embeddings trained on their own by skip-gram with negative
 * sampling, the geometry measurements (cosine, distance, a two-dimensional
 * projection by power iteration), and the decoding rules (temperature, top-k,
 * nucleus).
 */

import { rng } from "./net.ts";

export type Vec = number[];
export type Mat = number[][];

const zeros = (n: number): Vec => new Array(n).fill(0);
const zeroMat = (r: number, c: number): Mat => Array.from({ length: r }, () => zeros(c));

export function dot(a: Vec, b: Vec) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}
export const norm = (a: Vec) => Math.sqrt(dot(a, a));
export const cosine = (a: Vec, b: Vec) => dot(a, b) / ((norm(a) || 1e-12) * (norm(b) || 1e-12));
export const distance = (a: Vec, b: Vec) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));

export function softmax(z: Vec): Vec {
  const top = Math.max(...z.filter(Number.isFinite));
  const e = z.map((v) => (Number.isFinite(v) ? Math.exp(v - top) : 0));
  const total = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / total);
}

function gaussMat(rows: number, cols: number, scale: number, next: () => number): Mat {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => {
      let u = 0;
      let v = 0;
      while (u === 0) u = next();
      while (v === 0) v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * scale;
    }),
  );
}

// ------------------------------------------------------------- skip-gram embeddings

export type SkipGram = {
  /** one row per vocabulary entry: the vector */
  E: Mat;
  /** the context vectors, one per entry, used only during training */
  C: Mat;
  /** how many times each row was moved */
  touched: number[];
  steps: number;
  loss: number;
  width: number;
};

export function skipGram(vocabSize: number, width: number, seed = 1): SkipGram {
  const next = rng(seed);
  return {
    E: gaussMat(vocabSize, width, 0.3, next),
    C: gaussMat(vocabSize, width, 0.3, next),
    touched: zeros(vocabSize),
    steps: 0,
    loss: 0,
    width,
  };
}

const sig = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * one step of skip-gram with negative sampling: for one centre token and one
 * neighbour, push their vectors together; for a few random tokens, push apart.
 * the centre's row is the only row of E that moves, which is the sparse update
 * the story points at.
 */
export function skipGramStep(
  model: SkipGram,
  ids: number[],
  rate: number,
  windowSize: number,
  negatives: number,
  next: () => number,
) {
  const n = ids.length;
  const centre = Math.floor(next() * n);
  const offset = 1 + Math.floor(next() * windowSize);
  const at = next() < 0.5 ? centre - offset : centre + offset;
  if (at < 0 || at >= n) return;
  const c = ids[centre];
  const e = model.E[c];
  const grad = zeros(model.width);
  let loss = 0;
  const pairs: [number, number][] = [[ids[at], 1]];
  for (let k = 0; k < negatives; k++) pairs.push([ids[Math.floor(next() * n)], 0]);
  for (const [o, label] of pairs) {
    const ctx = model.C[o];
    const p = sig(dot(e, ctx));
    loss -= label ? Math.log(p + 1e-12) : Math.log(1 - p + 1e-12);
    const g = p - label;
    for (let d = 0; d < model.width; d++) {
      grad[d] += g * ctx[d];
      ctx[d] -= rate * g * e[d];
    }
  }
  for (let d = 0; d < model.width; d++) e[d] -= rate * grad[d];
  model.touched[c] += 1;
  model.steps += 1;
  model.loss = model.loss === 0 ? loss : 0.99 * model.loss + 0.01 * loss;
}

/** the k nearest rows to one row, by cosine, excluding itself. */
export function nearest(E: Mat, id: number, k: number, ok: (i: number) => boolean = () => true) {
  const out: { id: number; cos: number; dist: number }[] = [];
  for (let i = 0; i < E.length; i++) {
    if (i === id || !ok(i)) continue;
    out.push({ id: i, cos: cosine(E[id], E[i]), dist: distance(E[id], E[i]) });
  }
  return out.sort((a, b) => b.cos - a.cos).slice(0, k);
}

/** the mean vector, and the rows with it taken away: centring. */
export function centre(E: Mat): { mean: Vec; rows: Mat } {
  const width = E[0].length;
  const mean = zeros(width);
  for (const r of E) for (let d = 0; d < width; d++) mean[d] += r[d] / E.length;
  return { mean, rows: E.map((r) => r.map((v, d) => v - mean[d])) };
}

/** the average cosine between distinct rows: how narrow the cone is. */
export function meanCosine(E: Mat, sample = 400, seed = 3) {
  const next = rng(seed);
  let s = 0;
  for (let i = 0; i < sample; i++) {
    const a = Math.floor(next() * E.length);
    let b = Math.floor(next() * E.length);
    if (b === a) b = (b + 1) % E.length;
    s += cosine(E[a], E[b]);
  }
  return s / sample;
}

/**
 * the two directions of most spread, by power iteration on the covariance,
 * and every row's coordinates along them. a projection, with the fraction of
 * the spread it keeps reported so the distortion is a number rather than a
 * warning.
 */
export function project2(E: Mat): { points: [number, number][]; kept: number; axes: [Vec, Vec] } {
  const { rows } = centre(E);
  const width = rows[0].length;
  const cov = zeroMat(width, width);
  for (const r of rows) for (let i = 0; i < width; i++) for (let j = 0; j < width; j++) cov[i][j] += (r[i] * r[j]) / rows.length;
  let total = 0;
  for (let i = 0; i < width; i++) total += cov[i][i];
  const power = (deflate: Vec[]): { v: Vec; lambda: number } => {
    let v = Array.from({ length: width }, (_, i) => Math.cos(i + 1));
    let lambda = 0;
    for (let it = 0; it < 200; it++) {
      let w = cov.map((row) => dot(row, v));
      for (const d of deflate) {
        const p = dot(w, d);
        w = w.map((x, i) => x - p * d[i]);
      }
      lambda = norm(w);
      if (lambda < 1e-12) break;
      v = w.map((x) => x / lambda);
    }
    return { v, lambda };
  };
  const first = power([]);
  const second = power([first.v]);
  const points = rows.map((r) => [dot(r, first.v), dot(r, second.v)] as [number, number]);
  return { points, kept: total > 0 ? (first.lambda + second.lambda) / total : 0, axes: [first.v, second.v] };
}

// ------------------------------------------------------------------ position

/** the sinusoidal encoding: one vector per position, a fixed function of the index. */
export function sinusoid(position: number, width: number): Vec {
  return Array.from({ length: width }, (_, i) => {
    const freq = 1 / Math.pow(10000, (2 * Math.floor(i / 2)) / width);
    return i % 2 === 0 ? Math.sin(position * freq) : Math.cos(position * freq);
  });
}

// ---------------------------------------------------------- the tiny attention model

export type Model = {
  vocab: number;
  width: number;
  context: number;
  E: Mat; // vocab x width, tied with the output
  P: Mat; // context x width, learned positions
  Wq: Mat;
  Wk: Mat;
  Wv: Mat;
  steps: number;
  loss: number;
};

export function makeModel(vocab: number, width: number, context: number, seed = 1): Model {
  const next = rng(seed);
  const s = 1 / Math.sqrt(width);
  return {
    vocab,
    width,
    context,
    E: gaussMat(vocab, width, 0.5, next),
    P: gaussMat(context, width, 0.2, next),
    Wq: gaussMat(width, width, s, next),
    Wk: gaussMat(width, width, s, next),
    Wv: gaussMat(width, width, s, next),
    steps: 0,
    loss: 0,
  };
}

export function paramCount(m: Model) {
  return {
    table: m.vocab * m.width,
    positions: m.context * m.width,
    attention: 3 * m.width * m.width,
    output: 0, // tied to the table
    total: m.vocab * m.width + m.context * m.width + 3 * m.width * m.width,
  };
}

export type Pass = {
  x: Mat; // stream on entry: embedding plus position
  q: Mat;
  k: Mat;
  v: Mat;
  scores: Mat; // masked, scaled
  weights: Mat;
  mixed: Mat; // weights applied to v
  h: Mat; // stream after the residual add
  logits: Mat;
  probs: Mat;
};

const matmul = (A: Mat, B: Mat): Mat => A.map((row) => B[0].map((_, j) => row.reduce((s, a, k) => s + a * B[k][j], 0)));
const transpose = (A: Mat): Mat => A[0].map((_, j) => A.map((row) => row[j]));

/** the whole model on a sequence of token ids, every intermediate kept. */
export function forward(m: Model, ids: number[], causal = true): Pass {
  const n = ids.length;
  const x = ids.map((id, p) => m.E[id].map((v, d) => v + m.P[p][d]));
  const q = matmul(x, m.Wq);
  const k = matmul(x, m.Wk);
  const v = matmul(x, m.Wv);
  const scale = Math.sqrt(m.width);
  const scores: Mat = [];
  const weights: Mat = [];
  for (let i = 0; i < n; i++) {
    const row = k.map((kj, j) => (causal && j > i ? -Infinity : dot(q[i], kj) / scale));
    scores.push(row);
    weights.push(softmax(row));
  }
  const mixed = weights.map((w) => {
    const acc = zeros(m.width);
    for (let j = 0; j < n; j++) if (w[j] > 0) for (let d = 0; d < m.width; d++) acc[d] += w[j] * v[j][d];
    return acc;
  });
  const h = x.map((xi, i) => xi.map((val, d) => val + mixed[i][d]));
  const logits = h.map((hi) => m.E.map((row) => dot(hi, row)));
  const probs = logits.map(softmax);
  return { x, q, k, v, scores, weights, mixed, h, logits, probs };
}

/** cross entropy of the next token at every position, averaged. */
export function lossOf(pass: Pass, ids: number[]) {
  let total = 0;
  let count = 0;
  for (let i = 0; i + 1 < ids.length; i++) {
    total -= Math.log(pass.probs[i][ids[i + 1]] + 1e-12);
    count += 1;
  }
  return count ? total / count : 0;
}

export type Grads = { E: Mat; P: Mat; Wq: Mat; Wk: Mat; Wv: Mat };

/**
 * backpropagation through the whole thing, by hand. each line is the
 * derivative of the matching line of `forward`, in reverse order.
 */
export function backward(m: Model, ids: number[]): { grads: Grads; loss: number; pass: Pass } {
  const pass = forward(m, ids);
  const n = ids.length;
  const count = Math.max(1, n - 1);
  const g: Grads = { E: zeroMat(m.vocab, m.width), P: zeroMat(m.context, m.width), Wq: zeroMat(m.width, m.width), Wk: zeroMat(m.width, m.width), Wv: zeroMat(m.width, m.width) };

  // the loss against the logits: probability minus one-hot, at every position but the last
  const dlogits: Mat = pass.probs.map((p, i) => (i + 1 < n ? p.map((v, t) => (v - (t === ids[i + 1] ? 1 : 0)) / count) : zeros(m.vocab)));
  // logits = h E^T, so dh = dlogits E and dE += dlogits^T h
  const dh: Mat = dlogits.map((row) => {
    const acc = zeros(m.width);
    for (let t = 0; t < m.vocab; t++) if (row[t] !== 0) for (let d = 0; d < m.width; d++) acc[d] += row[t] * m.E[t][d];
    return acc;
  });
  for (let i = 0; i < n; i++) for (let t = 0; t < m.vocab; t++) if (dlogits[i][t] !== 0) for (let d = 0; d < m.width; d++) g.E[t][d] += dlogits[i][t] * pass.h[i][d];
  // h = x + mixed
  const dx: Mat = dh.map((row) => row.slice());
  const dmixed = dh;
  // mixed_i = sum_j w_ij v_j
  const dw: Mat = zeroMat(n, n);
  const dv: Mat = zeroMat(n, m.width);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      dw[i][j] = dot(dmixed[i], pass.v[j]);
      for (let d = 0; d < m.width; d++) dv[j][d] += pass.weights[i][j] * dmixed[i][d];
    }
  }
  // softmax backward, row by row
  const dscores: Mat = zeroMat(n, n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j <= i; j++) s += dw[i][j] * pass.weights[i][j];
    for (let j = 0; j <= i; j++) dscores[i][j] = pass.weights[i][j] * (dw[i][j] - s);
  }
  // scores_ij = q_i . k_j / sqrt(width)
  const scale = Math.sqrt(m.width);
  const dq: Mat = zeroMat(n, m.width);
  const dk: Mat = zeroMat(n, m.width);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      const ds = dscores[i][j] / scale;
      if (ds === 0) continue;
      for (let d = 0; d < m.width; d++) {
        dq[i][d] += ds * pass.k[j][d];
        dk[j][d] += ds * pass.q[i][d];
      }
    }
  }
  // q = x Wq and so on: dW = x^T dq, dx += dq Wq^T
  const xT = transpose(pass.x);
  const addW = (dW: Mat, dOut: Mat) => {
    const got = matmul(xT, dOut);
    for (let a = 0; a < m.width; a++) for (let b = 0; b < m.width; b++) dW[a][b] += got[a][b];
  };
  addW(g.Wq, dq);
  addW(g.Wk, dk);
  addW(g.Wv, dv);
  const back = (dOut: Mat, W: Mat) => {
    const WT = transpose(W);
    const got = matmul(dOut, WT);
    for (let i = 0; i < n; i++) for (let d = 0; d < m.width; d++) dx[i][d] += got[i][d];
  };
  back(dq, m.Wq);
  back(dk, m.Wk);
  back(dv, m.Wv);
  // x_i = E[id_i] + P[i]
  for (let i = 0; i < n; i++) {
    for (let d = 0; d < m.width; d++) {
      g.E[ids[i]][d] += dx[i][d];
      g.P[i][d] += dx[i][d];
    }
  }
  return { grads: g, loss: lossOf(pass, ids), pass };
}

/** every parameter as one list and back, for the optimiser and the check. */
export function flatten(m: Model): number[] {
  return [...m.E.flat(), ...m.P.flat(), ...m.Wq.flat(), ...m.Wk.flat(), ...m.Wv.flat()];
}
export function flattenGrads(g: Grads): number[] {
  return [...g.E.flat(), ...g.P.flat(), ...g.Wq.flat(), ...g.Wk.flat(), ...g.Wv.flat()];
}
export function unflatten(m: Model, flat: number[]) {
  let at = 0;
  for (const M of [m.E, m.P, m.Wq, m.Wk, m.Wv]) for (const row of M) for (let j = 0; j < row.length; j++) row[j] = flat[at++];
}

/** the same gradient by nudging every parameter, for checking. slow, so a small model only. */
export function numericalGrad(m: Model, ids: number[], eps = 1e-4): number[] {
  const flat = flatten(m);
  const out = zeros(flat.length);
  for (let i = 0; i < flat.length; i++) {
    const keep = flat[i];
    flat[i] = keep + eps;
    unflatten(m, flat);
    const up = lossOf(forward(m, ids), ids);
    flat[i] = keep - eps;
    unflatten(m, flat);
    const down = lossOf(forward(m, ids), ids);
    flat[i] = keep;
    out[i] = (up - down) / (2 * eps);
  }
  unflatten(m, flat);
  return out;
}

export function worstDisagreement(a: number[], b: number[]) {
  let worst = 0;
  for (let i = 0; i < a.length; i++) {
    const rel = Math.abs(a[i] - b[i]) / Math.max(1e-6, Math.abs(a[i]) + Math.abs(b[i]));
    worst = Math.max(worst, rel);
  }
  return worst;
}

/** Adam, on the flat list. */
export function adam(size: number, rate: number) {
  const v = zeros(size);
  const s = zeros(size);
  let t = 0;
  return (p: number[], g: number[]) => {
    t += 1;
    for (let i = 0; i < size; i++) {
      v[i] = 0.9 * v[i] + 0.1 * g[i];
      s[i] = 0.999 * s[i] + 0.001 * g[i] * g[i];
      p[i] -= (rate * (v[i] / (1 - 0.9 ** t))) / (Math.sqrt(s[i] / (1 - 0.999 ** t)) + 1e-8);
    }
  };
}

/** one training step on a random window of the corpus. */
export function trainStep(m: Model, corpus: number[], step: (p: number[], g: number[]) => void, next: () => number) {
  const start = Math.floor(next() * (corpus.length - m.context - 1));
  const ids = corpus.slice(start, start + m.context);
  const { grads, loss } = backward(m, ids);
  const flat = flatten(m);
  step(flat, flattenGrads(grads));
  unflatten(m, flat);
  m.steps += 1;
  m.loss = m.steps === 1 ? loss : 0.98 * m.loss + 0.02 * loss;
  return loss;
}

// ------------------------------------------------------------------ decoding

export type Decoding = { temperature: number; topK: number; topP: number; penalty: number };

export const GREEDY: Decoding = { temperature: 0, topK: 0, topP: 1, penalty: 0 };

/**
 * the distribution the decoding rule actually draws from, built from the raw
 * scores: temperature divides, penalties subtract, top-k and nucleus cut, and
 * what is left is renormalised. returned in vocabulary order with the cut
 * entries at zero, so a page can show what was removed.
 */
export function shape(logits: Vec, rule: Decoding, seen: number[] = []): Vec {
  if (rule.temperature <= 0) {
    const best = logits.reduce((b, v, i) => (v > logits[b] ? i : b), 0);
    return logits.map((_, i) => (i === best ? 1 : 0));
  }
  const z = logits.map((v, i) => v / rule.temperature - (seen.includes(i) ? rule.penalty : 0));
  let p = softmax(z);
  const order = p.map((_, i) => i).sort((a, b) => p[b] - p[a]);
  const keep = new Set<number>();
  let mass = 0;
  for (let r = 0; r < order.length; r++) {
    if (rule.topK > 0 && r >= rule.topK) break;
    if (rule.topP < 1 && mass >= rule.topP) break;
    keep.add(order[r]);
    mass += p[order[r]];
  }
  p = p.map((v, i) => (keep.has(i) ? v : 0));
  const total = p.reduce((a, b) => a + b, 0);
  return p.map((v) => v / total);
}

export function draw(p: Vec, next: () => number) {
  let u = next();
  for (let i = 0; i < p.length; i++) {
    u -= p[i];
    if (u <= 0) return i;
  }
  return p.length - 1;
}

/** perplexity: the exponential of the average loss, an effective number of choices. */
export const perplexity = (loss: number) => Math.exp(loss);
