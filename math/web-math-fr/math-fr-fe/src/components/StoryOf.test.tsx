import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StoryOf } from "@/components/StoryOf";
import type { At, Scene } from "@/components/StoryOf";
import type { StoryStep } from "@/lib/storyline";

type Fade = { first: number; second: number };
type Set = { dots: number };
type Top = "count";
type Act = "more";
type Values = { extra: number };
type Data = { total: number };
type Step = StoryStep<Fade, Set, Top, Act>;
type Stub = Scene<Fade, Set, Top, Act, Values, Data>;
type Where = At<Fade, Set, Top, Act, Values>;

const STEPS: Step[] = [
  { id: "one", say: "One dot stands.", fade: { first: 1, second: 0 }, set: { dots: 1 }, top: "count", act: null },
  { id: "two", say: "A second dot joins it.", fade: { first: 1, second: 1 }, set: { dots: 2 }, top: null, act: "more" },
  { id: "three", say: "Both dots stay.", fade: { first: 0.5, second: 1 }, set: { dots: 3 }, top: "count", act: null },
];

const WIDTH = 800;
const HEIGHT = 450;
const LANDING = 5000;

type Given = {
  top?: (step: Step, data: Data, set: Set) => ReactNode | undefined;
  pointer?: { onDrag: (x: number, y: number, at: Where) => void; onRelease: (at: Where) => void };
};

function show({ top, pointer }: Given = {}) {
  const build = vi.fn<Stub["build"]>((values) => ({ total: values.extra }));
  const draw = vi.fn<Stub["draw"]>();
  const onStep = vi.fn<Stub["onStep"]>((values) => ({ ...values, extra: 0 }));
  const scene: Stub = {
    DEFAULTS: { extra: 0 },
    build,
    draw,
    topLine: (_top, data, set) => `Dots: ${set.dots}, added: ${data.total}`,
    applyAct: (set, values) => ({ dots: set.dots * 10 + values.extra }),
    onStep,
  };
  render(
    <StoryOf
      steps={STEPS}
      scene={scene}
      act={(_act, values, change) => (
        <button type="button" onClick={() => change({ ...values, extra: values.extra + 1 })}>
          Add a dot
        </button>
      )}
      top={top}
      pointer={pointer}
    />,
  );
  const story = document.querySelector('[data-slot="story"]') as HTMLElement;
  const slot = (name: string) => story.querySelector(`[data-slot="${name}"]`) as HTMLElement;
  return { story, slot, build, draw, onStep };
}

const button = (name: string) => screen.getByRole("button", { name });
const next = () => fireEvent.click(button("Next step"));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("The story of a scene", () => {
  it("opens on the first step with its sentence and the scene's line above the picture", () => {
    const { slot } = show();
    expect(slot("story-say").textContent).toBe("One dot stands.");
    expect(slot("story-top").textContent).toBe("Dots: 10, added: 0");
    expect(slot("story-count").textContent).toBe("Step 1 of 3");
  });

  it("shows the action of a step that has one, and nothing on a step without", () => {
    const { slot } = show();
    expect(slot("story-act").childNodes.length).toBe(0);
    next();
    expect(slot("story-say").textContent).toBe("A second dot joins it.");
    expect(slot("story-act").textContent).toBe("Add a dot");
    expect(slot("story-top").textContent).toBe("");
    next();
    expect(slot("story-act").childNodes.length).toBe(0);
  });

  it("builds the data again when the action changes the reader's values", () => {
    const { build, draw } = show();
    next();
    const before = build.mock.calls.length;
    fireEvent.click(button("Add a dot"));
    expect(build.mock.calls.length).toBe(before + 1);
    expect(build).toHaveBeenLastCalledWith({ extra: 1 });
    expect(draw.mock.lastCall?.[1]).toEqual({ total: 1 });
    expect(draw.mock.lastCall?.[3]).toEqual({ dots: 21 });
  });

  it("tells the scene once about each change of step, and not about a step that stays", () => {
    const { onStep, story } = show();
    fireEvent.keyDown(button("Next step"), { key: "ArrowLeft" });
    expect(onStep).not.toHaveBeenCalled();
    next();
    expect(onStep).toHaveBeenCalledTimes(1);
    fireEvent.click(button("Add a dot"));
    next();
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(onStep).toHaveBeenLastCalledWith({ extra: 1 });
    expect(story.querySelector('[data-slot="story-top"]')?.textContent).toBe("Dots: 30, added: 0");
    fireEvent.keyDown(button("Back"), { key: "ArrowRight" });
    expect(onStep).toHaveBeenCalledTimes(2);
  });

  it("draws the scene once mounted, with the set that went through the scene", () => {
    const { draw } = show();
    expect(draw.mock.calls.length).toBeGreaterThan(0);
    expect(draw.mock.lastCall?.[1]).toEqual({ total: 0 });
    expect(draw.mock.lastCall?.[2]).toEqual({ first: 1, second: 0 });
    expect(draw.mock.lastCall?.[3]).toEqual({ dots: 10 });
  });

  it("eases the picture to the values of the new step", async () => {
    const { draw } = show();
    next();
    await waitFor(() => expect(draw.mock.lastCall?.[2]).toEqual({ first: 1, second: 1 }), { timeout: LANDING });
    const partly = draw.mock.calls.some(([, , fade]) => fade.second > 0 && fade.second < 1);
    expect(partly).toBe(true);
  });

  it("puts the picture at the values of the new step at once while it stands", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const { draw } = show();
    expect(button("Move the picture")).toBeTruthy();
    next();
    expect(draw.mock.lastCall?.[2]).toEqual({ first: 1, second: 1 });
  });

  it("tells the scene whether the picture moves or stands", () => {
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: true } as MediaQueryList);
    const { draw } = show();
    expect(draw.mock.lastCall?.[5]).toBe(false);
    fireEvent.click(button("Move the picture"));
    expect(draw.mock.lastCall?.[5]).toBe(true);
  });

  it("keeps the scene's line when the page's own line is undefined, and takes the page's otherwise", () => {
    const top = vi.fn((step: Step) => (step.id === "three" ? "Three dots" : undefined));
    const { slot } = show({ top });
    expect(top).toHaveBeenCalled();
    expect(slot("story-top").textContent).toBe("Dots: 10, added: 0");
    next();
    next();
    expect(slot("story-top").textContent).toBe("Three dots");
  });

  it("ends with the way to the experiment", () => {
    show();
    next();
    next();
    expect(button("Go to the experiment")).toBeTruthy();
    fireEvent.click(button("Start the story again"));
    expect(screen.getByText("Step 1 of 3")).toBeTruthy();
  });

  it("hands the pointer to the page in the units of the stage", () => {
    const proto = HTMLCanvasElement.prototype;
    const capture = proto.setPointerCapture;
    proto.setPointerCapture = () => {};
    vi.spyOn(proto, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 0,
      right: WIDTH,
      bottom: HEIGHT,
      x: 0,
      y: 0,
      width: WIDTH,
      height: HEIGHT,
      toJSON: () => ({}),
    });
    const onDrag = vi.fn<(x: number, y: number, at: Where) => void>();
    const onRelease = vi.fn<(at: Where) => void>();
    const { story } = show({ pointer: { onDrag, onRelease } });
    next();
    const canvas = story.querySelector("canvas") as HTMLCanvasElement;
    fireEvent.pointerDown(canvas, { clientX: WIDTH / 2, clientY: HEIGHT / 2, pointerId: 1 });
    expect(onDrag).toHaveBeenCalledTimes(1);
    const [x, y, at] = onDrag.mock.calls[0];
    expect(Math.abs(x - 50)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(y - 37.5)).toBeLessThanOrEqual(0.5);
    expect(at.step.id).toBe("two");
    expect(at.values).toEqual({ extra: 0 });
    expect(at.set).toEqual({ dots: 20 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(onRelease.mock.calls[0][0].step.id).toBe("two");
    proto.setPointerCapture = capture;
  });

  it("gives each pointer event the values the event before it left, with no picture drawn between", () => {
    const proto = HTMLCanvasElement.prototype;
    const capture = proto.setPointerCapture;
    proto.setPointerCapture = () => {};
    const seen: number[] = [];
    const onDrag = (_x: number, _y: number, at: Where) => {
      seen.push(at.values.extra);
      at.change({ ...at.values, extra: at.values.extra + 1 });
    };
    const onRelease = (at: Where) => seen.push(at.values.extra);
    const { story, build } = show({ pointer: { onDrag, onRelease } });
    next();
    const canvas = story.querySelector("canvas") as HTMLCanvasElement;
    act(() => {
      fireEvent.pointerDown(canvas, { pointerId: 1, buttons: 1 });
      fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1 });
      fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1 });
      fireEvent.pointerUp(canvas, { pointerId: 1 });
    });
    expect(seen).toEqual([0, 1, 2, 3]);
    expect(build).toHaveBeenLastCalledWith({ extra: 3 });
    fireEvent.click(button("Add a dot"));
    expect(build).toHaveBeenLastCalledWith({ extra: 4 });
    next();
    expect(build).toHaveBeenLastCalledWith({ extra: 0 });
    proto.setPointerCapture = capture;
  });

  it("marks the story with the id of the step it is on", () => {
    const { story } = show();
    expect(story.getAttribute("data-step")).toBe("one");
    next();
    expect(story.getAttribute("data-step")).toBe("two");
  });
});
