import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import common from "@/locales/en/common.json";
import i18n from "@/i18n";
import { search } from "@/lib/search";
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
    expect(search("draw the line").some((h) => h.to === "/topics/networks/play/line")).toBe(true);
    expect(search("")).toEqual([]);
    expect(search("zzzz")).toEqual([]);
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

  it("The front page shows the Mandelbulb in its contour light with no switch, and the topics", async () => {
    await siteAt("/");
    await waitFor(() => expect(screen.getByText(common.front.title1)).toBeTruthy());
    expect(screen.queryByRole("button", { name: "Solid" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Contour light" })).toBeNull();
    expect(screen.queryByText("Colour")).toBeNull();
    expect(screen.getByText("Start with fractals").closest("a")?.getAttribute("href")).toBe("/topics/fractals/parts");
    expect(screen.getByText("The topics")).toBeTruthy();
    // the strip under the hero is gone: no observation line, no news line, no scroll hint
    expect(screen.queryByText(/Scroll to discover/)).toBeNull();
    expect(screen.queryByText(/Observation 01/)).toBeNull();
  });
});
