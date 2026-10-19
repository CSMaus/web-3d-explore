import { describe, expect, it } from "vitest";
import { expectedCeded, fractionalNoise, lundbergRuin, paretoScale, trial, type Cover, type Terms, type World } from "@/systems/ruin";
import { rng } from "@/systems/net";

const classical: World = { rate: 20, mean: 1, sizes: "exponential", alpha: 1.5, hurst: 0.5, clustering: 0 };
const none: Cover = { retention: Infinity, loading: 0.3 };

describe("The surplus process", () => {
  it("agrees with the Lundberg-Cramer ruin probability for exponential claims", () => {
    const terms: Terms = { capital: 6, loading: 0.2, years: 150 };
    const got = trial(classical, terms, none, 3000, 7).ruinRate;
    const want = lundbergRuin(classical, terms);
    expect(Math.abs(got - want)).toBeLessThan(0.03);
    expect(want).toBeGreaterThan(0.2);
  });

  it("is ruined more often by heavy tails than by light ones with the same mean", () => {
    const terms: Terms = { capital: 15, loading: 0.2, years: 30 };
    const light = trial(classical, terms, none, 1500, 3).ruinRate;
    const heavy = trial({ ...classical, sizes: "pareto", alpha: 1.3 }, terms, none, 1500, 3);
    expect(heavy.ruinRate).toBeGreaterThan(light + 0.1);
    // the largest single claim is a much bigger share of everything one insurer paid
    const lightShare = trial(classical, terms, none, 300, 3).largestClaimShare;
    expect(heavy.largestClaimShare).toBeGreaterThan(0.1);
    expect(lightShare).toBeLessThan(0.03);
  });

  it("is ruined more often when the years cluster", () => {
    const terms: Terms = { capital: 15, loading: 0.15, years: 30 };
    const flat = trial({ ...classical, clustering: 0.5 }, terms, none, 1500, 5).ruinRate;
    const clustered = trial({ ...classical, hurst: 0.85, clustering: 0.5 }, terms, none, 1500, 5).ruinRate;
    expect(clustered).toBeGreaterThan(flat + 0.05);
  });

  it("is ruined less often with a reinsurance layer against the large claims", () => {
    const heavy: World = { ...classical, sizes: "pareto", alpha: 1.3 };
    const terms: Terms = { capital: 15, loading: 0.25, years: 30 };
    const bare = trial(heavy, terms, none, 1500, 9).ruinRate;
    const covered = trial(heavy, terms, { retention: 5, loading: 0.3 }, 1500, 9).ruinRate;
    expect(covered).toBeLessThan(bare);
  });
});

describe("The pieces under it", () => {
  it("prices a Pareto layer as the tail says", () => {
    const w: World = { ...classical, sizes: "pareto", alpha: 2 };
    const scale = paretoScale(1, 2);
    expect(scale).toBeCloseTo(0.5, 9);
    // above the retention the excess of a Pareto with index 2 has mean scale^2 / R
    expect(expectedCeded(w, 5)).toBeCloseTo((scale * scale) / 5, 9);
    expect(expectedCeded(classical, 3)).toBeCloseTo(Math.exp(-3), 9);
    expect(expectedCeded(classical, Infinity)).toBe(0);
  });

  it("makes fractional noise with the memory it was asked for", () => {
    const n = 4000;
    const corr = (h: number) => {
      const x = fractionalNoise(n, h, rng(11));
      let s = 0;
      for (let i = 1; i < n; i++) s += x[i] * x[i - 1];
      return s / (n - 1);
    };
    // lag-one correlation of fractional Gaussian noise is (2^(2H) - 2) / 2
    expect(Math.abs(corr(0.5) - 0)).toBeLessThan(0.05);
    expect(Math.abs(corr(0.8) - (Math.pow(2, 1.6) - 2) / 2)).toBeLessThan(0.06);
  });
});
