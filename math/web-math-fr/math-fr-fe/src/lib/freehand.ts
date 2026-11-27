import type { C } from "@/systems/series";

const CENTRE: C = [50, 37.5];
const SCALE = 30;
const GAP = 0.008;
const LEAST = 12;

export function addPoint(points: C[], p: C, minGap = GAP): C[] {
  const last = points[points.length - 1];
  if (last !== undefined && Math.hypot(p[0] - last[0], p[1] - last[1]) <= minGap) return [...points];
  return [...points, p];
}

export function finish(points: C[], least = LEAST): C[] | null {
  return points.length < least ? null : points;
}

export function fromStage(sx: number, sy: number): C {
  return [(sx - CENTRE[0]) / SCALE, (sy - CENTRE[1]) / SCALE];
}
