import { useCallback, useEffect, useRef, useState } from "react";

/**
 * a step function called on animation frames, so a page can show a thing
 * happening rather than a thing that has happened.
 *
 * the step count is state, so the page redraws; the work itself is done in a
 * ref so a fast run does not queue a render per step.
 */
export function useRunner(
  step: (n: number) => void,
  options: { perFrame?: number; stopAt?: number } = {},
) {
  const { perFrame = 1, stopAt } = options;
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(0);
  const work = useRef(step);
  const at = useRef(0);
  const rate = useRef(perFrame);
  // steps owed but not yet taken, so a rate below one step a frame still runs
  const owed = useRef(0);

  useEffect(() => {
    work.current = step;
    rate.current = perFrame;
  });

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    const loop = () => {
      owed.current += Math.max(0.001, rate.current);
      const many = Math.floor(owed.current);
      owed.current -= many;
      for (let i = 0; i < many; i++) {
        if (stopAt !== undefined && at.current >= stopAt) {
          setRunning(false);
          setCount(at.current);
          return;
        }
        at.current += 1;
        work.current(at.current);
      }
      setCount(at.current);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [running, stopAt]);

  const once = useCallback(
    (many = 1) => {
      for (let i = 0; i < many; i++) {
        at.current += 1;
        work.current(at.current);
      }
      setCount(at.current);
    },
    [],
  );

  const reset = useCallback(() => {
    setRunning(false);
    at.current = 0;
    owed.current = 0;
    setCount(0);
  }, []);

  return {
    running,
    count,
    play: () => setRunning(true),
    pause: () => setRunning(false),
    toggle: () => setRunning((v) => !v),
    once,
    reset,
  };
}
