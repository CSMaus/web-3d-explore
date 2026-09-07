import { useEffect, useRef } from "react";

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export function Frame({ draw, className }: { draw: Draw; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const fn = useRef(draw);

  useEffect(() => {
    fn.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;

    const paint = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const px = Math.min(window.devicePixelRatio, 2);
      const w = Math.max(1, Math.floor(parent.clientWidth));
      const h = Math.max(1, Math.floor(parent.clientHeight));
      if (canvas.width !== w * px || canvas.height !== h * px) {
        canvas.width = w * px;
        canvas.height = h * px;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(px, 0, 0, px, 0, 0);
      fn.current(ctx, w, h);
    };

    const queue = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        raf = 0;
        paint();
      });
    };

    queue();
    const ro = new ResizeObserver(queue);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [draw]);

  return <canvas ref={ref} className={className} />;
}
