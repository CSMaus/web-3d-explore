import { RouterProvider, createMemoryHistory, createRouter } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { GROUPS, SYSTEMS } from "@/lib/probability";
import { pieceAt } from "@/content/uses";
import { quizOf } from "@/lib/quizzes";

async function siteAt(path: string) {
  const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: [path] }), defaultPendingMs: 0 });
  await router.load();
  return render(<RouterProvider router={router as never} />);
}

const verdict = { selector: '[data-slot="verdict"]' };

describe("The probability topic's pages", () => {
  it("every play page draws with the backend down, says what it waits for, and carries the run bar", async () => {
    for (const s of SYSTEMS) {
      const view = await siteAt(s.to);
      await waitFor(() => expect(screen.getByRole("button", { name: /^(Run( again)?|Pause)$/ })).toBeTruthy());
      expect(document.querySelectorAll("main canvas").length).toBeGreaterThan(0);
      expect(screen.getByRole("button", { name: "Reset" })).toBeTruthy();
      expect(document.querySelector('[data-slot="verdict"]')?.textContent?.length ?? 0).toBeGreaterThan(20);
      view.unmount();
    }
  });

  it("the test page counts 99 ill and 4,995 healthy positives, 1.94 per cent", async () => {
    await siteAt("/topics/probability/play/test");
    await waitFor(() => expect(screen.getByText(/Of these 100,000 people 100 are ill/, verdict)).toBeTruthy());
    for (let i = 0; i < 10; i += 1) screen.getByRole("button", { name: "Ten steps" }).click();
    await waitFor(() => expect(screen.getByText(/99 ill people tested positive, and so did 4,995 healthy ones. Of the 5,094 positives, 1.94 per cent are ill/, verdict)).toBeTruthy());
  });

  it("the birthdays page passes one half at 23 people, 50.7 per cent", async () => {
    await siteAt("/topics/probability/play/birthdays");
    await waitFor(() => expect(screen.getByRole("button", { name: "Ten steps" })).toBeTruthy());
    screen.getByRole("button", { name: "Ten steps" }).click();
    screen.getByRole("button", { name: "Ten steps" }).click();
    for (let i = 0; i < 3; i += 1) screen.getByRole("button", { name: "One step" }).click();
    await waitFor(() => expect(screen.getByText(/passes one half at 23 people: 50.7 per cent, with 253 pairs/, verdict)).toBeTruthy());
  });

  it("the game page expects -0.333 a round and the ruin page 0.500 for a fair coin from 10 to 20", async () => {
    const game = await siteAt("/topics/probability/play/game");
    await waitFor(() => expect(screen.getByText(/the expected gain is -0.333 a round, so -333 over 1000 rounds/, verdict)).toBeTruthy());
    game.unmount();
    await siteAt("/topics/probability/play/ruin");
    await waitFor(() => expect(screen.getByText(/the formula gives 0.500 for reaching 20, after 100.0 bets on average/, verdict)).toBeTruthy());
  });

  it("the Poisson page ends on e^-3 = 0.0498 and the bins page on e^-2", async () => {
    const view = await siteAt("/topics/probability/play/poisson");
    await waitFor(() => expect(screen.getByRole("button", { name: "Ten steps" })).toBeTruthy());
    screen.getByRole("button", { name: "Ten steps" }).click();
    screen.getByRole("button", { name: "Ten steps" }).click();
    await waitFor(() => expect(screen.getByText(/With the minute cut into 1000 slices, each holding a call with chance 0.0030, a minute has no call with chance 0.0496. The Poisson chance of no call is e\^-3 = 0.0498/, verdict)).toBeTruthy());
    view.unmount();
    await siteAt("/topics/probability/play/bins");
    await waitFor(() => expect(screen.getByText(/The area under the curve to the right of 20 minutes is 0.1353/, verdict)).toBeTruthy());
  });

  it("the topic has its groups, its sections, its test and its written application", async () => {
    await siteAt("/topics/probability/play");
    await waitFor(() => expect(screen.getByRole("heading", { name: "Twelve pages in six groups" })).toBeTruthy());
    expect(SYSTEMS.map((s) => s.id)).toEqual(["dice", "birthdays", "test", "doors", "game", "hats", "galton", "poisson", "bins", "memory", "walks", "ruin"]);
    for (const g of GROUPS) expect(SYSTEMS.filter((s) => s.group === g).length).toBeGreaterThanOrEqual(2);
    const quiz = quizOf("probability", "en");
    expect(quiz?.questions.length).toBe(10);
    for (const q of quiz!.questions) {
      expect(q.options.length).toBe(4);
      expect(q.options.filter((o) => o.correct).length).toBe(1);
    }
    expect(pieceAt("probability", "screening")?.sources.length).toBeGreaterThan(2);
  });
});
