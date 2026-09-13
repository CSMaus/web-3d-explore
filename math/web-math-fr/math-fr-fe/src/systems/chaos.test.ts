import { describe, expect, it } from "vitest";
import {
  boxDimension,
  classify,
  divergence,
  eigen2,
  equilibria,
  integrate,
  jacobian,
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
} from "@/systems/flow";
import {
  SEED,
  cascade,
  compose,
  exponent,
  logistic,
  logisticSlope,
  orbit,
  period,
  sine,
  superstable,
} from "@/systems/maps";

const TURN = 2 * Math.PI;

describe("The integrators, against an answer that is known exactly", () => {
  // the undamped oscillator returns to where it started after a whole turn
  const errorAfter = (how: "euler" | "midpoint" | "rk4", steps: number) => {
    const f = oscillator(0, 1);
    const dt = TURN / steps;
    let x = [1, 0];
    for (let i = 0; i < steps; i++) x = step(f, x, i * dt, dt, how);
    return Math.hypot(x[0] - 1, x[1]);
  };

  it.each([
    ["euler", 1],
    ["midpoint", 2],
    ["rk4", 4],
  ] as const)("%s is order %i", (how, order) => {
    // measured at 256 and 512 steps rather than 128 and 256, because Euler
    // approaches its order from above and is still reporting 1.06 at the
    // coarser pair. every method here is asymptotic, not exact at any step.
    const coarse = errorAfter(how, 256);
    const fine = errorAfter(how, 512);
    const measured = Math.log2(coarse / fine);
    expect(measured).toBeGreaterThan(order - 0.1);
    expect(measured).toBeLessThan(order + 0.1);
  });

  it("The end of the run has to land on a whole turn, or the order is wrong", () => {
    // 63 steps of 0.1 overshoots one turn by 0.0168, and that offset alone is
    // an error of about 1.7e-2 whatever the method. this is the trap.
    const f = oscillator(0, 1);
    const sloppy = (how: "euler" | "rk4") => {
      const dt = 0.1;
      let x = [1, 0];
      for (let i = 0; i < 63; i++) x = step(f, x, i * dt, dt, how);
      return Math.hypot(x[0] - 1, x[1]);
    };
    expect(sloppy("rk4")).toBeGreaterThan(1e-2);
    expect(errorAfter("rk4", 64)).toBeLessThan(1e-5);
  });

  it("Only the accurate method keeps the oscillator's energy", () => {
    const f = oscillator(0, 1);
    const after = (how: "euler" | "rk4") => {
      const dt = 0.01;
      let x = [1, 0];
      for (let i = 0; i < Math.round((100 * TURN) / dt); i++) x = step(f, x, i * dt, dt, how);
      return 0.5 * (x[0] ** 2 + x[1] ** 2);
    };
    expect(after("rk4")).toBeCloseTo(0.5, 5);
    expect(after("euler")).toBeGreaterThan(100);
  });
});

describe("The local picture at an equilibrium", () => {
  it("The jacobian of the oscillator is its own matrix", () => {
    const j = jacobian(oscillator(0.4, 1), [0, 0]);
    expect(j[0][0]).toBeCloseTo(0, 6);
    expect(j[0][1]).toBeCloseTo(1, 6);
    expect(j[1][0]).toBeCloseTo(-1, 6);
    expect(j[1][1]).toBeCloseTo(-0.4, 6);
  });

  it.each([
    [[[-1, 0], [0, -2]], "stable node"],
    [[[1, 0], [0, 2]], "unstable node"],
    [[[1, 0], [0, -2]], "saddle"],
    [[[-0.2, 1], [-1, -0.2]], "stable spiral"],
    [[[0.2, 1], [-1, 0.2]], "unstable spiral"],
    [[[0, 1], [-1, 0]], "centre"],
    [[[0, 0], [0, -1]], "not hyperbolic"],
  ])("Classifies %j as %s", (m, kind) => {
    expect(classify(eigen2(m as number[][]))).toBe(kind);
  });

  it("Finds the equilibria of each system and classifies them", () => {
    const undamped = equilibria(oscillator(0, 1), [-2, 2, -2, 2]);
    expect(undamped).toHaveLength(1);
    expect(undamped[0].kind).toBe("centre");

    const damped = equilibria(oscillator(0.4, 1), [-2, 2, -2, 2]);
    expect(damped[0].kind).toBe("stable spiral");

    const cycle = equilibria(vanDerPol(1), [-3, 3, -3, 3]);
    expect(cycle[0].kind).toBe("unstable spiral");

    const wild = equilibria(predatorPrey(1, 0.5, 0.75, 0.25), [-0.5, 8, -0.5, 5]);
    const kinds = wild.map((r) => r.kind).sort();
    expect(kinds).toContain("saddle");
  });

  it("Volume is preserved without damping and lost with it", () => {
    expect(divergence(oscillator(0, 1), [0.1, 0.1])).toBeCloseTo(0, 6);
    expect(divergence(oscillator(0.4, 1), [0.1, 0.1])).toBeCloseTo(-0.4, 6);
  });
});

describe("The Lorenz system", () => {
  const f = lorenz();

  it("Its divergence is exactly minus the sum of its coefficients", () => {
    expect(divergence(f, [1, 1, 1])).toBeCloseTo(-(10 + 1 + 8 / 3), 4);
    expect(divergence(f, [30, -20, 5])).toBeCloseTo(-(10 + 1 + 8 / 3), 4);
  });

  it("Neighbours separate at the published rate", () => {
    const l = lyapunov(f, [1, 1, 1], 0.005, 0.5, 2500, 2500);
    expect(l.lambda).toBeGreaterThan(0.82);
    expect(l.lambda).toBeLessThan(0.99);
  });

  it("The Kaplan-Yorke dimension comes out at the published 2.06", () => {
    const l = lyapunov(f, [1, 1, 1], 0.005, 0.5, 2500, 2500);
    const ky = kaplanYorke(l.lambda, divergence(f, [1, 1, 1]));
    expect(ky.lambda3).toBeLessThan(-14);
    expect(ky.dimension).toBeGreaterThan(2.04);
    expect(ky.dimension).toBeLessThan(2.08);
  });

  it("Box counting on a finite sample is lower, and says over what window", () => {
    const p = integrate(f, [1, 1, 1], 0.005, 120000, "rk4", 5000);
    const b = boxDimension(p, 8);
    expect(b.dimension).toBeGreaterThan(1.7);
    expect(b.dimension).toBeLessThan(2.05);
    // every level finer than twice the state spacing is dropped as an artefact
    expect(b.sizes[b.window[1]]).toBeGreaterThan(2 * b.spacing);
    expect(b.window[0]).toBe(1);
    expect(b.window[1]).toBeLessThan(7);
  });
});

describe("The Rossler system", () => {
  const f = rossler();

  it("Its divergence depends on the state, so a point value is not the average", () => {
    expect(divergence(f, [1, 1, 1])).toBeCloseTo(0.2 + 1 - 5.7, 4);
    const p = integrate(f, [1, 1, 1], 0.01, 60000, "rk4", 10000);
    const mean = meanDivergence(f, p);
    expect(Math.abs(mean - divergence(f, [1, 1, 1]))).toBeGreaterThan(0.4);
    expect(mean).toBeLessThan(0);
  });

  it("Separates far more slowly than Lorenz, and is still chaotic", () => {
    const l = lyapunov(f, [1, 1, 1], 0.01, 1.0, 2500, 2500);
    expect(l.lambda).toBeGreaterThan(0.04);
    expect(l.lambda).toBeLessThan(0.12);
  });

  it("Crossing a plane in one direction turns the flow into a map", () => {
    const p = integrate(f, [1, 1, 1], 0.01, 60000, "rk4", 10000);
    const cuts = section(p, 1, 0, [0, 2]);
    expect(cuts.length).toBeGreaterThan(50);
    // one crossing a turn, and the turns are about six time units apart
    const gaps = cuts.slice(1).map((c, i) => c.t - cuts[i].t);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    expect(mean).toBeGreaterThan(4);
    expect(mean).toBeLessThan(8);
    // interpolated, not snapped to a step
    expect(cuts.some((c) => Math.abs(c.t / 0.01 - Math.round(c.t / 0.01)) > 1e-6)).toBe(true);
  });
});

describe("The logistic map", () => {
  it("Its fixed point and stability are what the algebra says", () => {
    for (const r of [1.5, 2.5, 2.9]) {
      const fixed = 1 - 1 / r;
      expect(logistic(r)(fixed)).toBeCloseTo(fixed, 10);
      expect(Math.abs(logisticSlope(r)(fixed))).toBeLessThan(1);
    }
    // past three the slope leaves the unit interval and the point has doubled
    expect(Math.abs(logisticSlope(3.2)(1 - 1 / 3.2))).toBeGreaterThan(1);
  });

  it("A cycle of the map is a fixed point of the iterated map", () => {
    const two = orbit(logistic(3.2), SEED, 2, 4000);
    const twice = compose(logistic(3.2), 2);
    expect(twice(two[0])).toBeCloseTo(two[0], 8);
    expect(twice(two[1])).toBeCloseTo(two[1], 8);
  });

  it.each([
    [2.5, 1],
    [3.2, 2],
    [3.5, 4],
    [3.83, 3],
  ])("Settles on a cycle of period %i at r = %f", (r, want) => {
    expect(period(orbit(logistic(r), SEED, 400, 6000))).toBe(want);
  });

  it("At r = 4 the exponent is exactly the logarithm of two", () => {
    expect(exponent(logistic, logisticSlope, 4, 20000, 5000)).toBeCloseTo(Math.LN2, 2);
  });

  it("The critical point is the wrong seed for measuring an orbit", () => {
    // 0.5 goes to 1 goes to 0, and 0 is a fixed point with slope 4, so the
    // measurement returns log 4 rather than log 2
    const wrong = exponent(logistic, logisticSlope, 4, 6000, 2000, 0.5);
    expect(wrong).toBeCloseTo(Math.log(4), 3);
    expect(SEED).not.toBe(0.5);
  });

  it("The exponent is negative on a cycle and positive in the band", () => {
    expect(exponent(logistic, logisticSlope, 3.2)).toBeLessThan(-0.1);
    expect(exponent(logistic, logisticSlope, 3.6)).toBeGreaterThan(0.1);
    // and about zero where a cycle loses stability
    expect(Math.abs(exponent(logistic, logisticSlope, 3.449489))).toBeLessThan(0.02);
  });
});

describe("The cascade, and Feigenbaum's constant", () => {
  it("Locates the superstable parameters at their published values", () => {
    const want = [2, 3.236068, 3.498562, 3.554641, 3.566667];
    // the lower bound is walked past each point already found. a point of
    // period one returns after two steps as well, so searching the whole range
    // for period two would return the period-one answer.
    let from = 1.9;
    want.forEach((value, n) => {
      const hit = superstable(logistic, Math.pow(2, n), from, 4);
      expect(hit).not.toBeNull();
      expect(hit as number).toBeCloseTo(value, 5);
      from = (hit as number) + 1e-12;
    });
  });

  it("Asking for a higher period over the whole range returns the lower one", () => {
    // documented behaviour rather than a defect: this is why cascade walks its
    // lower bound, and a caller that does not will silently get period one
    expect(superstable(logistic, 4, 1.9, 4) as number).toBeCloseTo(2, 6);
    expect(superstable(logistic, 4, 3.3, 4) as number).toBeCloseTo(3.498562, 5);
  });

  it("The ratio of the gaps approaches 4.6692", () => {
    const c = cascade(logistic, 7, 1.9, 4);
    expect(c.points.length).toBe(8);
    expect(c.delta).toBeCloseTo(4.6692, 3);
  });

  it("A different family with one smooth maximum gives the same number", () => {
    const c = cascade(sine, 7, 0.4, 0.95);
    expect(c.points.length).toBeGreaterThanOrEqual(7);
    // the cascade is somewhere else entirely, and the constant is the same
    expect(c.points[0]).toBeCloseTo(0.5, 4);
    expect(c.points[c.points.length - 1]).toBeLessThan(0.87);
    expect(c.delta).toBeCloseTo(4.669, 2);
  });

  it("The gaps shrink and the ratios settle rather than wander", () => {
    const c = cascade(logistic, 7, 1.9, 4);
    for (let i = 1; i < c.gaps.length; i++) expect(c.gaps[i]).toBeLessThan(c.gaps[i - 1]);
    const last = c.ratios.slice(-3);
    for (const r of last) expect(Math.abs(r - 4.6692)).toBeLessThan(0.01);
  });
});
