import type { Pen } from "@/components/Plot";
import { FAINT, MUTED, ONE, SKY } from "@/lib/draw";
import { sDot, sLine, sRing, withAlpha } from "@/scenes/kit";
import type { Stage } from "@/scenes/kit";
import { armsChain, armsHeight, unitArms, unitTarget } from "@/systems/series";
import type { Arm, C, UnitWave } from "@/systems/series";

export type WaveState = { wave: UnitWave; shown: number; proj: number; strip: number; ghost: number };

const HUB: C = [22, 37.5];
const R = 15;
const W = (2 * Math.PI) / 7;
const X0 = 50;
const X1 = 98;
const P = 26;
const BASE = 37.5;
const WALL: C = [16, 59];
const STEP = 0.4;
const MOST = 40;
const TURN = 2 * Math.PI;

const THIN = 1;
const ARM_WEIGHT = 2;
const WAVE_WEIGHT = 2.5;
const GHOST_WEIGHT = 5;
const GHOST_ALPHA = 0.3;
const DASH = [4, 5];
const SOLID: number[] = [];

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

const ARMS: Record<UnitWave, Arm[]> = {
  square: unitArms("square", MOST),
  sawtooth: unitArms("sawtooth", MOST),
};
const SAMPLES = Math.round((X1 - X0) / STEP);

function ringAlpha(i: number): number {
  if (i < RING_NEAR) return ALPHA_NEAR;
  return i < RING_MID ? ALPHA_MID : ALPHA_FAR;
}

export function drawWave(pen: Pen, st: Stage, s: WaveState, t: number): void {
  const arms = ARMS[s.wave];
  const angle = W * t;
  const chain = armsChain(arms, s.shown, angle).map(([x, y]): C => [HUB[0] + R * x, HUB[1] + R * y]);
  const tip = chain[chain.length - 1];
  const lengths = chain.slice(1).map((p, i) => Math.hypot(p[0] - chain[i][0], p[1] - chain[i][1]));
  const xs = Array.from({ length: SAMPLES + 1 }, (_, i) => X0 + i * STEP);
  const phase = (x: number) => angle - ((x - X0) / P) * TURN;

  withAlpha(pen, GHOST_ALPHA * s.ghost * s.strip, () => {
    sLine(pen, st, xs.map((x): C => [x, BASE + R * unitTarget(s.wave, phase(x))]), MUTED, GHOST_WEIGHT);
  });

  withAlpha(pen, s.strip, () => {
    sLine(pen, st, [[X0, BASE], [X1, BASE]], FAINT, THIN);
    sLine(pen, st, xs.map((x): C => [x, BASE + R * armsHeight(arms, s.shown, phase(x))]), ONE, WAVE_WEIGHT);
  });

  withAlpha(pen, s.proj, () => {
    sLine(pen, st, [[X0, WALL[0]], [X0, WALL[1]]], FAINT, THIN);
    pen.ctx.setLineDash(DASH);
    sLine(pen, st, [tip, [X0, tip[1]]], ONE, THIN);
    pen.ctx.setLineDash(SOLID);
  });

  lengths.forEach((len, i) => {
    if (len < RING_LEAST) return;
    withAlpha(pen, ringAlpha(i), () => sRing(pen, st, chain[i][0], chain[i][1], len, MUTED, THIN));
  });

  sLine(pen, st, chain, SKY, ARM_WEIGHT);

  for (let i = 1; i < chain.length - 1; i += 1) {
    if (lengths[i - 1] > JOINT_LEAST) sDot(pen, st, chain[i][0], chain[i][1], JOINT_DOT, SKY);
  }
  sDot(pen, st, HUB[0], HUB[1], HUB_DOT, MUTED);
  sDot(pen, st, tip[0], tip[1], TIP_DOT, ONE);
  withAlpha(pen, s.proj, () => sDot(pen, st, X0, tip[1], TIP_DOT, ONE));
}
