import { IFS_PRESETS, contraction, runGame, boxDim } from "../src/systems/ifs.ts";
import { LSYS_PRESETS, expand, parseRules, rngFrom, turtle } from "../src/systems/lsystem.ts";
import { dbmCreate, dbmStep, dlaCreate, dlaGrow, massDim } from "../src/systems/growth.ts";

const fern = IFS_PRESETS["Barnsley fern"];
console.log("fern contractions", fern.map((m) => contraction(m).toFixed(3)).join(" "));
const run = runGame(fern, { points: 120000, startx: 0, starty: 0, drop: 30 });
const d = boxDim(run.xs, run.ys, run.kept);
console.log("fern kept", run.kept, "box dimension", d?.toFixed(3));
const tally = new Array(4).fill(0);
for (let i = 0; i < run.kept; i++) tally[run.who[i]]++;
console.log("per move share", tally.map((n) => ((n / run.kept) * 100).toFixed(1) + "%").join(" "));
for (const [name, cfg] of Object.entries(LSYS_PRESETS)) {
  const g = expand(cfg.axiom, parseRules(cfg.rules), cfg.passes, 900000);
  const segs = turtle(g.word, cfg.angle, 0, rngFrom(7));
  console.log(name.padEnd(21), "word", String(g.word.length).padStart(7), "segments", String(segs.length).padStart(6), "capped", g.capped);
}


const SHARES = [0.1, 0.17, 0.28, 0.41, 0.59];

function cells(order: number[], size: number) {
  const xs = new Float64Array(order.length);
  const ys = new Float64Array(order.length);
  for (let i = 0; i < order.length; i++) {
    xs[i] = order[i] % size;
    ys[i] = Math.floor(order[i] / size);
  }
  return { xs, ys };
}

for (const eta of [0.6, 1, 2]) {
  const st = dbmCreate(50, 87, 9, 300, "gap");
  while (!st.done && st.order.length < 300) if (!dbmStep(st, eta, 12)) break;
  const { xs, ys } = cells(st.order, st.cols);
  const d = boxDim(xs, ys, st.order.length, { least: 120, cuts: [2, 4, 8, 16] });
  console.log("breakdown gap  eta", String(eta).padEnd(4), "sites", String(st.order.length).padStart(4), "box d", d ? d.toFixed(3) : "n/a");
}
{
  const cols = 91;
  const st = dbmCreate(Math.round(cols * 1.04), cols, 9, 300, "point");
  while (!st.done && st.order.length < 400) if (!dbmStep(st, 1, 12)) break;
  const mr = st.rows >> 1;
  const mc = st.cols >> 1;
  const sect = new Array(8).fill(0);
  for (const at of st.order) {
    const dy = Math.floor(at / st.cols) - mr;
    const dx = (at % st.cols) - mc;
    const a = Math.atan2(-dy, dx);
    const s = ((Math.floor((a + Math.PI) / (Math.PI / 4)) % 8) + 8) % 8;
    sect[s] = Math.max(sect[s], Math.hypot(dx, dy));
  }
  console.log("Lichtenberg point sites", st.order.length, "reach per sector", sect.map((v) => v.toFixed(0)).join(" "));
}
for (const [size, target] of [[161, 1200], [161, 2500]] as const) {
  const st = dlaCreate(size, 11);
  while (!st.done && st.order.length < target) {
    const before = st.order.length;
    dlaGrow(st, 20, target, 2.5, 6000, 3);
    if (st.order.length === before) break;
  }
  const md = massDim(st.order, size, SHARES);
  console.log("wandering particles", String(st.order.length).padStart(4), "reach", st.radius.toFixed(0), "mass d", md ? md.toFixed(3) : "n/a");
}
