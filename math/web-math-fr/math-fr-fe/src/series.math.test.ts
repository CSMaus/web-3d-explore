import { describe, expect, it } from "vitest";
import { FN, circlesAt, circlesOf, dct8, droppedEnergy, idct8, keepStrong, outlineOf, peakOf, radiusOf, reduceQuarter, resample, sinPoly, sinReduced, taylorAt, taylorCoefficients, waveSum, waveTerms, type C } from "@/systems/series";

describe("The series topic's mathematics", () => {
  it("Taylor: three terms of sin give sin(0.5) to six places, as the page says", () => {
    const c = taylorCoefficients("sin", 0, 5);
    expect(c.map((v) => +v.toFixed(6))).toEqual([0, 1, 0, -0.166667, 0, 0.008333]);
    expect(taylorAt(c, 0, 0.5).toFixed(7)).toBe("0.4794271");
    expect(Math.sin(0.5).toFixed(7)).toBe("0.4794255");
  });

  it("Taylor about any centre matches the function inside the radius", () => {
    for (const fn of ["sin", "cos", "exp", "ln", "bump"] as const) {
      const a = 0.4;
      const c = taylorCoefficients(fn, a, 40);
      expect(Math.abs(taylorAt(c, a, a + 0.5) - FN[fn](a + 0.5))).toBeLessThan(1e-6);
    }
    expect(taylorCoefficients("bump", 0, 4).map((v) => Math.round(v))).toEqual([1, 0, -1, 0, 1]);
    expect(taylorCoefficients("ln", 0, 3)).toEqual([0, 1, -0.5, 1 / 3]);
  });

  it("1/(1 + x^2) about 0 stops at 1, about 1 at the square root of 2: the poles at ±i", () => {
    expect(radiusOf("bump", 0)).toBe(1);
    expect(radiusOf("bump", 1)).toBeCloseTo(Math.SQRT2, 12);
    const c = taylorCoefficients("bump", 0, 60);
    expect(Math.abs(taylorAt(c, 0, 0.9) - FN.bump(0.9))).toBeLessThan(1e-2);
    expect(Math.abs(taylorAt(c, 0, 1.1))).toBeGreaterThan(10);
  });

  it("Fourier: the square wave's sum settles at 1 and overshoots a jump by about 9 per cent of it", () => {
    const t = waveTerms("square", 200);
    expect(waveSum(t, Math.PI / 2)).toBeCloseTo(1, 2);
    expect(peakOf(t)).toBeGreaterThan(1.175);
    expect(peakOf(t)).toBeLessThan(1.182);
    expect(waveSum(waveTerms("triangle", 50), 0)).toBeCloseTo(1, 2);
    expect(waveSum(waveTerms("sawtooth", 400), Math.PI / 2)).toBeCloseTo(0.5, 2);
  });

  it("A circle walked once is one circle; all circles redraw every point; the error is the radii left out", () => {
    const ring: C[] = Array.from({ length: 64 }, (_, k) => [2 * Math.cos((2 * Math.PI * k) / 64), 2 * Math.sin((2 * Math.PI * k) / 64)]);
    const c = circlesOf(ring);
    expect(c[0].n).toBe(1);
    expect(c[0].r).toBeCloseTo(2, 9);
    const square: C[] = resample([[0, 0], [1, 0], [1, 1], [0, 1]], 32);
    const sc = circlesOf(square);
    const tip = circlesAt(sc, sc.length, 5 / 32).pop()!;
    expect(tip[0]).toBeCloseTo(square[5][0], 9);
    expect(tip[1]).toBeCloseTo(square[5][1], 9);
    expect(droppedEnergy(sc, sc.length)).toBe(0);
    expect(droppedEnergy(sc, 3)).toBeGreaterThan(droppedEnergy(sc, 9));
  });

  it("The outline of a filled square is walked once around its edge", () => {
    const w = 40;
    const grey = new Array(w * w).fill(255);
    for (let y = 10; y < 30; y += 1) for (let x = 10; x < 30; x += 1) grey[y * w + x] = 0;
    const path = outlineOf(grey, w, w);
    expect(path.length).toBe(76);
    expect(path.every(([x, y]) => (x === 10 || x === 29 || y === 10 || y === 29) && x >= 10 && x <= 29 && y >= 10 && y <= 29)).toBe(true);
  });

  it("The cosine transform loses nothing, and keeping all 64 coefficients rebuilds the picture", () => {
    const block = Array.from({ length: 64 }, (_, i) => ((i * 37) % 101) - 50);
    const back = idct8(dct8(block));
    back.forEach((v, i) => expect(v).toBeCloseTo(block[i], 9));
    const grey = Array.from({ length: 16 * 16 }, (_, i) => (i * 13) % 256);
    expect(keepStrong(grey, 16, 16, 64).rms).toBeLessThan(1e-9);
    expect(keepStrong(grey, 16, 16, 4).rms).toBeGreaterThan(keepStrong(grey, 16, 16, 16).rms);
  });

  it("A calculator's sin: the polynomial alone fails far from zero, reduced first it is right to 14 places", () => {
    // seven terms, up to the 13th power, on the window of a quarter of pi: off by 2.0e-14 at its edge
    expect(Math.abs(sinPoly(Math.PI / 4) - Math.sin(Math.PI / 4))).toBeLessThan(2.1e-14);
    // the same seven terms at x = 10 are useless
    expect(Math.abs(sinPoly(10) - Math.sin(10))).toBeGreaterThan(500);
    // 100 is 64 quarter turns and -0.531 left over; 64 is a whole number of full turns
    const { k, r, turn } = reduceQuarter(100);
    expect([k, +r.toFixed(3), turn]).toEqual([64, -0.531, 0]);
    for (const x of [100, -7.3, 3, 1e3, 0.2, 2.5]) expect(Math.abs(sinReduced(x) - Math.sin(x))).toBeLessThan(1e-13);
  });
});

