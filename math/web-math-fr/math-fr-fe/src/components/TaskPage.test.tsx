import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TaskPage, ToLab } from "@/components/TaskPage";

const JOB = "How often do two dice add up to seven?";

function show(story?: ReactNode) {
  render(
    <TaskPage
      title="Two dice"
      job={JOB}
      story={story}
      input={<p>Number of throws</p>}
      run={<button type="button">Run</button>}
      picture={<canvas />}
      result={<p>Nothing thrown yet.</p>}
    />,
  );
}

const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement | null;
const follows = (first: Node, second: Node) =>
  Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("The task page", () => {
  it("has no experiment heading without a story, and names its question", () => {
    show();
    expect(document.getElementById("lab")).toBeNull();
    expect(slot("task-job")?.textContent).toBe(JOB);
    expect(slot("task-job")?.tagName).toBe("P");
    expect(screen.getByText("WHAT GOES IN")).toBeTruthy();
  });

  it("puts the story between the question and the experiment heading, above the panels", () => {
    show(<div data-testid="tale">A story of three steps.</div>);
    const job = slot("task-job") as HTMLElement;
    const tale = screen.getByTestId("tale");
    const lab = document.getElementById("lab") as HTMLElement;
    const panel = screen.getByText("WHAT GOES IN");
    expect(job.textContent).toBe(JOB);
    expect(lab.tagName).toBe("H2");
    expect(lab.textContent).toBe("The experiment");
    expect(follows(job, tale)).toBe(true);
    expect(follows(tale, lab)).toBe(true);
    expect(follows(lab, panel)).toBe(true);
  });

  it("keeps the experiment heading reachable by a script and out of the tab order", () => {
    show(<div>A story.</div>);
    expect(document.getElementById("lab")?.getAttribute("tabindex")).toBe("-1");
  });
});

describe("The button to the experiment", () => {
  const press = () => fireEvent.click(screen.getByRole("button", { name: "Go to the experiment" }));

  it("moves the focus to the experiment heading where the page cannot scroll", () => {
    show(<ToLab />);
    const lab = document.getElementById("lab") as HTMLElement;
    Object.defineProperty(lab, "scrollIntoView", { value: undefined, configurable: true });
    expect(() => press()).not.toThrow();
    expect(document.activeElement).toBe(lab);
  });

  it("scrolls the heading to the top smoothly, then moves the focus to it", () => {
    show(<ToLab />);
    const lab = document.getElementById("lab") as HTMLElement;
    const scroll = vi.fn();
    Object.defineProperty(lab, "scrollIntoView", { value: scroll, configurable: true });
    press();
    expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(document.activeElement).toBe(lab);
  });

  it("scrolls at once for a reader who asked for less motion", () => {
    vi.spyOn(window, "matchMedia").mockImplementation((query: string) => ({ matches: true, media: query }) as MediaQueryList);
    show(<ToLab />);
    const lab = document.getElementById("lab") as HTMLElement;
    const scroll = vi.fn();
    Object.defineProperty(lab, "scrollIntoView", { value: scroll, configurable: true });
    press();
    expect(scroll).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
  });

  it("does nothing on a page that has no experiment heading", () => {
    render(<ToLab />);
    expect(() => press()).not.toThrow();
  });
});
