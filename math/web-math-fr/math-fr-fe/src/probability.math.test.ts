import { describe, expect, it } from "vitest";
import {
  BINS,
  TRIALS,
  arcsine,
  bayes,
  beyond,
  binomial,
  counted,
  distance,
  doorsGame,
  dropBall,
  evenAt,
  expectedBets,
  expectedGain,
  gainSpread,
  choose,
  histogram,
  matchChance,
  matches,
  mean,
  playRuin,
  poisson,
  population,
  reachChance,
  remaining,
  rngFrom,
  round,
  roomShares,
  samples,
  shareAbove,
  shared,
  shuffleHats,
  spread,
  startWalks,
  stepWalks,
  sumWays,
  throwTwo,
} from "@/systems/probability";

const SCREEN = { people: 100000, prevalence: 0.001, sensitivity: 0.99, falsePositive: 0.05 };

describe("The probability topic's mathematics", () => {
  it("Two dice: 7 has six of the 36 pairs, 2 and 12 one each, and 1000 throws come close", () => {
    expect(sumWays(7)).toBe(6);
    expect(sumWays(2)).toBe(1);
    expect(sumWays(12)).toBe(1);
    expect([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].reduce((s, k) => s + sumWays(k), 0)).toBe(36);
    expect((6 / 36).toFixed(4)).toBe("0.1667");
    const rng = rngFrom(1);
    let sevens = 0;
    for (let i = 0; i < 1000; i += 1) {
      const [a, b] = throwTwo(rng);
      if (a + b === 7) sevens += 1;
    }
    expect(Math.abs(sevens / 1000 - 1 / 6)).toBeLessThan(0.03);
  });

  it("Birthdays: 23 people give 50.7 per cent, the first group past an even chance", () => {
    expect(evenAt()).toBe(23);
    expect((shared(23) * 100).toFixed(1)).toBe("50.7");
    expect((shared(22) * 100).toFixed(1)).toBe("47.6");
    expect((shared(50) * 100).toFixed(1)).toBe("97.0");
    expect((shared(70) * 100).toFixed(1)).toBe("99.9");
    const rng = rngFrom(7);
    let yes = 0;
    for (let i = 0; i < 2000; i += 1) if (roomShares(23, rng)) yes += 1;
    expect(Math.abs(yes / 2000 - shared(23))).toBeLessThan(0.04);
  });

  it("A test of 99 and 5 per cent in 100,000 people with 1 in 1000 ill: 99 ill positives, 4,995 healthy ones, 1.94 per cent", () => {
    const c = counted(SCREEN);
    expect(c.ill).toBe(100);
    expect(c.illPositive).toBe(99);
    expect(c.healthyPositive).toBe(4995);
    expect(c.positive).toBe(5094);
    expect((c.share * 100).toFixed(2)).toBe("1.94");
    expect((bayes(SCREEN) * 100).toFixed(2)).toBe("1.94");
    const kinds = population(SCREEN, 3);
    expect(kinds.filter((k) => k === 3).length).toBe(99);
    expect(kinds.filter((k) => k === 1).length).toBe(4995);
    // a prevalence of 1 in 100 raises it to 16.7 per cent
    expect((bayes({ ...SCREEN, prevalence: 0.01 }) * 100).toFixed(1)).toBe("16.7");
  });

  it("The screening piece: 9 of 98 positives, 7 in 100 recalls with a cancer, 6.5 per cent a mammogram", () => {
    const c = counted({ people: 1000, prevalence: 0.01, sensitivity: 0.9, falsePositive: 0.09 });
    expect([c.ill, c.illPositive, c.healthy, c.healthyPositive, c.positive]).toEqual([10, 9, 990, 89, 98]);
    expect((c.share * 100).toFixed(1)).toBe("9.2");
    expect((c.healthyPositive / c.illPositive).toFixed(1)).toBe("9.9");
    expect(Math.round(1000 * 0.083)).toBe(83);
    expect(Math.round((5.8 / 83) * 100)).toBe(7);
    expect(((1 - 0.509 ** 0.1) * 100).toFixed(1)).toBe("6.5");
  });

  it("The test's numbers: 5/36, 0.706 at 30 people, 16.7 per cent, -300, 137, 20/64, 0.135, 0.368, 0.450", () => {
    expect((5 / 36).toFixed(3)).toBe("0.139");
    expect((3 / 21).toFixed(3)).toBe("0.143");
    expect(shared(30).toFixed(3)).toBe("0.706");
    expect((1 - shared(30)).toFixed(3)).toBe("0.294");
    expect(choose(30, 2)).toBe(435);
    expect((bayes({ ...SCREEN, prevalence: 0.01 }) * 100).toFixed(1)).toBe("16.7");
    expect(expectedGain(15, 3) * 600).toBe(-300);
    expect((15 * Math.sqrt((1 / 6) * (5 / 6)) * Math.sqrt(600)).toFixed(0)).toBe("137");
    expect(choose(6, 3)).toBe(20);
    expect(binomial(6, 3, 0.5)).toBe(0.3125);
    expect(poisson(0, 2).toFixed(3)).toBe("0.135");
    expect(beyond("exponential", 5, 5).toFixed(3)).toBe("0.368");
    expect(reachChance(5, 10, 0.49).toFixed(3)).toBe("0.450");
    expect(expectedBets(5, 10, 0.49).toFixed(0)).toBe("25");
  });

  it("The doors: staying wins a third, switching two thirds; with 100 doors 1 and 99 in 100", () => {
    const rng = rngFrom(11);
    let stay = 0;
    let swap = 0;
    for (let i = 0; i < 3000; i += 1) {
      const g = doorsGame(3, rng);
      expect(g.left).not.toBe(g.first);
      if (g.stayWins) stay += 1;
      if (g.switchWins) swap += 1;
    }
    expect(stay + swap).toBe(3000);
    expect(Math.abs(stay / 3000 - 1 / 3)).toBeLessThan(0.03);
    let hundred = 0;
    for (let i = 0; i < 1000; i += 1) if (doorsGame(100, rng).switchWins) hundred += 1;
    expect(hundred).toBeGreaterThan(970);
  });

  it("The game: pay 2, win 10 on a six, -1/3 a round, about -333 after 1000", () => {
    expect(expectedGain().toFixed(3)).toBe("-0.333");
    expect(expectedGain(12)).toBeCloseTo(0, 12);
    expect(gainSpread().toFixed(2)).toBe("3.73");
    expect((gainSpread() * Math.sqrt(1000)).toFixed(0)).toBe("118");
    expect(choose(23, 2)).toBe(253);
    const rng = rngFrom(5);
    let total = 0;
    for (let i = 0; i < 1000; i += 1) total += round(rng).gain;
    expect(Math.abs(total / 1000 + 1 / 3)).toBeLessThan(0.35);
  });

  it("Hats: one match on average for any number of hats, and no match a third of the time for 3 and 0.368 for many", () => {
    for (const n of [3, 10, 50]) {
      let s = 0;
      for (let k = 0; k <= n; k += 1) s += k * matchChance(n, k);
      expect(s).toBeCloseTo(1, 9);
    }
    expect(matchChance(3, 0)).toBeCloseTo(1 / 3, 12);
    expect(matchChance(3, 2)).toBe(0);
    expect(matchChance(10, 0).toFixed(3)).toBe("0.368");
    const rng = rngFrom(2);
    let total = 0;
    for (let i = 0; i < 2000; i += 1) total += matches(shuffleHats(20, rng));
    expect(Math.abs(total / 2000 - 1)).toBeLessThan(0.08);
  });

  it("The Galton board: ten rows at p = 1/2 put 252 balls in 1024 in the middle bin", () => {
    expect(binomial(10, 5, 0.5) * 1024).toBeCloseTo(252, 9);
    expect((binomial(10, 5, 0.5) * 100).toFixed(1)).toBe("24.6");
    const rng = rngFrom(4);
    const bins = new Array(11).fill(0);
    for (let i = 0; i < 4000; i += 1) bins[dropBall(10, 0.5, rng).bin] += 1;
    expect(Math.abs(bins[5] / 4000 - 0.246)).toBeLessThan(0.03);
  });

  it("Binomial to Poisson with 3 on average: no success at all goes from 0.028 at 10 trials to e^-3 = 0.0498", () => {
    expect(Math.exp(-3).toFixed(4)).toBe("0.0498");
    expect(poisson(0, 3)).toBeCloseTo(Math.exp(-3), 12);
    expect(binomial(10, 0, 0.3).toFixed(4)).toBe("0.0282");
    expect(binomial(100, 0, 0.03).toFixed(4)).toBe("0.0476");
    expect(binomial(1000, 0, 0.003).toFixed(4)).toBe("0.0496");
    expect(poisson(2, 3).toFixed(3)).toBe("0.224");
    const gap = (n: number) => distance(Array.from({ length: n + 1 }, (_, k) => binomial(n, k, 3 / n)), Array.from({ length: 40 }, (_, k) => poisson(k, 3)));
    expect(gap(10)).toBeGreaterThan(gap(100));
    expect(gap(1000)).toBeLessThan(0.003);
    expect(TRIALS[TRIALS.length - 1]).toBe(1000);
  });

  it("Densities: 10,000 waits averaging 10 minutes leave about 0.135 above 20, as e^-2 says", () => {
    expect(Math.exp(-2).toFixed(3)).toBe("0.135");
    expect(beyond("exponential", 20)).toBeCloseTo(Math.exp(-2), 12);
    expect(beyond("uniform", 20)).toBe(0);
    const v = samples("exponential", 10000, 1);
    expect(Math.abs(shareAbove(v, 20) - 0.1353)).toBeLessThan(0.01);
    expect(Math.abs(mean(v) - 10)).toBeLessThan(0.3);
    const h = histogram(v, 0, 60, BINS[BINS.length - 1]);
    expect(h.reduce((s, c) => s + c, 0)).toBeGreaterThan(9950);
  });

  it("Memoryless: after 10 minutes waited the wait ahead still averages 10, and a timetable leaves 5", () => {
    const v = samples("exponential", 10000, 1);
    const ahead = remaining(v, 10);
    expect(Math.abs(mean(ahead) - 10)).toBeLessThan(0.6);
    expect(Math.abs(ahead.length / 10000 - Math.exp(-1))).toBeLessThan(0.015);
    const u = remaining(samples("uniform", 10000, 1), 10);
    expect(Math.abs(mean(u) - 5)).toBeLessThan(0.2);
  });

  it("Walks: the spread after n steps is close to sqrt(n), and time above zero piles up at the ends", () => {
    const w = startWalks(2000, 9);
    for (let i = 0; i < 400; i += 1) stepWalks(w);
    expect(Math.abs(spread(w.at) - 20)).toBeLessThan(1.5);
    const frac = Array.from(w.positive, (p) => p / 400);
    const ends = frac.filter((f) => f < 0.1 || f > 0.9).length / frac.length;
    const middle = frac.filter((f) => f >= 0.4 && f <= 0.6).length / frac.length;
    expect(ends).toBeGreaterThan(middle * 2);
    expect((2 * arcsine(0.1)).toFixed(2)).toBe("0.41");
    expect((arcsine(0.6) - arcsine(0.4)).toFixed(3)).toBe("0.128");
  });

  it("Ruin: from 10 to 20 a fair coin reaches 20 half the time in 100 bets on average; at 49 per cent 0.40", () => {
    expect(reachChance(10, 20, 0.5)).toBe(0.5);
    expect(expectedBets(10, 20, 0.5)).toBe(100);
    expect(reachChance(10, 20, 0.49).toFixed(2)).toBe("0.40");
    expect(reachChance(10, 20, 0.49).toFixed(3)).toBe("0.401");
    expect(expectedBets(10, 20, 0.49).toFixed(1)).toBe("98.7");
    expect(reachChance(100, 200, 0.49).toFixed(3)).toBe("0.018");
    const rng = rngFrom(8);
    let won = 0;
    let bets = 0;
    for (let i = 0; i < 2000; i += 1) {
      const g = playRuin(10, 20, 0.5, rng);
      if (g.won) won += 1;
      bets += g.bets;
    }
    expect(Math.abs(won / 2000 - 0.5)).toBeLessThan(0.04);
    expect(Math.abs(bets / 2000 - 100)).toBeLessThan(8);
  });
});
