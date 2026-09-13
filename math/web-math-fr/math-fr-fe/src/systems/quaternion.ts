/**
 * Hamilton's numbers: one real part and three imaginary ones, i, j and k, with
 * i i = j j = k k = i j k = -1, cut into the stone of a Dublin bridge in 1843.
 * a unit quaternion is a turn in space, as a unit complex number is a turn in
 * the plane, with one difference that changes everything: two turns in space
 * do not commute, so neither do the numbers.
 *
 * stored as [w, x, y, z]: w + x i + y j + z k.
 */
export type Q = [number, number, number, number];
export type V3 = [number, number, number];

export const ONE_Q: Q = [1, 0, 0, 0];

export function mul(a: Q, b: Q): Q {
  const [aw, ax, ay, az] = a;
  const [bw, bx, by, bz] = b;
  return [
    aw * bw - ax * bx - ay * by - az * bz,
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
  ];
}

export const conj = (q: Q): Q => [q[0], -q[1], -q[2], -q[3]];
export const norm = (q: Q) => Math.hypot(q[0], q[1], q[2], q[3]);
export function unit(q: Q): Q {
  const n = norm(q) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}

/** the turn by an angle about an axis: half the angle goes in, which is the whole trick. */
export function fromAxisAngle(axis: V3, angle: number): Q {
  const n = Math.hypot(...axis) || 1;
  const s = Math.sin(angle / 2);
  return [Math.cos(angle / 2), (axis[0] / n) * s, (axis[1] / n) * s, (axis[2] / n) * s];
}

/** the axis and angle of a unit quaternion, angle in [0, pi]. */
export function toAxisAngle(q: Q): { axis: V3; angle: number } {
  const u = unit(q);
  const w = Math.max(-1, Math.min(1, u[0]));
  const angle = 2 * Math.acos(Math.abs(w));
  const s = Math.sqrt(Math.max(0, 1 - w * w));
  const sign = w < 0 ? -1 : 1;
  if (s < 1e-9) return { axis: [0, 0, 1], angle: 0 };
  return { axis: [(sign * u[1]) / s, (sign * u[2]) / s, (sign * u[3]) / s], angle };
}

/** a vector turned by q: q v q^-1, with v as a quaternion with no real part. */
export function rotate(q: Q, v: V3): V3 {
  const p = mul(mul(q, [0, v[0], v[1], v[2]]), conj(q));
  return [p[1], p[2], p[3]];
}

/** the turn part way from a to b along the shortest arc: Shoemake's slerp. */
export function slerp(a: Q, b: Q, t: number): Q {
  let cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (cos < 0) {
    cos = -cos;
    bb = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (cos > 0.9995) return unit([a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t]);
  const theta = Math.acos(cos);
  const sa = Math.sin((1 - t) * theta) / Math.sin(theta);
  const sb = Math.sin(t * theta) / Math.sin(theta);
  return [a[0] * sa + bb[0] * sb, a[1] * sa + bb[1] * sb, a[2] * sa + bb[2] * sb, a[3] * sa + bb[3] * sb];
}

/** the angle between two orientations: how far apart two turns left the same object. */
export function between(a: Q, b: Q): number {
  return toAxisAngle(mul(conj(a), b)).angle;
}

/** "0.71 + 0.71i", "j", "-k", the way the other topic writes a + bi. */
export function show(q: Q, digits = 2): string {
  const parts: string[] = [];
  const names = ["", "i", "j", "k"];
  q.forEach((v, idx) => {
    if (Math.abs(v) < Math.pow(10, -digits) / 2) return;
    const mag = Math.abs(v);
    const body = idx === 0 ? mag.toFixed(digits) : Math.abs(mag - 1) < Math.pow(10, -digits) / 2 ? "" : mag.toFixed(digits);
    const term = body + names[idx];
    parts.push(parts.length === 0 ? (v < 0 ? "-" : "") + term : (v < 0 ? " - " : " + ") + term);
  });
  return parts.length ? parts.join("") : "0";
}

/**
 * a shape to turn: a small house, so its orientation is unmistakable. one
 * polyline through every edge, with the return trips included.
 */
export const HOUSE: V3[] = (() => {
  const a: V3 = [-1, -0.6, -0.5];
  const b: V3 = [1, -0.6, -0.5];
  const c: V3 = [1, -0.6, 0.5];
  const d: V3 = [-1, -0.6, 0.5];
  const e: V3 = [-1, 0.3, -0.5];
  const f: V3 = [1, 0.3, -0.5];
  const g: V3 = [1, 0.3, 0.5];
  const h: V3 = [-1, 0.3, 0.5];
  const r1: V3 = [-1, 0.9, 0];
  const r2: V3 = [1, 0.9, 0];
  const door1: V3 = [0.3, -0.6, 0.5];
  const door2: V3 = [0.3, -0.1, 0.5];
  const door3: V3 = [0.7, -0.1, 0.5];
  const door4: V3 = [0.7, -0.6, 0.5];
  return [a, b, c, d, a, e, f, b, f, g, c, g, h, d, h, e, r1, r2, f, r2, g, r2, r1, h, r1, e, a, d, door1, door2, door3, door4];
})();
