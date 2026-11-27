import type { JSX, KeyboardEvent, ReactNode, Ref } from "react";
import { Button, Panel, Text } from "@kit/index";
import { L } from "@/lib/lang";

type Props = {
  count: number;
  step: number;
  onStep: (n: number) => void;
  say: string;
  top?: ReactNode;
  picture: ReactNode;
  aside?: ReactNode;
  tune?: ReactNode;
  act?: ReactNode;
  end: ReactNode;
  playing: boolean;
  onToggle: () => void;
  hostRef?: Ref<HTMLElement>;
  stepId?: string;
};

/** the elements that use the arrow keys themselves, so the story leaves the keys to them */
const FIELDS = 'input, textarea, select, [role="slider"]';

/**
 * a story read one step at a time: a line above the picture, the picture, the sentence of the
 * step, the one action of the step, and the buttons that move between steps. the slots keep
 * their heights from step to step, so the buttons stay where they are.
 */
export function Story({
  count,
  step,
  onStep,
  say,
  top,
  picture,
  aside,
  tune,
  act,
  end,
  playing,
  onToggle,
  hostRef,
  stepId,
}: Props): JSX.Element {
  const last = step >= count - 1;

  const onKeys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    if (event.target instanceof Element && event.target.matches(FIELDS)) return;
    event.preventDefault();
    onStep(event.key === "ArrowRight" ? Math.min(step + 1, count - 1) : Math.max(step - 1, 0));
  };

  return (
    <Panel>
      <section
        data-slot="story"
        data-step={stepId}
        aria-label={L("The story of this page")}
        ref={hostRef}
        onKeyDown={onKeys}
      >
        <Text kind="caption" as="div" data-slot="story-top" className="min-h-[1.75rem]">
          {top}
        </Text>
        <div data-slot="story-picture" className="relative mt-2 h-[min(460px,calc(100vh-18rem))] min-h-[260px]">
          <div data-slot="plot" className="h-full overflow-hidden">
            {picture}
          </div>
          {aside ? (
            <div data-slot="story-aside" className="absolute top-2 right-2">
              <Panel>{aside}</Panel>
            </div>
          ) : null}
        </div>
        <Text kind="intro" as="p" data-slot="story-say" aria-live="polite" className="mt-3 min-h-[3.4em]">
          {say}
        </Text>
        {tune ? (
          <div data-slot="story-tune" className="mt-2">
            {tune}
          </div>
        ) : null}
        <div data-slot="story-act" className="mt-2 min-h-[2.75rem]">
          {act}
        </div>
        <div data-slot="story-nav" className="mt-2 flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => onStep(step - 1)} disabled={step === 0}>
            {L("Back")}
          </Button>
          <Button variant="outline" onClick={onToggle}>
            {playing ? L("Stop the picture") : L("Move the picture")}
          </Button>
          {last ? (
            <>
              <Button variant="outline" onClick={() => onStep(0)}>
                {L("Start the story again")}
              </Button>
              {end}
            </>
          ) : (
            <Button onClick={() => onStep(step + 1)}>{L("Next step")}</Button>
          )}
          <Text kind="note" as="span" data-slot="story-count">
            {L("Step {{n}} of {{m}}", { n: step + 1, m: count })}
          </Text>
        </div>
      </section>
    </Panel>
  );
}
