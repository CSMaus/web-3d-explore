import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { SYSTEMS } from "@/lib/chaos";

async function siteAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

// the count the run bar shows, read from its caption
const counted = () => Number(screen.getByRole("button", { name: "Reset" }).parentElement!.querySelector('[data-text="caption"]')!.textContent!.split(" / ")[0].replace(/,/g, ""));

describe("Topic 2, with the backend down", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  const drawn = [
    ["/topics/chaos/play/field", "One equation for change, drawn as strokes"],
    ["/topics/chaos/play/solvers", "Solving an equation step by step"],
    ["/topics/chaos/play/phase", "Two quantities at once: the phase plane"],
    ["/topics/chaos/play/logistic", "The logistic map"],
    ["/topics/chaos/play/bifurcation", "The bifurcation diagram"],
  ] as const;

  for (const [path, title] of drawn) {
    it(`${path} still draws without it`, async () => {
      const view = await siteAt(path);
      await waitFor(() => expect(screen.getByRole("heading", { name: title })).toBeTruthy());
      expect(document.querySelector("main canvas")).toBeTruthy();
      view.unmount();
    });
  }

  it("Every system has a page, and the tab bar reaches all of them", async () => {
    await siteAt("/topics/chaos/play");
    await waitFor(() => expect(screen.getByText("Choose a page to try")).toBeTruthy());
    const hrefs = Array.from(document.querySelectorAll("main a")).map((a) => a.getAttribute("href"));
    for (const s of SYSTEMS) expect(hrefs).toContain(s.to);
    expect(SYSTEMS.length).toBe(7);
  });

  it("The play index names each system even with nothing served", async () => {
    await siteAt("/topics/chaos/play");
    await waitFor(() => expect(screen.getByText("The Lorenz system")).toBeTruthy());
    for (const name of ["The logistic map", "The bifurcation diagram", "The Rossler system"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
  });

  it("Every page inside topic 2 carries the topic bar and its three sections", async () => {
    for (const path of [
      "/topics/chaos/play",
      "/topics/chaos/parts",
      "/topics/chaos/theory",
      "/topics/chaos/play/lorenz",
      "/topics/chaos/play/bifurcation",
    ]) {
      const view = await siteAt(path);
      await waitFor(() =>
        expect(
          screen.getAllByText("Topic 2 - Differential equations, attractors and chaos").length,
        ).toBe(1),
      );
      const hrefs = Array.from(document.querySelectorAll("main a")).map((a) =>
        a.getAttribute("href"),
      );
      expect(hrefs, path).toContain("/topics/chaos/parts");
      expect(hrefs, path).toContain("/topics/chaos/play");
      expect(hrefs, path).toContain("/topics/chaos/theory");
      view.unmount();
    }
  });

  it("A topic with no clips sends its bare address to its pages, not to an empty series", async () => {
    await siteAt("/topics/chaos");
    await waitFor(() => expect(screen.getByText("Choose a page to try")).toBeTruthy());
  });

  it("The series page says plainly that no clip is made, and lists the flow", async () => {
    await siteAt("/topics/chaos/parts");
    await waitFor(() => expect(screen.getByText(/no clip is made yet/i)).toBeTruthy());
    expect(screen.getByText("The Lorenz system: three equations from a simplified model of rising warm air")).toBeTruthy();
    expect(screen.getByText("Control: the experiment that steadied a chaotic heart rhythm with small, timed pulses")).toBeTruthy();
    // the fractal block is borrowed from topic 1 rather than repeated
    expect(screen.getAllByText("In the Fractals topic").length).toBe(3);
    expect(document.querySelector('main a[href="/topics/fractals/parts"]')).toBeTruthy();
  });

  it("Every page starts at the same width as the rest of the site", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(document.querySelector("main")).toBeTruthy());
      expect(document.querySelector("main")?.dataset.slot, s.to).toBe("page");
      view.unmount();
    }
  });

  it("The picture is held while the controls scroll, as in topic 1", async () => {
    for (const path of [
      "/topics/chaos/play/field",
      "/topics/chaos/play/phase",
      "/topics/chaos/play/logistic",
      "/topics/chaos/play/bifurcation",
    ]) {
      const view = await siteAt(path);
      await waitFor(() => expect(document.querySelector("main canvas")).toBeTruthy());
      const column = document.querySelector("main canvas")?.closest("section")?.parentElement;
      expect(column?.className, path).toContain("lg:sticky");
      expect(column?.className, path).toContain("lg:top-24");
      view.unmount();
    }
  });

  it("Both attractor pages offer auto or manual rotation and a reset", async () => {
    for (const path of ["/topics/chaos/play/lorenz", "/topics/chaos/play/rossler"]) {
      const view = await siteAt(path);
      await waitFor(() => expect(screen.getByText("ROTATION MODE")).toBeTruthy());
      expect(screen.getByRole("button", { name: "Auto" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Manual" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Reset view" })).toBeTruthy();
      view.unmount();
    }
  });

  it("The Lorenz page reports the numbers it measured, not stated ones", async () => {
    await siteAt("/topics/chaos/play/lorenz");
    await waitFor(() => expect(screen.getByText("Largest Lyapunov exponent: how fast a tiny gap grows")).toBeTruthy());
    for (const label of [
      "Mean divergence: how fast a small blob of states loses volume",
      "Third Lyapunov exponent: how fast the most squeezed direction shrinks",
      "Kaplan-Yorke dimension: computed from the three exponents",
      "Prediction horizon: how long a forecast stays useful",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // the divergence of Lorenz is exactly -(sigma + 1 + beta)
    expect(screen.getByText("-(sigma + 1 + beta) = -13.6667")).toBeTruthy();
  });

  it("The bifurcation page shows the cascade it located and the constant", async () => {
    await siteAt("/topics/chaos/play/bifurcation");
    await waitFor(() => expect(screen.getByText("WHERE THE DOUBLINGS HAPPEN")).toBeTruthy());
    expect(screen.getByText("2.000000")).toBeTruthy();
    expect(screen.getByText("3.236068")).toBeTruthy();
    expect(screen.getByText("4.6692")).toBeTruthy();
    expect(screen.getByText("Feigenbaum's constant, known value")).toBeTruthy();
  });

  it("Run after a few steps carries on from them", async () => {
    // frames are handed out one at a time, so the first frames of the run can be looked at
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queue.push(cb));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      queue[id - 1] = () => {};
    });
    await siteAt("/topics/chaos/play/logistic");
    await waitFor(() => expect(screen.getByRole("button", { name: "One step" })).toBeTruthy());
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole("button", { name: "One step" }));
    await waitFor(() => expect(counted()).toBe(3));
    fireEvent.click(screen.getByRole("button", { name: "Run" }));
    // the run carries on from the third step rather than from the runner's own count
    for (let i = 0; i < 60 && counted() === 3; i++) act(() => queue.splice(0).forEach((cb) => cb(0)));
    expect(counted()).toBeGreaterThan(3);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  });
});
