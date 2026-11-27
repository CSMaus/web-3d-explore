import type { Pen } from "@/components/Plot";
import { MUTED, ONE, SKY } from "@/lib/draw";
import { sDot, sLine, sRing, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import { chainFrom } from "@/systems/series";
import type { C, Circle } from "@/systems/series";

export type ChainState = { hub: C; arms: Circle[]; shown: number; target: number; path: C[] | null };

const CENTRE: C = [50, 37.5];
const K = 30;
const LAP_TIME = 10;
const SPOTS = 480;

const TARGET_ALPHA = 0.7;
const TARGET_WEIGHT = 2;
const TARGET_DASH = [2, 6];
const SOLID: number[] = [];

const LAP_ALPHA = 0.22;
const LAP_WEIGHT = 1.5;

const TAIL_SHARE = 0.8;
const BANDS = 16;
const BAND_POWER = 1.4;
const TAIL_WEIGHT = 3;

const THIN = 1;
const ARM_WEIGHT = 2;
const RING_MOST = 30;
const RING_LEAST = 0.4;
const RING_NEAR = 3;
const RING_MID = 10;
const ALPHA_NEAR = 0.5;
const ALPHA_MID = 0.28;
const ALPHA_FAR = 0.12;

const JOINT_LEAST = 1.6;
const JOINT_DOT = 2;
const HUB_DOT = 3.5;
const TIP_DOT = 5;

type Kept = { arms: Circle[]; hub: C; shown: number; lap: C[] };

let kept: Kept | null = null;

const place = (p: C): C => [CENTRE[0] + K * p[0], CENTRE[1] + K * p[1]];

function ringAlpha(i: number): number {
  if (i < RING_NEAR) return ALPHA_NEAR;
  return i < RING_MID ? ALPHA_MID : ALPHA_FAR;
}

function lapOf(s: ChainState): C[] {
  if (kept && kept.arms === s.arms && kept.shown === s.shown && kept.hub[0] === s.hub[0] && kept.hub[1] === s.hub[1]) return kept.lap;
  const lap = Array.from({ length: SPOTS }, (_, i): C => {
    const chain = chainFrom(s.hub, s.arms, s.shown, i / SPOTS);
    return place(chain[chain.length - 1]);
  });
  kept = { arms: s.arms, hub: [s.hub[0], s.hub[1]], shown: s.shown, lap };
  return lap;
}

export function drawChain(pen: Pen, st: Stage, s: ChainState, t: number): void {
  const turn = (((t / LAP_TIME) % 1) + 1) % 1;
  const path = s.path;

  if (path !== null && path.length > 0) {
    withAlpha(pen, TARGET_ALPHA * s.target, () => {
      pen.ctx.setLineDash(TARGET_DASH);
      sLine(pen, st, [...path, path[0]].map(place), MUTED, TARGET_WEIGHT);
      pen.ctx.setLineDash(SOLID);
    });
  }

  const lap = lapOf(s);
  withAlpha(pen, LAP_ALPHA, () => sLine(pen, st, [...lap, lap[0]], ONE, LAP_WEIGHT));

  const chain = chainFrom(s.hub, s.arms, s.shown, turn).map(place);
  const tip = chain[chain.length - 1];
  const lengths = chain.slice(1).map((p, i) => Math.hypot(p[0] - chain[i][0], p[1] - chain[i][1]));

  const now = Math.floor(turn * SPOTS);
  const tail = Math.floor(SPOTS * TAIL_SHARE);
  for (let b = BANDS - 1; b >= 0; b -= 1) {
    const band: C[] = [];
    for (let j = Math.floor((tail * (b + 1)) / BANDS); j >= Math.floor((tail * b) / BANDS); j -= 1) {
      band.push(lap[(((now - j) % SPOTS) + SPOTS) % SPOTS]);
    }
    if (b === 0) band.push(tip);
    withAlpha(pen, (1 - b / BANDS) ** BAND_POWER, () => sLine(pen, st, band, ONE, TAIL_WEIGHT));
  }

  lengths.slice(0, RING_MOST).forEach((len, i) => {
    if (len < RING_LEAST) return;
    withAlpha(pen, ringAlpha(i), () => sRing(pen, st, chain[i][0], chain[i][1], len, MUTED, THIN));
  });

  sLine(pen, st, chain, SKY, ARM_WEIGHT);

  for (let i = 1; i < chain.length - 1; i += 1) {
    if (lengths[i - 1] > JOINT_LEAST) sDot(pen, st, chain[i][0], chain[i][1], JOINT_DOT, SKY);
  }
  sDot(pen, st, chain[0][0], chain[0][1], HUB_DOT, MUTED);
  sDot(pen, st, tip[0], tip[1], TIP_DOT, ONE);
}
