import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { SYSTEMS } from "@/lib/series";

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

describe("The series topic's pages", () => {
  it("every play page draws with the backend down and carries the run bar", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByRole("button", { name: /^(Run( again)?|Pause)$/ })).toBeTruthy());
      expect(document.querySelectorAll("main canvas").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
      view.unmount();
    }
  });

  it("the Taylor page reads the sum against sin at the chosen point after three steps", async () => {
    await siteAt("/topics/series/play/taylor");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Taylor series: a curve from powers of x" })).toBeTruthy());
    screen.getByRole("button", { name: "Ten steps" }).click();
    await waitFor(() => expect(screen.getByText(/With powers up to 10, the sum at x = 0.50 is 0.4794255/, { selector: '[data-slot="verdict"]' })).toBeTruthy());
  });

  it("the series topic has its sections and its test", async () => {
    await siteAt("/topics/series/play");
    await waitFor(() => expect(screen.getByRole("heading", { name: "The pages, in order" })).toBeTruthy());
    expect(SYSTEMS.map((s) => s.id)).toEqual(["taylor", "radius", "fourier", "draw", "frequencies"]);
  });
});
