import { afterEach, describe, expect, it, vi } from "vitest";
import type { Pen } from "@/components/Plot";
import { stageOf } from "@/scenes/kit";
import { catOutline } from "@/scenes/series/cat";
import { drawChain } from "@/scenes/series/chain";
import type { ChainState } from "@/scenes/series/chain";
import * as series from "@/systems/series";

const SPOTS = 480;
const FRAME_MOST = 31;

function stillPen(): Pen {
  const none = () => {};
  const ctx = { globalAlpha: 1, setLineDash: none };
  return {
    ctx, width: 900, height: 440,
    box: { x0: 0, x1: 1, y0: 0, y1: 1 },
    line: none, dot: none, ring: none,
  } as unknown as Pen;
}

function catState(shown: number): ChainState {
  const path = catOutline();
  const { hub, arms } = series.splitHub(series.circlesOf(path));
  return { hub, arms, shown, target: 1, path };
}

describe("The scene of a chain that draws", () => {
  afterEach(() => vi.restoreAllMocks());

  it("works out the whole lap once and keeps it while the arrows stay the same", () => {
    const pen = stillPen();
    const state = catState(5);
    const spy = vi.spyOn(series, "chainFrom");
    drawChain(pen, stageOf(pen), state, 0.3);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(SPOTS);
    spy.mockClear();
    drawChain(pen, stageOf(pen), { ...state }, 0.35);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(FRAME_MOST);
    expect(spy.mock.calls.length).toBeGreaterThan(0);
  });

  it("works the lap out again when the number of arrows or the centre changes", () => {
    const pen = stillPen();
    const state = catState(5);
    drawChain(pen, stageOf(pen), state, 0);
    const spy = vi.spyOn(series, "chainFrom");
    drawChain(pen, stageOf(pen), { ...state, shown: 5.5 }, 0.1);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(SPOTS);
    spy.mockClear();
    drawChain(pen, stageOf(pen), { ...state, shown: 5.5, hub: [state.hub[0] + 0.1, state.hub[1]] }, 0.2);
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(SPOTS);
    spy.mockClear();
    drawChain(pen, stageOf(pen), { ...state, shown: 5.5, hub: [state.hub[0] + 0.1, state.hub[1]] }, 0.3);
    expect(spy.mock.calls.length).toBeLessThanOrEqual(FRAME_MOST);
  });

  it("draws a whole frame before time starts, with no arrows and with no outline to aim at", () => {
    const pen = stillPen();
    const state = catState(0);
    expect(() => drawChain(pen, stageOf(pen), { ...state, path: null }, -3.2)).not.toThrow();
    expect(() => drawChain(pen, stageOf(pen), { ...state, arms: [], shown: 4 }, 61.3)).not.toThrow();
  });
});
