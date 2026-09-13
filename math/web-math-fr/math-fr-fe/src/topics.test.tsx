import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

const CARDS = [
  {
    slug: "fractals",
    number: 1,
    title: "Fractals",
    summary: "Roughness that does not smooth out",
    state: "ready",
    parts: 10,
    beats: 53,
    seconds: 1188,
    systems: 7,
  },
  {
    slug: "chaos",
    number: 2,
    title: "Differential equations, attractors and chaos",
    summary: "An equation whose unknown is a function",
    state: "writing",
    parts: 0,
    beats: 0,
    seconds: 0,
    systems: 7,
  },
  {
    slug: "networks",
    number: 3,
    title: "Calculus into a first neural network",
    summary: "The perceptron and what it became",
    state: "writing",
    parts: 0,
    beats: 0,
    seconds: 0,
    systems: 7,
  },
  {
    slug: "tokens",
    number: 4,
    title: "Tokens, embeddings and generation",
    summary: "A string of text turned into numbers",
    state: "planned",
    parts: 0,
    beats: 0,
    seconds: 0,
    systems: 0,
  },
  {
    slug: "primes",
    number: 5,
    title: "An aside: the gaps between primes",
    summary: "The gaps between primes as a return map",
    state: "writing",
    parts: 0,
    beats: 0,
    seconds: 0,
    systems: 1,
    aside: true,
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

describe("The topic index", () => {
  beforeEach(() => {
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("Lists every topic, built or not, in reading order", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("Topic 1 - Fractals")).toBeTruthy());
    expect(screen.getByText("Topic 2 - Differential equations, attractors and chaos")).toBeTruthy();
    expect(screen.getByText("Topic 3 - Calculus into a first neural network")).toBeTruthy();
    expect(screen.getByText("Topic 4 - Tokens, embeddings and generation")).toBeTruthy();
    const items = Array.from(document.querySelectorAll("li"));
    expect(items[0].textContent).toContain("Topic 1");
    expect(items[2].textContent).toContain("Topic 3");
    expect(items[3].textContent).toContain("Topic 4");
  });

  it("A topic with pages is a link, whether or not it is filmed", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("Topic 1 - Fractals")).toBeTruthy());
    const hrefs = Array.from(document.querySelectorAll("main a")).map((a) =>
      a.getAttribute("href"),
    );
    // filmed goes to the series, built but unfilmed goes to the pages
    expect(hrefs).toContain("/topics/fractals/parts");
    expect(hrefs).toContain("/topics/chaos/play");
    expect(hrefs).toContain("/topics/networks/play");
    // tokens has pages now, so it links to them even though the card still says planned
    expect(hrefs).toContain("/topics/tokens/play");
    // the aside links to its one page from its own block under the list
    expect(hrefs).toContain("/topics/primes/play/gaps");
    expect(hrefs.length).toBe(5);
    expect(screen.getByRole("link", { name: "Open the aside" })).toBeTruthy();
    expect(screen.getByText("Asides")).toBeTruthy();
  });

  it("Says plainly what exists on each, rather than pretending either way", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("Ready")).toBeTruthy());
    expect(screen.getAllByText("Being written").length).toBe(2);
    expect(screen.getAllByText("Planned").length).toBe(1);
    expect(screen.getByText(/10 parts, 53 beats, about 20 minutes, 7 things to move/i)).toBeTruthy();
    expect(
      screen.getAllByText(/7 things to move, and every equation. no clip filmed yet/i).length,
    ).toBe(2);
    expect(screen.getAllByText(/0 things to move, and every equation/i).length).toBe(1);
    // tokens is planned on its card and built in the site, so it is the third with pages
    expect(screen.getAllByText(/things to move, and every equation. no clip filmed yet/i).length).toBe(3);
  });

  it("Says what is missing when the backend is down, and still names the way in", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByText("The backend is not answering")).toBeTruthy());
    expect(screen.getByText(/\/topics\/fractals/i)).toBeTruthy();
  });
});

describe("Navigation between and inside topics", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("The top bar moves between topics, not inside one", async () => {
    await siteAt("/topics");
    const bar = document.querySelector("header nav");
    const labels = Array.from(bar?.querySelectorAll("a") ?? []).map((a) => a.textContent);
    expect(labels).toEqual(["Home", "Topics", "Account"]);
    expect(labels).not.toContain("play");
    expect(labels).not.toContain("theory");
  });

  it("Every page inside the topic carries the topic bar and its three sections", async () => {
    for (const path of [
      "/topics/fractals/parts",
      "/topics/fractals/theory",
      "/topics/fractals/play",
      "/topics/fractals/play/ifs",
      "/topics/fractals/play/mandelbulb",
    ]) {
      const view = await siteAt(path);
      await waitFor(() => expect(screen.getAllByText("Topic 1 - Fractals").length).toBe(1));
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

  it("The front page offers a way into the topics", async () => {
    await siteAt("/");
    await waitFor(() => expect(screen.getByText(/this page is not finished yet/i)).toBeTruthy());
    // the menu bar carries one of the same name, so this is scoped to the page
    const link = document.querySelector('main a[href="/topics"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe("Topics");
  });

  it("A topic with no section named goes to its series", async () => {
    await siteAt("/topics/fractals");
    await waitFor(() => expect(screen.getAllByText("Topic 1 - Fractals").length).toBe(1));
    expect(screen.getByRole("heading", { name: "The series, in order" })).toBeTruthy();
  });
});

describe("The page frame", () => {
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

  it("Every page starts at the same width, so its left edge matches the menu", async () => {
    for (const path of everywhere) {
      const view = await siteAt(path);
      const main = document.querySelector("main");
      expect(main?.className, path).toContain("max-w-6xl");
      expect(main?.className, path).toContain("px-6");
      view.unmount();
    }
  });
});

describe("The menu bar and the page agree on where the left edge is", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
  });

  it("Both use the same maximum width and the same padding", async () => {
    await siteAt("/topics");
    const bar = document.querySelector("header nav");
    const main = document.querySelector("main");
    for (const token of ["max-w-6xl", "px-6"]) {
      expect(bar?.className).toContain(token);
      expect(main?.className).toContain(token);
    }
  });
});
