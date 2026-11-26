import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

// the count the run bar shows, read from its caption
const counted = () => Number(screen.getByRole("button", { name: "Reset" }).parentElement!.querySelector('[data-text="caption"]')!.textContent!.split(" / ")[0].replace(/,/g, ""));

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
    await waitFor(() => expect(screen.getByText("Fourteen pages on how a language model reads and writes")).toBeTruthy());
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
      expect(document.querySelector("main")?.dataset.slot, s.to).toBe("page");
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
    await waitFor(() => expect(screen.getByText("Fourteen pages on how a language model reads and writes")).toBeTruthy());
    view.unmount();
    await siteAt("/topics/tokens/parts");
    await waitFor(() => expect(screen.getByText(/no video of this topic is made yet/i)).toBeTruthy());
    expect(screen.getByText("Four mistakes explained by the first five steps")).toBeTruthy();
    expect(screen.getAllByText("Main step").length).toBe(2);
  });
});

describe("Topic 4, what a step changes", () => {
  beforeEach(down);

  it("The bytes page counts characters, code points and bytes and finds them unequal off English", async () => {
    await siteAt("/topics/tokens/play/bytes");
    await waitFor(() => expect(screen.getByText(/nothing is read yet\. run reads the line one character at a time/i)).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText(/run replays the merges on it one at a time/i)).toBeTruthy());
    for (let i = 0; i < 16; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/turning the \d+ ids back into bytes gives exactly the sentence/i)).toBeTruthy());
    expect(screen.getByText(/"windowsill" is cut into \d+ pieces, because it never appears/i)).toBeTruthy();
  });

  it("The cost page finds a script the vocabulary never saw costs more than a token a character", async () => {
    await siteAt("/topics/tokens/play/cost");
    await waitFor(() => expect(screen.getByText(/takes the eleven sentences in turn/i)).toBeTruthy());
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "One step" }));
    await waitFor(() => expect(screen.getAllByText(/Russian: 64 tokens for 35 characters/i).length).toBeGreaterThan(0));
  });

  it("The table page picks one row per token and reports the shape", async () => {
    await siteAt("/topics/tokens/play/table");
    await waitFor(() => expect(screen.getByText(/7 tokens are waiting/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/a longer input would add rows\. no input can make a row wider/i)).toBeTruthy());
    expect(screen.getByText("7 by 8")).toBeTruthy();
  });

  it("The order page finds a sentence and its shuffle identical without positions and different with them", async () => {
    await siteAt("/topics/tokens/play/order");
    await waitFor(() => expect(screen.getByText(/run mixes both sentences, then adds in their rows/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the two averages are equal/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Sines and cosines" }));
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/after \d+ positions the two averages differ by/i)).toBeTruthy());
  });

  it("The attention page walks six moments and its last row adds to one", async () => {
    await siteAt("/topics/tokens/play/attend");
    await waitFor(() => expect(screen.getByText(/will get a new list of numbers made from all/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/its new list is the values averaged with these weights/i)).toBeTruthy());
    const sum = screen.getByText("Sum of the last token's weights").nextElementSibling;
    expect(Number(sum?.textContent)).toBeCloseTo(1, 5);
  });

  it("The next-token page starts at guessing and sharpens with training", async () => {
    haltBackground();
    resetModel();
    await siteAt("/topics/tokens/play/predict");
    await waitFor(() => expect(screen.getByText(/untrained, the model finds all \d+ tokens about equally likely/i)).toBeTruthy());
    for (let i = 0; i < 6; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/after 1500 training steps the model gives/i)).toBeTruthy(), { timeout: 20000 });
  }, 30000);

  it("The loop page appends what it chose and the window fills", async () => {
    await siteAt("/topics/tokens/play/generate");
    await waitFor(() => expect(screen.getByText(/the start of the text is 5 tokens long/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/step 10: the model read/i)).toBeTruthy());
    expect(screen.getByText(/dropped out of it/i)).toBeTruthy();
  });

  it("The sampling page generates under two rules side by side", async () => {
    await siteAt("/topics/tokens/play/sample");
    await waitFor(() => expect(screen.getByText(/run writes text with this rule and with greedy/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/10 tokens with each rule/i)).toBeTruthy());
  });

  it("The artefacts page opens four cases and names the page behind each", async () => {
    await siteAt("/topics/tokens/play/artefacts");
    await waitFor(() => expect(screen.getByText(/run shows the four cases one at a time/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/none of them is a mystery about the model/i)).toBeTruthy());
  });

  it("Run after a few steps carries on from them", async () => {
    // frames are handed out one at a time, so the first frames of the run can be looked at
    const queue: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => queue.push(cb));
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      queue[id - 1] = () => {};
    });
    await siteAt("/topics/tokens/play/space");
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
