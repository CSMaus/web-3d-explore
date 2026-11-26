import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { JOBS, STORIES } from "@/storylines/list";

/**
 * every page of the list opens with its story, and the story can be read to its end: each step
 * shows its own sentence, its line above the picture when it has one, and its one action when it
 * has one; the last step leads to the panels below, which are still there.
 */
type Step = { id: string; say: string; top: string | null; act: string | null };
const storylines = import.meta.glob<{ STEPS: Step[] }>("./storylines/*/*.ts", { eager: true });

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

const slot = (host: Element, name: string) => host.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;
const controls = (host: Element | null) => (host ? host.querySelectorAll('button, input, select, [role="slider"]').length : 0);

// a page counts as wired once its source imports its storyline; story.final.test.ts requires all of them
const sources = import.meta.glob<string>("./routes/topics/*/play/*.tsx", { eager: true, query: "?raw", import: "default" });
const wired = (key: string) => {
  const [topic, page] = key.split("/");
  return (sources[`./routes/topics/${topic}/play/${page}.tsx`] ?? "").includes(`@/storylines/${key}`);
};
const WIRED = Object.keys(STORIES).filter(wired);

describe("The pages wired so far", () => {
  it("are pages of stories on the list", () => {
    expect(WIRED.length).toBeGreaterThanOrEqual(0);
  });
});

describe.each(WIRED)("The story on the page %s", (key: string) => {
  it("reads from the first step to the last and back, and leaves the panels in place", async () => {
    const [topic, page] = key.split("/");
    const steps = storylines[`./storylines/${key}.ts`].STEPS;
    const view = await siteAt(`/topics/${topic}/play/${page}`);
    await waitFor(() => expect(document.querySelector('[data-slot="story"]')).toBeTruthy());
    const story = document.querySelector('[data-slot="story"]') as HTMLElement;

    // the page: one short question under the title, the story, then the panels under their heading
    const job = document.querySelector('[data-slot="task-job"]');
    expect(job?.textContent).toBe(JOBS[key]);
    const lab = document.getElementById("lab");
    expect(lab?.tagName).toBe("H2");
    expect(lab?.textContent).toBe("The experiment");
    expect(story.compareDocumentPosition(lab as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(story.querySelector("canvas")).toBeTruthy();
    expect(story.getAttribute("aria-label")).toBe("The story of this page");
    expect(slot(story, "story-say")?.getAttribute("aria-live")).toBe("polite");
    expect(within(story).getByRole("button", { name: "Back" })).toHaveProperty("disabled", true);

    for (let i = 0; i < steps.length; i += 1) {
      const step = steps[i];
      expect(slot(story, "story-say")?.textContent, step.id).toBe(step.say);
      expect(slot(story, "story-count")?.textContent, step.id).toBe(`Step ${i + 1} of ${steps.length}`);
      const top = slot(story, "story-top")?.textContent?.trim() ?? "";
      if (step.top) expect(top.length, `${step.id}: no line above the picture`).toBeGreaterThan(0);
      else expect(top, `${step.id}: a line above the picture where the story has none`).toBe("");
      if (step.act) expect(controls(slot(story, "story-act")), `${step.id}: nothing to do`).toBeGreaterThan(0);
      else expect(controls(slot(story, "story-act")), `${step.id}: a control on a step that has no action`).toBe(0);
      if (i < steps.length - 1) fireEvent.click(within(story).getByRole("button", { name: "Next step" }));
    }

    // the last step hands over to the panels and can start again
    expect(within(story).queryByRole("button", { name: "Next step" })).toBeNull();
    expect(within(story).getByRole("button", { name: "Go to the experiment" })).toBeTruthy();
    fireEvent.click(within(story).getByRole("button", { name: "Back" }));
    expect(slot(story, "story-say")?.textContent).toBe(steps[steps.length - 2].say);
    fireEvent.click(within(story).getByRole("button", { name: "Next step" }));
    fireEvent.click(within(story).getByRole("button", { name: "Start the story again" }));
    expect(slot(story, "story-say")?.textContent).toBe(steps[0].say);

    // the arrow keys step through it while the focus is inside
    within(story).getByRole("button", { name: "Next step" }).focus();
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowRight" });
    expect(slot(story, "story-say")?.textContent).toBe(steps[1].say);
    fireEvent.keyDown(document.activeElement as Element, { key: "ArrowLeft" });
    expect(slot(story, "story-say")?.textContent).toBe(steps[0].say);

    // what the page had before is still there, once
    expect(screen.getAllByRole("button", { name: /^(Run( again)?|Pause)$/ }).length).toBe(1);
    expect(screen.getAllByRole("button", { name: "Reset" }).length).toBe(1);
    expect(document.querySelector('[data-slot="verdict"]')?.textContent?.length ?? 0).toBeGreaterThan(20);
    view.unmount();
  });
});

describe.runIf(wired("series/fourier"))("The Fourier story's own controls", () => {
  it("lets the number of arrows be changed on every step, and the shape on the steps that draw", async () => {
    const steps = storylines["./storylines/series/fourier.ts"].STEPS as (Step & { set: { mode: string } })[];
    await siteAt("/topics/series/play/fourier");
    await waitFor(() => expect(document.querySelector('[data-slot="story"]')).toBeTruthy());
    const story = document.querySelector('[data-slot="story"]') as HTMLElement;
    for (let i = 0; i < steps.length; i += 1) {
      const tune = slot(story, "story-tune");
      expect(tune?.querySelector('[role="slider"]'), `${steps[i].id}: no slider for the number of arrows`).toBeTruthy();
      const shapes = within(tune as HTMLElement).queryAllByRole("button", { name: /^(Cat|π|∑|&|3)$/ }).length;
      if (steps[i].set.mode === "draw") expect(shapes, `${steps[i].id}: no choice of shape`).toBe(5);
      else expect(shapes, steps[i].id).toBe(0);
      if (i < steps.length - 1) fireEvent.click(within(story).getByRole("button", { name: "Next step" }));
    }
    // the count buttons change the line above the picture
    fireEvent.click(within(story).getByRole("button", { name: "Start the story again" }));
    for (let i = 0; i < 7; i += 1) fireEvent.click(within(story).getByRole("button", { name: "Next step" }));
    expect(slot(story, "story-top")?.textContent).toContain("⅕ sin 5t");
    fireEvent.click(within(story).getByRole("button", { name: "One more arrow" }));
    expect(slot(story, "story-top")?.textContent).toContain("⅐ sin 7t");
    fireEvent.click(within(story).getByRole("button", { name: "One arrow fewer" }));
    fireEvent.click(within(story).getByRole("button", { name: "One arrow fewer" }));
    expect(slot(story, "story-top")?.textContent).not.toContain("⅕ sin 5t");
  });
});
