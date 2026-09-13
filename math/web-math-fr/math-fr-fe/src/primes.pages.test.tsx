import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { firstPrimes, gaps, predictability, returnPairs, sieve } from "@/systems/primes";
import { logistic, orbit } from "@/systems/maps";

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

describe("the primes, as numbers", () => {
  it("the sieve finds the primes and the first-n helper reaches n", () => {
    expect(sieve(30)).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
    expect(firstPrimes(1000).length).toBe(1000);
    expect(firstPrimes(1000)[999]).toBe(7919);
    expect(gaps([2, 3, 5, 7, 11])).toEqual([1, 2, 2, 4]);
  });

  it("knowing a gap says almost nothing about the next; a rule says everything", () => {
    const g = gaps(firstPrimes(5000));
    expect(predictability(g).ratio).toBeGreaterThan(0.85);
    const xs = Array.from(orbit(logistic(4), 0.1234567, 3000, 50));
    // every value fixes the next exactly, so the return pairs lie on the parabola
    for (const [a, b] of returnPairs(xs).slice(0, 200)) expect(Math.abs(b - 4 * a * (1 - a))).toBeLessThan(1e-9);
  });
});

describe("the aside's page", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("connection refused"))));
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("draws, runs and says the primes are not chaotic", async () => {
    await siteAt("/topics/primes/play/gaps");
    await waitFor(() => expect(screen.getByRole("heading", { name: "The gaps between primes, as a return map" })).toBeTruthy());
    expect(document.querySelectorAll("main canvas").length).toBe(3);
    expect(screen.getByText(/press run and the gaps are placed/i)).toBeTruthy();
    for (let i = 0; i < 30; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the primes are not chaotic/i)).toBeTruthy());
  });

  it("the bare address and the play index both land on the one page, and the parts page says no series", async () => {
    let view = await siteAt("/topics/primes");
    await waitFor(() => expect(screen.getByRole("heading", { name: "The gaps between primes, as a return map" })).toBeTruthy());
    view.unmount();
    view = await siteAt("/topics/primes/parts");
    await waitFor(() => expect(screen.getByText("No series")).toBeTruthy());
    view.unmount();
  });
});
