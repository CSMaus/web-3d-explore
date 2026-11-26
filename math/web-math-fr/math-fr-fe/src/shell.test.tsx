import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import common from "@/locales/en/common.json";
import i18n from "@/i18n";
import { search } from "@/lib/search";
import { SEQUENCE, nextAfter } from "@/lib/sequence";
import { BRAND } from "@/lib/site";

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

function down() {
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("connection refused"))));
  document.cookie = "mathfr_session_consent=accepted; path=/";
}

describe("The shell", () => {
  beforeEach(down);

  it("Carries the brand, the skip link and the search in the bar, and declares its language", async () => {
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText(BRAND)).toBeTruthy());
    expect(screen.getByText("Skip to content").getAttribute("href")).toBe("#content");
    expect(document.getElementById("content")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Search/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Log in" }).getAttribute("href")).toBe("/account");
    expect(document.documentElement.lang).toBe(i18n.language);
    expect(document.title).toBe(BRAND);
  });

  it("Opens the search from the bar and finds pages across the whole site", async () => {
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByRole("button", { name: /Search/ })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: /Search/ }));
    const box = await screen.findByRole("dialog");
    expect(box).toBeTruthy();
    const input = screen.getByPlaceholderText("Search the whole site");
    fireEvent.change(input, { target: { value: "lorenz" } });
    await waitFor(() => expect(screen.getByText("Lorenz")).toBeTruthy());
    fireEvent.change(input, { target: { value: "projects" } });
    await waitFor(() => expect(within(box).getByRole("option", { selected: true })).toBeTruthy());
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("Indexes topics, sections, interactive pages and projects", () => {
    expect(search("lorenz")[0].to).toBe("/topics/chaos/play/lorenz");
    expect(search("mathematics fractals").some((h) => h.to === "/topics/fractals/theory")).toBe(true);
    expect(search("webpaut")[0].to).toBe("/projects/webpaut");
    expect(search("Barashok")[0].to).toBe("/about");
    expect(search("cobalt ferrite")[0].to).toBe("/about");
    expect(search("dividing dots").some((h) => h.to === "/topics/networks/play/line")).toBe(true);
    expect(search("")).toEqual([]);
    expect(search("zzzz")).toEqual([]);
  });

  it("A topic's test marks a pick as final, says why every answer is right or wrong, and counts the score", async () => {
    await siteAt("/topics/complex/test");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Test: Imaginary numbers" })).toBeTruthy());
    const first = screen.getAllByRole("listitem").find((li) => li.getAttribute("data-slot") === "quiz-question")!;
    const options = within(first).getAllByRole("button");
    expect(options).toHaveLength(4);
    fireEvent.click(options[0]);
    // after a pick every option is closed and carries its reason, the right one is marked
    expect(within(first).getAllByRole("button").every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    expect(first.querySelector('[data-state="right"]')).toBeTruthy();
    expect(within(first).getAllByText(/./, { selector: "p[data-text=note]" })).toHaveLength(4);
    expect(screen.getByText(/out of 1 answered, 10 questions in all/)).toBeTruthy();
  });

  it("No topic's test gives the answer away by length: the right option is the longest in at most 3 questions", () => {
    const files = import.meta.glob<{ questions: { id: string; options: { text: string; correct: boolean }[] }[] }>("./content/quizzes/**/*.json", { eager: true, import: "default" });
    const checked = Object.keys(files);
    expect(checked.length).toBeGreaterThan(0);
    for (const path of checked) {
      const longest = files[path].questions.filter((q) => {
        const right = q.options.find((o) => o.correct)!;
        return q.options.every((o) => right.text.length >= o.text.length);
      });
      expect(longest.map((q) => q.id), path).toHaveLength(Math.min(longest.length, 3));
    }
  });

  it("The next button goes through a topic page by page, then on to the next topic", () => {
    expect(nextAfter("/topics/complex/play/square")?.to).toBe("/topics/complex/play/round");
    expect(nextAfter("/topics/complex/play")?.to).toBe("/topics/complex/play/line");
    expect(nextAfter("/topics/complex/uses")?.to).toBe("/topics/complex/test");
    expect(nextAfter("/topics/complex/test")?.to).toBe("/topics/fractals/parts");
    expect(nextAfter("/topics/chaos")?.to).toBe("/topics/chaos/parts");
    expect(nextAfter("/topics")).toBeNull();
    expect(nextAfter("/about")).toBeNull();
    expect(nextAfter("/")).toBeNull();
    expect(nextAfter("/projects/webpaut")).toBeNull();
    expect(nextAfter(SEQUENCE[SEQUENCE.length - 1].to)).toBeNull();
  });

  for (const [path, heading] of [
    ["/learn", "Learn"],
    ["/play", "Play"],
    ["/about", "Kseniia Barashok"],
    ["/projects", "Projects"],
    ["/projects/webpaut", "WebPAUT, ultrasonic inspection in the browser"],
    ["/contact", "Contact"],
    ["/search", "Search"],
  ] as const) {
    it(`${path} renders its heading with the backend down`, async () => {
      const view = await siteAt(path);
      await waitFor(() => expect(screen.getByRole("heading", { name: heading })).toBeTruthy());
      view.unmount();
    });
  }

  it("The front page shows the Mandelbulb in its contour light with no switch, what the site is for, and the topics", async () => {
    await siteAt("/");
    await waitFor(() => expect(screen.getByText(common.front.title1)).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Solid" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Contour light" })).toBeNull();
    expect(screen.queryByText("Colour")).toBeNull();
    // the first screen says what the site is for and starts at the first topic
    expect(screen.getByText(common.front.lede)).toBeTruthy();
    expect(screen.getAllByText("Start here").some((e) => e.closest("a")?.getAttribute("href") === SEQUENCE[0].to)).toBe(true);
    expect(screen.getByText(common.front.steps.heading)).toBeTruthy();
    expect(screen.getByText("The topics")).toBeTruthy();
    // the strip under the hero is gone: no observation line, no news line, no scroll hint
    expect(screen.queryByText(/Scroll to discover/)).toBeNull();
    expect(screen.queryByText(/Observation 01/)).toBeNull();
  });
});
