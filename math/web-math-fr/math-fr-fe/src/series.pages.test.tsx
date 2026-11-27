import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("the page of outlines asks its question in one sentence and points to the Fourier story first", async () => {
    await siteAt("/topics/series/play/draw");
    await waitFor(() => expect(document.querySelector('[data-slot="task-job"]')).toBeTruthy());
    expect(document.querySelector('[data-slot="task-job"]')?.textContent).toBe("How few turning arrows are enough to recognise a shape?");
    const link = screen.getByRole("link", { name: "First read the story on the Fourier page" });
    expect(link.getAttribute("href")).toBe("/topics/series/play/fourier");
  });

  it("the Fourier story lists its first arrows, then writes them as one formula", async () => {
    await siteAt("/topics/series/play/fourier");
    await waitFor(() => expect(document.querySelector('[data-slot="story"]')).toBeTruthy());
    const story = document.querySelector('[data-slot="story"]') as HTMLElement;
    const next = () => fireEvent.click(within(story).getByRole("button", { name: "Next step" }));

    for (let i = 0; i < 14; i += 1) next();
    expect(story.getAttribute("data-step")).toBe("forty");
    expect(story.querySelector('[data-slot="story-aside"]')).toBeNull();

    next();
    expect(story.getAttribute("data-step")).toBe("list");
    const aside = story.querySelector('[data-slot="story-aside"]') as HTMLElement;
    expect(aside.querySelectorAll('table[data-slot="story-list"] tr').length).toBe(6);
    expect(aside.textContent).toContain("More rows: 35");

    next();
    expect(story.getAttribute("data-step")).toBe("series");
    const top = story.querySelector('[data-slot="story-top"]') as HTMLElement;
    expect(top.textContent).toContain("drawing(t) =");
    expect(top.querySelector(".katex")).toBeTruthy();
    expect(within(top).getByText(/^c holds the length/)).toBeTruthy();
  });
});
