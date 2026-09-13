/**
 * the shapes a network can have beyond a plain stack of full connections: a
 * convolution, a recurrent cell with gates, and attention.
 *
 * each one is written out so its mechanism can be shown rather than described.
 * they are small and deterministic on purpose: every number on the pages that
 * use them is computed here, and a reader can follow one value through by hand.
 */

import { ACTS, rng, type Mat, type Vec } from "./net.ts";

// ------------------------------------------------------------------ convolution

export type Grid = number[][];

export const KERNELS: Record<string, { label: string; k: Grid; what: string }> = {
  edgeV: {
    label: "Vertical edges",
    k: [
      [1, 0, -1],
      [2, 0, -2],
      [1, 0, -1],
    ],
    what: "Large where the left of a patch is brighter than its right, so it lights up on vertical edges",
  },
  edgeH: {
    label: "Horizontal edges",
    k: [
      [1, 2, 1],
      [0, 0, 0],
      [-1, -2, -1],
    ],
    what: "The same thing turned a quarter turn, so it lights up on horizontal edges",
  },
  blur: {
    label: "Blur",
    k: [
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
      [1 / 9, 1 / 9, 1 / 9],
    ],
    what: "The plain average of a patch, which smooths everything and finds nothing",
  },
  sharpen: {
    label: "Sharpen",
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
    what: "The centre pixel with its neighbours subtracted, which exaggerates whatever changes",
  },
  spot: {
    label: "A corner",
    k: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
    what: "Large only where one pixel differs from all eight of its neighbours at once",
  },
};

/** one patch of the input, the size of the kernel, at a given position. */
export function patch(input: Grid, row: number, col: number, size: number): Grid {
  const out: Grid = [];
  for (let r = 0; r < size; r++) {
    out.push([]);
    for (let c = 0; c < size; c++) {
      const rr = row + r;
      const cc = col + c;
      out[r].push(input[rr]?.[cc] ?? 0);
    }
  }
  return out;
}

/** the one number a patch and a kernel produce: multiply, then add up. */
export function dot(a: Grid, b: Grid): number {
  let total = 0;
  for (let r = 0; r < a.length; r++) {
    for (let c = 0; c < a[r].length; c++) total += a[r][c] * (b[r]?.[c] ?? 0);
  }
  return total;
}

export type Conv = {
  out: Grid;
  /** how many multiply-adds the whole map took, and how many weights it used */
  work: number;
  weights: number;
  /** what a fully connected layer of the same input and output would have cost */
  denseWeights: number;
};

/**
 * slide the kernel over the input and record the number at each position.
 *
 * the point of the count returned with it: the same kernel is reused at every
 * position, so a convolution has as many weights as the kernel has entries and
 * no more, however large the input is. a full connection between the same two
 * grids would need one weight per pair.
 */
export function convolve(input: Grid, k: Grid, stride = 1, bias = 0, act = "relu"): Conv {
  const size = k.length;
  const rows = Math.floor((input.length - size) / stride) + 1;
  const cols = Math.floor((input[0].length - size) / stride) + 1;
  const out: Grid = [];
  const f = ACTS[act as keyof typeof ACTS]?.f ?? ((z: number) => z);
  for (let r = 0; r < rows; r++) {
    out.push([]);
    for (let c = 0; c < cols; c++) {
      out[r].push(f(dot(patch(input, r * stride, c * stride, size), k) + bias));
    }
  }
  return {
    out,
    work: rows * cols * size * size,
    weights: size * size,
    denseWeights: input.length * input[0].length * rows * cols,
  };
}

/** the largest value in each block, which throws away where inside the block it was. */
export function pool(input: Grid, size = 2): Grid {
  const rows = Math.floor(input.length / size);
  const cols = Math.floor(input[0].length / size);
  const out: Grid = [];
  for (let r = 0; r < rows; r++) {
    out.push([]);
    for (let c = 0; c < cols; c++) {
      let most = -Infinity;
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) most = Math.max(most, input[r * size + i][c * size + j]);
      }
      out[r].push(most);
    }
  }
  return out;
}

export const PICTURES: Record<string, { label: string; make: (n: number) => Grid }> = {
  cross: {
    label: "A cross",
    make: (n) => grid(n, (r, c) => (Math.abs(r - (n - 1) / 2) < 1.5 || Math.abs(c - (n - 1) / 2) < 1.5 ? 1 : 0)),
  },
  square: {
    label: "A square",
    make: (n) => {
      const lo = Math.round(n * 0.25);
      const hi = Math.round(n * 0.75);
      return grid(n, (r, c) => (r >= lo && r <= hi && c >= lo && c <= hi ? 1 : 0));
    },
  },
  disc: {
    label: "A disc",
    make: (n) =>
      grid(n, (r, c) =>
        Math.hypot(r - (n - 1) / 2, c - (n - 1) / 2) < n * 0.3 ? 1 : 0,
      ),
  },
  stripes: {
    label: "Stripes",
    make: (n) => grid(n, (_r, c) => (Math.floor(c / 3) % 2 === 0 ? 1 : 0)),
  },
  digit: {
    label: "A seven",
    make: (n) =>
      grid(n, (r, c) => {
        const y = r / (n - 1);
        const x = c / (n - 1);
        if (y < 0.2 && x > 0.15 && x < 0.85) return 1;
        const want = 0.85 - (y - 0.2) * 0.7;
        return Math.abs(x - want) < 0.09 && y >= 0.2 ? 1 : 0;
      }),
  },
  noise: {
    label: "Noise",
    make: (n) => {
      const next = rng(7);
      return grid(n, () => (next() > 0.5 ? 1 : 0));
    },
  },
};

function grid(n: number, at: (r: number, c: number) => number): Grid {
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => at(r, c)));
}

// -------------------------------------------------------------- a recurrent cell

export type Gates = {
  forget: number;
  input: number;
  candidate: number;
  output: number;
  /** the cell's memory after this step, and what it hands on */
  cell: number;
  hidden: number;
};

export type CellWeights = {
  /** for each gate: weight on the input, weight on the previous hidden, bias */
  forget: [number, number, number];
  input: [number, number, number];
  candidate: [number, number, number];
  output: [number, number, number];
};

export const REMEMBER: CellWeights = {
  // a cell wired by hand to hold whatever it is first given. the input gate
  // reads the cell's own last output: open while that is zero, shut once the
  // memory holds something. that needs the held value to have a known sign,
  // so the page that uses it feeds a positive first number
  forget: [0, 0, 6],
  input: [0, -30, 6],
  candidate: [4, 0, 0],
  output: [0, 0, 6],
};

export const FORGETFUL: CellWeights = {
  // and one wired to hold nothing, so the contrast is visible
  forget: [0, 0, -6],
  input: [0, 0, 6],
  candidate: [4, 0, 0],
  output: [0, 0, 6],
};

const sig = ACTS.sigmoid.f;

/**
 * one step of a long short-term memory cell.
 *
 * four small units look at the same two numbers, the input now and what the
 * cell handed itself last step. the forget gate decides how much of the memory
 * survives, the input gate how much of the new candidate is let in, and the
 * output gate how much of the memory is shown to the next layer. the memory
 * itself is added to rather than replaced, which is the whole reason a value
 * can survive a long sequence.
 */
export function cellStep(w: CellWeights, x: number, prevHidden: number, prevCell: number): Gates {
  const at = (g: [number, number, number]) => g[0] * x + g[1] * prevHidden + g[2];
  const forget = sig(at(w.forget));
  const input = sig(at(w.input));
  const candidate = Math.tanh(at(w.candidate));
  const output = sig(at(w.output));
  const cell = forget * prevCell + input * candidate;
  const hidden = output * Math.tanh(cell);
  return { forget, input, candidate, output, cell, hidden };
}

export function runCell(w: CellWeights, xs: number[]): Gates[] {
  const out: Gates[] = [];
  let hidden = 0;
  let cell = 0;
  for (const x of xs) {
    const g = cellStep(w, x, hidden, cell);
    out.push(g);
    hidden = g.hidden;
    cell = g.cell;
  }
  return out;
}

/**
 * the same sequence through a plain recurrent step, which has no memory to
 * protect: the state is replaced every step rather than added to.
 */
export function runPlain(xs: number[], wx = 1, wh = 0.9, b = 0): number[] {
  const out: number[] = [];
  let h = 0;
  for (const x of xs) {
    h = Math.tanh(wx * x + wh * h + b);
    out.push(h);
  }
  return out;
}

// --------------------------------------------------------------------- attention

export type Attention = {
  tokens: string[];
  /** one row a position: how much that position drew from each other one */
  weights: Mat;
  scores: Mat;
  q: Mat;
  k: Mat;
  v: Mat;
  out: Mat;
  width: number;
};

/**
 * one head of attention over a short sequence.
 *
 * each position produces a query, a key and a value from its own vector. the
 * score between two positions is one's query against the other's key; softmax
 * turns a row of scores into weights that are positive and add to one; and the
 * new vector at a position is those weights applied to the other positions'
 * values. everything else in a transformer is layers of that.
 */
export function attend(
  tokens: string[],
  embed: Mat,
  Wq: Mat,
  Wk: Mat,
  Wv: Mat,
  causal = true,
): Attention {
  const n = tokens.length;
  const width = Wq.length;
  const apply = (W: Mat, x: Vec) => W.map((row) => row.reduce((s, w, i) => s + w * x[i], 0));
  const q = embed.map((x) => apply(Wq, x));
  const k = embed.map((x) => apply(Wk, x));
  const v = embed.map((x) => apply(Wv, x));

  const scale = Math.sqrt(width);
  const scores: Mat = [];
  const weights: Mat = [];
  for (let i = 0; i < n; i++) {
    const row: Vec = [];
    for (let j = 0; j < n; j++) {
      // the scale keeps the scores from growing with the width, which would
      // drive the softmax to pick one position and ignore the rest
      row.push(causal && j > i ? -Infinity : q[i].reduce((s, qq, d) => s + qq * k[j][d], 0) / scale);
    }
    scores.push(row);
    const top = Math.max(...row.filter(Number.isFinite));
    const e = row.map((s) => (Number.isFinite(s) ? Math.exp(s - top) : 0));
    const total = e.reduce((a, b) => a + b, 0);
    weights.push(e.map((x) => x / total));
  }

  const out = weights.map((row) => {
    const acc = new Array(width).fill(0);
    for (let j = 0; j < n; j++) for (let d = 0; d < width; d++) acc[d] += row[j] * v[j][d];
    return acc;
  });

  return { tokens, weights, scores, q, k, v, out, width };
}

/** a deterministic stand-in for trained embeddings, so the page is reproducible. */
export function fakeEmbeddings(tokens: string[], width: number): Mat {
  return tokens.map((t) => {
    let seed = 2166136261;
    for (const ch of t) {
      seed ^= ch.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
    const next = rng(Math.abs(seed) % 100000 + 1);
    return Array.from({ length: width }, () => next() * 2 - 1);
  });
}

export function randomMatrix(rows: number, cols: number, seed: number): Mat {
  const next = rng(seed);
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (next() * 2 - 1) / Math.sqrt(cols)),
  );
}

// ------------------------------------- attention with heads that do something

/** how fast the position angle turns per step. */
export const TURN = Math.PI / 5;

/**
 * a vector per token, in three parts: entries 0 and 1 carry the position as a
 * point on a circle, entry 2 is a constant one, and the rest carry the word.
 *
 * the position goes in as an angle because that is what lets a head ask for
 * "one before me" with nothing but a dot product: rotating a query back by one
 * step makes it line up with the key of the position one earlier.
 *
 * the constant entry is there because a projection is linear, so a head that
 * wants to ask the same question at every position has nothing to build that
 * question out of unless something in the vector does not vary. a real model
 * calls the same thing a bias.
 */
export const POS = 0;
export const ONE = 2;
export const WORD = 3;

export function sequence(tokens: string[], wordWidth = 6): Mat {
  return tokens.map((t, p) => {
    let seed = 2166136261;
    for (const ch of t.toLowerCase()) {
      seed ^= ch.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
    const next = rng((Math.abs(seed) % 99991) + 1);
    const word = Array.from({ length: wordWidth }, () => next() * 2 - 1);
    const norm = Math.hypot(...word) || 1;
    return [Math.cos(p * TURN), Math.sin(p * TURN), 1, ...word.map((v) => v / norm)];
  });
}

const zeros = (rows: number, cols: number): Mat =>
  Array.from({ length: rows }, () => new Array(cols).fill(0));

export type Head = {
  label: string;
  what: string;
  build: (width: number) => { Wq: Mat; Wk: Mat; Wv: Mat };
};

/**
 * four heads, three of them wired by hand so that what they do is visible.
 *
 * none of them is a fake: each is an ordinary pair of projection matrices, and
 * the weights are computed by the same dot product and softmax as any trained
 * head. they are chosen so a reader can see a pattern and say what it is.
 */
export const HEADS: Record<string, Head> = {
  previous: {
    label: "The word just before",
    what:
      "The query is the position rotated back by one step, so it lines up with the key of the position one earlier. This is how a head can mean 'look behind me' with nothing but a dot product.",
    build: (width) => {
      const Wq = zeros(width, width);
      // a rotation by minus one step, applied to the two position entries
      Wq[0][0] = Math.cos(TURN);
      Wq[0][1] = Math.sin(TURN);
      Wq[1][0] = -Math.sin(TURN);
      Wq[1][1] = Math.cos(TURN);
      const Wk = zeros(width, width);
      Wk[0][0] = 1;
      Wk[1][1] = 1;
      return { Wq: scaleMat(Wq, 30), Wk, Wv: identity(width) };
    },
  },
  first: {
    label: "The first word",
    what:
      "The query reads only the constant entry, so every position asks exactly the same question. The key is the position, so the score is largest where the position angle is zero, which is the first word.",
    build: (width) => {
      // the query is built from the constant entry alone, so it does not vary
      // with the token or the position: every row asks the same thing
      const Wq = zeros(width, width);
      Wq[0][ONE] = 30;
      const Wk = zeros(width, width);
      Wk[0][POS] = 1;
      Wk[1][POS + 1] = 1;
      return { Wq, Wk, Wv: identity(width) };
    },
  },
  same: {
    label: "The same word again",
    what:
      "The query and the key are both just the word part of the vector, so a token scores highest against itself and against any other copy of the same word. With 'the' twice in the sentence, watch the later one look back at the earlier one.",
    build: (width) => {
      const pick = zeros(width, width);
      for (let d = WORD; d < width; d++) pick[d][d] = 1;
      return { Wq: scaleMat(pick, 14), Wk: pick, Wv: identity(width) };
    },
  },
  untrained: {
    label: "Untrained",
    what:
      "Two random projections, which is what a head looks like before any training at all: every position draws about equally from every earlier one, and the pattern says nothing.",
    build: (width) => ({
      Wq: randomMatrix(width, width, 3),
      Wk: randomMatrix(width, width, 5),
      Wv: identity(width),
    }),
  },
};

function identity(n: number): Mat {
  const m = zeros(n, n);
  for (let i = 0; i < n; i++) m[i][i] = 1;
  return m;
}

function scaleMat(m: Mat, by: number): Mat {
  return m.map((row) => row.map((v) => v * by));
}


