import { useEffect, useRef } from "react";

type Props = {
  /** called with a device-pixel-scaled context and the size in css pixels */
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  className?: string;
};

/**
 * a canvas that fills its parent and redraws when the parent resizes or the
 * draw callback changes. the transform is set to the device pixel ratio so the
 * callback works in css pixels throughout.
 *
 * reconstructed from the built bundle after being overwritten. it is the canvas
 * host the topic 1 growth and point pages draw through.
 */
export function Frame({ draw, className }: Props) {
  const host = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef(draw);

  useEffect(() => {
    latest.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = host.current;
    if (!canvas) return;
    let queued = 0;

    const paint = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const ratio = Math.min(window.devicePixelRatio, 2);
      const w = Math.max(1, Math.floor(parent.clientWidth));
      const h = Math.max(1, Math.floor(parent.clientHeight));
      if (canvas.width !== w * ratio || canvas.height !== h * ratio) {
        canvas.width = w * ratio;
        canvas.height = h * ratio;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      latest.current(ctx, w, h);
    };

    const soon = () => {
      if (queued) cancelAnimationFrame(queued);
      queued = requestAnimationFrame(() => {
        queued = 0;
        paint();
      });
    };

    soon();
    const watch = new ResizeObserver(soon);
    if (canvas.parentElement) watch.observe(canvas.parentElement);
    return () => {
      if (queued) cancelAnimationFrame(queued);
      watch.disconnect();
    };
  }, [draw]);

  return <canvas ref={host} className={className} />;
}
