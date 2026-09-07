import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";

async function siteAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

describe("every page with the backend down", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  const drawn = [
    ["/topics/fractals/play/ifs", "iterated maps"],
    ["/topics/fractals/play/lsystem", "rewriting systems"],
    ["/topics/fractals/play/lichtenberg", "dielectric breakdown"],
    ["/topics/fractals/play/dla", "wandering particles"],
  ] as const;

  for (const [path, title] of drawn) {
    it(`${path} still draws its fractal`, async () => {
      await siteAt(path);
      await waitFor(() => expect(screen.getByRole("heading", { name: title })).toBeTruthy());
      expect(document.querySelector("canvas")).toBeTruthy();
      expect(screen.getByText(/needs nothing from it/)).toBeTruthy();
    });
  }

  it("the play index lists every system from a local copy", async () => {
    await siteAt("/topics/fractals/play");
    await waitFor(() => expect(screen.getByText("pick something to move")).toBeTruthy());
    for (const name of ["iterated maps", "rewriting systems", "Julia sets"]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByRole("link", { name: "Mandelbulb 3D" }).length).toBe(1);
  });

  it("/topics/fractals/theory says what is missing instead of failing", async () => {
    await siteAt("/topics/fractals/theory");
    await waitFor(() => expect(screen.getByText("the backend is not answering")).toBeTruthy());
  });

  it("/topics/fractals/parts says what is missing instead of failing", async () => {
    await siteAt("/topics/fractals/parts");
    await waitFor(() => expect(screen.getByText("the backend is not answering")).toBeTruthy());
  });

  it("the series page is named as one section of one topic, not as a lecture", async () => {
    await siteAt("/topics/fractals/parts");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "the series, in order" })).toBeTruthy(),
    );
    expect(screen.getByText("topic 1 - fractals")).toBeTruthy();
    expect(screen.queryByText(/lecture/i)).toBeNull();
  });

  it("the front page needs no backend at all", async () => {
    await siteAt("/");
    await waitFor(() =>
      expect(screen.getByText(/this page is not finished yet/)).toBeTruthy(),
    );
  });
});

describe("the three-dimensional page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("offers auto or manual rotation, and both reset buttons", async () => {
    await siteAt("/topics/fractals/play/mandelbulb");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "the three-dimensional set" })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "auto" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "manual" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "reset view" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "reset all" })).toBeTruthy();
  });

  it("shows the turn controls only in manual rotation", async () => {
    await siteAt("/topics/fractals/play/mandelbulb");
    await waitFor(() => expect(screen.getByRole("button", { name: "manual" })).toBeTruthy());
    expect(screen.queryByText("drag the picture to turn it.")).toBeNull();
    screen.getByRole("button", { name: "manual" }).click();
    await waitFor(() => expect(screen.getByText("drag the picture to turn it.")).toBeTruthy());
  });
});

describe("the iterated maps page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("offers colouring by branch and writes every move out", async () => {
    await siteAt("/topics/fractals/play/ifs");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "iterated maps" })).toBeTruthy(),
    );
    expect(screen.getByRole("button", { name: "by branch" })).toBeTruthy();
    expect(screen.getByText("EQUATIONS")).toBeTruthy();
    for (const n of [1, 2, 3, 4]) {
      expect(screen.getAllByText(`move ${n}`).length).toBeGreaterThan(0);
    }
    expect(screen.getByText("carries the whole shape")).toBeTruthy();
  });

  it("reports which grouping the counts use", async () => {
    await siteAt("/topics/fractals/play/ifs");
    await waitFor(() => expect(screen.getByText("grouped by")).toBeTruthy());
    expect(screen.getByText("the last move used")).toBeTruthy();
    screen.getByRole("button", { name: "by branch" }).click();
    await waitFor(() =>
      expect(screen.getByText(/branch, with move \d as the carrier/)).toBeTruthy(),
    );
  });
});

describe("saving the picture", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  for (const path of ["/topics/fractals/play/ifs", "/topics/fractals/play/lsystem", "/topics/fractals/play/lichtenberg", "/topics/fractals/play/dla"]) {
    it(`${path} offers a save button that reads the canvas`, async () => {
      await siteAt(path);
      await waitFor(() => expect(screen.getByRole("button", { name: "save image" })).toBeTruthy());
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      const asUrl = vi.fn(() => "data:image/png;base64,AA==");
      canvas.toDataURL = asUrl as unknown as typeof canvas.toDataURL;
      screen.getByRole("button", { name: "save image" }).click();
      expect(asUrl).toHaveBeenCalled();
      expect(screen.queryByText("the picture could not be read back")).toBeNull();
    });
  }

  it("says so rather than failing quietly when there is no picture to read", async () => {
    await siteAt("/topics/fractals/play/mandelbulb");
    await waitFor(() => expect(screen.getByRole("button", { name: "save image" })).toBeTruthy());
    screen.getByRole("button", { name: "save image" }).click();
    await waitFor(() =>
      expect(screen.getByText("the picture could not be read back")).toBeTruthy(),
    );
  });
});

describe("the layout of a system page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("connection refused"))),
    );
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  for (const path of ["/topics/fractals/play/ifs", "/topics/fractals/play/lsystem", "/topics/fractals/play/lichtenberg", "/topics/fractals/play/dla"]) {
    it(`${path} holds the picture in place while the controls scroll`, async () => {
      await siteAt(path);
      await waitFor(() => expect(document.querySelector("canvas")).toBeTruthy());
      const stage = document.querySelector("canvas")?.closest("section");
      const column = stage?.parentElement;
      expect(column?.className).toContain("lg:sticky");
      expect(column?.className).toContain("lg:top-24");
      expect(stage?.className).toContain("calc(100vh-12rem)");
      expect(stage?.closest(".grid")?.className).toContain("items-start");
    });
  }

  it("names its panels in the same style", async () => {
    await siteAt("/topics/fractals/play/ifs");
    await waitFor(() => expect(screen.getByText("PRESET")).toBeTruthy());
    for (const name of ["MOVE", "COLOUR", "EQUATIONS", "MATHEMATICS"]) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });
});

const THEORY = {
  definitions: [{ id: "box", name: "box counting", tex: "d", note: "a note" }],
  systems: [
    {
      id: "ifs",
      name: "iterated maps",
      summary: "a summary",
      blocks: [{ label: "move", tex: "x", note: "a note" }],
      dimension: { label: "dimension", tex: "d", note: "a note" },
    },
    {
      id: "julia",
      name: "Julia sets",
      summary: "a summary",
      blocks: [{ label: "step", tex: "z", note: "a note" }],
      dimension: { label: "dimension", tex: "d", note: "a note" },
    },
  ],
};

const TOPIC = {
  slug: "fractals",
  number: 1,
  title: "fractals",
  summary: "a summary",
  state: "ready",
  parts: 2,
  beats: 2,
  seconds: 120,
  systems: 7,
  part_list: [
    {
      number: 2,
      title: "the coastline paradox",
      beats: [
        { slug: "02-coastline", seconds: 61.5, video: "", shows: "a coast", why: "a reason", say: "a line" },
      ],
    },
    {
      number: 3,
      title: "box-counting dimension",
      beats: [
        { slug: "03-box-counting", seconds: 56.9, video: "", shows: "a grid", why: "a reason", say: "a line" },
      ],
    },
  ],
};

function serve(map: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      const hit = Object.keys(map).find((key) => String(url).endsWith(key));
      if (!hit) return Promise.reject(new Error("connection refused"));
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(map[hit]) });
    }),
  );
}

describe("the index beside a long page", () => {
  beforeEach(() => {
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("the theory page lists every system and the dimension definitions", async () => {
    serve({ "/topics/fractals/equations": THEORY });
    await siteAt("/topics/fractals/theory");
    await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
    const rail = screen.getByLabelText("on this page");
    for (const label of ["how dimension is measured", "iterated maps", "Julia sets"]) {
      expect(rail.textContent).toContain(label);
    }
    expect(rail.querySelector('a[href="#julia"]')).toBeTruthy();
    expect(document.getElementById("julia")).toBeTruthy();
    expect(rail.textContent).toBeTruthy();
  });

  it("the topic page lists every part", async () => {
    serve({ "/topics/fractals": TOPIC });
    await siteAt("/topics/fractals/parts");
    await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
    const rail = screen.getByLabelText("on this page");
    expect(rail.textContent).toContain("2. the coastline paradox");
    expect(rail.textContent).toContain("3. box-counting dimension");
    expect(rail.querySelector('a[href="#part-3"]')).toBeTruthy();
    expect(document.getElementById("part-3")).toBeTruthy();
  });

  for (const [path, body] of [
    ["/topics/fractals/theory", { "/topics/fractals/equations": THEORY }],
    ["/topics/fractals/parts", { "/topics/fractals": TOPIC }],
  ] as const) {
    it(`${path} gives the index its own column so it cannot land on the text`, async () => {
      serve(body);
      await siteAt(path);
      await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
      const rail = screen.getByLabelText("on this page");
      expect(rail.className).not.toContain("fixed");
      const holder = rail.closest("main");
      expect(holder?.className).toContain("xl:grid");
      expect(holder?.className).toContain("xl:grid-cols-[240px_minmax(0,1fr)]");
      expect(rail.parentElement).toBe(holder);
    });
  }

  it("the series page calls its sections parts, not topics", async () => {
    serve({ "/topics/fractals": TOPIC });
    await siteAt("/topics/fractals/parts");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "part 2 - the coastline paradox" })).toBeTruthy(),
    );
    expect(screen.getByText("topic 1 - fractals")).toBeTruthy();
  });
});

describe("the index tracks the page and lands where it says", () => {
  beforeEach(() => {
    document.cookie = "mathfr_session_consent=accepted; path=/";
  });

  it("every entry is a real anchor with a scroll margin clear of the menu", async () => {
    serve({ "/topics/fractals": TOPIC });
    await siteAt("/topics/fractals/parts");
    await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
    const rail = screen.getByLabelText("on this page");
    for (const link of Array.from(rail.querySelectorAll("a"))) {
      const id = link.getAttribute("href")?.slice(1) ?? "";
      const target = document.getElementById(id);
      expect(target).toBeTruthy();
      expect(target?.className).toContain("scroll-mt-24");
    }
  });

  it("a click moves the mark straight away rather than waiting for the scroll", async () => {
    serve({ "/topics/fractals": TOPIC });
    await siteAt("/topics/fractals/parts");
    await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
    const rail = screen.getByLabelText("on this page");
    const second = rail.querySelector('a[href="#part-3"]') as HTMLAnchorElement;
    expect(second.getAttribute("aria-current")).toBeNull();
    second.click();
    await waitFor(() => expect(second.getAttribute("aria-current")).toBe("true"));
    expect(rail.querySelector('a[href="#part-2"]')?.getAttribute("aria-current")).toBeNull();
  });

  it("no beat carries the containment that made a jump land in the wrong place", async () => {
    serve({ "/topics/fractals": TOPIC });
    await siteAt("/topics/fractals/parts");
    await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
    const beats = Array.from(document.querySelectorAll("#part-2 section"));
    expect(beats.length).toBeGreaterThan(0);
    for (const beat of beats) {
      expect(beat.className).not.toContain("deep");
    }
  });

  it("the index is set in a size that can be read", async () => {
    serve({ "/theory": THEORY, "/topics/fractals/equations": THEORY });
    await siteAt("/topics/fractals/theory");
    await waitFor(() => expect(screen.getByLabelText("on this page")).toBeTruthy());
    const label = screen.getByLabelText("on this page").querySelector("a span:last-child");
    expect(label?.className).toContain("text-[13px]");
  });
});
