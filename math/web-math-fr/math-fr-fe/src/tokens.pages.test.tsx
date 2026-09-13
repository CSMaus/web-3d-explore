import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { haltBackground, resetModel } from "@/lib/tiny";
import { GROUPS, SYSTEMS } from "@/lib/tokens";
import { LOCAL } from "@/routes/topics/tokens/play/index";

async function siteAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

function down() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.reject(new Error("connection refused"))),
  );
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number);
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
  document.cookie = "mathfr_session_consent=accepted; path=/";
}

const title = (id: string) => LOCAL.find((l) => l.id === id)!.name;

describe("Topic 4, with the backend down", () => {
  beforeEach(down);

  for (const s of SYSTEMS) {
    it(`${s.to} draws without it`, async () => {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByRole("heading", { name: title(s.id) })).toBeTruthy());
      view.unmount();
    });
  }

  it("All fourteen pages are reachable from the tab bar, in four named groups", async () => {
    await siteAt("/topics/tokens/play");
    await waitFor(() => expect(screen.getByText("Fourteen pages, one text")).toBeTruthy());
    const hrefs = Array.from(document.querySelectorAll("main a")).map((a) => a.getAttribute("href"));
    for (const s of SYSTEMS) expect(hrefs).toContain(s.to);
    expect(SYSTEMS.length).toBe(14);
    for (const group of GROUPS) expect(screen.getAllByText(group).length).toBeGreaterThan(0);
    expect(GROUPS.length).toBe(4);
  });

  it("Every page carries the topic bar, the page width and the three headings in order", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getAllByText("Topic 4 - Tokens, embeddings and generation").length).toBe(1));
      const hrefs = Array.from(document.querySelectorAll("main a")).map((a) => a.getAttribute("href"));
      expect(hrefs, s.to).toContain("/topics/tokens/parts");
      expect(hrefs, s.to).toContain("/topics/tokens/theory");
      expect(document.querySelector("main")?.className, s.to).toContain("max-w-6xl");
      const order = Array.from(document.querySelectorAll("main h2")).map((h) => h.textContent);
      expect(order.indexOf("WHAT GOES IN"), s.to).toBeLessThan(order.indexOf("RUN"));
      expect(order.indexOf("RUN"), s.to).toBeLessThan(order.indexOf("WHAT CAME OUT"));
      expect(screen.getByRole("button", { name: /^Run( again)?$/ }), s.to).toBeTruthy();
      expect(screen.getByRole("button", { name: "One step" }), s.to).toBeTruthy();
      expect(screen.getByRole("button", { name: "Reset" }), s.to).toBeTruthy();
      view.unmount();
    }
  });

  it("The bare address goes to the pages, and the series page lists eighteen steps", async () => {
    const view = await siteAt("/topics/tokens");
    await waitFor(() => expect(screen.getByText("Fourteen pages, one text")).toBeTruthy());
    view.unmount();
    await siteAt("/topics/tokens/parts");
    await waitFor(() => expect(screen.getByText(/no clip is made yet/i)).toBeTruthy());
    expect(screen.getByText("What the first five steps explain")).toBeTruthy();
    expect(screen.getAllByText("The centrepiece").length).toBe(2);
  });
});

describe("Topic 4, what a step changes", () => {
  beforeEach(down);

  it("The bytes page counts characters, code points and bytes and finds them unequal off English", async () => {
    await siteAt("/topics/tokens/play/bytes");
    await waitFor(() => expect(screen.getByText(/press run and the text is read/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Russian" }));
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/35 characters, 35 code points, 64 bytes/i)).toBeTruthy());
  });

  it("The merge page joins the commonest pair and shortens the text", async () => {
    await siteAt("/topics/tokens/play/merge");
    await waitFor(() => expect(screen.getByText(/before any merge the text is 2039 bytes/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "One step" }));
    await waitFor(() => expect(screen.getByText(/merge 1: .* became one symbol/i)).toBeTruthy());
    expect(screen.getByText("256 + 1 = 257")).toBeTruthy();
  });

  it("The segment page replays the merges and the round trip is exact", async () => {
    await siteAt("/topics/tokens/play/segment");
    await waitFor(() => expect(screen.getByText(/press run and the merges are replayed/i)).toBeTruthy());
    for (let i = 0; i < 16; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/decoding the \d+ ids gives back exactly the sentence/i)).toBeTruthy());
    expect(screen.getByText(/"windowsill" is \d+ pieces because it never appears/i)).toBeTruthy();
  });

  it("The cost page finds a script the vocabulary never saw costs more than a token a character", async () => {
    await siteAt("/topics/tokens/play/cost");
    await waitFor(() => expect(screen.getByText(/each script is cut in turn/i)).toBeTruthy());
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "One step" }));
    await waitFor(() => expect(screen.getAllByText(/Russian: 64 tokens for 35 characters/i).length).toBeGreaterThan(0));
  });

  it("The table page picks one row per token and reports the shape", async () => {
    await siteAt("/topics/tokens/play/table");
    await waitFor(() => expect(screen.getByText(/7 tokens are waiting/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/a longer input would add rows; nothing could make a row wider/i)).toBeTruthy());
    expect(screen.getByText("7 by 8")).toBeTruthy();
  });

  it("The order page finds a sentence and its shuffle identical without positions and different with them", async () => {
    await siteAt("/topics/tokens/play/order");
    await waitFor(() => expect(screen.getByText(/press run: both sentences are mixed/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the two totals are identical/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Sines and cosines" }));
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the two totals differ by/i)).toBeTruthy());
  });

  it("The attention page walks six moments and its last row adds to one", async () => {
    await siteAt("/topics/tokens/play/attend");
    await waitFor(() => expect(screen.getByText(/will end up with a new vector built from all/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/its new vector is those weights applied to the values/i)).toBeTruthy());
    const sum = screen.getByText("The last row adds to").nextElementSibling;
    expect(Number(sum?.textContent)).toBeCloseTo(1, 5);
  });

  it("The next-token page starts at guessing and sharpens with training", async () => {
    haltBackground();
    resetModel();
    await siteAt("/topics/tokens/play/predict");
    await waitFor(() => expect(screen.getByText(/untrained: every one of the \d+ tokens is about equally likely/i)).toBeTruthy());
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/after 1500 steps the model gives/i)).toBeTruthy(), { timeout: 20000 });
  }, 30000);

  it("The loop page appends what it chose and the window fills", async () => {
    await siteAt("/topics/tokens/play/generate");
    await waitFor(() => expect(screen.getByText(/the prompt is 5 tokens/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/step 10: the model was run over/i)).toBeTruthy());
    expect(screen.getByText(/fallen out of it/i)).toBeTruthy();
  });

  it("The sampling page generates under two rules side by side", async () => {
    await siteAt("/topics/tokens/play/sample");
    await waitFor(() => expect(screen.getByText(/press run to generate under your rule and under greedy/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/10 tokens under each rule/i)).toBeTruthy());
  });

  it("The artefacts page opens four cases and names the page behind each", async () => {
    await siteAt("/topics/tokens/play/artefacts");
    await waitFor(() => expect(screen.getByText(/the four cases open one at a time/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/none is a mystery about the model/i)).toBeTruthy());
  });
});
