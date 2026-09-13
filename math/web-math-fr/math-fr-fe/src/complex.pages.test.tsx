import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { SYSTEMS } from "@/lib/complex";
import { abs, add, fromPolar, mul, orbit, rootsOfUnity, show, spin, square, turns, type C } from "@/systems/complex";
import { between, fromAxisAngle, mul as qmul, rotate, show as qshow, slerp, type Q } from "@/systems/quaternion";

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

const near = (a: C, b: C, eps = 1e-9) => Math.hypot(a[0] - b[0], a[1] - b[1]) < eps;

describe("the arithmetic of the plane", () => {
  it("i times i is minus one, and four quarter turns come back", () => {
    const i: C = [0, 1];
    expect(near(mul(i, i), [-1, 0])).toBe(true);
    let z: C = [1, 0];
    for (let k = 0; k < 4; k++) z = mul(z, i);
    expect(near(z, [1, 0])).toBe(true);
  });

  it("adding adds the parts; multiplying multiplies lengths and adds angles", () => {
    expect(add([2, 3], [-1, 1])).toEqual([1, 4]);
    const a = fromPolar(2, 0.1);
    const b = fromPolar(1.5, 0.2);
    const p = mul(a, b);
    expect(abs(p)).toBeCloseTo(3, 9);
    expect(turns(p)).toBeCloseTo(0.3, 9);
    expect(near(square([0, 1]), [-1, 0])).toBe(true);
  });

  it("the exponential at an imaginary rate stays on the unit circle and lands on minus one at pi", () => {
    for (const th of [0.3, 1, 2.5, 4]) expect(abs(spin(th))).toBeCloseTo(1, 12);
    expect(near(spin(Math.PI), [-1, 0], 1e-12)).toBe(true);
    const roots = rootsOfUnity(6);
    expect(roots.length).toBe(6);
    for (const r of roots) {
      let z: C = [1, 0];
      for (let k = 0; k < 6; k++) z = mul(z, r);
      expect(near(z, [1, 0], 1e-9)).toBe(true);
    }
  });

  it("squaring again: inside falls, outside leaves, and a shift bends the boundary", () => {
    expect(orbit([0.5, 0.3], [0, 0], 40).left).toBeNull();
    const out = orbit([1.2, 0.1], [0, 0], 40);
    expect(out.left).not.toBeNull();
    // the origin stays under plain squaring and under one shift, and leaves under another:
    // the shift is what bends the boundary
    expect(orbit([0, 0], [-0.5, 0.5], 60).left).toBeNull();
    expect(orbit([0, 0], [-0.8, 0.16], 60).left).toBe(40);
    expect(show([2, 3])).toBe("2 + 3i");
    expect(show([0, -1])).toBe("-i");
    expect(show([4, 0])).toBe("4");
  });
});

describe("Hamilton's numbers", () => {
  it("i j is k, j i is minus k, and two turns in space do not commute", () => {
    const i: Q = [0, 1, 0, 0];
    const j: Q = [0, 0, 1, 0];
    expect(qshow(qmul(i, j))).toBe("k");
    expect(qshow(qmul(j, i))).toBe("-k");
    expect(qshow(qmul(i, i))).toBe("-1.00");
    const qx = fromAxisAngle([1, 0, 0], Math.PI / 2);
    const qy = fromAxisAngle([0, 1, 0], Math.PI / 2);
    const xy = rotate(qmul(qy, qx), [0, 0, 1]);
    const yx = rotate(qmul(qx, qy), [0, 0, 1]);
    expect(Math.hypot(xy[0] - yx[0], xy[1] - yx[1], xy[2] - yx[2])).toBeGreaterThan(1);
    expect((between(qmul(qy, qx), qmul(qx, qy)) * 180) / Math.PI).toBeCloseTo(120, 6);
    // the same axis twice commutes, as in the plane
    const qx2 = fromAxisAngle([1, 0, 0], 0.7);
    expect(between(qmul(qx, qx2), qmul(qx2, qx))).toBeLessThan(1e-9);
    // slerp keeps the length and lands on its ends
    const half = slerp([1, 0, 0, 0], qx, 0.5);
    expect(Math.hypot(...half)).toBeCloseTo(1, 12);
    expect(between(slerp([1, 0, 0, 0], qx, 1), qx)).toBeLessThan(1e-9);
  });
});

describe("the opening topic's pages", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("connection refused"))));
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("every page draws with the backend down and carries the run bar", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByRole("button", { name: /^Run( again)?$/ })).toBeTruthy());
      // the quaternion page draws through webgl, which the test browser does not have
      if (s.id !== "quaternions") expect(document.querySelectorAll("main canvas").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "Ten steps" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
      view.unmount();
    }
  });

  it("the line page tries every number and finds no square below zero", async () => {
    await siteAt("/topics/complex/play/line");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Numbers on a line, and the one question they cannot answer" })).toBeTruthy());
    const square = screen.getByRole("button", { name: /square/i });
    fireEvent.click(square);
    for (let i = 0; i < 13; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/below zero/i)).toBeTruthy());
  });

  it("the quarter turn page says i times i is minus one after two turns", async () => {
    await siteAt("/topics/complex/play/turn");
    await waitFor(() => expect(screen.getByRole("heading", { name: "A quarter turn, called i" })).toBeTruthy());
    for (let i = 0; i < 40; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/i times i is minus one|times i four times is times one|round again/i)).toBeTruthy());
  });

  it("the exponential page pauses on minus one at pi", async () => {
    await siteAt("/topics/complex/play/round");
    await waitFor(() => expect(screen.getByRole("heading", { name: "The exponential goes round" })).toBeTruthy());
    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/e to the i pi equals minus one/i)).toBeTruthy());
  });

  it("the index shows six pages and the parts page says no series", async () => {
    let view = await siteAt("/topics/complex/play");
    await waitFor(() => expect(screen.getByText("Seven pages, from nothing")).toBeTruthy());
    const pages = Array.from(document.querySelectorAll("main a")).filter((a) => /\/topics\/complex\/play\/[a-z]+$/.test(a.getAttribute("href") ?? ""));
    expect(new Set(pages.map((a) => a.getAttribute("href"))).size).toBe(7);
    view.unmount();
    view = await siteAt("/topics/complex/parts");
    await waitFor(() => expect(screen.getByRole("heading", { name: "The series, in order" })).toBeTruthy());
    view.unmount();
  });
});
