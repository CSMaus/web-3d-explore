import { describe, expect, it } from "vitest";
import { approach, clampStep, easeFade, grow, num, settled, share } from "@/lib/storyline";

describe("The motions and formats every story shares", () => {
  it("approach closes on its aim from both sides, never passes it and lands on it", () => {
    for (const [from, to] of [[0, 1], [1, 0], [0.3, 0.3], [-2, 5]] as const) {
      let v: number = from;
      for (let i = 0; i < 600; i += 1) {
        const next = approach(v, to, 1 / 60);
        expect(Math.abs(to - next)).toBeLessThanOrEqual(Math.abs(to - v));
        v = next;
      }
      expect(v).toBe(to);
    }
    expect(approach(0, 1, 100)).toBe(1);
    expect(approach(0, 1, -1)).toBe(0);
  });

  it("grow reaches a count up or down without passing it, faster from further away", () => {
    let up = 0;
    let frames = 0;
    while (up !== 12 && frames < 5000) { const next = grow(up, 12, 1 / 60); expect(next).toBeGreaterThan(up); expect(next).toBeLessThanOrEqual(12); up = next; frames += 1; }
    expect(up).toBe(12);
    expect(frames).toBeLessThan(240);
    let down = 60;
    while (down !== 1) { const next = grow(down, 1, 1 / 60); expect(next).toBeLessThan(down); expect(next).toBeGreaterThanOrEqual(1); down = next; }
    expect(grow(3, 3, 1)).toBe(3);
    expect(grow(0, 100, 1 / 60) - 0).toBeGreaterThan(grow(0, 2, 1 / 60) - 0);
  });

  it("easeFade moves every part and says when it has arrived", () => {
    let shown = { a: 0, b: 1 };
    const aim = { a: 1, b: 0.3 };
    expect(settled(shown, aim)).toBe(false);
    for (let i = 0; i < 600; i += 1) shown = easeFade(shown, aim, 1 / 60);
    expect(shown).toEqual(aim);
    expect(settled(shown, aim)).toBe(true);
    const first = { a: 0, b: 1 };
    easeFade(first, aim, 1 / 60);
    expect(first).toEqual({ a: 0, b: 1 });
  });

  it("writes step numbers, whole numbers and shares the way the pages do", () => {
    expect([clampStep(-3, 10), clampStep(99, 10), clampStep(4.4, 10)]).toEqual([0, 9, 4]);
    expect([num(5000), num(100000), num(4995), num(7)]).toEqual(["5,000", "100,000", "4,995", "7"]);
    expect([share(6, 36), share(1, 36), share(3, 36)]).toEqual(["6/36 = 1/6", "1/36", "3/36 = 1/12"]);
  });
});
