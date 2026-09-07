import { describe, expect, it } from "vitest";
import { IFS_PRESETS, boxDim, carrierOf, contraction, runGame } from "./ifs";

const fern = IFS_PRESETS["Barnsley fern"];

describe("iterated maps", () => {
  it("gives the published contraction factors for the fern", () => {
    const found = fern.map((m) => Number(contraction(m).toFixed(3)));
    expect(found).toEqual([0.16, 0.851, 0.341, 0.379]);
  });

  it("keeps every map a contraction", () => {
    for (const preset of Object.values(IFS_PRESETS)) {
      for (const m of preset) expect(contraction(m)).toBeLessThan(1);
    }
  });

  it("settles on the fern with a dimension near the measured one", () => {
    const run = runGame(fern, { points: 120000, startx: 0, starty: 0, drop: 30 });
    expect(run.escaped).toBe(false);
    expect(run.kept).toBe(120000);
    const d = boxDim(run.xs, run.ys, run.kept);
    expect(d).not.toBeNull();
    expect(d as number).toBeGreaterThan(1.7);
    expect(d as number).toBeLessThan(1.85);
  });

  it("draws each map about as often as its probability says", () => {
    const run = runGame(fern, { points: 60000, startx: 0, starty: 0, drop: 30 });
    const tally = [0, 0, 0, 0];
    for (let i = 0; i < run.kept; i++) tally[run.who[i]]++;
    fern.forEach((m, i) => {
      expect(tally[i] / run.kept).toBeCloseTo(m.p, 1);
    });
  });

  it("reports a runaway instead of drawing nothing", () => {
    const bad = [{ a: 1.4, b: 0, c: 0, d: 1.4, e: 0.1, f: 0.1, p: 1 }];
    expect(contraction(bad[0])).toBeGreaterThan(1);
    const run = runGame(bad, { points: 5000, startx: 0.5, starty: 0.5, drop: 0 });
    expect(run.escaped).toBe(true);
  });

  it("gives the exact dimension for the Sierpinski triangle", () => {
    const run = runGame(IFS_PRESETS["Sierpinski triangle"], {
      points: 200000,
      startx: 0,
      starty: 0,
      drop: 30,
    });
    const d = boxDim(run.xs, run.ys, run.kept) as number;
    expect(d).toBeCloseTo(Math.log(3) / Math.log(2), 1);
  });
});

describe("colouring by branch rather than by the last move", () => {
  it("picks the carrier as the map that shrinks least", () => {
    expect(carrierOf(fern)).toBe(1);
  });

  it("gathers every leaf of a move, not just the first one", () => {
    const run = runGame(fern, { points: 120000, startx: 0, starty: 0, drop: 40 });
    for (const move of [2, 3]) {
      let byLast = 0;
      let byBranch = 0;
      for (let i = 0; i < run.kept; i++) {
        if (run.who[i] === move) byLast++;
        if (run.tag[i] === move) byBranch++;
      }
      expect(byBranch).toBeGreaterThan(byLast * 4);
    }
  });

  it("reaches far higher up the fern by branch than by the last move", () => {
    const run = runGame(fern, { points: 120000, startx: 0, starty: 0, drop: 40 });
    let lastTop = -Infinity;
    let branchTop = -Infinity;
    for (let i = 0; i < run.kept; i++) {
      if (run.who[i] === 2) lastTop = Math.max(lastTop, run.ys[i]);
      if (run.tag[i] === 2) branchTop = Math.max(branchTop, run.ys[i]);
    }
    expect(branchTop).toBeGreaterThan(lastTop * 2);
  });

  it("gives every point exactly one branch", () => {
    const run = runGame(fern, { points: 40000, startx: 0, starty: 0, drop: 40 });
    const seen = new Set<number>();
    for (let i = 0; i < run.kept; i++) seen.add(run.tag[i]);
    expect([...seen].every((t) => t >= 0 && t < fern.length)).toBe(true);
  });
});
