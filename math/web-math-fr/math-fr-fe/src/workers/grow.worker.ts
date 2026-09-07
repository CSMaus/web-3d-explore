/// <reference lib="webworker" />
import {
  type Dbm,
  type Dla,
  dbmCreate,
  dbmStep,
  dlaCreate,
  dlaGrow,
} from "@/systems/growth";

export type DbmJob = {
  kind: "dbm";
  mode: "point" | "gap";
  cols: number;
  rows: number;
  eta: number;
  sites: number;
  seed: number;
  sweeps: number;
  warm: number;
};

export type DlaJob = {
  kind: "dla";
  size: number;
  target: number;
  kill: number;
  seed: number;
  traced: number;
  cap: number;
};

export type Job = (DbmJob | DlaJob) & { id: number };

export type Tick = {
  id: number;
  kind: "dbm" | "dla";
  order: Int32Array;
  size: number;
  rows: number;
  cols: number;
  phi: Float32Array | null;
  tracks: Int32Array[];
  radius: number;
  done: boolean;
  finished: boolean;
};

const scope = self as unknown as DedicatedWorkerGlobalScope;

let job: Job | null = null;
let dbm: Dbm | null = null;
let dla: Dla | null = null;

function sendDbm(state: Dbm, id: number, finished: boolean) {
  const order = Int32Array.from(state.order);
  const phi = Float32Array.from(state.phi);
  const tick: Tick = {
    id,
    kind: "dbm",
    order,
    size: state.cols,
    rows: state.rows,
    cols: state.cols,
    phi,
    tracks: [],
    radius: 0,
    done: state.done,
    finished,
  };
  scope.postMessage(tick, [order.buffer, phi.buffer]);
}

function sendDla(state: Dla, id: number, finished: boolean) {
  const order = Int32Array.from(state.order);
  const tracks = state.tracks.map((t) => Int32Array.from(t));
  const tick: Tick = {
    id,
    kind: "dla",
    order,
    size: state.size,
    rows: state.size,
    cols: state.size,
    phi: null,
    tracks,
    radius: state.radius,
    done: state.done,
    finished,
  };
  scope.postMessage(tick, [order.buffer, ...tracks.map((t) => t.buffer)]);
}

function pump() {
  if (!job) return;
  const id = job.id;

  if (job.kind === "dbm" && dbm) {
    const target = job.sites;
    let added = 0;
    while (added < 6 && !dbm.done && dbm.order.length < target) {
      if (!dbmStep(dbm, job.eta, job.warm)) break;
      added++;
    }
    const finished = dbm.done || dbm.order.length >= target;
    sendDbm(dbm, id, finished);
    if (!finished) setTimeout(pump, 0);
    return;
  }

  if (job.kind === "dla" && dla) {
    dlaGrow(dla, 16, job.target, job.kill, job.cap, job.traced);
    const finished = dla.done || dla.order.length >= job.target;
    sendDla(dla, id, finished);
    if (!finished) setTimeout(pump, 0);
  }
}

scope.onmessage = (event: MessageEvent<Job>) => {
  job = event.data;
  dbm = null;
  dla = null;
  if (job.kind === "dbm") {
    dbm = dbmCreate(job.rows, job.cols, job.seed, job.sweeps, job.mode);
    sendDbm(dbm, job.id, false);
  } else {
    dla = dlaCreate(job.size, job.seed);
    sendDla(dla, job.id, false);
  }
  setTimeout(pump, 0);
};
