import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Story } from "@/components/Story";

type Given = {
  step?: number;
  playing?: boolean;
  tune?: ReactNode;
  act?: ReactNode;
  aside?: ReactNode;
  stepId?: string;
};

function show({ step = 0, playing = true, tune, act, aside, stepId }: Given = {}) {
  const onStep = vi.fn();
  const onToggle = vi.fn();
  render(
    <Story
      count={3}
      step={step}
      onStep={onStep}
      say="One arrow turns."
      top="Arrows: 1"
      picture={<canvas />}
      aside={aside}
      tune={tune}
      act={act}
      end={<button type="button">Go to the experiment</button>}
      playing={playing}
      onToggle={onToggle}
      stepId={stepId}
    />,
  );
  const story = document.querySelector('[data-slot="story"]') as HTMLElement;
  const slot = (name: string) => story.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;
  return { story, slot, onStep, onToggle };
}

const button = (name: string) => screen.getByRole("button", { name });

describe("The story", () => {
  it("has its six slots, its name and a sentence that is read out when it changes", () => {
    const { story, slot } = show();
    expect(story.tagName).toBe("SECTION");
    for (const name of ["story-top", "story-picture", "story-say", "story-act", "story-nav"]) {
      expect(slot(name), name).toBeTruthy();
    }
    expect(story.getAttribute("aria-label")).toBe("The story of this page");
    expect(slot("story-say")?.getAttribute("aria-live")).toBe("polite");
    expect(slot("story-say")?.textContent).toBe("One arrow turns.");
    expect(slot("story-top")?.textContent).toBe("Arrows: 1");
  });

  it("stands in a panel, with the picture in a plot frame", () => {
    const { story, slot } = show();
    expect(story.closest('[data-slot="panel"]')).toBeTruthy();
    expect(slot("story-picture")?.querySelector('[data-slot="plot"] canvas')).toBeTruthy();
  });

  it("cannot go back from the first step, and goes on to the second", () => {
    const { onStep } = show();
    expect(button("Back")).toHaveProperty("disabled", true);
    fireEvent.click(button("Next step"));
    expect(onStep).toHaveBeenCalledTimes(1);
    expect(onStep).toHaveBeenCalledWith(1);
  });

  it("goes back from a later step", () => {
    const { onStep } = show({ step: 1 });
    expect(button("Back")).toHaveProperty("disabled", false);
    fireEvent.click(button("Back"));
    expect(onStep).toHaveBeenCalledWith(0);
  });

  it("ends with a way to start again and what the last step offers", () => {
    const { onStep } = show({ step: 2 });
    expect(screen.queryByRole("button", { name: "Next step" })).toBeNull();
    expect(button("Go to the experiment")).toBeTruthy();
    fireEvent.click(button("Start the story again"));
    expect(onStep).toHaveBeenCalledWith(0);
  });

  it("offers neither of those before the last step", () => {
    show({ step: 1 });
    expect(screen.queryByRole("button", { name: "Start the story again" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Go to the experiment" })).toBeNull();
  });

  it("counts the steps from one", () => {
    const { slot } = show({ step: 1 });
    expect(slot("story-count")?.textContent).toBe("Step 2 of 3");
  });

  it("steps with the arrow keys from a button inside it", () => {
    const { onStep } = show({ step: 1 });
    const right = fireEvent.keyDown(button("Back"), { key: "ArrowRight" });
    expect(onStep).toHaveBeenLastCalledWith(2);
    const left = fireEvent.keyDown(button("Back"), { key: "ArrowLeft" });
    expect(onStep).toHaveBeenLastCalledWith(0);
    expect(onStep).toHaveBeenCalledTimes(2);
    // fireEvent returns false when the default action was prevented
    expect(right).toBe(false);
    expect(left).toBe(false);
  });

  it("stays inside its steps at both ends", () => {
    const first = show({ step: 0 });
    fireEvent.keyDown(button("Next step"), { key: "ArrowLeft" });
    expect(first.onStep).toHaveBeenLastCalledWith(0);
  });

  it("stays on the last step when the right arrow is pressed there", () => {
    const { onStep } = show({ step: 2 });
    fireEvent.keyDown(button("Back"), { key: "ArrowRight" });
    expect(onStep).toHaveBeenLastCalledWith(2);
  });

  it("leaves the arrow keys to a field of the step's action", () => {
    const { onStep, slot } = show({
      act: (
        <>
          <input aria-label="Arrows" />
          <div role="slider" aria-label="Speed" aria-valuenow={1} tabIndex={0} />
        </>
      ),
    });
    const act = slot("story-act") as HTMLElement;
    fireEvent.keyDown(act.querySelector("input") as Element, { key: "ArrowRight" });
    fireEvent.keyDown(act.querySelector("input") as Element, { key: "ArrowLeft" });
    fireEvent.keyDown(act.querySelector('[role="slider"]') as Element, { key: "ArrowRight" });
    expect(onStep).not.toHaveBeenCalled();
  });

  it("ignores every other key", () => {
    const { onStep } = show({ step: 1 });
    fireEvent.keyDown(button("Back"), { key: "Enter" });
    fireEvent.keyDown(button("Back"), { key: "ArrowUp" });
    expect(onStep).not.toHaveBeenCalled();
  });

  it("has no place for a setting when none is given, and an empty place for the action", () => {
    const { slot } = show();
    expect(slot("story-tune")).toBeNull();
    expect(slot("story-act")).toBeTruthy();
    expect(slot("story-act")?.childNodes.length).toBe(0);
    expect(slot("story-aside")).toBeNull();
  });

  it("shows the setting, the action and the aside when they are given", () => {
    const { slot } = show({
      tune: <span>Arrows in use</span>,
      act: <button type="button">Add an arrow</button>,
      aside: <span>Five arrows</span>,
    });
    expect(slot("story-tune")?.textContent).toBe("Arrows in use");
    expect(slot("story-act")?.textContent).toBe("Add an arrow");
    const aside = slot("story-aside");
    expect(aside?.textContent).toBe("Five arrows");
    expect(aside?.parentElement).toBe(slot("story-picture"));
    expect(aside?.querySelector('[data-slot="panel"]')).toBeTruthy();
  });

  it("names the pause button for what a press does", () => {
    const moving = show({ playing: true });
    expect(screen.queryByRole("button", { name: "Move the picture" })).toBeNull();
    fireEvent.click(button("Stop the picture"));
    expect(moving.onToggle).toHaveBeenCalledTimes(1);
  });

  it("offers to move the picture when it stands", () => {
    const still = show({ playing: false });
    expect(screen.queryByRole("button", { name: "Stop the picture" })).toBeNull();
    fireEvent.click(button("Move the picture"));
    expect(still.onToggle).toHaveBeenCalledTimes(1);
  });

  it("carries the id of its step when one is given, and no such mark otherwise", () => {
    const named = show({ stepId: "one-arrow" });
    expect(named.story.getAttribute("data-step")).toBe("one-arrow");
    cleanup();
    const plain = show();
    expect(plain.story.hasAttribute("data-step")).toBe(false);
  });
});
