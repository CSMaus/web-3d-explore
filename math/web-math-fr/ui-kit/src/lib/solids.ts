/**
 * the solid figures: shapes in three dimensions, as polylines of points, one a
 * subject. the element in components/figures.tsx turns them, projects them
 * into a 100 by 100 box and draws them with the same travelling light as the
 * flat figures. every shape is centred on the origin and fits a sphere of
 * radius one. the last polyline of every shape is the one its light walks
 * along: one unbroken line over edges that are drawn, since a dash starts again
 * at every separate piece and a light on every piece would light it all at once.
 */

export type SolidKind = "helix" | "tetra" | "lorenz" | "network" | "attention";

export type P3 = [number, number, number];

/** moves a set of polylines so its centre is the origin and scales it into the unit sphere. */
function normal(lines: P3[][]): P3[][] {
  const all = lines.flat();
  const mid = [0, 1, 2].map((k) => (Math.min(...all.map((p) => p[k])) + Math.max(...all.map((p) => p[k]))) / 2);
  const reach = Math.max(...all.map((p) => Math.hypot(p[0] - mid[0], p[1] - mid[1], p[2] - mid[2]))) || 1;
  return lines.map((line) => line.map((p) => [(p[0] - mid[0]) / reach, (p[1] - mid[1]) / reach, (p[2] - mid[2]) / reach]));
}

/** a turn written out in time: e to the i theta, a circle that climbs as it goes, round its axis */
function helix(): P3[][] {
  const turn: P3[] = [];
  const steps = 360;
  const turns = 3;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * turns * Math.PI * 2;
    turn.push([Math.cos(a), -1.2 + (2.4 * i) / steps, Math.sin(a)]);
  }
  const ring: P3[] = [];
  for (let i = 0; i <= 90; i += 1) {
    const a = (i / 90) * Math.PI * 2;
    ring.push([Math.cos(a), -1.2, Math.sin(a)]);
  }
  return normal([ring, [[0, -1.35, 0], [0, 1.35, 0]], turn]);
}

/** the Sierpinski tetrahedron at the second step: four half-size copies, each made of four again */
function tetra(): P3[][] {
  const corners: P3[] = [
    [1, 1, 1],
    [1, -1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
  ];
  const lines: P3[][] = [];
  const mid = (a: P3, b: P3): P3 => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  const split = (c: P3[], depth: number) => {
    if (depth === 0) {
      const [a, b, d, e] = c;
      lines.push([a, b, d, a, e, b], [e, d]);
      return;
    }
    c.forEach((keep) => split(c.map((other) => mid(keep, other)), depth - 1));
  };
  split(corners, 2);
  // the light walks the outer edges, which the small copies draw in pieces
  const [a, b, c, d] = corners;
  lines.push([a, b, c, a, d, b, c, d]);
  return normal(lines);
}

/** the Lorenz attractor, integrated with the classic numbers, its two wings side by side and its height upright */
function lorenz(): P3[][] {
  const sigma = 10;
  const rho = 28;
  const beta = 8 / 3;
  const dt = 0.008;
  let x = 0.1;
  let y = 0;
  let z = 0;
  const line: P3[] = [];
  for (let i = 0; i < 4200; i += 1) {
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;
    x += dx * dt;
    y += dy * dt;
    z += dz * dt;
    // the first steps leave the start for the attractor and are not drawn; every third step is kept
    if (i > 300 && i % 3 === 0) line.push([x, z, y]);
  }
  return normal([line]);
}

/** a small network: four layers of units on rings, every unit joined to every unit of the next layer */
function network(): P3[][] {
  const sizes = [3, 4, 4, 2];
  const layers: P3[][] = sizes.map((n, l) =>
    Array.from({ length: n }, (_, k) => {
      const a = (k / n) * Math.PI * 2 + l * 0.4;
      const r = n === 1 ? 0 : 0.75;
      return [-1.5 + l, r * Math.cos(a), r * Math.sin(a)] as P3;
    }),
  );
  const lines: P3[][] = [];
  for (let l = 0; l + 1 < layers.length; l += 1) {
    for (const a of layers[l]) for (const b of layers[l + 1]) lines.push([a, b]);
  }
  // each unit a small ring, so it reads as a node and not a crossing
  for (const layer of layers) {
    for (const [cx, cy, cz] of layer) {
      const ring: P3[] = [];
      for (let i = 0; i <= 16; i += 1) {
        const a = (i / 16) * Math.PI * 2;
        ring.push([cx, cy + 0.12 * Math.cos(a), cz + 0.12 * Math.sin(a)]);
      }
      lines.push(ring);
    }
  }
  // the light walks drawn links only: across each pair of layers it zigzags over every unit of
  // both, so it passes most of the links, then goes on to the next pair
  const walk: P3[] = [];
  for (let l = 0; l + 1 < layers.length; l += 1) {
    const [a, b] = [layers[l], layers[l + 1]];
    const steps = Math.max(a.length, b.length);
    for (let k = 0; k < steps; k += 1) walk.push(a[k % a.length], b[k % b.length]);
  }
  lines.push(walk);
  return normal(lines);
}

/** a row of tokens as squares, with arcs of attention from each token to earlier ones */
function attention(): P3[][] {
  const n = 6;
  const gap = 0.55;
  const lines: P3[][] = [];
  const at = (k: number) => -((n - 1) * gap) / 2 + k * gap;
  for (let k = 0; k < n; k += 1) {
    const x = at(k);
    const s = 0.16;
    lines.push([
      [x - s, -s, 0],
      [x + s, -s, 0],
      [x + s, s, 0],
      [x - s, s, 0],
      [x - s, -s, 0],
    ]);
  }
  const pairs: [number, number][] = [
    [5, 0],
    [5, 3],
    [4, 1],
    [3, 2],
    [2, 0],
    [4, 3],
    [5, 2],
  ];
  pairs.forEach(([a, b], i) => {
    const x0 = at(a);
    const x1 = at(b);
    const lift = 0.25 + 0.22 * Math.abs(a - b);
    const tilt = (i % 3) - 1;
    const arc: P3[] = [];
    for (let s = 0; s <= 40; s += 1) {
      const t = s / 40;
      arc.push([x0 + (x1 - x0) * t, 0.18 + lift * Math.sin(Math.PI * t), 0.18 * tilt * Math.sin(Math.PI * t)]);
    }
    lines.push(arc);
  });
  // the light walks six of the arcs, each starting where the last ended: tokens 1, 4, 3, 2, 5, 0, 2
  const chain: P3[] = [];
  const route = [1, 4, 3, 2, 5, 0, 2];
  for (let r = 0; r + 1 < route.length; r += 1) {
    const [from, to] = [route[r], route[r + 1]];
    const i = pairs.findIndex(([p, q]) => (p === from && q === to) || (p === to && q === from));
    const [p, q] = pairs[i];
    const lift = 0.25 + 0.22 * Math.abs(p - q);
    const tilt = (i % 3) - 1;
    for (let s = chain.length ? 1 : 0; s <= 40; s += 1) {
      // the arc as drawn runs from p to q; walking it the other way reads it backwards
      const t = from === p ? s / 40 : 1 - s / 40;
      chain.push([at(p) + (at(q) - at(p)) * t, 0.18 + lift * Math.sin(Math.PI * t), 0.18 * tilt * Math.sin(Math.PI * t)]);
    }
  }
  lines.push(chain);
  return normal(lines);
}

export const SOLIDS: Record<SolidKind, () => P3[][]> = { helix, tetra, lorenz, network, attention };

/** the length of a shape's walking line, in the units of the unit sphere */
export function walkLength(lines: P3[][]): number {
  const w = lines[lines.length - 1] ?? [];
  let s = 0;
  for (let i = 1; i < w.length; i += 1) s += Math.hypot(w[i][0] - w[i - 1][0], w[i][1] - w[i - 1][1], w[i][2] - w[i - 1][2]);
  return s;
}

/** the walking line of the helix, the length the light's lap in figures.ts is set for; a longer or shorter line takes longer or less, so the light keeps one pace on every shape */
export const WALK_REFERENCE = 12;

export const SOLID_KINDS = Object.keys(SOLIDS) as SolidKind[];

export const SOLID_NAMES: Record<SolidKind, string> = {
  helix: "A turn in time",
  tetra: "Sierpinski tetrahedron",
  lorenz: "Lorenz attractor",
  network: "A small network",
  attention: "Tokens and attention",
};

/**
 * the shape turned by an angle about the upright axis and tipped towards the eye,
 * projected with a little perspective into a 100 by 100 box, as one svg path.
 */
export function project(lines: P3[][], angle: number, tilt = 0.32, margin = 8): string {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const half = 50 - margin;
  const out: string[] = [];
  for (const line of lines) {
    let d = "";
    line.forEach(([x, y, z], i) => {
      const rx = x * ca + z * sa;
      const rz = -x * sa + z * ca;
      const ry = y * ct - rz * st;
      const depth = y * st + rz * ct;
      const k = 3.2 / (3.2 - depth);
      d += `${i === 0 ? "M" : "L"}${(50 + rx * k * half * 0.86).toFixed(1)} ${(50 - ry * k * half * 0.86).toFixed(1)}`;
    });
    out.push(d);
  }
  return out.join(" ");
}
