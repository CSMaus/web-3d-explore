export function rngFrom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export type Dbm = {
  rows: number;
  cols: number;
  mode: "point" | "gap";
  phi: Float64Array;
  fixed: Uint8Array;
  cluster: Uint8Array;
  order: number[];
  rand: () => number;
  done: boolean;
};

export function relax(st: Dbm, sweeps: number) {
  const { rows, cols, phi, fixed } = st;
  const next = new Float64Array(phi.length);
  for (let s = 0; s < sweeps; s++) {
    next.set(phi);
    for (let r = 1; r < rows - 1; r++) {
      const row = r * cols;
      for (let c = 1; c < cols - 1; c++) {
        const i = row + c;
        if (fixed[i]) continue;
        next[i] = 0.25 * (phi[i - cols] + phi[i + cols] + phi[i - 1] + phi[i + 1]);
      }
    }
    for (let r = 0; r < rows; r++) {
      const row = r * cols;
      if (!fixed[row]) next[row] = next[row + 1];
      if (!fixed[row + cols - 1]) next[row + cols - 1] = next[row + cols - 2];
    }
    phi.set(next);
  }
}

export function dbmCreate(
  rows: number,
  cols: number,
  seed: number,
  sweeps: number,
  mode: "point" | "gap",
): Dbm {
  const n = rows * cols;
  const st: Dbm = {
    rows,
    cols,
    mode,
    phi: new Float64Array(n),
    fixed: new Uint8Array(n),
    cluster: new Uint8Array(n),
    order: [],
    rand: rngFrom(seed),
    done: false,
  };
  let seedAt: number;
  if (mode === "point") {
    const mr = rows >> 1;
    const mc = cols >> 1;
    const far = Math.min(mr, mc);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        st.phi[r * cols + c] = Math.min(1, Math.hypot(r - mr, c - mc) / far);
      }
    }
    for (let c = 0; c < cols; c++) {
      st.phi[c] = 1;
      st.fixed[c] = 1;
      st.phi[(rows - 1) * cols + c] = 1;
      st.fixed[(rows - 1) * cols + c] = 1;
    }
    for (let r = 0; r < rows; r++) {
      st.phi[r * cols] = 1;
      st.fixed[r * cols] = 1;
      st.phi[r * cols + cols - 1] = 1;
      st.fixed[r * cols + cols - 1] = 1;
    }
    seedAt = mr * cols + mc;
  } else {
    for (let r = 0; r < rows; r++) {
      const v = r / (rows - 1);
      for (let c = 0; c < cols; c++) st.phi[r * cols + c] = v;
    }
    for (let c = 0; c < cols; c++) {
      st.phi[c] = 0;
      st.fixed[c] = 1;
      const b = (rows - 1) * cols + c;
      st.phi[b] = 1;
      st.fixed[b] = 1;
    }
    seedAt = cols + (cols >> 1);
  }
  st.cluster[seedAt] = 1;
  st.fixed[seedAt] = 1;
  st.phi[seedAt] = 0;
  st.order.push(seedAt);
  relax(st, sweeps);
  return st;
}

export function dbmStep(st: Dbm, eta: number, warm: number) {
  const { rows, cols, phi, cluster } = st;
  const idx: number[] = [];
  const w: number[] = [];
  let total = 0;
  for (let r = 1; r < rows - 1; r++) {
    const row = r * cols;
    for (let c = 1; c < cols - 1; c++) {
      const i = row + c;
      if (cluster[i]) continue;
      if (!(cluster[i - cols] || cluster[i + cols] || cluster[i - 1] || cluster[i + 1])) continue;
      const p = Math.pow(Math.max(phi[i], 0), eta);
      idx.push(i);
      w.push(p);
      total += p;
    }
  }
  if (!idx.length || !(total > 0)) {
    st.done = true;
    return false;
  }
  let r = st.rand() * total;
  let k = 0;
  while (k < idx.length - 1 && r > w[k]) {
    r -= w[k];
    k++;
  }
  const at = idx[k];
  cluster[at] = 1;
  st.fixed[at] = 1;
  phi[at] = 0;
  st.order.push(at);
  const hitRow = Math.floor(at / cols);
  const hitCol = at % cols;
  if (st.mode === "point") {
    if (hitRow <= 1 || hitRow >= rows - 2 || hitCol <= 1 || hitCol >= cols - 2) st.done = true;
  } else if (hitRow >= rows - 2) {
    st.done = true;
  }
  relax(st, warm);
  return true;
}

export type Dla = {
  size: number;
  grid: Uint8Array;
  order: number[];
  tracks: number[][];
  radius: number;
  rand: () => number;
  done: boolean;
};

export function dlaCreate(size: number, seed: number): Dla {
  const st: Dla = {
    size,
    grid: new Uint8Array(size * size),
    order: [],
    tracks: [],
    radius: 2,
    rand: rngFrom(seed),
    done: false,
  };
  const at = (size >> 1) * size + (size >> 1);
  st.grid[at] = 1;
  st.order.push(at);
  return st;
}

export function dlaLaunch(st: Dla, kill: number, cap: number, traceLimit: number) {
  const { size, grid } = st;
  const half = size >> 1;
  const keep = traceLimit > 0;
  const walk: number[] = [];
  const start = st.radius + 2;
  const angle = st.rand() * Math.PI * 2;
  let y = Math.round(half + start * Math.sin(angle));
  let x = Math.round(half + start * Math.cos(angle));
  const gone = kill * start * (kill * start);
  for (let n = 0; n < cap; n++) {
    if (keep) walk.push(y * size + x);
    const d = st.rand();
    if (d < 0.25) y += 1;
    else if (d < 0.5) y -= 1;
    else if (d < 0.75) x += 1;
    else x -= 1;
    const dy = y - half;
    const dx = x - half;
    if (dy * dy + dx * dx > gone) return false;
    if (y < 1 || y >= size - 1 || x < 1 || x >= size - 1) return false;
    if (
      grid[(y - 1) * size + x] ||
      grid[(y + 1) * size + x] ||
      grid[y * size + x - 1] ||
      grid[y * size + x + 1]
    ) {
      const at = y * size + x;
      grid[at] = 1;
      st.order.push(at);
      const reach = Math.hypot(dy, dx) + 1;
      if (reach > st.radius) st.radius = reach;
      if (st.radius >= half - 2) st.done = true;
      if (keep) {
        walk.push(at);
        st.tracks.push(walk);
        while (st.tracks.length > traceLimit) st.tracks.shift();
      }
      return true;
    }
  }
  return false;
}

export function dlaGrow(
  st: Dla,
  want: number,
  target: number,
  kill: number,
  cap: number,
  traceLimit: number,
) {
  let added = 0;
  let tries = 0;
  while (added < want && tries < 400) {
    if (st.done || st.order.length >= target) break;
    tries++;
    if (dlaLaunch(st, kill, cap, traceLimit)) added++;
  }
  return added;
}

export function massDim(order: number[], size: number, shares: number[]) {
  if (order.length < 60) return null;
  const half = size >> 1;
  let reach = 0;
  const rad = new Float64Array(order.length);
  for (let i = 0; i < order.length; i++) {
    const dy = Math.floor(order[i] / size) - half;
    const dx = (order[i] % size) - half;
    rad[i] = Math.hypot(dy, dx);
    if (rad[i] > reach) reach = rad[i];
  }
  if (!(reach > 4)) return null;
  const pairs: [number, number][] = [];
  for (const f of shares) {
    const r = reach * f;
    let n = 0;
    for (let i = 0; i < rad.length; i++) if (rad[i] <= r) n++;
    if (n > 0) pairs.push([Math.log(r), Math.log(n)]);
  }
  if (pairs.length < 3) return null;
  const n = pairs.length;
  const mx = pairs.reduce((a, p) => a + p[0], 0) / n;
  const my = pairs.reduce((a, p) => a + p[1], 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pairs) {
    num += (p[0] - mx) * (p[1] - my);
    den += (p[0] - mx) ** 2;
  }
  return den === 0 ? null : num / den;
}

export function cellsBoxDim(order: number[], size: number) {
  const xs = new Float64Array(order.length);
  const ys = new Float64Array(order.length);
  for (let i = 0; i < order.length; i++) {
    xs[i] = order[i] % size;
    ys[i] = Math.floor(order[i] / size);
  }
  return { xs, ys };
}
