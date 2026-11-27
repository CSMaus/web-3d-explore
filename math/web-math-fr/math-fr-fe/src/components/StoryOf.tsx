import { useMemo, useRef, useState } from "react";
import type { JSX, ReactNode } from "react";
import { Plot } from "@/components/Plot";
import type { Pen } from "@/components/Plot";
import { Story } from "@/components/Story";
import { ToLab } from "@/components/TaskPage";
import { UNIT } from "@/lib/panes";
import { useStoryClock } from "@/lib/storyClock";
import { clampStep, easeFade, settled } from "@/lib/storyline";
import type { StoryStep } from "@/lib/storyline";
import { stagePoint } from "@/scenes/kit";

type Fades = Record<string, number>;
type Sets = Record<string, number | string>;

export type Scene<F extends Fades, S extends Sets, T extends string, A extends string, V, D> = {
  DEFAULTS: V;
  build: (values: V) => D;
  draw: (pen: Pen, data: D, fade: F, set: S, t: number) => void;
  topLine: (top: T, data: D, set: S) => string;
  applyAct: (set: S, values: V, act: A | null) => S;
  onStep: (values: V) => V;
};

export type At<F extends Fades, S extends Sets, T extends string, A extends string, V> = {
  step: StoryStep<F, S, T, A>;
  values: V;
  change: (next: V) => void;
  set: S;
};

type Props<F extends Fades, S extends Sets, T extends string, A extends string, V, D> = {
  steps: StoryStep<F, S, T, A>[];
  scene: Scene<F, S, T, A, V, D>;
  act: (act: A, values: V, change: (next: V) => void, data: D, set: S) => ReactNode;
  tune?: (step: StoryStep<F, S, T, A>, values: V, change: (next: V) => void, data: D, set: S) => ReactNode;
  top?: (step: StoryStep<F, S, T, A>, data: D, set: S) => ReactNode | undefined;
  aside?: (step: StoryStep<F, S, T, A>, data: D, set: S) => ReactNode;
  pointer?: {
    onDrag: (x: number, y: number, at: At<F, S, T, A, V>) => void;
    onRelease: (at: At<F, S, T, A, V>) => void;
  };
};

export function StoryOf<F extends Fades, S extends Sets, T extends string, A extends string, V, D>({
  steps,
  scene,
  act,
  tune,
  top,
  aside,
  pointer,
}: Props<F, S, T, A, V, D>): JSX.Element {
  const host = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<V>(scene.DEFAULTS);
  const [shown, setShown] = useState<F>(steps[0].fade);
  const [eased, setEased] = useState(0);
  const clock = useStoryClock(host);

  const current = steps[step];
  const data = useMemo(() => scene.build(values), [scene, values]);
  const set = useMemo(() => scene.applyAct(current.set, values, current.act), [scene, current, values]);

  // the shown fade is moved while rendering, once for each clock time, so a frame eases it one
  // share of the way; an effect would paint the frame first and then paint it again
  if (!settled(shown, current.fade)) {
    if (!clock.playing) {
      setShown(current.fade);
    } else if (eased !== clock.time) {
      setShown(easeFade(shown, current.fade, clock.dt));
      setEased(clock.time);
    }
  }

  const go = (n: number) => {
    const next = clampStep(n, steps.length);
    if (next === step) return;
    setStep(next);
    setValues((v) => scene.onStep(v));
  };

  const at: At<F, S, T, A, V> = { step: current, values, change: setValues, set };

  const drag = (x: number, y: number) => {
    const canvas = host.current?.querySelector("canvas");
    if (!canvas || !pointer) return;
    const rect = canvas.getBoundingClientRect();
    const [sx, sy] = stagePoint(x, y, rect.width, rect.height);
    pointer.onDrag(sx, sy, at);
  };

  const own = top?.(current, data, set);
  const line = own !== undefined ? own : current.top !== null ? scene.topLine(current.top, data, set) : null;

  return (
    <Story
      count={steps.length}
      step={step}
      onStep={go}
      say={current.say}
      top={line}
      picture={
        <Plot
          className="h-full w-full"
          box={UNIT}
          deps={[clock.time, shown, set, data]}
          draw={(pen) => scene.draw(pen, data, shown, set, clock.time)}
          onDrag={pointer ? drag : undefined}
          onRelease={pointer ? () => pointer.onRelease(at) : undefined}
        />
      }
      aside={aside?.(current, data, set)}
      tune={tune?.(current, values, setValues, data, set)}
      act={current.act !== null ? act(current.act, values, setValues, data, set) : null}
      end={<ToLab />}
      playing={clock.playing}
      onToggle={clock.toggle}
      hostRef={host}
      stepId={current.id}
    />
  );
}
