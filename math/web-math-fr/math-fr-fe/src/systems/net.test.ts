import { describe, expect, it } from "vitest";
import {
  agree,
  backward,
  descend,
  forward,
  gradFlat,
  loss,
  make,
  numerical,
  params,
  predict,
  rng,
  solveLinear,
  train,
  work,
  type Act,
  type Init,
  type LossKind,
} from "@/systems/net";
import { dataset, perceptron } from "@/systems/learn";

function sample(sizes: number[], kind: LossKind, seed = 11) {
  const next = rng(seed);
  const X = Array.from({ length: 5 }, () => Array.from({ length: sizes[0] }, () => next() * 2 - 1));
  const wide = sizes[sizes.length - 1];
  const Y = X.map(() => {
    if (kind === "crossentropy") {
      const one = new Array(wide).fill(0);
      one[Math.floor(next() * wide)] = 1;
      return one;
    }
    return Array.from({ length: wide }, () => next());
  });
  return { X, Y };
}

const worstGap = (sizes: number[], act: Act, out: Act, kind: LossKind, eps?: number) => {
  const net = make(sizes, act, out, "xavier", 7);
  const batch = sample(sizes, kind);
  const a = gradFlat(net, backward(net, batch, kind).grad);
  const b = gradFlat(net, numerical(net, batch, kind, eps));
  return agree(a, b).worst;
};

describe("Backpropagation, against the definition of a derivative", () => {
  it.each([
    [[2, 3, 1], "sigmoid", "sigmoid", "mse"],
    [[2, 3, 1], "tanh", "linear", "mse"],
    [[2, 4, 4, 1], "tanh", "linear", "mse"],
    [[2, 5, 3], "tanh", "softmax", "crossentropy"],
    [[3, 6, 6, 2], "sigmoid", "softmax", "crossentropy"],
    [[4, 8, 8, 8, 2], "tanh", "linear", "mse"],
  ] as [number[], Act, Act, LossKind][])(
    "%j %s into %s under %s",
    (sizes, act, out, kind) => {
      expect(worstGap(sizes, act, out, kind)).toBeLessThan(1e-6);
    },
  );

  it("The check has a best step, and both sides of it are worse", () => {
    const at = (eps: number) => worstGap([3, 6, 6, 2], "sigmoid", "softmax", "crossentropy", eps);
    const coarse = at(1e-2);
    const best = at(1e-4);
    const fine = at(1e-8);
    expect(best).toBeLessThan(coarse);
    expect(best).toBeLessThan(fine);
    // truncation falls as the square of the step: a decade coarser is a
    // hundredfold worse
    expect(at(1e-2) / at(1e-3)).toBeGreaterThan(30);
    // rounding grows as its reciprocal: a decade finer is tenfold worse
    expect(at(1e-8) / at(1e-7)).toBeGreaterThan(3);
  });

  it("A rectifier's kink defeats the check without touching the gradient", () => {
    const net = make([2, 4, 4, 1], "relu", "linear", "xavier", 7);
    const batch = sample([2, 4, 4, 1], "mse");
    let nearest = Infinity;
    for (const x of batch.X) {
      for (const v of forward(net, x).z.flat()) nearest = Math.min(nearest, Math.abs(v));
    }
    // some unit sits exactly on the kink, where there is no derivative at all
    expect(nearest).toBeLessThan(1e-6);
    expect(worstGap([2, 4, 4, 1], "relu", "linear", "mse")).toBeGreaterThan(1e-6);
    // the same shape with a smooth activation agrees
    expect(worstGap([2, 4, 4, 1], "tanh", "linear", "mse")).toBeLessThan(1e-6);
  });

  it("The backward pass does twice the arithmetic of the forward one", () => {
    for (const sizes of [[2, 3, 1], [5, 10, 10, 3], [20, 64, 64, 10]]) {
      const w = work(make(sizes, "relu", "linear", "he", 3));
      expect(w.backward).toBe(2 * w.forward);
    }
  });
});

describe("What the parts of a network are for", () => {
  it("Counts its own parameters", () => {
    expect(params(make([2, 3, 1], "tanh", "linear", "xavier")).total).toBe(13);
    expect(params(make([5, 10, 10, 3], "tanh", "linear", "xavier")).total).toBe(203);
    expect(params(make([20, 64, 64, 10], "tanh", "linear", "xavier")).total).toBe(6154);
  });

  it("Depth with no activation is one matrix and one bias", () => {
    const deep = make([3, 6, 6, 2], "linear", "linear", "xavier", 5);
    const zero = predict(deep, [0, 0, 0]);
    const basis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => predict(deep, e));
    const next = rng(4);
    let worst = 0;
    for (let t = 0; t < 8; t++) {
      const x = Array.from({ length: 3 }, () => next() * 4 - 2);
      const got = predict(deep, x);
      for (let i = 0; i < got.length; i++) {
        const want = zero[i] + x.reduce((s, xj, j) => s + xj * (basis[j][i] - zero[i]), 0);
        worst = Math.max(worst, Math.abs(got[i] - want));
      }
    }
    expect(worst).toBeLessThan(1e-12);
  });

  it("Equal weights never come apart, whatever the depth", () => {
    for (const init of ["zeros", "equal"] as Init[]) {
      const net = make([4, 6, 6, 2], "tanh", "linear", init, 3);
      const out = forward(net, [0.4, -0.2, 0.9, 0.1]);
      const layer = out.a[1];
      for (const v of layer) expect(v).toBeCloseTo(layer[0], 12);
      const g = backward(net, { X: [[0.4, -0.2, 0.9, 0.1]], Y: [[1, 0]] }, "mse").grad;
      for (const v of g.db[1]) expect(v).toBeCloseTo(g.db[1][0], 12);
    }
  });

  it("A scheme that ignores the fan-in cannot hold the signal at any width", () => {
    /**
     * a layer multiplies the variance by its fan-in times the variance of its
     * weights, so a fixed weight range gives a gain that depends on the width.
     * that is the whole reason the fan-in appears in every scheme: without it
     * the same initialisation decays at one width and explodes at another.
     */
    const carry = (init: Init, act: Act, wide: number) => {
      const sizes = new Array(9).fill(wide);
      const net = make(sizes, act, "linear", init, 12);
      const next = rng(9);
      const first: number[] = [];
      const last: number[] = [];
      for (let s = 0; s < 40; s++) {
        const x = Array.from({ length: wide }, () => next() * 2 - 1);
        const { a } = forward(net, x);
        first.push(...a[0]);
        last.push(...a[8]);
      }
      const v = (xs: number[]) => {
        const m = xs.reduce((a, b) => a + b, 0) / xs.length;
        return xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length;
      };
      return v(last) / Math.max(v(first), 1e-12);
    };

    const uniform = [20, 40, 80].map((w) => carry("uniform", "relu", w));
    const he = [20, 40, 80].map((w) => carry("he", "relu", w));

    // a fixed weight range spans orders of magnitude across those widths
    expect(Math.max(...uniform) / Math.min(...uniform)).toBeGreaterThan(100);
    // and one sized from the fan-in stays within a small factor of itself
    expect(Math.max(...he) / Math.min(...he)).toBeLessThan(20);
    // at the widest, the difference is stark
    expect(uniform[2]).toBeGreaterThan(50 * he[2]);
    // and all-zero passes nothing at all, at any width
    expect(carry("zeros", "tanh", 40)).toBe(0);
  });
});

describe("Solving in one shot, and where that stops", () => {
  it("Least squares recovers the line the data came from", () => {
    const next = rng(21);
    const X = Array.from({ length: 60 }, () => [next() * 4 - 2]);
    const Y = X.map(([x]) => [1.7 * x + 0.35 + (next() - 0.5) * 0.02]);
    const fit = solveLinear(X, Y);
    expect(fit.weights[0][0]).toBeCloseTo(1.7, 2);
    expect(fit.bias[0]).toBeCloseTo(0.35, 2);
  });

  it("And descent can only walk to the same place, never past it", () => {
    const next = rng(21);
    const X = Array.from({ length: 40 }, () => [next() * 2 - 1, next() * 2 - 1]);
    const Y = X.map(([a, b]) => [1.7 * a - 0.6 * b + 0.35 + (next() - 0.5) * 0.05]);
    const closed = solveLinear(X, Y);
    const net = make([2, 1], "linear", "linear", "xavier", 3);
    const walked = train(net, { X, Y }, "mse", "sgd", 0.2, 4000, 40, 1);
    expect(walked.loss).toBeGreaterThanOrEqual(closed.residual - 1e-9);
    expect(walked.loss).toBeCloseTo(closed.residual, 6);
  });

  it("The best a straight line can do on exclusive or is exactly one eighth", () => {
    const xor = dataset("xor", 4, 1);
    expect(solveLinear(xor.X, xor.Y).residual).toBeCloseTo(0.125, 6);
  });

  it("And one hidden layer gets far below that", () => {
    const net = make([2, 4, 1], "tanh", "sigmoid", "xavier", 8);
    const done = train(net, dataset("xor", 4, 1), "mse", "adam", 0.08, 4000, 4, 1);
    expect(done.loss).toBeLessThan(1e-4);
  });
});

describe("The perceptron", () => {
  it("Stops after finitely many updates when a separating line exists", () => {
    const run = perceptron(dataset("split", 60, 3), 4000);
    expect(run.converged).toBe(true);
    expect(run.wrong).toBe(0);
    expect(run.updates).toBeGreaterThan(0);
  });

  it("Never stops on exclusive or, and says so rather than pretending", () => {
    const run = perceptron(dataset("xor", 4, 1), 500);
    expect(run.converged).toBe(false);
    expect(run.wrong).toBeGreaterThan(0);
    expect(run.passes).toBe(500);
  });

  it("Keeps every line it drew, so the turning can be watched", () => {
    const run = perceptron(dataset("split", 40, 5), 4000);
    expect(run.history.length).toBeGreaterThan(0);
    expect(run.history.length).toBeLessThanOrEqual(run.updates);
  });
});

describe("Descent on a surface whose curvature is known", () => {
  const bowl = (p: number[]) => 0.5 * (p[0] ** 2 + 8 * p[1] ** 2);
  const slope = (p: number[]) => [p[0], 8 * p[1]];

  it("Settles below the bound and runs away above it", () => {
    // the bound is twice the reciprocal of the sharpest curvature: 2/8 = 0.25
    expect(descend(bowl, slope, [3, 1.4], 0.24, 400).diverged).toBe(false);
    expect(descend(bowl, slope, [3, 1.4], 0.26, 400).diverged).toBe(true);
  });

  it("Reaches the minimum it was pointed at", () => {
    const walk = descend(bowl, slope, [3, 1.4], 0.12, 400);
    expect(walk.loss).toBeLessThan(1e-9);
  });

  it("Keeps the whole path, one point a step", () => {
    const walk = descend(bowl, slope, [3, 1.4], 0.05, 37);
    expect(walk.path.length).toBe(38);
  });
});

describe("The family of methods", () => {
  const reach = (kind: Parameters<typeof train>[3], rate: number) => {
    const net = make([2, 8, 1], "tanh", "sigmoid", "xavier", 4);
    return train(net, dataset("xor", 4, 1), "mse", kind, rate, 20000, 4, 1, 0.01);
  };

  it("Every one of them gets there", () => {
    for (const kind of ["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adam"] as const) {
      const fast = kind === "sgd" || kind === "momentum" || kind === "nesterov";
      expect(reach(kind, fast ? 0.5 : 0.05).reached, kind).toBe(true);
    }
  });

  it("And the ones built to be faster are", () => {
    const plain = reach("sgd", 0.5).steps;
    expect(reach("momentum", 0.5).steps).toBeLessThan(plain);
    expect(reach("adam", 0.05).steps).toBeLessThan(plain);
    expect(reach("rmsprop", 0.05).steps).toBeLessThan(plain);
  });

  it("A batch smaller than the data makes the descent stochastic", () => {
    const data = dataset("rings", 60, 3);
    const whole = make([2, 8, 1], "tanh", "sigmoid", "xavier", 4);
    const part = make([2, 8, 1], "tanh", "sigmoid", "xavier", 4);
    const a = train(whole, data, "mse", "sgd", 0.2, 300, 60, 1);
    const b = train(part, data, "mse", "sgd", 0.2, 300, 8, 1);
    // the same start and the same number of steps, and different answers,
    // because the second one only ever saw eight examples at a time
    expect(Math.abs(a.loss - b.loss)).toBeGreaterThan(0);
    expect(loss(whole, data, "mse")).toBeCloseTo(a.loss, 12);
  });
});

describe("The shapes a network can have instead", () => {
  it("A convolution's response is the patch against the kernel, by hand", async () => {
    const { KERNELS, PICTURES, convolve, dot, patch } = await import("@/systems/shapes");
    const img = PICTURES.square.make(16);
    const c = convolve(img, KERNELS.edgeV.k, 1, 0, "linear");
    for (const [r, col] of [
      [5, 3],
      [8, 8],
      [2, 11],
    ] as [number, number][]) {
      expect(c.out[r][col]).toBeCloseTo(dot(patch(img, r, col, 3), KERNELS.edgeV.k), 12);
    }
  });

  it("It owns the kernel's weights and no more, whatever the picture size", async () => {
    const { KERNELS, PICTURES, convolve } = await import("@/systems/shapes");
    for (const n of [12, 20, 40]) {
      const c = convolve(PICTURES.disc.make(n), KERNELS.blur.k);
      expect(c.weights).toBe(9);
      // a full connection between the two grids would grow with the fourth
      // power of the size, which is the whole reason a convolution exists
      expect(c.denseWeights).toBe(n * n * c.out.length * c.out[0].length);
    }
    const small = convolve(PICTURES.disc.make(12), KERNELS.blur.k);
    const large = convolve(PICTURES.disc.make(40), KERNELS.blur.k);
    expect(large.denseWeights / small.denseWeights).toBeGreaterThan(50);
    expect(large.weights).toBe(small.weights);
  });

  it("Pooling halves the map and keeps the largest value in each block", async () => {
    const { pool } = await import("@/systems/shapes");
    const g = [
      [1, 9, 2, 0],
      [3, 4, 5, 6],
      [0, 0, 7, 1],
      [2, 2, 1, 1],
    ];
    expect(pool(g, 2)).toEqual([
      [9, 6],
      [2, 7],
    ]);
  });

  it("A gated cell keeps a value that a plain step loses", async () => {
    const { REMEMBER, FORGETFUL, runCell, runPlain } = await import("@/systems/shapes");
    const seq = [1, ...new Array(19).fill(0)];
    const kept = runCell(REMEMBER, seq);
    const lost = runCell(FORGETFUL, seq);
    const plain = runPlain(seq);
    // the cell wired to hold on still has most of it twenty steps later
    expect(Math.abs(kept[19].cell / kept[0].cell)).toBeGreaterThan(0.5);
    // the one wired to let go has none
    expect(Math.abs(lost[19].cell)).toBeLessThan(1e-6);
    // and a plain step, which multiplies rather than adds, has almost none
    expect(Math.abs(plain[19] / plain[0])).toBeLessThan(0.15);
  });

  it("The gates are what decide that, and they are ordinary units", async () => {
    const { REMEMBER, FORGETFUL, runCell } = await import("@/systems/shapes");
    const seq = [1, ...new Array(9).fill(0)];
    const kept = runCell(REMEMBER, seq)[9];
    const lost = runCell(FORGETFUL, seq)[9];
    // every gate is squashed into nought to one, so it reads as how far open
    for (const g of [kept, lost]) {
      for (const v of [g.forget, g.input, g.output]) {
        expect(v).toBeGreaterThan(0);
        expect(v).toBeLessThan(1);
      }
    }
    expect(kept.forget).toBeGreaterThan(0.9);
    expect(lost.forget).toBeLessThan(0.1);
    // and the memory is exactly forget times the old plus input times the new
    const before = runCell(REMEMBER, seq)[8];
    expect(kept.cell).toBeCloseTo(kept.forget * before.cell + kept.input * kept.candidate, 12);
  });

  it("Attention's weights are positive and add to one on every row", async () => {
    const { HEADS, attend, sequence } = await import("@/systems/shapes");
    const tokens = "the cat sat on the mat".split(" ");
    const embed = sequence(tokens);
    for (const key of Object.keys(HEADS)) {
      const { Wq, Wk, Wv } = HEADS[key].build(embed[0].length);
      const a = attend(tokens, embed, Wq, Wk, Wv);
      for (const row of a.weights) {
        expect(row.reduce((s, v) => s + v, 0)).toBeCloseTo(1, 10);
        for (const v of row) expect(v).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("The mask stops any position seeing a later one", async () => {
    const { HEADS, attend, sequence } = await import("@/systems/shapes");
    const tokens = "a b c d".split(" ");
    const embed = sequence(tokens);
    const { Wq, Wk, Wv } = HEADS.untrained.build(embed[0].length);
    const masked = attend(tokens, embed, Wq, Wk, Wv, true);
    for (let i = 0; i < tokens.length; i++) {
      for (let j = i + 1; j < tokens.length; j++) expect(masked.weights[i][j]).toBe(0);
    }
    const open = attend(tokens, embed, Wq, Wk, Wv, false);
    expect(open.weights[0].filter((v) => v > 0).length).toBe(4);
  });

  it("The hand-wired heads do what they are named for", async () => {
    const { HEADS, attend, sequence } = await import("@/systems/shapes");
    const tokens = "the cat sat on the mat".split(" ");
    const embed = sequence(tokens);
    const peak = (key: string) => {
      const { Wq, Wk, Wv } = HEADS[key].build(embed[0].length);
      const a = attend(tokens, embed, Wq, Wk, Wv);
      return a.weights.map((row) => row.indexOf(Math.max(...row)));
    };

    // one before me, from position three onward where there is room for it
    const back = peak("previous");
    for (let i = 2; i < tokens.length; i++) expect(back[i], `row ${i}`).toBe(i - 1);

    // the first word, from every position
    const first = peak("first");
    for (let i = 1; i < tokens.length; i++) expect(first[i], `row ${i}`).toBe(0);

    // and the same word again: the second "the" finds the first one
    const { Wq, Wk, Wv } = HEADS.same.build(embed[0].length);
    const same = attend(tokens, embed, Wq, Wk, Wv);
    expect(same.weights[4][0]).toBeGreaterThan(0.3);
    expect(same.weights[4][1]).toBeLessThan(0.1);
  });
});
