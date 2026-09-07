import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { socketUrl } from "@/lib/deep";

const SYSTEM = {
  id: "mandelbrot",
  name: "the Mandelbrot set",
  summary: "a summary",
  blocks: [{ label: "step", tex: "z", note: "a note" }],
  dimension: { label: "dimension", tex: "d", note: "a note" },
};

/** a stand-in for the browser socket that records what was sent and can be driven. */
class FakeSocket {
  static made: FakeSocket[] = [];
  static OPEN = 1;
  static CONNECTING = 0;
  readyState = 0;
  sent: Record<string, unknown>[] = [];
  closed: { code?: number } | null = null;
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: ((e: { code: number }) => void) | null = null;

  constructor(public url: string) {
    FakeSocket.made.push(this);
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  send(body: string) {
    this.sent.push(JSON.parse(body));
  }
  close(code = 1000) {
    this.readyState = 3;
    this.closed = { code };
    this.onclose?.({ code });
  }
  deliver(body: unknown) {
    this.onmessage?.({ data: JSON.stringify(body) });
  }
}

function tileFor(nonce: number, step: number, final: boolean) {
  return {
    kind: "tile",
    nonce,
    step,
    width: 1024 / step,
    height: 768 / step,
    iters: 400,
    cx: -0.743643887037151,
    cy: 0.13182590420533,
    span: 3e-5,
    png: "aGVsbG8=".repeat(20),
    final,
  };
}

async function pageAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    defaultPendingMs: 0,
  });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

function serveSystem() {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(SYSTEM) })),
  );
}

/** the zoom slider is the only range on this page that runs to 22. */
function zoomSlider(): HTMLInputElement {
  const all = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="range"]'));
  const found = all.find((i) => i.max === "22");
  if (!found) throw new Error("no zoom slider on the page");
  return found;
}

const zoomTo = async (times: number) => {
  await act(async () => {
    fireEvent.change(zoomSlider(), { target: { value: String(times) } });
  });
};

describe("the deep-zoom socket on the Mandelbrot page", () => {
  beforeEach(() => {
    FakeSocket.made = [];
    vi.stubGlobal("WebSocket", FakeSocket as unknown as typeof WebSocket);
    document.cookie = "mathfr_session_consent=accepted; path=/";
    serveSystem();
  });

  it("says nothing about the server while the card can still draw the view", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await waitFor(() => expect(screen.getByText("VIEW")).toBeTruthy());
    expect(screen.queryByText("SERVER RENDER")).toBeNull();
    expect(FakeSocket.made.length).toBe(0);
  });

  it("offers the server only past the point single precision runs out", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await waitFor(() => expect(screen.getByText("VIEW")).toBeTruthy());
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    expect(screen.getByRole("button", { name: "render on the server" })).toBeTruthy();
  });

  it("opens no socket until the render is asked for", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    expect(FakeSocket.made.length).toBe(0);
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    expect(FakeSocket.made.length).toBe(1);
    expect(FakeSocket.made[0].url).toBe(socketUrl());
  });

  it("sends the view it is looking at, bounded in size", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    expect(live.sent.length).toBe(1);
    const want = live.sent[0];
    expect(want.span).toBeCloseTo(1.6 / Math.pow(2, 20), 12);
    expect(Number(want.width)).toBeLessThanOrEqual(1100);
    expect(Number(want.height)).toBeLessThanOrEqual(800);
    expect(Number(want.iters)).toBeGreaterThanOrEqual(400);
    expect(Number(want.nonce)).toBeGreaterThan(0);
  });

  it("shows each pass as it arrives and counts them", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    const id = Number(live.sent[0].nonce);

    await act(async () => live.deliver(tileFor(id, 8, false)));
    await waitFor(() => expect(screen.getByText("pass 1 of 4")).toBeTruthy());
    expect(screen.getByAltText("the set rendered on the server")).toBeTruthy();

    await act(async () => live.deliver(tileFor(id, 4, false)));
    await waitFor(() => expect(screen.getByText("pass 2 of 4")).toBeTruthy());

    await act(async () => live.deliver(tileFor(id, 1, true)));
    await waitFor(() => expect(screen.getByText("finished, full resolution")).toBeTruthy());
  });

  it("closes the socket as soon as the view is finished", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    const id = Number(live.sent[0].nonce);
    expect(live.closed).toBeNull();
    await act(async () => live.deliver(tileFor(id, 1, true)));
    expect(live.closed).not.toBeNull();
  });

  it("throws away a pass that belongs to a view already left", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    const id = Number(live.sent[0].nonce);
    await act(async () => live.deliver(tileFor(id - 1, 8, false)));
    expect(screen.queryByAltText("the set rendered on the server")).toBeNull();
    await act(async () => live.deliver(tileFor(id, 8, false)));
    expect(screen.getByAltText("the set rendered on the server")).toBeTruthy();
  });

  it("drops the picture when the view moves, and says why", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    await act(async () => live.deliver(tileFor(Number(live.sent[0].nonce), 1, true)));
    expect(screen.getByAltText("the set rendered on the server")).toBeTruthy();
    await zoomTo(19);
    await waitFor(() => expect(screen.getByText(/the view moved/)).toBeTruthy());
    expect(screen.queryByAltText("the set rendered on the server")).toBeNull();
  });

  it("reports a refusal from the server rather than waiting for ever", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    await act(async () =>
      live.deliver({
        kind: "refused",
        nonce: live.sent[0].nonce,
        reason: "that render is larger than the budget allows",
      }),
    );
    await waitFor(() =>
      expect(screen.getByText("that render is larger than the budget allows")).toBeTruthy(),
    );
    expect(live.closed).not.toBeNull();
  });

  it("reports a busy server and keeps the connection for the retry", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    await act(async () =>
      live.deliver({ kind: "busy", reason: "too many renders in flight" }),
    );
    await waitFor(() => expect(screen.getByText("too many renders in flight")).toBeTruthy());
  });

  it("reports a connection that drops mid render", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    await act(async () => live.close(1006));
    await waitFor(() => expect(screen.getByText(/the connection closed \(1006\)/)).toBeTruthy());
  });

  it("stops on request and leaves nothing open", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    await act(async () => {
      screen.getByRole("button", { name: "stop" }).click();
    });
    expect(live.closed).not.toBeNull();
    await waitFor(() => expect(screen.getByText("not started")).toBeTruthy());
  });

  it("names the server as what drew the picture, and the card otherwise", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await waitFor(() => expect(screen.getByText("the graphics card")).toBeTruthy());
    await zoomTo(20);
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    await act(async () => live.deliver(tileFor(Number(live.sent[0].nonce), 1, true)));
    await waitFor(() => expect(screen.getByText("the server, double precision")).toBeTruthy());
  });
});

describe("the socket address", () => {
  it("follows wherever the api lives", () => {
    expect(socketUrl()).toBe("ws://localhost:1585/api/deep");
  });
});

describe("a server that does not answer with the view asked for", () => {
  beforeEach(() => {
    FakeSocket.made = [];
    vi.stubGlobal("WebSocket", FakeSocket as unknown as typeof WebSocket);
    document.cookie = "mathfr_session_consent=accepted; path=/";
    serveSystem();
  });

  it("says so instead of sitting on the first pass for ever", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    const stripped = tileFor(1, 8, false) as Record<string, unknown>;
    delete stripped.nonce;
    await act(async () => live.deliver(stripped));
    await waitFor(() =>
      expect(screen.getByText("the server did not answer with the view asked for")).toBeTruthy(),
    );
    expect(live.closed).not.toBeNull();
  });
});

describe("the palette reaches the server", () => {
  beforeEach(() => {
    FakeSocket.made = [];
    vi.stubGlobal("WebSocket", FakeSocket as unknown as typeof WebSocket);
    document.cookie = "mathfr_session_consent=accepted; path=/";
    serveSystem();
  });

  it("sends the colours the page is drawing in, not the server's own", async () => {
    await pageAt("/topics/fractals/play/mandelbrot");
    await zoomTo(20);
    await waitFor(() => expect(screen.getByText("SERVER RENDER")).toBeTruthy());
    await act(async () => {
      screen.getByRole("button", { name: "render on the server" }).click();
    });
    const live = FakeSocket.made[0];
    await act(async () => live.open());
    const want = live.sent[0] as { ramp: string[]; body: string; shift: number };
    expect(Array.isArray(want.ramp)).toBe(true);
    expect(want.ramp.length).toBeGreaterThanOrEqual(2);
    for (const hex of want.ramp) expect(hex).toMatch(/^#[0-9a-f]{6}$/i);
    expect(want.body).toMatch(/^#[0-9a-f]{6}$/i);
    expect(typeof want.shift).toBe("number");
  });
});
