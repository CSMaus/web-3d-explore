import { describe, expect, it } from "vitest";
import { arc, kmBetween, project, routeKm } from "@/lib/globe";

describe("The route over the globe", () => {
  it("measures along the sphere: London to Paris about 344 km, a quarter of the equator 10,008 km", () => {
    expect(Math.round(kmBetween({ lat: 51.5074, lon: -0.1278 }, { lat: 48.8566, lon: 2.3522 }))).toBe(344);
    expect(Math.round(kmBetween({ lat: 0, lon: 0 }, { lat: 0, lon: 90 }))).toBe(10008);
    expect(routeKm([{ lat: 0, lon: 0 }, { lat: 0, lon: 90 }, { lat: 0, lon: 180 }])).toBeCloseTo(20015, 0);
  });

  it("the shortest path starts and ends at the two places and stays on the sphere's great circle", () => {
    const a = { lat: 37.57, lon: 126.98 };
    const b = { lat: 55.76, lon: 37.62 };
    const pts = arc(a, b, 32);
    expect(pts[0].lat).toBeCloseTo(a.lat, 6);
    expect(pts[32].lon).toBeCloseTo(b.lon, 6);
    const total = pts.slice(1).reduce((s, p, i) => s + kmBetween(pts[i], p), 0);
    expect(total).toBeCloseTo(kmBetween(a, b), 0);
  });

  it("the place the globe faces is at its centre and near; the opposite side is hidden", () => {
    const q = project({ lat: 30, lon: 40 }, 30, 40);
    expect(Math.abs(q.x) + Math.abs(q.y)).toBeLessThan(1e-12);
    expect(q.near).toBe(true);
    expect(project({ lat: -30, lon: -140 }, 30, 40).near).toBe(false);
  });

  it("Opposite places still get a path of real points", () => {
    const path = arc({ lat: 10, lon: 20 }, { lat: -10, lon: -160 }, 32);
    expect(path.every((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon))).toBe(true);
    expect(path[0]).toEqual({ lat: 10, lon: 20 });
  });
});
