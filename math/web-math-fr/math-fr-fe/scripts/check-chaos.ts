/**
 * runs the mathematics of topic 2 and prints what it measures, so the numbers
 * on the pages can be checked against values published elsewhere.
 *
 *   npm run check:chaos
 */
import {
  boxDimension,
  divergence,
  equilibria,
  integrate,
  kaplanYorke,
  lorenz,
  lyapunov,
  meanDivergence,
  oscillator,
  predatorPrey,
  rossler,
  section,
  step,
  vanDerPol,
  type Field,
  type Method,
} from "../src/systems/flow.ts";
import {
  cascade,
  exponent,
  logistic,
  logisticSlope,
  orbit,
  period,
  sine,
  sineSlope,
  SEED,
} from "../src/systems/maps.ts";

const f = (n: number, d = 4) => n.toFixed(d);
const line = (a: string, b: string, c = "") =>
  console.log(`  ${a.padEnd(34)} ${b.padStart(12)}   ${c}`);

console.log("\nINTEGRATOR ORDER  (undamped oscillator, one whole turn)");
for (const how of ["euler", "midpoint", "rk4"] as Method[]) {
  const err = (steps: number) => {
    const dt = (2 * Math.PI) / steps;
    let x = [1, 0];
    for (let i = 0; i < steps; i++) x = step(oscillator(0, 1), x, i * dt, dt, how);
    return Math.hypot(x[0] - 1, x[1]);
  };
  const a = err(256);
  const b = err(512);
  line(how, f(Math.log2(a / b), 2), `error ${a.toExponential(2)} then ${b.toExponential(2)}`);
}

console.log("\nEQUILIBRIA");
const planes: [string, Field, [number, number, number, number]][] = [
  ["Undamped oscillator", oscillator(0, 1), [-2, 2, -2, 2]],
  ["Damped oscillator", oscillator(0.4, 1), [-2, 2, -2, 2]],
  ["Van der Pol, mu = 1", vanDerPol(1), [-3, 3, -3, 3]],
  ["Predator and prey", predatorPrey(1, 0.5, 0.75, 0.25), [-0.5, 8, -0.5, 5]],
];
for (const [name, fld, box] of planes) {
  for (const r of equilibria(fld, box)) {
    const e = r.eigen
      .map((v) => (v.im ? `${f(v.re, 2)}${v.im > 0 ? "+" : "-"}${f(Math.abs(v.im), 2)}i` : f(v.re, 2)))
      .join(", ");
    line(name, `(${f(r.at[0], 2)}, ${f(r.at[1], 2)})`, `${e}  -> ${r.kind}`);
  }
}

console.log("\nSTRANGE ATTRACTORS");
for (const [name, fld, dt, span, pubL, pubD] of [
  ["Lorenz", lorenz(), 0.002, 0.5, 0.906, 2.062],
  ["Rossler", rossler(), 0.005, 1.0, 0.0714, 2.01],
] as const) {
  const path = integrate(fld, [1, 1, 1], dt, 800000, "rk4", 20000);
  const l = lyapunov(fld, [1, 1, 1], dt, span, 5000, 4000);
  const md = meanDivergence(fld, path);
  const ky = kaplanYorke(l.lambda, md);
  const box = boxDimension(path, 9);
  console.log(`  ${name}`);
  line("  Largest exponent", f(l.lambda), `published ${pubL}`);
  line("  Divergence at (1,1,1)", f(divergence(fld, [1, 1, 1])), "");
  line("  Mean divergence on the orbit", f(md), "= The sum of the three exponents");
  line("  Third exponent", f(ky.lambda3), "= Mean divergence less the largest");
  line("  Kaplan-Yorke dimension", f(ky.dimension, 3), `published ${pubD}`);
  line("  Box counting", f(box.dimension, 3), `over box sizes ${f(box.sizes[box.window[1]], 3)} to ${f(box.sizes[box.window[0]], 2)}`);
  line("  State spacing", f(box.spacing), "The floor below which counting is an artefact");
  if (name === "Rossler") {
    const cuts = section(path, 1, 0, [0, 2]);
    line("  Crossings of y = 0", String(cuts.length), "");
  }
}

console.log("\nTHE LOGISTIC MAP");
for (const r of [2.5, 3.2, 3.449489, 3.5, 3.56995, 3.6, 3.83, 4]) {
  const p = period(orbit(logistic(r), SEED, 400, 6000));
  line(`  r = ${r}`, f(exponent(logistic, logisticSlope, r)), p ? `period ${p}` : "aperiodic");
}
line("  r = 4 exactly", f(Math.LN2), "Which is log 2");

console.log("\nTHE CASCADE, AND UNIVERSALITY");
for (const [name, fam, from, to] of [
  ["logistic", logistic, 1.9, 4],
  ["sine", sine, 0.4, 0.95],
] as const) {
  const c = cascade(fam, 7, from, to, 0.5);
  console.log(`  ${name}`);
  c.points.forEach((p, i) => {
    line(
      `  period ${Math.pow(2, i)}`,
      f(p, 6),
      i >= 2 ? `gap ${f(c.gaps[i - 1], 6)}   ratio ${f(c.ratios[i - 2], 4)}` : "",
    );
  });
  line("  delta", f(c.delta, 4), "Feigenbaum 4.6692");
}
void sineSlope;
console.log("");
