import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

const CARDS = [
  {
    slug: "fractals",
    number: 1,
    title: "fractals",
    summary: "roughness that does not smooth out",
    state: "ready",
    parts: 10,
    beats: 53,
    seconds: 1188,
    systems: 7,
  },
  {
    slug: "chaos",
    number: 2,
    title: "differential equations, attractors and chaos",
    summary: "an equation whose unknown is a function",
    state: "planned",
    parts: 0,
    beats: 0,
    seconds: 0,
    systems: 0,
  },
  {
    slug: "networks",
    number: 3,
    title: "calculus into a first neural network",
    summary: "the perceptron and what it became",
    state: "planned",
    parts: 0,
    beats: 0,
    seconds: 0,
    systems: 0,
  },
];

async function siteAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

function serve(body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) =>
      String(url).endsWith("/topics")
        ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) })
        : Promise.reject(new Error("connection refused")),
    ),
  );
}

describe("the topic index", () => {
  beforeEach(() => {
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("lists every topic, built or not, in reading order", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("topic 1 - fractals")).toBeTruthy());
    expect(screen.getByText("topic 2 - differential equations, attractors and chaos")).toBeTruthy();
    expect(screen.getByText("topic 3 - calculus into a first neural network")).toBeTruthy();
    const items = Array.from(document.querySelectorAll("li"));
    expect(items[0].textContent).toContain("topic 1");
    expect(items[2].textContent).toContain("topic 3");
  });

  it("only the built topic is a link, and it points at its series", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("topic 1 - fractals")).toBeTruthy());
    const links = Array.from(document.querySelectorAll("main a"));
    expect(links.length).toBe(1);
    expect(links[0].getAttribute("href")).toBe("/topics/fractals/parts");
  });

  it("says plainly what is not built rather than pretending", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("ready")).toBeTruthy());
    expect(screen.getAllByText("planned").length).toBe(2);
    expect(screen.getAllByText("the plan is written; nothing is built yet").length).toBe(2);
    expect(screen.getByText(/10 parts, 53 beats, about 20 minutes, 7 things to move/)).toBeTruthy();
  });

  it("says what is missing when the backend is down, and still names the way in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("the backend is not answering")).toBeTruthy());
    expect(screen.getByText(/\/topics\/fractals/)).toBeTruthy();
  });
});

describe("navigation between and inside topics", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("the top bar moves between topics, not inside one", async () => {
    await siteAt("/topics");
    const bar = document.querySelector("header nav");
    const labels = Array.from(bar?.querySelectorAll("a") ?? []).map((a) => a.textContent);
    expect(labels).toEqual(["home", "topics", "account"]);
    expect(labels).not.toContain("play");
    expect(labels).not.toContain("theory");
  });

  it("every page inside the topic carries the topic bar and its three sections", async () => {
    for (const path of [
      "/topics/fractals/parts",
      "/topics/fractals/theory",
      "/topics/fractals/play",
      "/topics/fractals/play/ifs",
      "/topics/fractals/play/mandelbulb",
    ]) {
      const view = await siteAt(path);
      await waitFor(() => expect(screen.getAllByText("topic 1 - fractals").length).toBe(1));
      const hrefs = Array.from(document.querySelectorAll("main a")).map((a) =>
        a.getAttribute("href"),
      );
      expect(hrefs).toContain("/topics/fractals/parts");
      expect(hrefs).toContain("/topics/fractals/play");
      expect(hrefs).toContain("/topics/fractals/theory");
      expect(hrefs).toContain("/topics");
      view.unmount();
    }
  });

  it("the front page offers a way into the topics", async () => {
    await siteAt("/");
    await waitFor(() => expect(screen.getByText(/this page is not finished yet/)).toBeTruthy());
    const link = screen.getByRole("link", { name: "the topics" });
    expect(link.getAttribute("href")).toBe("/topics");
  });

  it("a topic with no section named goes to its series", async () => {
    await siteAt("/topics/fractals");
    await waitFor(() => expect(screen.getAllByText("topic 1 - fractals").length).toBe(1));
    expect(screen.getByRole("heading", { name: "the series, in order" })).toBeTruthy();
  });
});

describe("the page frame", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  const everywhere = [
    "/topics",
    "/topics/fractals/parts",
    "/topics/fractals/theory",
    "/topics/fractals/play",
    "/topics/fractals/play/ifs",
    "/topics/fractals/play/julia",
    "/topics/fractals/play/mandelbrot",
    "/topics/fractals/play/mandelbulb",
    "/account",
  ];

  it("every page starts at the same width, so its left edge matches the menu", async () => {
    for (const path of everywhere) {
      const view = await siteAt(path);
      const main = document.querySelector("main");
      expect(main?.className, path).toContain("max-w-6xl");
      expect(main?.className, path).toContain("px-6");
      view.unmount();
    }
  });
});

describe("the menu bar and the page agree on where the left edge is", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
  });

  it("both use the same maximum width and the same padding", async () => {
    await siteAt("/topics");
    const bar = document.querySelector("header nav");
    const main = document.querySelector("main");
    for (const token of ["max-w-6xl", "px-6"]) {
      expect(bar?.className).toContain(token);
      expect(main?.className).toContain(token);
    }
  });
});
