/**
 * the paths of the line figures: the fractals of the fractals topic, generated
 * in a 100 by 100 box as svg path strings. the element in components/figures.tsx
 * draws them. the curves come from rewriting rules read by a turtle; the rest
 * from direct recursion.
 */

export type FigureKind =
  | "snowflake"
  | "koch"
  | "triangle"
  | "arrowhead"
  | "carpet"
  | "squares"
  | "cantor"
  | "dragon"
  | "levy"
  | "hilbert"
  | "flowsnake"
  | "tree";

type Pt = [number, number];

const fmt = (n: number) => n.toFixed(2);

function polyline(points: Pt[], close: boolean): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`).join(" ") + (close ? " Z" : "");
}

/** scales a set of polylines to fit the box with a margin, keeping proportions. */
function fit(lines: Pt[][], margin = 8): Pt[][] {
  const all = lines.flat();
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const span = Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY) || 1;
  const scale = (100 - 2 * margin) / span;
  const ox = (100 - (Math.max(...xs) - minX) * scale) / 2;
  const oy = (100 - (Math.max(...ys) - minY) * scale) / 2;
  return lines.map((line) => line.map(([x, y]) => [ox + (x - minX) * scale, oy + (y - minY) * scale]));
}

/** a rewriting system drawn by a turtle: F moves, + and - turn, [ and ] push and pop. */
function turtle(axiom: string, rules: Record<string, string>, n: number, angle: number, forward = "F"): Pt[][] {
  let s = axiom;
  for (let i = 0; i < n; i++) s = [...s].map((c) => rules[c] ?? c).join("");
  const rad = (angle * Math.PI) / 180;
  const lines: Pt[][] = [];
  let line: Pt[] = [[0, 0]];
  let x = 0;
  let y = 0;
  let dir = 0;
  const stack: [number, number, number][] = [];
  for (const c of s) {
    if (forward.includes(c)) {
      x += Math.cos(dir);
      y += Math.sin(dir);
      line.push([x, y]);
    } else if (c === "+") dir += rad;
    else if (c === "-") dir -= rad;
    else if (c === "[") stack.push([x, y, dir]);
    else if (c === "]") {
      if (line.length > 1) lines.push(line);
      [x, y, dir] = stack.pop() ?? [x, y, dir];
      line = [[x, y]];
    }
  }
  if (line.length > 1) lines.push(line);
  return fit(lines);
}

function kochSide(a: Pt, b: Pt, n: number): Pt[] {
  if (n === 0) return [a];
  const [ax, ay] = a;
  const [bx, by] = b;
  const dx = (bx - ax) / 3;
  const dy = (by - ay) / 3;
  const p1: Pt = [ax + dx, ay + dy];
  const p3: Pt = [ax + 2 * dx, ay + 2 * dy];
  const t = -Math.PI / 3;
  const p2: Pt = [p1[0] + dx * Math.cos(t) - dy * Math.sin(t), p1[1] + dx * Math.sin(t) + dy * Math.cos(t)];
  return [...kochSide(a, p1, n - 1), ...kochSide(p1, p2, n - 1), ...kochSide(p2, p3, n - 1), ...kochSide(p3, b, n - 1)];
}

function snowflake(level: number): string[] {
  const r = 44;
  const corners: Pt[] = [0, 1, 2].map((i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
    return [50 + r * Math.cos(a), 54 + r * Math.sin(a)];
  });
  const pts = [...kochSide(corners[0], corners[1], level), ...kochSide(corners[1], corners[2], level), ...kochSide(corners[2], corners[0], level)];
  return [polyline(pts, true)];
}

function sierpinski(level: number): string[] {
  const out: string[] = [];
  const walk = (a: Pt, b: Pt, c: Pt, n: number) => {
    out.push(polyline([a, b, c], true));
    if (n === 0) return;
    const ab: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const bc: Pt = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];
    const ca: Pt = [(c[0] + a[0]) / 2, (c[1] + a[1]) / 2];
    walk(a, ab, ca, n - 1);
    walk(ab, b, bc, n - 1);
    walk(ca, bc, c, n - 1);
  };
  walk([50, 8], [94, 88], [6, 88], level);
  return out;
}

function squareAt(cx: number, cy: number, s: number): string {
  const h = s / 2;
  return polyline([[cx - h, cy - h], [cx + h, cy - h], [cx + h, cy + h], [cx - h, cy + h]], true);
}

function vicsek(level: number): string[] {
  const out: string[] = [];
  const walk = (cx: number, cy: number, s: number, n: number) => {
    out.push(squareAt(cx, cy, s));
    if (n === 0) return;
    const t = s / 3;
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]]) walk(cx + dx * t, cy + dy * t, t, n - 1);
  };
  walk(50, 50, 84, level);
  return out;
}

function carpet(level: number): string[] {
  const out: string[] = [];
  const walk = (cx: number, cy: number, s: number, n: number) => {
    out.push(squareAt(cx, cy, s));
    if (n === 0) return;
    const t = s / 3;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx !== 0 || dy !== 0) walk(cx + dx * t, cy + dy * t, t, n - 1);
  };
  walk(50, 50, 84, level);
  return out;
}

function cantor(levels: number): string[] {
  const out: string[] = [];
  const gap = 84 / levels;
  const walk = (x0: number, x1: number, row: number) => {
    if (row >= levels) return;
    const y = 8 + row * gap + gap / 2;
    out.push(polyline([[x0, y], [x1, y]], false));
    const third = (x1 - x0) / 3;
    walk(x0, x0 + third, row + 1);
    walk(x1 - third, x1, row + 1);
  };
  walk(8, 92, 0);
  return out;
}

function tree(depth: number): string[] {
  const out: string[] = [];
  const walk = (x: number, y: number, len: number, dir: number, n: number) => {
    const nx = x + len * Math.cos(dir);
    const ny = y + len * Math.sin(dir);
    out.push(polyline([[x, y], [nx, ny]], false));
    if (n === 0) return;
    walk(nx, ny, len * 0.7, dir - Math.PI / 5, n - 1);
    walk(nx, ny, len * 0.7, dir + Math.PI / 5, n - 1);
  };
  walk(50, 94, 30, -Math.PI / 2, depth);
  return out;
}

const lines = (set: Pt[][]) => set.map((l) => polyline(l, false));

export const FIGURES: Record<FigureKind, () => string[]> = {
  snowflake: () => snowflake(3),
  koch: () => lines(turtle("F", { F: "F+F--F+F" }, 4, 60)),
  triangle: () => sierpinski(3),
  arrowhead: () => lines(turtle("A", { A: "B-A-B", B: "A+B+A" }, 5, 60, "AB")),
  carpet: () => carpet(2),
  squares: () => vicsek(2),
  cantor: () => cantor(5),
  dragon: () => lines(turtle("FX", { X: "X+YF+", Y: "-FX-Y" }, 10, 90)),
  levy: () => lines(turtle("F", { F: "+F--F+" }, 10, 45)),
  hilbert: () => lines(turtle("A", { A: "-BF+AFA+FB-", B: "+AF-BFB-FA+" }, 5, 90)),
  flowsnake: () => lines(turtle("A", { A: "A-B--B+A++AA+B-", B: "+A-BB--B-A++A+B" }, 3, 60, "AB")),
  tree: () => tree(7),
};

export const FIGURE_KINDS = Object.keys(FIGURES) as FigureKind[];

/** the figure's name as the fractals topic calls it. */
export const FIGURE_NAMES: Record<FigureKind, string> = {
  snowflake: "Koch snowflake",
  koch: "Koch curve",
  triangle: "Sierpinski triangle",
  arrowhead: "Sierpinski arrowhead",
  carpet: "Sierpinski carpet",
  squares: "Vicsek cross",
  cantor: "Cantor set",
  dragon: "Dragon curve",
  levy: "Lévy C curve",
  hilbert: "Hilbert curve",
  flowsnake: "Gosper flowsnake",
  tree: "Binary tree",
};
