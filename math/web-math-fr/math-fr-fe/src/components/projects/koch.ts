type P = [number, number];

/**
 * the Koch curve from a to b after `level` steps. each step replaces every piece by four pieces a
 * third as long, the middle two raised into a point. `grow` raises the last step's points from
 * flat (0) to full (1), so a figure can show a step happening rather than jump to it.
 */
export function koch(level: number, a: P, b: P, grow = 1): P[] {
  let pts: P[] = [a, b];
  for (let k = 0; k < level; k++) {
    const lift = k === level - 1 ? grow : 1;
    const next: P[] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const dx = (x1 - x0) / 3;
      const dy = (y1 - y0) / 3;
      const p1: P = [x0 + dx, y0 + dy];
      const p3: P = [x0 + 2 * dx, y0 + 2 * dy];
      // the raised point: the middle third turned by sixty degrees, scaled by the lift
      const h = (Math.sqrt(3) / 2) * lift;
      const p2: P = [x0 + 1.5 * dx - h * dy, y0 + 1.5 * dy + h * dx];
      next.push(p1, p2, p3, pts[i + 1]);
    }
    pts = next;
  }
  return pts;
}

/** the closed snowflake: three Koch curves on the sides of a triangle, centred on (cx, cy) */
export function snowflake(level: number, cx: number, cy: number, r: number, grow = 1): P[] {
  const corner = (k: number): P => [cx + r * Math.cos(Math.PI / 2 + (k * 2 * Math.PI) / 3), cy + r * Math.sin(Math.PI / 2 + (k * 2 * Math.PI) / 3)];
  const out: P[] = [];
  for (let k = 0; k < 3; k++) {
    // corners in clockwise order, so the points rise outwards
    const side = koch(level, corner(-k), corner(-k - 1), grow);
    out.push(...(k ? side.slice(1) : side));
  }
  return out;
}
