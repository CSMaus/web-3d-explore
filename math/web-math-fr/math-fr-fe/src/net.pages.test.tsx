import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { GROUPS, REPLACED, SYSTEMS } from "@/lib/networks";

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
  document.cookie = "mathfr_session_consent=accepted; path=/";
}

const TITLES: Record<string, string> = {
  rate: "How fast is it going",
  rate2: "Is it speeding up or slowing down",
  accumulate: "Adding it back up",
  growth: "The thing that grows by how much there is",
  slope: "Which way is down",
  line: "Draw the line yourself",
  unit: "Inside one unit",
  layers: "Many units, one answer",
  learn: "How it learns, and how fast",
  blame: "The correction, one dot at a time",
  pictures: "The same job on a picture",
  sequence: "The same job on a sequence",
  words: "The same job on words",
};

describe("Topic 3, with the backend down", () => {
  beforeEach(down);

  for (const s of SYSTEMS) {
    it(`${s.to} draws without it`, async () => {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByRole("heading", { name: TITLES[s.id] })).toBeTruthy());
      expect(document.querySelector("main canvas")).toBeTruthy();
      view.unmount();
    });
  }

  it("All thirteen pages are reachable from the tab bar, in three named groups", async () => {
    await siteAt("/topics/networks/play");
    await waitFor(() => expect(screen.getByText("Thirteen pages, one job")).toBeTruthy());
    const hrefs = Array.from(document.querySelectorAll("main a")).map((a) => a.getAttribute("href"));
    for (const s of SYSTEMS) expect(hrefs).toContain(s.to);
    expect(SYSTEMS.length).toBe(13);
    for (const group of GROUPS) expect(screen.getByText(group)).toBeTruthy();
    expect(GROUPS.length).toBe(3);
  });

  it("Every page carries the topic bar and the same page width", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() =>
        expect(screen.getAllByText("Topic 3 - Calculus into a first neural network").length).toBe(1),
      );
      const hrefs = Array.from(document.querySelectorAll("main a")).map((a) =>
        a.getAttribute("href"),
      );
      expect(hrefs, s.to).toContain("/topics/networks/parts");
      expect(hrefs, s.to).toContain("/topics/networks/play");
      expect(hrefs, s.to).toContain("/topics/networks/theory");
      expect(document.querySelector("main")?.className, s.to).toContain("max-w-6xl");
      view.unmount();
    }
  });

  it("The picture is held while the controls scroll", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(document.querySelector("main canvas")).toBeTruthy());
      const column = document.querySelector("main canvas")?.closest("section")?.parentElement;
      expect(column?.className, s.to).toContain("lg:sticky");
      view.unmount();
    }
  });

  it("The bare address goes to the pages, since no clip is filmed", async () => {
    await siteAt("/topics/networks");
    await waitFor(() => expect(screen.getByText("Thirteen pages, one job")).toBeTruthy());
  });

  it("The series page lists the eighteen steps and marks the capstone", async () => {
    await siteAt("/topics/networks/parts");
    await waitFor(() => expect(screen.getByText(/no clip is made yet/i)).toBeTruthy());
    expect(screen.getByText("Backpropagation")).toBeTruthy();
    expect(screen.getByText("Derivative, calculus capstone")).toBeTruthy();
    expect(screen.getByText("Integral, calculus capstone")).toBeTruthy();
    expect(screen.getAllByText("The capstone").length).toBe(2);
  });
});

describe("Topic 3, the shape every page has", () => {
  beforeEach(down);

  it("What goes in, run, what came out: in that order, on every page", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByText("WHAT GOES IN")).toBeTruthy());
      expect(screen.getByText("RUN"), s.to).toBeTruthy();
      expect(screen.getByText("WHAT CAME OUT"), s.to).toBeTruthy();
      const order = Array.from(document.querySelectorAll("main h2")).map((h) => h.textContent);
      expect(order.indexOf("WHAT GOES IN"), s.to).toBeLessThan(order.indexOf("RUN"));
      expect(order.indexOf("RUN"), s.to).toBeLessThan(order.indexOf("WHAT CAME OUT"));
      view.unmount();
    }
  });

  it("Every page can be run, stepped and started again", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByRole("button", { name: /^Run( again)?$/ })).toBeTruthy());
      expect(screen.getByRole("button", { name: "One step" }), s.to).toBeTruthy();
      expect(screen.getByRole("button", { name: "Ten steps" }), s.to).toBeTruthy();
      expect(screen.getByRole("button", { name: "Reset" }), s.to).toBeTruthy();
      expect(screen.getByText("Speed"), s.to).toBeTruthy();
      view.unmount();
    }
  });

  it("The rejected addresses land on their replacements", async () => {
    for (const [old, to] of Object.entries(REPLACED)) {
      const id = to.split("/").pop() as string;
      const view = await siteAt(`/topics/networks/play/${old}`);
      await waitFor(() => expect(screen.getByRole("heading", { name: TITLES[id] })).toBeTruthy(), {
        timeout: 4000,
      });
      view.unmount();
    }
  });
});

describe("Topic 3, what a step changes", () => {
  beforeEach(down);

  it("The car page reads the speed from two positions and says so", async () => {
    await siteAt("/topics/networks/play/rate");
    await waitFor(() => expect(screen.getByText(/press run and the car sets off/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/from two positions .* apart, the speed comes out as/i)).toBeTruthy());
    expect(screen.getByText("So the speed is that divided by this")).toBeTruthy();
  });

  it("The line page counts what your line gets wrong before the machine runs", async () => {
    await siteAt("/topics/networks/play/line");
    await waitFor(() => expect(screen.getByText(/your line puts \d+ of 60 dots on the wrong side/i)).toBeTruthy());
    expect(screen.getByText("The machine has not started. Press run.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the machine's line has none wrong after 2 corrections/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Exclusive or" }));
    await waitFor(() => expect(screen.getByText("The machine has not started. Press run.")).toBeTruthy());
    for (let i = 0; i < 45; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/it will never do better: no straight line can separate these dots/i)).toBeTruthy());
  });

  it("The correction page walks one dot through six moments", async () => {
    await siteAt("/topics/networks/play/blame");
    await waitFor(() => expect(screen.getByText(/is about to go in/i)).toBeTruthy());
    const one = screen.getByRole("button", { name: "One step" });
    fireEvent.click(one);
    await waitFor(() => expect(screen.getByText(/goes in\. its two numbers sit on the two input units/i)).toBeTruthy());
    fireEvent.click(one);
    fireEvent.click(one);
    fireEvent.click(one);
    await waitFor(() => expect(screen.getByText(/the miss is .*: the answer minus what it wanted/i)).toBeTruthy());
    fireEvent.click(one);
    await waitFor(() => expect(screen.getByText(/the blame flows back along the wires/i)).toBeTruthy());
    fireEvent.click(one);
    await waitFor(() => expect(screen.getByText(/every weight moves/i)).toBeTruthy());
    // the blame agrees with nudging each number by hand
    const worst = screen.getByText("The same slopes by nudging each number by hand, worst disagreement").nextElementSibling;
    expect(Number(worst?.textContent)).toBeLessThan(1e-5);
  });

  it("The sequence page keeps the first number in the gated cell and loses it in the plain loop", async () => {
    await siteAt("/topics/networks/play/sequence");
    await waitFor(() => expect(screen.getByText(/the first number will be/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/asked for the first number, the gated cell can answer/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Gates set to drop" }));
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the first number is gone from both/i)).toBeTruthy());
  });

  it("The words page names the word each word listened to most", async () => {
    await siteAt("/topics/networks/play/words");
    await waitFor(() => expect(screen.getByText(/10 words\. press run/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the word just before it, as this head was wired to do/i)).toBeTruthy());
  });

  it("The pictures page slides, pools and names the shape", async () => {
    await siteAt("/topics/networks/play/pictures");
    await waitFor(() => expect(screen.getByText(/the pattern will visit every position/i)).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "One step" }));
    await waitFor(() => expect(screen.getByText(/position 1 of 100/i)).toBeTruthy());
    for (let i = 0; i < 11; i++) fireEvent.click(screen.getByRole("button", { name: "Ten steps" }));
    await waitFor(() => expect(screen.getByText(/the picture is nearest to a cross/i)).toBeTruthy());
  });
});
