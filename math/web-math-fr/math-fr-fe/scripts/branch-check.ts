import { IFS_PRESETS, contraction, type Map2 } from "../src/systems/ifs.ts";

const maps: Map2[] = IFS_PRESETS["Barnsley fern"];
const carrier = maps.reduce((best, m, i) => (contraction(m) > contraction(maps[best]) ? i : best), 0);
console.log("contractions", maps.map((m) => contraction(m).toFixed(3)).join(" "), "-> carrier is move", carrier + 1);

const N = 120000;
const xs = new Float64Array(N), ys = new Float64Array(N);
const who = new Uint8Array(N), tag = new Uint8Array(N);
const cuts: number[] = [];
let acc = 0;
const sum = maps.reduce((a, m) => a + m.p, 0);
for (const m of maps) { acc += m.p / sum; cuts.push(acc); }

let x = 0, y = 0, mark = carrier;
for (let i = 0; i < N + 40; i++) {
  const r = Math.random();
  let k = 0;
  while (k < cuts.length - 1 && r > cuts[k]) k++;
  const m = maps[k];
  [x, y] = [m.a * x + m.b * y + m.e, m.c * x + m.d * y + m.f];
  if (k !== carrier) mark = k;
  if (i >= 40) { const j = i - 40; xs[j] = x; ys[j] = y; who[j] = k; tag[j] = mark; }
}

function art(keep: (i: number) => boolean, W = 34, H = 30) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < N; i++) { x0 = Math.min(x0, xs[i]); x1 = Math.max(x1, xs[i]); y0 = Math.min(y0, ys[i]); y1 = Math.max(y1, ys[i]); }
  const g = Array.from({ length: H }, () => new Array(W).fill(" "));
  const k = Math.min((W - 1) / (x1 - x0), (H - 1) / (y1 - y0));
  const ox = (W - 1 - (x1 - x0) * k) / 2;
  let n = 0;
  for (let i = 0; i < N; i++) {
    if (!keep(i)) continue;
    n++;
    const px = Math.round((xs[i] - x0) * k + ox), py = H - 1 - Math.round((ys[i] - y0) * k);
    if (px >= 0 && px < W && py >= 0 && py < H) g[py][px] = "#";
  }
  return { rows: g.map((r) => r.join("")), n };
}

for (const move of [2, 3]) {
  const byWho = art((i) => who[i] === move);
  const byTag = art((i) => tag[i] === move);
  console.log(`\nmove ${move + 1}: coloured by last map used (${byWho.n} pts)   |   coloured by branch (${byTag.n} pts)`);
  byWho.rows.forEach((r, i) => console.log("  " + r + "   |   " + byTag.rows[i]));
}
