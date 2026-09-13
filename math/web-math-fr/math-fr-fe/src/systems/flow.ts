/**
 * continuous-time systems: integrators, the local linear picture at an
 * equilibrium, and the two measurements that decide whether a system is chaotic.
 *
 * nothing here is specific to a named system. the Lorenz and Rossler equations
 * are at the bottom as data.
 */

export type Vec = number[];
/** the rule: given the state and the clock, the rate of every coordinate. */
export type Field = (x: Vec, t: number) => Vec;
export type Method = "euler" | "midpoint" | "rk4";

const add = (a: Vec, b: Vec, k = 1) => a.map((v, i) => v + k * b[i]);

/** one step. the three methods differ only in how many times they ask the rule. */
export function step(f: Field, x: Vec, t: number, dt: number, how: Method): Vec {
  if (how === "euler") return add(x, f(x, t), dt);
  if (how === "midpoint") {
    const half = add(x, f(x, t), dt / 2);
    return add(x, f(half, t + dt / 2), dt);
  }
  const k1 = f(x, t);
  const k2 = f(add(x, k1, dt / 2), t + dt / 2);
  const k3 = f(add(x, k2, dt / 2), t + dt / 2);
  const k4 = f(add(x, k3, dt), t + dt);
  const slope = k1.map((_, i) => (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]) / 6);
  return add(x, slope, dt);
}

export type Path = { xs: Float64Array; dim: number; count: number; dt: number };

/** a trajectory as a flat buffer, one state after another. */
export function integrate(
  f: Field,
  start: Vec,
  dt: number,
  count: number,
  how: Method = "rk4",
  discard = 0,
): Path {
  const dim = start.length;
  let x = start.slice();
  let t = 0;
  for (let i = 0; i < discard; i++) {
    x = step(f, x, t, dt, how);
    t += dt;
  }
  const xs = new Float64Array(count * dim);
  for (let i = 0; i < count; i++) {
    for (let d = 0; d < dim; d++) xs[i * dim + d] = x[d];
    x = step(f, x, t, dt, how);
    t += dt;
  }
  return { xs, dim, count, dt };
}

export const at = (p: Path, i: number): Vec =>
  Array.from(p.xs.subarray(i * p.dim, i * p.dim + p.dim));

// ------------------------------------------------------------ the local picture

/** the array of first partial derivatives, by central difference. */
export function jacobian(f: Field, x: Vec, eps = 1e-6): number[][] {
  const n = x.length;
  const out: number[][] = [];
  for (let row = 0; row < n; row++) out.push(new Array(n).fill(0));
  for (let col = 0; col < n; col++) {
    const up = x.slice();
    const dn = x.slice();
    up[col] += eps;
    dn[col] -= eps;
    const a = f(up, 0);
    const b = f(dn, 0);
    for (let row = 0; row < n; row++) out[row][col] = (a[row] - b[row]) / (2 * eps);
  }
  return out;
}

/** the sum of the diagonal of the jacobian: the local rate of volume change. */
export function divergence(f: Field, x: Vec, eps = 1e-6): number {
  const j = jacobian(f, x, eps);
  return j.reduce((s, row, i) => s + row[i], 0);
}

export type Eigen = { re: number; im: number }[];

/** the two eigenvalues of a two by two, real pair or conjugate pair. */
export function eigen2(m: number[][]): Eigen {
  const [[a, b], [c, d]] = m;
  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;
  if (disc >= 0) {
    const r = Math.sqrt(disc);
    return [
      { re: (trace + r) / 2, im: 0 },
      { re: (trace - r) / 2, im: 0 },
    ];
  }
  const im = Math.sqrt(-disc) / 2;
  return [
    { re: trace / 2, im },
    { re: trace / 2, im: -im },
  ];
}

export type Kind =
  | "stable node"
  | "unstable node"
  | "saddle"
  | "stable spiral"
  | "unstable spiral"
  | "centre"
  | "not hyperbolic";

/**
 * the classification of a two-dimensional equilibrium. an eigenvalue on the
 * imaginary axis is called out rather than rounded into a neighbour, because
 * that is exactly the case where the linear picture decides nothing.
 */
export function classify(e: Eigen, tol = 1e-9): Kind {
  const [p, q] = e;
  if (p.im !== 0) {
    if (Math.abs(p.re) < tol) return "centre";
    return p.re < 0 ? "stable spiral" : "unstable spiral";
  }
  if (Math.abs(p.re) < tol || Math.abs(q.re) < tol) return "not hyperbolic";
  if (p.re * q.re < 0) return "saddle";
  return p.re < 0 ? "stable node" : "unstable node";
}

export type Rest = { at: Vec; eigen: Eigen; kind: Kind };

/** newton from one seed, on the rule itself rather than on a trajectory. */
function settle(f: Field, seed: Vec, tries = 60): Vec | null {
  let x = seed.slice();
  for (let i = 0; i < tries; i++) {
    const r = f(x, 0);
    if (Math.hypot(...r) < 1e-12) return x;
    const j = jacobian(f, x);
    const det = j[0][0] * j[1][1] - j[0][1] * j[1][0];
    if (Math.abs(det) < 1e-14) return null;
    const dx = (r[0] * j[1][1] - r[1] * j[0][1]) / det;
    const dy = (r[1] * j[0][0] - r[0] * j[1][0]) / det;
    x = [x[0] - dx, x[1] - dy];
    if (!Number.isFinite(x[0]) || !Number.isFinite(x[1])) return null;
  }
  return Math.hypot(...f(x, 0)) < 1e-7 ? x : null;
}

/** every equilibrium newton finds from a grid of seeds over the box. */
export function equilibria(
  f: Field,
  box: [number, number, number, number],
  seeds = 9,
): Rest[] {
  const [x0, x1, y0, y1] = box;
  const found: Rest[] = [];
  for (let i = 0; i < seeds; i++) {
    for (let k = 0; k < seeds; k++) {
      const sx = x0 + ((x1 - x0) * i) / (seeds - 1);
      const sy = y0 + ((y1 - y0) * k) / (seeds - 1);
      const hit = settle(f, [sx, sy]);
      if (!hit) continue;
      if (hit[0] < x0 - 0.5 || hit[0] > x1 + 0.5) continue;
      if (hit[1] < y0 - 0.5 || hit[1] > y1 + 0.5) continue;
      if (found.some((r) => Math.hypot(r.at[0] - hit[0], r.at[1] - hit[1]) < 1e-4)) continue;
      const eigen = eigen2(jacobian(f, hit));
      found.push({ at: hit, eigen, kind: classify(eigen) });
    }
  }
  return found;
}

// ------------------------------------------------------------- the measurements

export type Exponent = { lambda: number; samples: number; span: number };

/**
 * the largest lyapunov exponent, by releasing a neighbour and renormalising.
 *
 * two states a small distance apart are carried forward for a short interval,
 * the growth of the gap is recorded, and the neighbour is pulled back to the
 * original distance along the same direction. the average of the recorded
 * growth is the exponent. renormalising is what keeps the measurement local:
 * without it the pair saturates at the width of the attractor and the average
 * decays to zero.
 */
export function lyapunov(
  f: Field,
  start: Vec,
  dt = 0.01,
  span = 0.5,
  samples = 4000,
  discard = 2000,
  gap = 1e-8,
  how: Method = "rk4",
): Exponent {
  const inner = Math.max(1, Math.round(span / dt));
  let x = start.slice();
  let t = 0;
  for (let i = 0; i < discard; i++) {
    x = step(f, x, t, dt, how);
    t += dt;
  }
  let y = x.slice();
  y[0] += gap;
  let total = 0;
  let used = 0;
  for (let s = 0; s < samples; s++) {
    for (let i = 0; i < inner; i++) {
      x = step(f, x, t, dt, how);
      y = step(f, y, t, dt, how);
      t += dt;
    }
    const d = Math.hypot(...x.map((v, i) => y[i] - v));
    if (!Number.isFinite(d) || d === 0) break;
    total += Math.log(d / gap);
    used += 1;
    y = x.map((v, i) => v + ((y[i] - v) * gap) / d);
  }
  return { lambda: used ? total / (used * inner * dt) : 0, samples: used, span: inner * dt };
}

export type Boxes = {
  dimension: number;
  sizes: number[];
  counts: number[];
  /** the indices the fit actually used */
  window: [number, number];
  spacing: number;
};

/**
 * the box-counting dimension of a trajectory, the same definition topic 1
 * measured on a coastline, applied to a set that lives in three dimensions.
 *
 * a trajectory is a finite list of states, not a set, and that limits where the
 * definition applies. once the box is smaller than the mean spacing between
 * recorded states, every state sits in a box of its own, the count stops
 * growing with the geometry and the slope falls towards zero. at the other end
 * the count is bounded by the number of boxes there are at all. so the fit is
 * taken over the window between those two, and the window is reported with the
 * answer rather than hidden inside it.
 */
export function boxDimension(p: Path, levels = 9): Boxes {
  const lo = new Array(p.dim).fill(Infinity);
  const hi = new Array(p.dim).fill(-Infinity);
  for (let i = 0; i < p.count; i++) {
    for (let d = 0; d < p.dim; d++) {
      const v = p.xs[i * p.dim + d];
      if (v < lo[d]) lo[d] = v;
      if (v > hi[d]) hi[d] = v;
    }
  }
  const reach = Math.max(...hi.map((v, d) => v - lo[d]));

  let walk = 0;
  const paces = Math.min(p.count - 1, 20000);
  for (let i = 1; i <= paces; i++) {
    let sq = 0;
    for (let d = 0; d < p.dim; d++) {
      const step_d = p.xs[i * p.dim + d] - p.xs[(i - 1) * p.dim + d];
      sq += step_d * step_d;
    }
    walk += Math.sqrt(sq);
  }
  const spacing = paces ? walk / paces : 0;

  const sizes: number[] = [];
  const counts: number[] = [];
  for (let level = 0; level < levels; level++) {
    const cells = 4 * Math.pow(2, level);
    const eps = reach / cells;
    const seen = new Set<string>();
    for (let i = 0; i < p.count; i++) {
      let key = "";
      for (let d = 0; d < p.dim; d++) {
        key += `${Math.floor((p.xs[i * p.dim + d] - lo[d]) / eps)},`;
      }
      seen.add(key);
    }
    sizes.push(eps);
    counts.push(seen.size);
  }

  // the coarsest level is dropped because its count is capped by 4^dim boxes,
  // and every level finer than twice the sampling spacing is dropped as an
  // artefact of the sampling rather than a fact about the set
  const first = Math.min(1, levels - 1);
  let last = first;
  for (let i = first; i < levels; i++) if (sizes[i] > 2 * spacing) last = i;

  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = first; i <= last; i++) {
    xs.push(Math.log(1 / sizes[i]));
    ys.push(Math.log(counts[i]));
  }
  const n = xs.length;
  if (n < 2) return { dimension: 0, sizes, counts, window: [first, last], spacing };
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let top = 0;
  let bot = 0;
  for (let i = 0; i < n; i++) {
    top += (xs[i] - mx) * (ys[i] - my);
    bot += (xs[i] - mx) ** 2;
  }
  return {
    dimension: bot ? top / bot : 0,
    sizes,
    counts,
    window: [first, last],
    spacing,
  };
}

/**
 * the divergence averaged along a trajectory. for Lorenz the divergence is the
 * same everywhere and a single point would do; for Rossler it depends on the
 * state, so a point value is not the rate at which the attractor's volume
 * actually contracts.
 */
export function meanDivergence(f: Field, p: Path, eps = 1e-6): number {
  let total = 0;
  for (let i = 0; i < p.count; i++) total += divergence(f, at(p, i), eps);
  return p.count ? total / p.count : 0;
}

/**
 * the Kaplan-Yorke dimension of a three-dimensional attractor, from the largest
 * exponent and the volume contraction.
 *
 * the three exponents sum to the average divergence, and the middle one is zero
 * because moving along the trajectory neither grows nor shrinks a separation.
 * so the third follows, and the dimension is two full directions plus the
 * fraction of the third that the stretching supports. this is the quantity
 * usually quoted for these attractors, and it is not the box-counting
 * dimension: that one is measured on a finite sample of the set and comes out
 * lower.
 */
export function kaplanYorke(lambda1: number, meanDiv: number) {
  const lambda3 = meanDiv - lambda1;
  const dimension = lambda3 < 0 ? 2 + lambda1 / Math.abs(lambda3) : NaN;
  return { lambda1, lambda2: 0, lambda3, dimension };
}

export type Crossing = { a: number; b: number; t: number };

/**
 * a poincare section: where the trajectory pierces a plane in one direction.
 * the crossing point is interpolated between the two states either side of the
 * plane rather than taken as the nearer of them, which would quantise the
 * section to the step size.
 */
export function section(
  p: Path,
  axis: number,
  level: number,
  keep: [number, number] = [0, 1],
): Crossing[] {
  const out: Crossing[] = [];
  let prev = at(p, 0);
  for (let i = 1; i < p.count; i++) {
    const now = at(p, i);
    if (prev[axis] < level && now[axis] >= level) {
      const w = (level - prev[axis]) / (now[axis] - prev[axis]);
      out.push({
        a: prev[keep[0]] + w * (now[keep[0]] - prev[keep[0]]),
        b: prev[keep[1]] + w * (now[keep[1]] - prev[keep[1]]),
        t: (i - 1 + w) * p.dt,
      });
    }
    prev = now;
  }
  return out;
}

// -------------------------------------------------------------- named systems

export const lorenz = (sigma = 10, rho = 28, beta = 8 / 3): Field =>
  ([x, y, z]) => [sigma * (y - x), x * (rho - z) - y, x * y - beta * z];

export const rossler = (a = 0.2, b = 0.2, c = 5.7): Field =>
  ([x, y, z]) => [-y - z, x + a * y, b + z * (x - c)];

/** the undamped or damped oscillator, written as a first-order pair. */
export const oscillator = (damping = 0, stiffness = 1): Field =>
  ([x, v]) => [v, -stiffness * x - damping * v];

export const vanDerPol = (mu = 1): Field => ([x, v]) => [v, mu * (1 - x * x) * v - x];

export const predatorPrey = (a = 1, b = 0.5, c = 0.75, d = 0.25): Field =>
  ([x, y]) => [a * x - b * x * y, -c * y + d * x * y];

// ------------------------------------------------------ the orbit diagram of a flow

export type OrbitColumn = { p: number; values: number[] };

/**
 * the bifurcation diagram of a flow, built the way the map's is: for each value
 * of a parameter, run the flow, throw away the approach, and record one number
 * each time a chosen event happens on the orbit (a crossing of a plane, or a
 * local maximum of one coordinate). a periodic orbit gives a few points above
 * its parameter, a doubled one twice as many, and chaos a smear.
 */
export function orbitDiagram(
  make: (p: number) => Field,
  from: number,
  to: number,
  columns: number,
  start: Vec,
  dt: number,
  discard: number,
  keep: number,
  pick: (prev: Vec, now: Vec, next: Vec) => number | null,
  how: Method = "rk4",
): OrbitColumn[] {
  const out: OrbitColumn[] = [];
  for (let c = 0; c < columns; c++) {
    const p = from + ((to - from) * c) / Math.max(1, columns - 1);
    const f = make(p);
    let prev = start.slice();
    let t = 0;
    for (let i = 0; i < discard; i++) {
      prev = step(f, prev, t, dt, how);
      t += dt;
    }
    let now = step(f, prev, t, dt, how);
    t += dt;
    const values: number[] = [];
    for (let i = 0; i < keep; i++) {
      const next = step(f, now, t, dt, how);
      t += dt;
      const v = pick(prev, now, next);
      if (v !== null && Number.isFinite(v)) values.push(v);
      prev = now;
      now = next;
      if (!Number.isFinite(now[0])) break;
    }
    out.push({ p, values });
  }
  return out;
}

/** the event: coordinate k passes a local maximum. */
export const localMax = (k: number) => (prev: Vec, now: Vec, next: Vec) =>
  prev[k] < now[k] && now[k] >= next[k] ? now[k] : null;

/** the event: coordinate `axis` crosses `level` upward; the value is coordinate `keep`, interpolated. */
export const crossing = (axis: number, level: number, keep: number) => (prev: Vec, now: Vec) => {
  if (prev[axis] < level && now[axis] >= level) {
    const w = (level - prev[axis]) / (now[axis] - prev[axis]);
    return prev[keep] + w * (now[keep] - prev[keep]);
  }
  return null;
};
