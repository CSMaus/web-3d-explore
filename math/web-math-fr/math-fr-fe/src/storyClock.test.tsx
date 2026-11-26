import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useStoryClock } from "@/lib/storyClock";

const host = { current: document.createElement("section") };
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("The story clock", () => {
  it("runs from the moment the story is mounted", async () => {
    const { result } = renderHook(() => useStoryClock(host));
    expect(result.current.playing).toBe(true);
    await waitFor(() => expect(result.current.time).toBeGreaterThan(0));
  });

  it("stands after the reader pauses it", async () => {
    const { result } = renderHook(() => useStoryClock(host));
    await waitFor(() => expect(result.current.time).toBeGreaterThan(0));
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);
    expect(result.current.dt).toBe(0);
    const held = result.current.time;
    await act(() => wait(100));
    expect(result.current.time).toBe(held);
  });

  it("goes on after a second press", async () => {
    const { result } = renderHook(() => useStoryClock(host));
    await waitFor(() => expect(result.current.time).toBeGreaterThan(0));
    act(() => result.current.toggle());
    const held = result.current.time;
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
    await waitFor(() => expect(result.current.time).toBeGreaterThan(held));
  });

  it("starts still for a reader who asked for less motion, and moves on a press", async () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const { result } = renderHook(() => useStoryClock(host));
    expect(result.current.playing).toBe(false);
    expect(result.current.time).toBe(0);
    await act(() => wait(100));
    expect(result.current.time).toBe(0);
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
    await waitFor(() => expect(result.current.time).toBeGreaterThan(0));
  });

  it("never counts a frame as longer than 0.05 seconds", async () => {
    let stamp = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((frame) => {
      stamp += 1000;
      const at = stamp;
      return setTimeout(() => frame(at), 0) as unknown as number;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => clearTimeout(id));
    const seen: number[] = [];
    const { result, unmount } = renderHook(() => {
      const clock = useStoryClock(host);
      seen.push(clock.dt);
      return clock;
    });
    await waitFor(() => expect(result.current.time).toBeGreaterThan(0.1));
    unmount();
    expect(Math.max(...seen)).toBe(0.05);
    const frames = result.current.time / 0.05;
    expect(frames).toBeCloseTo(Math.round(frames), 6);
  });
});
