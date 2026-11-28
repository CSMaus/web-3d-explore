import { describe, expect, it } from "vitest";
import { DEFAULTS, deal, decide } from "@/scenes/probability/doors";

describe("The reader's game in the doors story", () => {
  it("counts a choice once and leaves a decided game as it is", () => {
    const stayed = decide(DEFAULTS, "stay");
    expect(stayed.stay).toBe(1);
    expect(stayed.swap).toBe(0);
    expect(stayed.stayWon).toBe(DEFAULTS.first === DEFAULTS.car ? 1 : 0);
    expect(decide(stayed, "switch")).toBe(stayed);
    expect(decide(stayed, "stay")).toBe(stayed);

    const swapped = decide(DEFAULTS, "switch");
    expect(swapped.swap).toBe(1);
    expect(swapped.stay).toBe(0);
    expect(swapped.swapWon).toBe(DEFAULTS.left === DEFAULTS.car ? 1 : 0);
    expect(swapped.choice).toBe("switch");
  });

  it("deals a different game for a different deal", () => {
    const seen = new Set<string>();
    let game = DEFAULTS;
    for (let i = 0; i < 30; i += 1) {
      seen.add(`${game.car} ${game.first} ${game.left}`);
      const next = deal(game);
      expect(next.deal).toBe(game.deal + 1);
      expect(next.choice).toBe("none");
      game = next;
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it("wins about two games in three by switching", () => {
    let game = DEFAULTS;
    for (let i = 0; i < 300; i += 1) game = deal(decide(game, "switch"));
    expect(game.swap).toBe(300);
    expect(game.swapWon / game.swap).toBeGreaterThan(0.58);
    expect(game.swapWon / game.swap).toBeLessThan(0.75);
  });
});
