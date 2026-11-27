import { describe, expect, it } from "vitest";
import { GLYPHS, glyphShape, shapeOf } from "@/lib/outline";

describe("The outlines read from pictures", () => {
  it("offer four sample signs", () => {
    expect(GLYPHS.map((g) => g.id)).toEqual(["pi", "sigma", "amp", "three"]);
  });

  it("read a sign where the canvas draws nothing", () => {
    expect(Array.isArray(glyphShape("π"))).toBe(true);
  });

  it("find no outline where there is no picture", () => {
    expect(shapeOf(null)).toEqual([]);
  });
});
