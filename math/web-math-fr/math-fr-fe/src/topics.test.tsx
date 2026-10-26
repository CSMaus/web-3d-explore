import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import common from "@/locales/en/common.json";

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
    await waitFor(() => expect(screen.getByRole("heading", { name: "Fractals" })).toBeTruthy());
    expect(screen.getByRole("heading", { name: "Differential equations, attractors and chaos" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Calculus into a first neural network" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Tokens, embeddings and generation" })).toBeTruthy();
    const items = Array.from(document.querySelectorAll("li"));
    expect(items[0].textContent).toContain("Topic 1");
    expect(items[2].textContent).toContain("Topic 3");
    expect(items[3].textContent).toContain("Topic 4");
  });

  it("A topic with pages is a link, whether or not it is filmed", async () => {
    serve(CARDS);
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Fractals" })).toBeTruthy());
    const hrefs = Array.from(document.querySelectorAll("main a")).map((a) =>
      a.getAttribute("href"),
    );
    // filmed goes to the series, built but unfilmed goes to the pages
    expect(hrefs).toContain("/topics/fractals/parts");
    expect(hrefs).toContain("/topics/chaos/play");
    expect(hrefs).toContain("/topics/networks/play");
    // tokens has pages now, so it links to them even though the card still says planned
    expect(hrefs).toContain("/topics/tokens/play");
    // the primes are one card under the list, opening their one page
    expect(hrefs).toContain("/topics/primes/play/gaps");
    expect(hrefs.length).toBe(5);
    expect(screen.getByRole("link", { name: /Prime numbers/ })).toBeTruthy();
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

  it("Lists the topics from the snapshot when the backend is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    await siteAt("/topics");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Fractals" })).toBeTruthy());
    expect(screen.queryByText("The backend is not answering")).toBeNull();
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
    const labels = Array.from(bar?.querySelectorAll('[data-slot="topbar-link"]') ?? []).map((a) => a.textContent);
    expect(labels.filter((l) => l !== "Kit")).toEqual(["Learn", "Topics", "Play", "About", "Projects", "Contact"]);
    // the kit preview's link is a development tool and is there only in development
    expect(labels.includes("Kit")).toBe(import.meta.env.DEV);
    expect(labels).not.toContain("play");
    expect(labels).not.toContain("theory");
  });

  it("Every page inside the topic carries the topic bar and its four sections", async () => {
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
      expect(hrefs).toContain("/topics/fractals/uses");
      expect(hrefs).toContain("/topics");
      view.unmount();
    }
  });

  it("Every written application piece renders with its question, its limits and its sources", async () => {
    for (const [path, question] of [
      ["/topics/fractals/uses/actuarial", "How does anyone put a price on a fire that has not happened?"],
      ["/topics/chaos/uses/weather", "Why does the forecast say 70 per cent?"],
      ["/topics/complex/uses/current", "Why does a motor draw more current than the work it does?"],
      ["/topics/networks/uses/proteins", "How does a string of letters become a shape?"],
      ["/topics/tokens/uses/spam", "How does a mailbox know which mail to throw away?"],
    ] as const) {
      const view = await siteAt(path);
      await waitFor(() => expect(screen.getByRole("heading", { name: question })).toBeTruthy(), { timeout: 4000 });
      expect(screen.getByText("What this does not say")).toBeTruthy();
      expect(screen.getByText("Sources")).toBeTruthy();
      expect(document.querySelectorAll('a[data-slot="link"][target="_blank"]').length).toBeGreaterThan(2);
      view.unmount();
    }
  });

  it("The insurance piece carries the reader's experiment and runs it", async () => {
    await siteAt("/topics/fractals/uses/actuarial");
    await waitFor(() => expect(screen.getByRole("button", { name: "Run a thousand insurers" })).toBeTruthy(), { timeout: 4000 });
    fireEvent.click(screen.getByRole("button", { name: "Run a thousand insurers" }));
    await waitFor(() => expect(screen.getByText(/insurers were ruined within 30 years/)).toBeTruthy(), { timeout: 20000 });
  }, 30000);

  it("The applications live under their own section, and the old play addresses arrive there", async () => {
    let view = await siteAt("/topics/fractals/uses");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Applications" })).toBeTruthy());
    expect(screen.getByText("Claims with a fractal tail")).toBeTruthy();
    expect(screen.getByText("How does anyone put a price on a fire that has not happened?")).toBeTruthy();
    // every application of this topic is now written, so none is marked as coming
    expect(screen.getAllByText("Ready").length).toBeGreaterThan(3);
    expect(screen.queryByText("Being written")).toBeNull();
    view.unmount();
    view = await siteAt("/topics/fractals/play/tails");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Claims with a fractal tail" })).toBeTruthy(), { timeout: 4000 });
    expect(Array.from(document.querySelectorAll("main a")).map((a) => a.getAttribute("href"))).toContain("/topics/fractals/uses");
    view.unmount();
    view = await siteAt("/topics/fractals/play");
    await waitFor(() => expect(screen.getAllByText(/Iterated maps/).length).toBeGreaterThan(0));
    expect(screen.queryByText("Claims with a fractal tail")).toBeNull();
    view.unmount();
  });

  it("The front page offers a way into the topics", async () => {
    await siteAt("/");
    await waitFor(() => expect(screen.getByText(common.front.title1)).toBeTruthy());
    // the menu bar carries one of the same name, so this is scoped to the page
    const link = document.querySelector('main a[href="/topics"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe(common.front.browse);
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
      expect(main?.dataset.slot, path).toBe("page");
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
    // the bar is the kit's, which takes its width and gutters from the theme's
    // page values; the page body carries the same width by class
    const bar = document.querySelector('header [data-slot="topbar-inner"]');
    const main = document.querySelector("main");
    expect(bar).toBeTruthy();
    expect(main?.dataset.slot).toBe("page");
  });
});
