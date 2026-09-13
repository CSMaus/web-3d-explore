import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { claimsOver, credibility, gammaP, gammaQuantile, meanOf, pareto, posterior, survival, tailIndex } from "@/systems/actuary";
import { BEATS, SECONDS, SEGMENTS } from "@/data/mitdb207";
import { episodes, narrowing, stats } from "@/systems/beats";
import { NORMAL, SWITCH, isNormal, next, simulate, spread, toX } from "@/systems/heart";
import { autocorrelation, fgn, graphDimension, rngFrom, shuffled, varianceScaling, walk } from "@/systems/scaling";

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

describe("a heart with two rhythms", () => {
  it("the rule has a normal beat, a switching point and a chaotic band", () => {
    expect(next(NORMAL)).toBeCloseTo(NORMAL, 12);
    expect(isNormal(SWITCH)).toBe(true);
    expect(isNormal(SWITCH - 1e-6)).toBe(false);
    // the arrhythmia's band stays below the switching point
    let x = 0.3;
    for (let i = 0; i < 500; i++) {
      x = next(x);
      expect(x).toBeLessThan(SWITCH);
    }
    // from the normal side every interval is pulled back to the normal beat
    let y = 0.7;
    for (let i = 0; i < 40; i++) y = next(y);
    expect(y).toBeCloseTo(NORMAL, 6);
  });

  it("a pulse in the window starts the arrhythmia, one outside it does not, and the timed rescue ends it", () => {
    const base = { noise: 0.005, shockAt: 80, rescue: "none" as const, from: 200, fixedTime: toX(500), seed: 4 };
    const started = simulate({ ...base, shockTime: toX(500) }, 300);
    expect(started.slice(100).every((b) => !isNormal(b.x))).toBe(true);
    expect(spread(started.slice(100)).sd).toBeGreaterThan(40);
    const late = simulate({ ...base, shockTime: toX(650) }, 300);
    expect(late.slice(100).every((b) => isNormal(b.x))).toBe(true);
    const early = simulate({ ...base, shockTime: toX(350) }, 300);
    expect(early.slice(100).every((b) => isNormal(b.x))).toBe(true);
    const timed = simulate({ ...base, shockTime: toX(500), rescue: "timed" }, 400);
    const pause = timed.find((b) => b.pause);
    expect(pause).toBeDefined();
    expect(pause!.n - 200).toBeLessThan(6);
    expect(timed.slice(pause!.n + 1).every((b) => isNormal(b.x))).toBe(true);
    expect(spread(timed.slice(300)).sd).toBeLessThan(8);
    // a pulse at a fixed time needs luck: many more tries over thirty hearts
    let fixedTries = 0;
    let timedTries = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const f = simulate({ ...base, shockTime: toX(500), rescue: "fixed", seed }, 600);
      const fp = f.find((b) => b.pause);
      fixedTries += f.filter((b) => b.pulsed && b.n >= 200 && b.n <= (fp?.n ?? 600)).length;
      const t = simulate({ ...base, shockTime: toX(500), rescue: "timed", seed }, 600);
      const tp = t.find((b) => b.pause);
      timedTries += t.filter((b) => b.pulsed && b.n >= 200 && b.n <= (tp?.n ?? 600)).length;
    }
    expect(fixedTries).toBeGreaterThan(timedTries * 10);
  });
});

describe("the recorded heart", () => {
  it("the record holds the beats and rhythms the database names, and flutter is the fast one", () => {
    expect(BEATS.length).toBe(2331);
    expect(BEATS.every((b) => b.rr >= 100 && b.rr <= 2600)).toBe(true);
    const flutter = BEATS.filter((b) => b.rhythm === "VFL").map((b) => b.rr);
    const normal = BEATS.filter((b) => b.rhythm === "N").map((b) => b.rr);
    expect(flutter.length).toBe(472);
    expect(stats(flutter).mean).toBeLessThan(400);
    expect(stats(normal).mean).toBeGreaterThan(600);
    const runs = episodes(SEGMENTS, BEATS, "VFL", 0, SECONDS);
    expect(runs.length).toBe(6);
    expect(runs[5].to - runs[5].from).toBeGreaterThan(90);
    expect(Number.isFinite(narrowing(normal).ratio)).toBe(true);
  });
});

describe("walks with memory", () => {
  it("the exact correlations, and H read back off the steps", () => {
    expect(autocorrelation(0.5, 1)).toBeCloseTo(0, 12);
    expect(autocorrelation(0.7, 1)).toBeCloseTo(Math.pow(2, 0.4) - 1, 12);
    for (const H of [0.3, 0.7, 0.9]) {
      const s = fgn(H, 2048, 3);
      expect(Math.abs(varianceScaling(s).slope - H)).toBeLessThan(0.12);
      // shuffling keeps the steps and loses the memory
      expect(Math.abs(varianceScaling(shuffled(s, 5)).slope - 0.5)).toBeLessThan(0.12);
    }
    const d = graphDimension(walk(fgn(0.7, 2048, 3)));
    expect(d.slope).toBeGreaterThan(1.05);
    expect(d.slope).toBeLessThan(1.5);
  });
});

describe("the actuary's two pieces", () => {
  it("credibility is the exact Poisson-gamma posterior mean", () => {
    const prior = { shape: 2, rate: 20 };
    const claims = [0, 1, 0, 0, 0, 0, 1, 0, 0, 0];
    let x = 0;
    claims.forEach((c, i) => {
      x += c;
      const n = i + 1;
      const post = posterior(prior, n, x);
      const Z = credibility(n, 20);
      expect(meanOf(post)).toBeCloseTo(Z * (x / n) + (1 - Z) * 0.1, 12);
    });
    expect(meanOf(posterior(prior, 7, 2))).toBeCloseTo(0.1481, 3);
    expect(gammaP(2, 2)).toBeCloseTo(0.594, 3);
    const q = gammaQuantile(prior, 0.5);
    expect(gammaP(prior.shape, prior.rate * q)).toBeCloseTo(0.5, 6);
    expect(claimsOver(0.3, 10, 4).length).toBe(10);
  });

  it("a Pareto tail reads back its index and its top tenth looks like the whole", () => {
    const r = rngFrom(9);
    const xs = Array.from({ length: 4000 }, () => pareto(1.5, 1, r));
    expect(Math.abs(tailIndex(survival(xs)) - 1.5)).toBeLessThan(0.25);
    const top = [...xs].sort((a, b) => b - a).slice(0, 400);
    const floor = top[top.length - 1];
    expect(Math.abs(tailIndex(survival(top.map((v) => v / floor))) - 1.5)).toBeLessThan(0.4);
  });
});

describe("the applied pages", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("connection refused"))));
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("the heart page places the recorded beats and names the flutter and the return", async () => {
    await siteAt("/topics/chaos/play/control");
    await waitFor(() => expect(screen.getByRole("heading", { name: "A real heart: the normal beat, the arrhythmia, and back" })).toBeTruthy());
    expect(document.querySelectorAll("main canvas").length).toBe(3);
    expect(screen.getByText(/recorded beats from 3:48 to 5:00/)).toBeTruthy();
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/ventricular flutter, since/)).toBeTruthy());
    for (let i = 0; i < 60; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/stopped on its own after/)).toBeTruthy());
  });

  it("the three fractals pages draw, run and say what they measured", async () => {
    let view = await siteAt("/topics/fractals/play/hurst");
    await waitFor(() => expect(screen.getByRole("heading", { name: "A line that remembers: the Hurst exponent" })).toBeTruthy());
    for (let i = 0; i < 30; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the memory was in the order/)).toBeTruthy());
    view.unmount();
    view = await siteAt("/topics/fractals/play/credibility");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Trust the group or trust the record: an actuary's Bayes" })).toBeTruthy());
    for (let i = 0; i < 4; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/has earned 67 per cent of the weight/)).toBeTruthy());
    view.unmount();
    view = await siteAt("/topics/fractals/play/tails");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Claims with a fractal tail" })).toBeTruthy());
    for (let i = 0; i < 30; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the variance is infinite and the average will never settle/)).toBeTruthy());
    view.unmount();
  });
});
