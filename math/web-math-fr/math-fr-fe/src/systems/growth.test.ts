import { describe, expect, it } from "vitest";
import { dbmCreate, dbmStep, dlaCreate, dlaGrow, massDim } from "./growth";
import { boxDim } from "./ifs";

function spread(order: number[], size: number) {
  const xs = new Float64Array(order.length);
  const ys = new Float64Array(order.length);
  for (let i = 0; i < order.length; i++) {
    xs[i] = order[i] % size;
    ys[i] = Math.floor(order[i] / size);
  }
  return { xs, ys };
}

function runGap(eta: number, sites: number) {
  const st = dbmCreate(50, 87, 9, 300, "gap");
  while (!st.done && st.order.length < sites) if (!dbmStep(st, eta, 12)) break;
  return st;
}

describe("dielectric breakdown", () => {
  it("relaxes to a radially even field from a point", () => {
    const cols = 91;
    const st = dbmCreate(Math.round(cols * 1.04), cols, 1, 900, "point");
    const mr = st.rows >> 1;
    const mc = st.cols >> 1;
    for (const radius of [10, 20, 30]) {
      const seen: number[] = [];
      for (let k = 0; k < 8; k++) {
        const a = (k * Math.PI) / 4;
        const r = Math.round(mr - radius * Math.sin(a));
        const c = Math.round(mc + radius * Math.cos(a));
        seen.push(st.phi[r * st.cols + c]);
      }
      const lo = Math.min(...seen);
      const hi = Math.max(...seen);
      expect(hi - lo).toBeLessThan(0.03);
    }
  });

  it("branches in every direction from a point", () => {
    const cols = 91;
    const st = dbmCreate(Math.round(cols * 1.04), cols, 9, 300, "point");
    while (!st.done && st.order.length < 400) if (!dbmStep(st, 1, 12)) break;
    const mr = st.rows >> 1;
    const mc = st.cols >> 1;
    const reach = new Array(8).fill(0);
    for (const at of st.order) {
      const dy = Math.floor(at / st.cols) - mr;
      const dx = (at % st.cols) - mc;
      const a = Math.atan2(-dy, dx);
      const s = ((Math.floor((a + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8;
      reach[s] = Math.max(reach[s], Math.hypot(dx, dy));
    }
    for (const r of reach) expect(r).toBeGreaterThan(3);
  });

  it("thins as the roughness rises, and the dimension follows it down", () => {
    const soft = runGap(0.6, 300);
    const hard = runGap(2, 300);
    const cut = { least: 120, cuts: [2, 4, 8, 16] };
    const soften = spread(soft.order, soft.cols);
    const harden = spread(hard.order, hard.cols);
    const a = boxDim(soften.xs, soften.ys, soft.order.length, cut) as number;
    const b = boxDim(harden.xs, harden.ys, hard.order.length, cut) as number;
    expect(a).toBeGreaterThan(b);
    expect(a).toBeGreaterThan(1.4);
    expect(b).toBeLessThan(1.35);
  });

  it("reaches the far plate across a gap", () => {
    const st = runGap(2, 900);
    expect(st.done).toBe(true);
    const lowest = Math.max(...st.order.map((at) => Math.floor(at / st.cols)));
    expect(lowest).toBeGreaterThanOrEqual(st.rows - 3);
  });
});

describe("wandering particles", () => {
  it("grows a cluster whose mass-radius dimension sits near the accepted value", () => {
    const size = 161;
    const st = dlaCreate(size, 11);
    while (!st.done && st.order.length < 1200) {
      const before = st.order.length;
      dlaGrow(st, 20, 1200, 2.5, 6000, 3);
      if (st.order.length === before) break;
    }
    expect(st.order.length).toBe(1200);
    const d = massDim(st.order, size, [0.1, 0.17, 0.28, 0.41, 0.59]) as number;
    expect(d).toBeGreaterThan(1.55);
    expect(d).toBeLessThan(1.8);
  });

  it("keeps only the most recent walks and they are long", () => {
    const st = dlaCreate(121, 5);
    while (!st.done && st.order.length < 400) {
      const before = st.order.length;
      dlaGrow(st, 20, 400, 2.5, 6000, 3);
      if (st.order.length === before) break;
    }
    expect(st.tracks.length).toBe(3);
    expect(Math.max(...st.tracks.map((t) => t.length))).toBeGreaterThan(20);
  });

  it("records nothing when no walks are asked for", () => {
    const st = dlaCreate(101, 3);
    dlaGrow(st, 40, 120, 2.5, 6000, 0);
    expect(st.tracks.length).toBe(0);
    expect(st.order.length).toBeGreaterThan(1);
  });
});
