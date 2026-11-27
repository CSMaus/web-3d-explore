import { afterEach, describe, expect, it, vi } from "vitest";
import type { Pen } from "@/components/Plot";
import * as outline from "@/lib/outline";
import { catOutline } from "@/scenes/series/cat";
import * as chain from "@/scenes/series/chain";
import { DEFAULTS, MOST, applyAct, build, draw, onStep } from "@/scenes/series/fourier";
import type { Values } from "@/scenes/series/fourier";
import * as wave from "@/scenes/series/wave";
import type { Fade, Set } from "@/storylines/series/fourier";
import type { C } from "@/systems/series";

const HIDDEN: Fade = { proj: 0, strip: 0, ghost: 0, target: 0, list: 0 };
const ring = (n: number): C[] => Array.from({ length: n }, (_, i): C => [Math.cos((2 * Math.PI * i) / n), Math.sin((2 * Math.PI * i) / n)]);

function quietPen() {
  const line = vi.fn();
  const pen = { width: 800, height: 600, ctx: { setLineDash: vi.fn() }, line } as unknown as Pen;
  return { pen, line };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("The reader's number of arrows in the Fourier story", () => {
  it("stays inside what the picture of the step can hold", () => {
    const set: Set = { mode: "wave", wave: "square", count: 3 };
    expect(applyAct(set, { ...DEFAULTS, count: 99 }).count).toBe(40);
    expect(applyAct(set, { ...DEFAULTS, count: -4 }).count).toBe(1);
    expect(applyAct({ ...set, mode: "draw" }, { ...DEFAULTS, count: 999 }).count).toBe(MOST.draw);
    expect(applyAct({ ...set, mode: "own" }, { ...DEFAULTS, count: 70 }).count).toBe(70);
  });

  it("leaves the step as written until the reader sets a number", () => {
    const set: Set = { mode: "draw", wave: "square", count: 6 };
    expect(applyAct(set, DEFAULTS)).toBe(set);
  });

  it("is forgotten on a new step, while the shape and the drawing are kept", () => {
    const values: Values = { count: 17, shape: "pi", own: ring(20), drawing: false };
    expect(onStep(values)).toEqual({ ...values, count: null });
  });
});

describe("The data of the Fourier story", () => {
  it("turns the cat into a centre and 255 arrows, the same arrows on a second build", () => {
    const data = build(DEFAULTS);
    expect(data.path).toHaveLength(256);
    expect(data.arms).toHaveLength(255);
    expect(data.own).toBeNull();
    expect(build({ ...DEFAULTS, count: 9 }).arms).toBe(data.arms);
  });

  it("draws the cat where a sign cannot be read from a canvas", () => {
    vi.spyOn(outline, "glyphShape").mockReturnValue([]);
    expect(build({ ...DEFAULTS, shape: "sigma" }).path).toEqual(catOutline());
  });

  it("turns the reader's line into arrows once it is finished and long enough", () => {
    expect(build({ ...DEFAULTS, own: ring(12) }).own?.arms).toHaveLength(255);
    expect(build({ ...DEFAULTS, own: ring(11) }).own).toBeNull();
    expect(build({ ...DEFAULTS, own: ring(40), drawing: true }).own).toBeNull();
  });
});

describe("The picture of the Fourier story", () => {
  it("grows a new arrow frame by frame, and sets the number at once on a frame that does not follow", () => {
    const drawn = vi.spyOn(wave, "drawWave").mockImplementation(() => {});
    const { pen } = quietPen();
    const data = build(DEFAULTS);
    const seen = () => drawn.mock.calls[drawn.mock.calls.length - 1][2].shown;
    const three: Set = { mode: "wave", wave: "square", count: 3 };
    const four: Set = { ...three, count: 4 };

    draw(pen, data, HIDDEN, three, 100);
    expect(seen()).toBe(3);
    draw(pen, data, HIDDEN, four, 100.03);
    const first = seen();
    expect(first).toBeGreaterThan(3);
    expect(first).toBeLessThan(4);
    draw(pen, data, HIDDEN, four, 100.06);
    expect(seen()).toBeGreaterThan(first);
    expect(seen()).toBeLessThan(4);
    draw(pen, data, HIDDEN, four, 100.06);
    expect(seen()).toBeLessThan(4);

    draw(pen, data, HIDDEN, three, 105);
    expect(seen()).toBe(3);
    draw(pen, data, HIDDEN, four, 50);
    expect(seen()).toBe(4);

    draw(pen, data, HIDDEN, { ...four, wave: "sawtooth" }, 50.03);
    expect(seen()).toBeGreaterThan(0);
    expect(seen()).toBeLessThan(1);
  });

  it("sets the number at once while the picture stands, on the same frame and on a new kind of picture", () => {
    const drawn = vi.spyOn(wave, "drawWave").mockImplementation(() => {});
    const { pen } = quietPen();
    const data = build(DEFAULTS);
    const seen = () => drawn.mock.calls[drawn.mock.calls.length - 1][2].shown;
    const three: Set = { mode: "wave", wave: "square", count: 3 };

    draw(pen, data, HIDDEN, three, 200, false);
    expect(seen()).toBe(3);
    draw(pen, data, HIDDEN, { ...three, count: 4 }, 200, false);
    expect(seen()).toBe(4);
    draw(pen, data, HIDDEN, { ...three, wave: "sawtooth", count: 12 }, 200, false);
    expect(seen()).toBe(12);
  });

  it("shows the reader's line while it is drawn, and the chain of its arrows after", () => {
    const drawn = vi.spyOn(chain, "drawChain").mockImplementation(() => {});
    const own: Set = { mode: "own", wave: "square", count: 50 };

    const empty = quietPen();
    draw(empty.pen, build(DEFAULTS), HIDDEN, own, 0);
    expect(empty.line).toHaveBeenCalledTimes(1);
    expect(drawn).not.toHaveBeenCalled();

    const going = quietPen();
    draw(going.pen, build({ ...DEFAULTS, own: ring(30), drawing: true }), HIDDEN, own, 0.03);
    expect(going.line).toHaveBeenCalledTimes(2);
    expect(drawn).not.toHaveBeenCalled();

    const ready = build({ ...DEFAULTS, own: ring(30) });
    draw(quietPen().pen, ready, HIDDEN, own, 0.06);
    expect(drawn).toHaveBeenCalledTimes(1);
    expect(drawn.mock.calls[0][2]).toMatchObject({ arms: ready.own?.arms, target: 0, path: null });
  });
});
