import { useEffect, useState, type ComponentType } from "react";
import { Choices, Heading, Text } from "@kit/index";
import { useInView } from "@/lib/reveal";

/**
 * the steps of a project as one stage: a row of pill buttons, one per step, and the step shown
 * beside its own figure. while the stage is on screen the steps move on by themselves, one every
 * few seconds, a thin bar under the stage filling as the time passes; a click on a pill holds that
 * step and stops the moving on. only the step shown has its figure running. a reader who asked for
 * less motion gets no moving on.
 */
const DWELL = 9000;

export function Stage({ steps, figures }: { steps: { figure: string; title: string; text: string }[]; figures: Record<string, ComponentType> }) {
  const [at, setAt] = useState(0);
  const [held, setHeld] = useState(false);
  const [seen, setSeen] = useState(false);
  const host = useInView<HTMLDivElement>(setSeen, 0.35);
  const still = typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
  const moving = seen && !held && !still && steps.length > 1;

  useEffect(() => {
    if (!moving) return;
    const next = window.setTimeout(() => setAt((i) => (i + 1) % steps.length), DWELL);
    return () => window.clearTimeout(next);
  }, [moving, at, steps.length]);

  const step = steps[at];
  const Figure = figures[step.figure];
  return (
    <div ref={host}>
      <Choices
        className="flex-wrap"
        options={steps.map((s, i) => ({ id: String(i), label: `${String(i + 1).padStart(2, "0")} ${s.title}` }))}
        value={String(at)}
        onPick={(id) => {
          setAt(Number(id));
          setHeld(true);
        }}
      />
      <div className="mt-6 grid items-center gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10">
        <div key={`text-${at}`} className="min-w-0" style={{ animation: still ? undefined : "stage-in 420ms ease-out both" }}>
          <span data-text="label" className="tabular-nums">{String(at + 1).padStart(2, "0")}</span>
          <Heading level={3} className="mt-1">{step.title}</Heading>
          <Text kind="body" as="p" className="mt-2">{step.text}</Text>
        </div>
        <div key={`figure-${at}`} data-slot="plot" className="min-w-0 overflow-hidden" style={{ animation: still ? undefined : "stage-in 420ms ease-out both" }}>
          {Figure ? <Figure /> : null}
        </div>
      </div>
      {/* the time left on this step, as a bar that fills; only while the steps move on */}
      <div className="mt-4 h-px w-full overflow-hidden" style={{ background: "var(--c-border)" }} aria-hidden="true">
        {moving ? <div key={`bar-${at}`} className="h-full w-full origin-left" style={{ background: "var(--c-glow)", animation: `stage-fill ${DWELL}ms linear both` }} /> : null}
      </div>
    </div>
  );
}
