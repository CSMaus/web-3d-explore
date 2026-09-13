import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
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

describe("Topic 2, with the backend down", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  const drawn = [
    ["/topics/chaos/play/field", "One equation, and its field"],
    ["/topics/chaos/play/solvers", "Solving it by stepping"],
    ["/topics/chaos/play/phase", "Two unknowns, and the phase plane"],
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
    await waitFor(() => expect(screen.getByText("Pick something to move")).toBeTruthy());
    const hrefs = Array.from(document.querySelectorAll("main a")).map((a) => a.getAttribute("href"));
    for (const s of SYSTEMS) expect(hrefs).toContain(s.to);
    expect(SYSTEMS.length).toBe(8);
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
    await waitFor(() => expect(screen.getByText("Pick something to move")).toBeTruthy());
  });

  it("The series page says plainly that no clip is made, and lists the flow", async () => {
    await siteAt("/topics/chaos/parts");
    await waitFor(() => expect(screen.getByText(/no clip is made yet/i)).toBeTruthy());
    expect(screen.getByText("The Lorenz system")).toBeTruthy();
    expect(screen.getByText("Control, and the one experiment")).toBeTruthy();
    // the fractal block is borrowed from topic 1 rather than repeated
    expect(screen.getAllByText("From topic 1").length).toBe(3);
    expect(document.querySelector('main a[href="/topics/fractals/parts"]')).toBeTruthy();
  });

  it("Every page starts at the same width as the rest of the site", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(document.querySelector("main")).toBeTruthy());
      expect(document.querySelector("main")?.className, s.to).toContain("max-w-6xl");
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
    await waitFor(() => expect(screen.getByText("Largest Lyapunov exponent")).toBeTruthy());
    for (const label of [
      "Mean divergence",
      "Third exponent",
      "Kaplan-Yorke dimension",
      "Prediction horizon",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // the divergence of Lorenz is exactly -(sigma + 1 + beta)
    expect(screen.getByText("-(sigma + 1 + beta) = -13.6667")).toBeTruthy();
  });

  it("The bifurcation page shows the cascade it located and the constant", async () => {
    await siteAt("/topics/chaos/play/bifurcation");
    await waitFor(() => expect(screen.getByText("THE CASCADE")).toBeTruthy());
    expect(screen.getByText("2.000000")).toBeTruthy();
    expect(screen.getByText("3.236068")).toBeTruthy();
    expect(screen.getByText("4.6692")).toBeTruthy();
    expect(screen.getByText("Feigenbaum's delta")).toBeTruthy();
  });
});
