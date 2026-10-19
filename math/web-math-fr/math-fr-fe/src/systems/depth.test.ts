import { describe, expect, it } from "vitest";
import { CURVES, fade, gap, logit, nudge, slowdown, staircase, stepsTo } from "@/systems/depth";
import { dataset } from "@/systems/learn";
import { make, params, predict } from "@/systems/net";

describe("A small change in a weight", () => {
  const data = dataset("split", 60, 3);
  const w = [0.6, 0.4];
  const b = 0;
  // a dot close to the line, so the hard unit flips within the run
  const near = data.X.reduce((best, p) => (Math.abs(w[0] * p[0] + w[1] * p[1] + b) < Math.abs(w[0] * best[0] + w[1] * best[1] + b) ? p : best), data.X[0]);
  // pushed the way that carries the dot's total across zero
  const z0 = w[0] * near[0] + w[1] * near[1] + b;
  const size = 0.01 * -Math.sign(z0) * Math.sign(near[0]);
  const out = nudge(w, b, near, data, size, 300);

  it("moves the smooth unit's answer by a small amount every nudge", () => {
    for (let k = 1; k < out.smooth.length; k++) {
      const move = Math.abs(out.smooth[k] - out.smooth[k - 1]);
      expect(move).toBeGreaterThan(0);
      expect(move).toBeLessThan(0.25 * Math.abs(near[0]) * Math.abs(size) + 1e-9);
    }
  });

  it("moves the hard unit's answer once, by a jump, and otherwise not at all", () => {
    let changes = 0;
    for (let k = 1; k < out.hard.length; k++) if (out.hard[k] !== out.hard[k - 1]) changes += 1;
    expect(changes).toBe(1);
    expect(out.flipAt).toBeGreaterThan(0);
    expect(Math.abs(out.hard[out.flipAt] - out.hard[out.flipAt - 1])).toBe(1);
  });
});

describe("Any curve, from steps", () => {
  it("is a real network with one hidden unit per step", () => {
    const net = staircase(CURVES.bump.f, 12, 60);
    expect(net.sizes).toEqual([1, 12, 1]);
    expect(params(net).total).toBe(12 * 2 + 12 + 1);
    expect(Number.isFinite(predict(net, [0.3])[0])).toBe(true);
  });

  it("gets closer to the target with more steps, and closer again with steeper ones", () => {
    const f = CURVES.bump.f;
    const few = gap(staircase(f, 8, 60), f).worst;
    const more = gap(staircase(f, 32, 60), f).worst;
    const many = gap(staircase(f, 64, 60), f).worst;
    expect(more).toBeLessThan(few);
    expect(many).toBeLessThan(more);
    expect(gap(staircase(f, 64, 400), f).worst).toBeLessThan(0.05);
  });

  it("builds the staircase one unit at a time", () => {
    const f = CURVES.wave.f;
    const flat = staircase(f, 10, 60, 0);
    for (const x of [0.1, 0.5, 0.9]) expect(predict(flat, [x])[0]).toBeCloseTo(f(0.5 / 11), 6);
    expect(gap(staircase(f, 10, 60, 10), f).worst).toBeLessThan(gap(flat, f).worst);
  });
});

describe("A badly wrong start", () => {
  it("learns slowly under the squared miss and at once under cross entropy", () => {
    const out = slowdown(logit(0.98), 0.15, 400);
    expect(out.mse[0]).toBeCloseTo(0.98, 6);
    expect(out.ce[0]).toBeCloseTo(0.98, 6);
    expect(Math.abs(out.mse[1] - out.mse[0])).toBeLessThan(Math.abs(out.ce[1] - out.ce[0]));
    const slow = stepsTo(out.mse, 0, 0.1);
    const fast = stepsTo(out.ce, 0, 0.1);
    expect(fast).toBeGreaterThan(0);
    expect(slow === -1 || slow > 3 * fast).toBe(true);
  });

  it("asks for a move that carries the squash's slope only under the squared miss", () => {
    const out = slowdown(logit(0.98), 0.15, 1);
    expect(out.ceSlope[0]).toBeCloseTo(0.98, 6);
    expect(out.mseSlope[0]).toBeCloseTo(0.98 * 0.98 * 0.02, 6);
  });
});

describe("The first layer learns last", () => {
  const data = dataset("rings", 60, 3);
  const sizes = [2, 6, 6, 6, 6, 6, 1];

  it("passes a sigmoid net's blame back much smaller at every layer", () => {
    const net = make(sizes, "sigmoid", "sigmoid", "uniform", 4);
    const out = fade(net, data);
    expect(out.norms.length).toBe(6);
    expect(out.ratio).toBeGreaterThan(10);
    for (let l = 1; l < out.norms.length; l++) expect(out.norms[l]).toBeGreaterThan(out.norms[l - 1]);
  });

  it("keeps far more of it with a rectifier and a start sized for one", () => {
    const soft = fade(make(sizes, "sigmoid", "sigmoid", "uniform", 4), data).ratio;
    const hard = fade(make(sizes, "relu", "sigmoid", "he", 4), data).ratio;
    expect(hard).toBeLessThan(soft / 10);
  });
});
