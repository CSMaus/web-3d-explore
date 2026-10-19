/**
 * runs the mathematics of topic 3 and prints what it measures.
 *
 *   npm run check:net
 *
 * the important one is the gradient check: backpropagation against the
 * definition of a derivative. everything else on the pages rests on it.
 */
import {
  agree,
  backward,
  descend,
  forward,
  gradFlat,
  make,
  numerical,
  params,
  rng,
  solveLinear,
  train,
  work,
  type Act,
  type Init,
  type LossKind,
  type OptKind,
} from "../src/systems/net.ts";
import { dataset, perceptron } from "../src/systems/learn.ts";
import { CURVES, fade, gap, logit, nudge, slowdown, staircase, stepsTo } from "../src/systems/depth.ts";

const f = (n: number, d = 4) => n.toFixed(d);
const row = (a: string, b: string, c = "") => console.log(`  ${a.padEnd(30)} ${b.padStart(14)}   ${c}`);

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

console.log("\nGRADIENT CHECK, backpropagation against the definition");
const smooth: [number[], Act, Act, LossKind][] = [
  [[2, 3, 1], "sigmoid", "sigmoid", "mse"],
  [[2, 3, 1], "tanh", "linear", "mse"],
  [[2, 4, 4, 1], "tanh", "linear", "mse"],
  [[2, 5, 3], "tanh", "softmax", "crossentropy"],
  [[3, 6, 6, 2], "sigmoid", "softmax", "crossentropy"],
  [[4, 8, 8, 8, 2], "tanh", "linear", "mse"],
];
for (const [sizes, act, out, kind] of smooth) {
  const net = make(sizes, act, out, "xavier", 7);
  const batch = sample(sizes, kind);
  const a = gradFlat(net, backward(net, batch, kind).grad);
  const b = gradFlat(net, numerical(net, batch, kind));
  const { worst } = agree(a, b);
  row(
    `${sizes.join("-")} ${act} -> ${out}`,
    worst.toExponential(2),
    `${params(net).total} params  ${worst < 1e-6 ? "agree" : "DISAGREE"}`,
  );
}

console.log("\n  and the kink, which the definition cannot see past:");
{
  const net = make([2, 4, 4, 1], "relu", "linear", "xavier", 7);
  const batch = sample([2, 4, 4, 1], "mse");
  const a = gradFlat(net, backward(net, batch, "mse").grad);
  const b = gradFlat(net, numerical(net, batch, "mse"));
  let nearest = Infinity;
  for (const x of batch.X) for (const v of forward(net, x).z.flat()) nearest = Math.min(nearest, Math.abs(v));
  row("Relu, worst disagreement", agree(a, b).worst.toExponential(2), "");
  row("Closest unit to the kink", nearest.toExponential(2), "A rectifier is not differentiable at 0");
}

console.log("\n  the step size the check is taken at, on a 3-6-6-2 net:");
{
  const sizes = [3, 6, 6, 2];
  const net = make(sizes, "sigmoid", "softmax", "xavier", 7);
  const batch = sample(sizes, "crossentropy");
  const a = gradFlat(net, backward(net, batch, "crossentropy").grad);
  for (const eps of [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-8]) {
    const b = gradFlat(net, numerical(net, batch, "crossentropy", eps));
    row(`eps ${eps.toExponential(0)}`, agree(a, b).worst.toExponential(2), "");
  }
  console.log("  Truncation falls as the step squared, rounding grows as its reciprocal,");
  console.log("  So the best step is where they meet and both sides of it look worse.");
}

console.log("\nWORK PER PASS, counted");
for (const sizes of [[2, 3, 1], [5, 10, 10, 3], [20, 64, 64, 10]]) {
  const net = make(sizes, "relu", "linear", "he", 3);
  const w = work(net);
  row(sizes.join("-"), String(params(net).total), `forward ${w.forward}, backward ${w.backward}, ratio ${w.ratio}`);
}

console.log("\nDEPTH WITHOUT AN ACTIVATION BUYS NOTHING");
{
  const deep = make([3, 6, 6, 2], "linear", "linear", "xavier", 5);
  const next = rng(4);
  const zero = forward(deep, [0, 0, 0]).a[3];
  const basis = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => forward(deep, e).a[3]);
  let worst = 0;
  for (let t = 0; t < 8; t++) {
    const x = Array.from({ length: 3 }, () => next() * 4 - 2);
    const got = forward(deep, x).a[3];
    const want = got.map((_, i) => zero[i] + x.reduce((s, xj, j) => s + xj * (basis[j][i] - zero[i]), 0));
    for (let i = 0; i < got.length; i++) worst = Math.max(worst, Math.abs(got[i] - want[i]));
  }
  row("3-6-6-2 against one matrix", worst.toExponential(2), worst < 1e-12 ? "identical" : "DIFFERENT");
}

console.log("\nINITIALISATION: what reaches layer eight");
for (const [kind, act] of [
  ["uniform", "tanh"],
  ["xavier", "tanh"],
  ["uniform", "relu"],
  ["he", "relu"],
  ["zeros", "tanh"],
] as [Init, Act][]) {
  const sizes = new Array(8).fill(40);
  const net = make(sizes, act, "linear", kind, 12);
  const next = rng(9);
  const fwd: number[][] = sizes.map(() => []);
  const back: number[][] = sizes.map(() => []);
  for (let s = 0; s < 120; s++) {
    const u = Math.max(next(), 1e-12);
    const x = Array.from({ length: 40 }, () =>
      Math.sqrt(-2 * Math.log(Math.max(next(), 1e-12))) * Math.cos(2 * Math.PI * next()) * 0 +
      Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next()),
    );
    const y = new Array(40).fill(0);
    const { a } = forward(net, x);
    for (let l = 0; l < sizes.length; l++) fwd[l].push(...a[l]);
    const g = backward(net, { X: [x], Y: [y] }, "mse").grad;
    for (let l = 0; l < g.db.length; l++) back[l].push(...g.db[l]);
  }
  const spread = (xs: number[]) => {
    const m = xs.reduce((p, q) => p + q, 0) / xs.length;
    return xs.reduce((p, q) => p + (q - m) ** 2, 0) / xs.length;
  };
  row(
    `${kind} + ${act}`,
    spread(fwd[7]).toExponential(1),
    `signal in, ${spread(back[0]).toExponential(1)} gradient at the first layer`,
  );
}

console.log("\nSOLVING A LINEAR NET IN ONE SHOT");
{
  const next = rng(21);
  const X = Array.from({ length: 40 }, () => [next() * 2 - 1, next() * 2 - 1]);
  const truth = [1.7, -0.6, 0.35];
  const Y = X.map(([a, b]) => [truth[0] * a + truth[1] * b + truth[2] + (next() - 0.5) * 0.05]);
  const fit = solveLinear(X, Y);
  row("recovered", fit.weights[0].map((v) => f(v, 3)).join(", ") + `, ${f(fit.bias[0], 3)}`, `truth ${truth.join(", ")}`);
  row("Residual, least squares", fit.residual.toExponential(3), "The minimum, by construction");
  const net = make([2, 1], "linear", "linear", "xavier", 3);
  const after = train(net, { X, Y }, "mse", "sgd", 0.2, 4000, 40, 1);
  row("Residual, after descent", after.loss.toExponential(3), `${after.steps} steps of gradient descent`);
}

console.log("\nWHERE THE CLOSED FORM STOPS");
{
  const xor = dataset("xor", 4, 1);
  const linear = solveLinear(xor.X, xor.Y);
  row("Linear least squares on XOR", linear.residual.toExponential(3), "The best a straight line can do");
  const net = make([2, 4, 1], "tanh", "sigmoid", "xavier", 8);
  const done = train(net, xor, "mse", "adam", 0.08, 4000, 4, 1);
  row("One hidden layer, trained", done.loss.toExponential(3), `${done.steps} steps`);
}

console.log("\nOPTIMISERS ON THE SAME PROBLEM, steps to reach a loss of 0.01");
for (const kind of ["sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adam"] as OptKind[]) {
  const net = make([2, 8, 1], "tanh", "sigmoid", "xavier", 4);
  const data = dataset("xor", 4, 1);
  const out = train(net, data, "mse", kind, kind === "sgd" || kind === "momentum" || kind === "nesterov" ? 0.5 : 0.05, 20000, 4, 1, 0.01);
  row(kind, out.reached ? String(out.steps) : "Not reached", `final loss ${out.loss.toExponential(2)}`);
}

console.log("\nTHE PERCEPTRON");
for (const kind of ["split", "xor"] as const) {
  const data = dataset(kind, kind === "xor" ? 4 : 60, 3);
  const p = perceptron(data, 4000);
  row(
    kind === "split" ? "Linearly separable" : "Exclusive or",
    p.converged ? `${p.updates} updates` : "never",
    p.converged ? "The convergence theorem" : `${p.wrong} of ${data.X.length} still wrong`,
  );
}

console.log("\nDESCENT ON A SURFACE WITH A KNOWN MINIMUM");
{
  const bowl = (p: number[]) => 0.5 * (p[0] ** 2 + 8 * p[1] ** 2);
  const slope = (p: number[]) => [p[0], 8 * p[1]];
  for (const rate of [0.02, 0.12, 0.24, 0.26]) {
    const walk = descend(bowl, slope, [3, 1.4], rate, 400);
    row(
      `rate ${rate}`,
      walk.diverged ? "Ran away" : f(walk.loss, 8),
      walk.diverged ? "The step is longer than the valley is wide" : `${walk.path.length} steps`,
    );
  }
  row("Stable while", "Rate < 2/8 = 0.25", "Twice the reciprocal of the sharpest curvature");
}
console.log("");

console.log("\nTHE REASONS BEHIND THE PAGES, measured");
{
  const data = dataset("split", 60, 3);
  const w = [0.6, 0.4];
  const near = data.X.reduce((best, p) => (Math.abs(w[0] * p[0] + w[1] * p[1]) < Math.abs(w[0] * best[0] + w[1] * best[1]) ? p : best), data.X[0]);
  const z0 = w[0] * near[0] + w[1] * near[1];
  const out = nudge(w, 0, near, data, 0.01 * -Math.sign(z0) * Math.sign(near[0]), 300);
  const moves = out.smooth.slice(1).map((a, i) => Math.abs(a - out.smooth[i]));
  row("Smooth unit, largest move per nudge", Math.max(...moves).toExponential(2), "Every nudge moves it");
  row("Hard unit, nudges before the jump", String(out.flipAt - 1), "Then one jump of 1, then nothing");
  for (const [n, s] of [[8, 60], [32, 60], [64, 60], [64, 400]] as [number, number][]) {
    row(`Staircase, ${n} units at steepness ${s}`, gap(staircase(CURVES.bump.f, n, s), CURVES.bump.f).worst.toFixed(4), "Worst gap to the bump");
  }
  const slow = slowdown(logit(0.98), 0.15, 2000);
  row("Sure and wrong, squared miss", String(stepsTo(slow.mse, 0, 0.1)), "Steps to within 0.1 of the answer");
  row("Sure and wrong, cross entropy", String(stepsTo(slow.ce, 0, 0.1)), "Steps to within 0.1 of the answer");
  const rings = dataset("rings", 60, 3);
  const sizes = [2, 6, 6, 6, 6, 6, 1];
  for (const [act, init] of [["sigmoid", "uniform"], ["tanh", "xavier"], ["relu", "he"]] as [Act, Init][]) {
    row(`Six layers, ${act} + ${init}`, fade(make(sizes, act, "sigmoid", init, 4), rings).ratio.toExponential(2), "Blame at the last layer over the first");
  }
}
