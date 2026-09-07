import { describe, expect, it } from "vitest";
import { LSYS_PRESETS, expand, parseRules, rngFrom, turtle } from "./lsystem";

const CAP = 900000;

function grow(name: string) {
  const cfg = LSYS_PRESETS[name];
  const word = expand(cfg.axiom, parseRules(cfg.rules), cfg.passes, CAP);
  return { cfg, word, segs: turtle(word.word, cfg.angle, 0, rngFrom(7)) };
}

describe("rewriting systems", () => {
  it("reads one rule a line", () => {
    const rules = parseRules("X = F+X\nF = FF\nnot a rule");
    expect(rules).toEqual({ X: "F+X", F: "FF" });
  });

  it("gives four to the power of the passes for the Koch curve", () => {
    expect(grow("Koch curve").segs.length).toBe(4 ** 4);
  });

  it("gives seven to the power of the passes for the flowsnake", () => {
    expect(grow("Gosper flowsnake").segs.length).toBe(7 ** 4);
  });

  it("gives three to the power of the passes for the arrowhead", () => {
    expect(grow("Sierpinski arrowhead").segs.length).toBe(3 ** 7);
  });

  it("gives two to the power of the passes for the dragon", () => {
    expect(grow("dragon").segs.length).toBe(2 ** 11);
  });

  it("branches the plant and leaves X and Y undrawn", () => {
    const { segs } = grow("plant");
    expect(segs.length).toBe(6048);
    expect(Math.max(...segs.map((s) => s.depth))).toBeGreaterThan(0);
  });

  it("stops expanding rather than running away past the cap", () => {
    const grown = expand("F", { F: "FFFF" }, 20, 5000);
    expect(grown.capped).toBe(true);
    expect(grown.reached).toBeLessThan(20);
  });

  it("moves the shape when the wobble is on and repeats with a seed", () => {
    const cfg = LSYS_PRESETS.plant;
    const word = expand(cfg.axiom, parseRules(cfg.rules), 4, CAP).word;
    const still = turtle(word, cfg.angle, 0, rngFrom(7));
    const shaken = turtle(word, cfg.angle, 0.3, rngFrom(7));
    const again = turtle(word, cfg.angle, 0.3, rngFrom(7));
    expect(shaken.length).toBe(still.length);
    expect(shaken[10].x1).not.toBeCloseTo(still[10].x1, 6);
    expect(again[10].x1).toBeCloseTo(shaken[10].x1, 12);
  });
});
