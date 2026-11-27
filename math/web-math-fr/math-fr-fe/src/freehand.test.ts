import { describe, expect, it } from "vitest";
import { addPoint, finish, fromStage } from "@/lib/freehand";
import { DEFAULTS, build } from "@/scenes/series/fourier";
import type { C } from "@/systems/series";

const RADIUS = 0.5;
const ring = (n: number): C[] =>
  Array.from({ length: n }, (_, i): C => [RADIUS * Math.cos((2 * Math.PI * i) / n), RADIUS * Math.sin((2 * Math.PI * i) / n)]);

describe("A line drawn by hand", () => {
  it("takes a new point only when it is far enough from the last, and leaves the old line as it was", () => {
    const line: C[] = [[0, 0]];
    const near = addPoint(line, [0.004, 0]);
    expect(near).toEqual([[0, 0]]);
    expect(near).not.toBe(line);
    const far = addPoint(line, [0.02, 0]);
    expect(far).toEqual([[0, 0], [0.02, 0]]);
    expect(far).not.toBe(line);
    expect(line).toEqual([[0, 0]]);
    expect(addPoint(line, [0.02, 0], 0.05)).toEqual([[0, 0]]);
    expect(addPoint([], [0.3, -0.2])).toEqual([[0.3, -0.2]]);
  });

  it("is kept from twelve points on, and is nothing when shorter", () => {
    expect(finish(ring(11))).toBeNull();
    expect(finish(ring(12))).toEqual(ring(12));
    expect(finish(ring(3), 3)).toEqual(ring(3));
  });

  it("is measured from the centre of the picture, one unit to the edge of the frame", () => {
    expect(fromStage(50, 37.5)).toEqual([0, 0]);
    expect(fromStage(80, 67.5)).toEqual([1, 1]);
    expect(fromStage(20, 7.5)).toEqual([-1, -1]);
  });
});

describe("The reader's line in the Fourier story", () => {
  it("becomes 255 arrows once the hand is lifted", () => {
    expect(build({ ...DEFAULTS, own: ring(40), drawing: false }).own?.arms).toHaveLength(255);
  });

  it("is not turned into arrows while it is being drawn", () => {
    expect(build({ ...DEFAULTS, own: ring(40), drawing: true }).own).toBeNull();
  });
});
