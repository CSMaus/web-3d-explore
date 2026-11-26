/**
 * the arithmetic of a route over the globe: distances along the sphere, the shortest path between
 * two places as a list of points, and the view of a point from a globe turned to face a longitude
 * and latitude (orthographic, as the globe is seen from far away).
 */
export type Place = { lat: number; lon: number };

const R_EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** the distance between two places along the surface, in kilometres (haversine) */
export function kmBetween(a: Place, b: Place): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** the whole route's length, place to place in order */
export function routeKm(places: Place[]): number {
  let s = 0;
  for (let i = 1; i < places.length; i += 1) s += kmBetween(places[i - 1], places[i]);
  return s;
}

type V3 = [number, number, number];
const toV = (p: Place): V3 => [Math.cos(rad(p.lat)) * Math.cos(rad(p.lon)), Math.cos(rad(p.lat)) * Math.sin(rad(p.lon)), Math.sin(rad(p.lat))];
const toP = (v: V3): Place => ({ lat: (Math.asin(Math.max(-1, Math.min(1, v[2]))) * 180) / Math.PI, lon: (Math.atan2(v[1], v[0]) * 180) / Math.PI });

/** points along the shortest path between two places, ends included (spherical interpolation) */
export function arc(a: Place, b: Place, steps = 48): Place[] {
  const p = toV(a);
  const q = toV(b);
  const dot = Math.max(-1, Math.min(1, p[0] * q[0] + p[1] * q[1] + p[2] * q[2]));
  const w = Math.acos(dot);
  if (w < 1e-9) return [a, b];
  // two places on opposite sides of the globe have no one shortest path; go by way of a pole
  if (Math.PI - w < 1e-9) {
    const pole = { lat: a.lat >= 0 ? 90 : -90, lon: a.lon };
    return [...arc(a, pole, Math.ceil(steps / 2)), ...arc(pole, b, Math.ceil(steps / 2)).slice(1)];
  }
  const out: Place[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const s1 = Math.sin((1 - t) * w) / Math.sin(w);
    const s2 = Math.sin(t * w) / Math.sin(w);
    out.push(toP([s1 * p[0] + s2 * q[0], s1 * p[1] + s2 * q[1], s1 * p[2] + s2 * q[2]]));
  }
  return out;
}

/**
 * a place seen on a globe of radius 1 turned so that the point (lat0, lon0) faces the viewer:
 * x to the right, y up, and whether the place is on the near side
 */
export function project(p: Place, lat0: number, lon0: number): { x: number; y: number; near: boolean } {
  const phi = rad(p.lat);
  const lam = rad(p.lon - lon0);
  const phi0 = rad(lat0);
  const x = Math.cos(phi) * Math.sin(lam);
  const y = Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam);
  const near = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam) >= 0;
  return { x, y, near };
}
