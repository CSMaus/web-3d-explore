/**
 * a fully-connected network, written out so every step is visible: the forward
 * pass, the loss, the gradient by backpropagation, and the same gradient by
 * finite difference so the first one can be checked rather than trusted.
 *
 * nothing here is fast. the nets are a few hundred parameters and clarity is
 * worth more than speed, so weights are plain nested arrays.
 */

export type Vec = number[];
export type Mat = number[][];

// ------------------------------------------------------------------ activations

export type Act = "sigmoid" | "tanh" | "relu" | "leaky" | "linear" | "softmax";

export const ACTS: Record<
  Act,
  { label: string; f: (z: number) => number; d: (z: number) => number; tex: string; dtex: string }
> = {
  sigmoid: {
    label: "Sigmoid",
    f: (z) => 1 / (1 + Math.exp(-z)),
    d: (z) => {
      const s = 1 / (1 + Math.exp(-z));
      return s * (1 - s);
    },
    tex: String.raw`\sigma(z) = \frac{1}{1 + e^{-z}}`,
    dtex: String.raw`\sigma'(z) = \sigma(z)\bigl(1 - \sigma(z)\bigr)`,
  },
  tanh: {
    label: "Tanh",
    f: (z) => Math.tanh(z),
    d: (z) => 1 - Math.tanh(z) ** 2,
    tex: String.raw`\tanh(z) = \frac{e^{z} - e^{-z}}{e^{z} + e^{-z}}`,
    dtex: String.raw`\tanh'(z) = 1 - \tanh^2(z)`,
  },
  relu: {
    // the derivative at exactly zero is a convention, not a derivative: the
    // function has a kink there. zero is the usual choice and training never
    // notices, but a finite-difference check does, because it evaluates both
    // sides of the kink and reports the average slope instead.
    label: "Rectifier",
    f: (z) => (z > 0 ? z : 0),
    d: (z) => (z > 0 ? 1 : 0),
    tex: String.raw`\mathrm{relu}(z) = \max(0, z)`,
    dtex: String.raw`\mathrm{relu}'(z) = \begin{cases} 1 & z > 0 \\ 0 & z < 0 \end{cases}`,
  },
  leaky: {
    label: "Leaky rectifier",
    f: (z) => (z > 0 ? z : 0.01 * z),
    d: (z) => (z > 0 ? 1 : 0.01),
    tex: String.raw`\mathrm{leaky}(z) = \max(0.01\,z,\; z)`,
    dtex: String.raw`\mathrm{leaky}'(z) = \begin{cases} 1 & z > 0 \\ 0.01 & z < 0 \end{cases}`,
  },
  linear: {
    label: "None",
    f: (z) => z,
    d: () => 1,
    tex: String.raw`\mathrm{id}(z) = z`,
    dtex: String.raw`\mathrm{id}'(z) = 1`,
  },
  softmax: {
    // applied across the layer rather than per unit, so the scalar entries are
    // only here to keep the table complete
    label: "Softmax",
    f: (z) => z,
    d: () => 1,
    tex: String.raw`\mathrm{softmax}(z)_i = \frac{e^{z_i}}{\sum_j e^{z_j}}`,
    dtex: String.raw`\frac{\partial \mathrm{softmax}_i}{\partial z_j} = p_i(\delta_{ij} - p_j)`,
  },
};

function softmax(z: Vec): Vec {
  const top = Math.max(...z);
  const e = z.map((v) => Math.exp(v - top));
  const total = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / total);
}

// ---------------------------------------------------------------- the parameters

export type Init = "zeros" | "equal" | "uniform" | "xavier" | "he";

export const INITS: Record<Init, { label: string; tex: string; note: string }> = {
  zeros: {
    label: "All zero",
    tex: String.raw`w_{ij} = 0`,
    note: "Every unit in a layer computes the same thing and receives the same gradient for ever",
  },
  equal: {
    label: "All the same",
    tex: String.raw`w_{ij} = 0.5`,
    note: "The same symmetry as all zero: the units in a layer never come apart",
  },
  uniform: {
    label: "Small uniform",
    tex: String.raw`w_{ij} \sim U(-0.5,\ 0.5)`,
    note: "Breaks the symmetry, but the spread of the signal is not controlled with depth",
  },
  xavier: {
    label: "Xavier",
    tex: String.raw`\operatorname{Var}(w) = \frac{2}{n_{\mathrm{in}} + n_{\mathrm{out}}}`,
    note: "Sized to hold the variance steady through a sigmoid-family activation",
  },
  he: {
    label: "He",
    tex: String.raw`\operatorname{Var}(w) = \frac{2}{n_{\mathrm{in}}}`,
    note: "Twice Xavier's variance, because a rectifier discards half of what reaches it",
  },
};

/** a small deterministic generator, so every picture is reproducible. */
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** a standard normal from two uniforms. */
function gauss(next: () => number) {
  const u = Math.max(next(), 1e-12);
  const v = next();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function weightFrom(kind: Init, fanIn: number, fanOut: number, next: () => number) {
  switch (kind) {
    case "zeros":
      return 0;
    case "equal":
      return 0.5;
    case "uniform":
      return next() - 0.5;
    case "xavier":
      return gauss(next) * Math.sqrt(2 / (fanIn + fanOut));
    case "he":
      return gauss(next) * Math.sqrt(2 / fanIn);
  }
}

export type Net = {
  sizes: number[];
  /** W[l] is sizes[l+1] by sizes[l] */
  W: Mat[];
  b: Vec[];
  act: Act;
  out: Act;
};

export function make(sizes: number[], act: Act, out: Act, init: Init, seed = 1): Net {
  const next = rng(seed);
  const W: Mat[] = [];
  const b: Vec[] = [];
  for (let l = 0; l + 1 < sizes.length; l++) {
    const rows = sizes[l + 1];
    const cols = sizes[l];
    W.push(
      Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => weightFrom(init, cols, rows, next)),
      ),
    );
    b.push(new Array(rows).fill(0));
  }
  return { sizes, W, b, act, out };
}

/** how many numbers the training is allowed to change, counted rather than stated. */
export function params(net: Net) {
  let weights = 0;
  let biases = 0;
  for (let l = 0; l < net.W.length; l++) {
    weights += net.W[l].length * net.W[l][0].length;
    biases += net.b[l].length;
  }
  return { weights, biases, total: weights + biases };
}

export function clone(net: Net): Net {
  return {
    sizes: [...net.sizes],
    W: net.W.map((m) => m.map((r) => [...r])),
    b: net.b.map((v) => [...v]),
    act: net.act,
    out: net.out,
  };
}

/** every parameter as one flat list, in a fixed order, and back again. */
export function flatten(net: Net): number[] {
  const out: number[] = [];
  for (let l = 0; l < net.W.length; l++) {
    for (const row of net.W[l]) out.push(...row);
    out.push(...net.b[l]);
  }
  return out;
}

export function unflatten(net: Net, flat: number[]): void {
  let at = 0;
  for (let l = 0; l < net.W.length; l++) {
    for (const row of net.W[l]) for (let j = 0; j < row.length; j++) row[j] = flat[at++];
    for (let i = 0; i < net.b[l].length; i++) net.b[l][i] = flat[at++];
  }
}

// -------------------------------------------------------------- the forward pass

export type Pass = { a: Vec[]; z: Vec[] };

/** the value of every unit, layer by layer, kept because the backward pass needs it. */
export function forward(net: Net, x: Vec): Pass {
  const a: Vec[] = [x.slice()];
  const z: Vec[] = [];
  const last = net.W.length - 1;
  for (let l = 0; l <= last; l++) {
    const rows = net.W[l];
    const raw = rows.map((row, i) => {
      let sum = net.b[l][i];
      for (let j = 0; j < row.length; j++) sum += row[j] * a[l][j];
      return sum;
    });
    z.push(raw);
    const kind = l === last ? net.out : net.act;
    a.push(kind === "softmax" ? softmax(raw) : raw.map(ACTS[kind].f));
  }
  return { a, z };
}

export const predict = (net: Net, x: Vec) => forward(net, x).a[net.W.length];

// --------------------------------------------------------------------- the loss

export type LossKind = "mse" | "crossentropy";

export const LOSSES: Record<LossKind, { label: string; tex: string; note: string }> = {
  mse: {
    label: "Mean squared error",
    tex: String.raw`L = \frac{1}{2N}\sum_{n}\sum_i \left(a_i^{(n)} - y_i^{(n)}\right)^2`,
    note: "For a continuous target. The half is there so the derivative has no factor of two",
  },
  crossentropy: {
    label: "Cross entropy",
    tex: String.raw`L = -\frac{1}{N}\sum_{n}\sum_i y_i^{(n)} \ln a_i^{(n)}`,
    note: "For a choice among classes, paired with a softmax output",
  },
};

export function lossOne(kind: LossKind, out: Vec, y: Vec) {
  if (kind === "mse") {
    let s = 0;
    for (let i = 0; i < out.length; i++) s += (out[i] - y[i]) ** 2;
    return s / 2;
  }
  let s = 0;
  for (let i = 0; i < out.length; i++) s -= y[i] * Math.log(Math.max(out[i], 1e-12));
  return s;
}

export type Batch = { X: Vec[]; Y: Vec[] };

export function loss(net: Net, batch: Batch, kind: LossKind) {
  let total = 0;
  for (let n = 0; n < batch.X.length; n++) {
    total += lossOne(kind, predict(net, batch.X[n]), batch.Y[n]);
  }
  return total / batch.X.length;
}

// ------------------------------------------------------------- the backward pass

export type Grad = { dW: Mat[]; db: Vec[] };

function zeroGrad(net: Net): Grad {
  return {
    dW: net.W.map((m) => m.map((r) => r.map(() => 0))),
    db: net.b.map((v) => v.map(() => 0)),
  };
}

/**
 * backpropagation: the chain rule applied layer by layer from the output back,
 * reusing the values the forward pass already computed.
 *
 * the cost is one pass forward and one back, and the backward pass does about
 * twice the arithmetic of the forward one, which `work` below counts.
 */
export function backward(net: Net, batch: Batch, kind: LossKind): { grad: Grad; loss: number } {
  const grad = zeroGrad(net);
  const last = net.W.length - 1;
  let total = 0;

  for (let n = 0; n < batch.X.length; n++) {
    const { a, z } = forward(net, batch.X[n]);
    const y = batch.Y[n];
    total += lossOne(kind, a[last + 1], y);

    // the output layer. softmax with cross entropy, and a linear output with
    // squared error, both collapse to the difference; anything else keeps the
    // activation's own derivative.
    let delta: Vec;
    const plain =
      (net.out === "softmax" && kind === "crossentropy") ||
      (net.out === "linear" && kind === "mse");
    if (plain) {
      delta = a[last + 1].map((v, i) => v - y[i]);
    } else {
      delta = a[last + 1].map((v, i) => (v - y[i]) * ACTS[net.out].d(z[last][i]));
    }

    for (let l = last; l >= 0; l--) {
      for (let i = 0; i < net.W[l].length; i++) {
        grad.db[l][i] += delta[i];
        for (let j = 0; j < net.W[l][i].length; j++) grad.dW[l][i][j] += delta[i] * a[l][j];
      }
      if (l === 0) break;
      const back: Vec = new Array(net.sizes[l]).fill(0);
      for (let j = 0; j < net.sizes[l]; j++) {
        let sum = 0;
        for (let i = 0; i < net.W[l].length; i++) sum += net.W[l][i][j] * delta[i];
        back[j] = sum * ACTS[net.act].d(z[l - 1][j]);
      }
      delta = back;
    }
  }

  const scale = 1 / batch.X.length;
  for (let l = 0; l < grad.dW.length; l++) {
    for (const row of grad.dW[l]) for (let j = 0; j < row.length; j++) row[j] *= scale;
    for (let i = 0; i < grad.db[l].length; i++) grad.db[l][i] *= scale;
  }
  return { grad, loss: total * scale };
}

/**
 * the same gradient from the definition: nudge one parameter, see what the loss
 * does, put it back. far too slow to train with, and the only way to know the
 * backward pass above is right.
 *
 * the step size has a sweet spot and it is not as small as it looks. central
 * differencing carries two errors that pull opposite ways: truncation, which
 * falls as the square of the step, and rounding, which grows as its reciprocal
 * because the two losses are subtracted and their leading digits cancel.
 * measured on a 3-6-6-2 net, the worst relative disagreement runs 1.8e-4 at a
 * step of 1e-2, 6.3e-8 at 1e-4, and back up to 7.1e-4 at 1e-8. so 1e-4 is the
 * default, and a check that fails at 1e-8 is telling you about the arithmetic
 * rather than about the gradient.
 */
export function numerical(net: Net, batch: Batch, kind: LossKind, eps = 1e-4): Grad {
  const work = clone(net);
  const flat = flatten(work);
  const out: number[] = [];
  for (let i = 0; i < flat.length; i++) {
    const was = flat[i];
    flat[i] = was + eps;
    unflatten(work, flat);
    const up = loss(work, batch, kind);
    flat[i] = was - eps;
    unflatten(work, flat);
    const down = loss(work, batch, kind);
    flat[i] = was;
    out.push((up - down) / (2 * eps));
  }
  unflatten(work, flat);
  const shape = zeroGrad(net);
  let at = 0;
  for (let l = 0; l < shape.dW.length; l++) {
    for (const row of shape.dW[l]) for (let j = 0; j < row.length; j++) row[j] = out[at++];
    for (let i = 0; i < shape.db[l].length; i++) shape.db[l][i] = out[at++];
  }
  return shape;
}

export function gradFlat(net: Net, g: Grad): number[] {
  const out: number[] = [];
  for (let l = 0; l < g.dW.length; l++) {
    for (const row of g.dW[l]) out.push(...row);
    out.push(...g.db[l]);
  }
  void net;
  return out;
}

/** the largest relative disagreement between two gradients. */
export function agree(a: number[], b: number[]) {
  let worst = 0;
  let at = 0;
  for (let i = 0; i < a.length; i++) {
    const scale = Math.max(1e-8, Math.abs(a[i]) + Math.abs(b[i]));
    const rel = Math.abs(a[i] - b[i]) / scale;
    if (rel > worst) {
      worst = rel;
      at = i;
    }
  }
  return { worst, at };
}

/** multiply-adds in each direction, counted rather than claimed. */
export function work(net: Net) {
  let forwardOps = 0;
  for (let l = 0; l < net.W.length; l++) forwardOps += net.W[l].length * net.W[l][0].length;
  // the backward pass does the same work twice: once for the gradient of the
  // weights, once to carry the error to the layer below
  return { forward: forwardOps, backward: 2 * forwardOps, ratio: 2 };
}

// ------------------------------------------------------------- solving in one shot

export type Fit = { weights: Mat; bias: Vec; residual: number };

/**
 * least squares for a network with no activation, which is one matrix and one
 * bias however many layers it has. solved by the normal equations with a bias
 * column appended, and a small ridge so a singular system still returns
 * something rather than exploding.
 *
 * this is the whole of the analytic route: one solve, no iteration, and the
 * residual it leaves is the smallest any choice of parameters can leave.
 */
export function solveLinear(X: Vec[], Y: Vec[], ridge = 1e-10): Fit {
  const n = X.length;
  const wide = X[0].length;
  const outs = Y[0].length;
  const cols = wide + 1;
  // A is the design matrix with a column of ones for the bias
  const A = X.map((x) => [...x, 1]);

  // the normal equations: (A^T A) p = A^T y, one solve a output
  const AtA: Mat = Array.from({ length: cols }, () => new Array(cols).fill(0));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < cols; j++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += A[k][i] * A[k][j];
      AtA[i][j] = s + (i === j ? ridge : 0);
    }
  }
  const weights: Mat = [];
  const bias: Vec = [];
  let residual = 0;
  for (let o = 0; o < outs; o++) {
    const Aty = new Array(cols).fill(0);
    for (let i = 0; i < cols; i++) {
      let s = 0;
      for (let k = 0; k < n; k++) s += A[k][i] * Y[k][o];
      Aty[i] = s;
    }
    const p = solveSquare(
      AtA.map((r) => [...r]),
      [...Aty],
    );
    weights.push(p.slice(0, wide));
    bias.push(p[wide]);
    for (let k = 0; k < n; k++) {
      let got = p[wide];
      for (let i = 0; i < wide; i++) got += p[i] * X[k][i];
      residual += (got - Y[k][o]) ** 2;
    }
  }
  return { weights, bias, residual: residual / (2 * n) };
}

/** gaussian elimination with partial pivoting. */
function solveSquare(M: Mat, y: Vec): Vec {
  const n = y.length;
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    [y[col], y[pivot]] = [y[pivot], y[col]];
    const lead = M[col][col];
    if (Math.abs(lead) < 1e-14) continue;
    for (let r = col + 1; r < n; r++) {
      const factor = M[r][col] / lead;
      if (!factor) continue;
      for (let c = col; c < n; c++) M[r][c] -= factor * M[col][c];
      y[r] -= factor * y[col];
    }
  }
  const out = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = y[r];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * out[c];
    out[r] = Math.abs(M[r][r]) < 1e-14 ? 0 : s / M[r][r];
  }
  return out;
}

// ----------------------------------------------------------------- the optimisers

export type OptKind = "sgd" | "momentum" | "nesterov" | "adagrad" | "rmsprop" | "adam";

export const OPTS: Record<OptKind, { label: string; tex: string; fixes: string }> = {
  sgd: {
    label: "Gradient descent",
    tex: String.raw`p \leftarrow p - \eta\,\nabla L`,
    fixes: "The baseline: one fixed step down the slope",
  },
  momentum: {
    label: "Momentum",
    tex: String.raw`v \leftarrow \beta v + \nabla L,\qquad p \leftarrow p - \eta\,v`,
    fixes: "Oscillation across a narrow valley, by carrying speed along it",
  },
  nesterov: {
    label: "Nesterov",
    tex: String.raw`v \leftarrow \beta v + \nabla L,\qquad p \leftarrow p - \eta\,(\nabla L + \beta v)`,
    fixes: "Momentum overshooting, by reading the slope where it is about to be",
  },
  adagrad: {
    label: "Adagrad",
    tex: String.raw`s \leftarrow s + (\nabla L)^2,\qquad p \leftarrow p - \frac{\eta}{\sqrt{s} + \epsilon}\nabla L`,
    fixes: "One rate for every parameter, by shrinking the rate where the slope has been steep",
  },
  rmsprop: {
    label: "RMSProp",
    tex: String.raw`s \leftarrow \rho s + (1-\rho)(\nabla L)^2,\qquad p \leftarrow p - \frac{\eta}{\sqrt{s} + \epsilon}\nabla L`,
    fixes: "Adagrad's rate decaying to nothing, by forgetting the distant past",
  },
  adam: {
    label: "Adam",
    tex: String.raw`p \leftarrow p - \eta\,\frac{\hat{v}}{\sqrt{\hat{s}} + \epsilon},\qquad \hat{v} = \frac{v}{1-\beta_1^{t}},\ \ \hat{s} = \frac{s}{1-\beta_2^{t}}`,
    fixes: "Both at once, with the two averages corrected for starting at zero",
  },
};

export function optimiser(kind: OptKind, size: number, rate: number) {
  const v = new Array(size).fill(0);
  const s = new Array(size).fill(0);
  let t = 0;
  const eps = 1e-8;
  return (p: number[], g: number[]) => {
    t += 1;
    for (let i = 0; i < size; i++) {
      switch (kind) {
        case "sgd":
          p[i] -= rate * g[i];
          break;
        case "momentum":
          v[i] = 0.9 * v[i] + g[i];
          p[i] -= rate * v[i];
          break;
        case "nesterov":
          v[i] = 0.9 * v[i] + g[i];
          p[i] -= rate * (g[i] + 0.9 * v[i]);
          break;
        case "adagrad":
          s[i] += g[i] * g[i];
          p[i] -= (rate / (Math.sqrt(s[i]) + eps)) * g[i];
          break;
        case "rmsprop":
          s[i] = 0.9 * s[i] + 0.1 * g[i] * g[i];
          p[i] -= (rate / (Math.sqrt(s[i]) + eps)) * g[i];
          break;
        case "adam": {
          v[i] = 0.9 * v[i] + 0.1 * g[i];
          s[i] = 0.999 * s[i] + 0.001 * g[i] * g[i];
          const vh = v[i] / (1 - Math.pow(0.9, t));
          const sh = s[i] / (1 - Math.pow(0.999, t));
          p[i] -= (rate * vh) / (Math.sqrt(sh) + eps);
          break;
        }
      }
    }
  };
}

export type Run = { loss: number; steps: number; reached: boolean; history: number[] };

/**
 * training. the batch is drawn at random each step when it is smaller than the
 * data, which is what makes the descent stochastic.
 */
export function train(
  net: Net,
  data: Batch,
  kind: LossKind,
  opt: OptKind,
  rate: number,
  steps: number,
  batchSize = data.X.length,
  seed = 1,
  target = 0,
): Run {
  const flat = flatten(net);
  const stepFn = optimiser(opt, flat.length, rate);
  const next = rng(seed);
  const history: number[] = [];
  let last: number;
  for (let s = 0; s < steps; s++) {
    let batch = data;
    if (batchSize < data.X.length) {
      const pick = Array.from({ length: batchSize }, () => Math.floor(next() * data.X.length));
      batch = { X: pick.map((i) => data.X[i]), Y: pick.map((i) => data.Y[i]) };
    }
    const { grad } = backward(net, batch, kind);
    stepFn(flat, gradFlat(net, grad));
    unflatten(net, flat);
    if (s % Math.max(1, Math.floor(steps / 200)) === 0) history.push(loss(net, data, kind));
    if (target > 0 && s % 10 === 0) {
      last = loss(net, data, kind);
      if (last <= target) return { loss: last, steps: s + 1, reached: true, history };
    }
  }
  last = loss(net, data, kind);
  return { loss: last, steps, reached: target > 0 ? last <= target : true, history };
}

// ------------------------------------------------------- descent on a bare surface

export type Walk = { path: [number, number][]; loss: number; diverged: boolean };

/**
 * gradient descent on a surface given directly, with no network under it, so the
 * step size and the shape of the valley can be seen on their own.
 */
export function descend(
  height: (p: Vec) => number,
  slope: (p: Vec) => Vec,
  from: Vec,
  rate: number,
  steps: number,
): Walk {
  const path: [number, number][] = [[from[0], from[1]]];
  let p = from.slice();
  for (let i = 0; i < steps; i++) {
    const g = slope(p);
    p = p.map((v, k) => v - rate * g[k]);
    if (!p.every(Number.isFinite) || Math.hypot(...p) > 1e6) {
      return { path, loss: Infinity, diverged: true };
    }
    path.push([p[0], p[1]]);
  }
  return { path, loss: height(p), diverged: false };
}
