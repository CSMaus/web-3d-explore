import { useEffect, useRef } from "react";

export type Box = { x0: number; x1: number; y0: number; y1: number };
/** what a page draws with: world coordinates in, device pixels out. */
export type Pen = {
  ctx: CanvasRenderingContext2D;
  box: Box;
  width: number;
  height: number;
  /** world to pixel */
  px: (x: number) => number;
  py: (y: number) => number;
  /** pixel to world, for clicks */
  wx: (px: number) => number;
  wy: (py: number) => number;
  line: (pts: [number, number][], colour: string, weight?: number) => void;
  dot: (x: number, y: number, r: number, colour: string) => void;
  ring: (x: number, y: number, r: number, colour: string, weight?: number) => void;
  arrow: (x: number, y: number, dx: number, dy: number, colour: string) => void;
  axes: (colour: string, ticks?: number) => void;
  text: (s: string, x: number, y: number, colour: string, align?: CanvasTextAlign) => void;
};

type Props = {
  box: Box;
  /**
   * keep one world unit the same length on both axes. a phase portrait needs
   * this: the undamped oscillator's orbits are circles, and a canvas wider than
   * it is tall will otherwise draw them as ellipses, which is the picture
   * telling a lie about the geometry. a plot of a value against time does not
   * need it, so it is off by default.
   */
  equal?: boolean;
  draw: (pen: Pen) => void;
  className?: string;
  onPick?: (x: number, y: number) => void;
  onDrag?: (x: number, y: number) => void;
  /** the pointer let go, for a page that holds on to what was grabbed */
  onRelease?: () => void;
  /** the wheel turned over the plot, at a world point: for zooming. the page's scroll is held */
  onWheel?: (x: number, y: number, delta: number) => void;
  /** anything in here that changes redraws the plot */
  deps: unknown[];
};

/**
 * a plain two-dimensional canvas with world coordinates. every picture in this
 * topic that is not a solid is drawn through this: direction fields, phase
 * portraits, time series, cobwebs, return maps and the bifurcation diagram.
 */
export function Plot({ box, draw, className, onPick, onDrag, onRelease, onWheel, equal, deps }: Props) {
  const host = useRef<HTMLCanvasElement | null>(null);
  const latest = useRef({ box, draw, onPick, onDrag, onRelease, onWheel, equal });

  // kept current after each render rather than during it, so the draw callback
  // the observer holds is never a stale closure
  useEffect(() => {
    latest.current = { box, draw, onPick, onDrag, onRelease, onWheel, equal };
  });

  // the wheel needs a listener that can hold the page's scroll, which react's cannot
  const wheeled = !!onWheel;
  useEffect(() => {
    const canvas = host.current;
    if (!canvas || !wheeled) return;
    const handler = (e: WheelEvent) => {
      const fn = latest.current.onWheel;
      if (!fn) return;
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const b = latest.current.equal ? squared(latest.current.box, rect.width, rect.height) : latest.current.box;
      const fx = (e.clientX - rect.left) / rect.width;
      const fy = (e.clientY - rect.top) / rect.height;
      fn(b.x0 + fx * (b.x1 - b.x0), b.y1 - fy * (b.y1 - b.y0), e.deltaY);
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, [wheeled]);

  useEffect(() => {
    const canvas = host.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== w * ratio || canvas.height !== h * ratio) {
        canvas.width = w * ratio;
        canvas.height = h * ratio;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const shown = latest.current.equal
        ? squared(latest.current.box, w, h)
        : latest.current.box;
      latest.current.draw(makePen(ctx, shown, w, h));
    };

    paint();
    const watch = new ResizeObserver(paint);
    watch.observe(canvas);
    return () => watch.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const where = (e: React.PointerEvent) => {
    const canvas = host.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const b = latest.current.equal
      ? squared(latest.current.box, rect.width, rect.height)
      : latest.current.box;
    const fx = (e.clientX - rect.left) / rect.width;
    const fy = (e.clientY - rect.top) / rect.height;
    return [b.x0 + fx * (b.x1 - b.x0), b.y1 - fy * (b.y1 - b.y0)] as const;
  };

  return (
    <canvas
      ref={host}
      className={className}
      style={{ cursor: onPick || onDrag ? "crosshair" : "default", touchAction: "none" }}
      onPointerDown={(e) => {
        const at = where(e);
        if (!at) return;
        if (onDrag) e.currentTarget.setPointerCapture(e.pointerId);
        latest.current.onPick?.(at[0], at[1]);
        latest.current.onDrag?.(at[0], at[1]);
      }}
      onPointerMove={(e) => {
        if (!onDrag || e.buttons === 0) return;
        const at = where(e);
        if (at) latest.current.onDrag?.(at[0], at[1]);
      }}
      onPointerUp={() => latest.current.onRelease?.()}
      onPointerCancel={() => latest.current.onRelease?.()}
    />
  );
}

/** the box grown along whichever axis is short, so world units are square. */
function squared(box: Box, width: number, height: number): Box {
  const w = box.x1 - box.x0;
  const h = box.y1 - box.y0;
  if (w <= 0 || h <= 0 || width <= 0 || height <= 0) return box;
  const want = width / height;
  const have = w / h;
  if (Math.abs(want - have) < 1e-9) return box;
  if (have < want) {
    const grow = (h * want - w) / 2;
    return { ...box, x0: box.x0 - grow, x1: box.x1 + grow };
  }
  const grow = (w / want - h) / 2;
  return { ...box, y0: box.y0 - grow, y1: box.y1 + grow };
}

function makePen(
  ctx: CanvasRenderingContext2D,
  box: Box,
  width: number,
  height: number,
): Pen {
  const px = (x: number) => ((x - box.x0) / (box.x1 - box.x0)) * width;
  const py = (y: number) => height - ((y - box.y0) / (box.y1 - box.y0)) * height;
  const wx = (p: number) => box.x0 + (p / width) * (box.x1 - box.x0);
  const wy = (p: number) => box.y0 + ((height - p) / height) * (box.y1 - box.y0);

  const pen: Pen = {
    ctx,
    box,
    width,
    height,
    px,
    py,
    wx,
    wy,
    line(pts, colour, weight = 1) {
      if (pts.length < 2) return;
      ctx.strokeStyle = colour;
      ctx.lineWidth = weight;
      ctx.beginPath();
      let open = false;
      for (const [x, y] of pts) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
          open = false;
          continue;
        }
        if (open) ctx.lineTo(px(x), py(y));
        else {
          ctx.moveTo(px(x), py(y));
          open = true;
        }
      }
      ctx.stroke();
    },
    dot(x, y, r, colour) {
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(px(x), py(y), r, 0, Math.PI * 2);
      ctx.fill();
    },
    ring(x, y, r, colour, weight = 1.5) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = weight;
      ctx.beginPath();
      ctx.arc(px(x), py(y), r, 0, Math.PI * 2);
      ctx.stroke();
    },
    arrow(x, y, dx, dy, colour) {
      const ax = px(x);
      const ay = py(y);
      const bx = px(x + dx);
      const by = py(y + dy);
      const len = Math.hypot(bx - ax, by - ay);
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      if (len < 4) return;
      const ux = (bx - ax) / len;
      const uy = (by - ay) / len;
      const head = Math.min(4, len * 0.45);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - head * (ux + uy * 0.6), by - head * (uy - ux * 0.6));
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - head * (ux - uy * 0.6), by - head * (uy + ux * 0.6));
      ctx.stroke();
    },
    axes(colour, ticks = 0) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (box.y0 <= 0 && box.y1 >= 0) {
        ctx.moveTo(0, py(0));
        ctx.lineTo(width, py(0));
      }
      if (box.x0 <= 0 && box.x1 >= 0) {
        ctx.moveTo(px(0), 0);
        ctx.lineTo(px(0), height);
      }
      ctx.stroke();
      if (!ticks) return;
      ctx.beginPath();
      for (let i = 0; i <= ticks; i++) {
        const x = box.x0 + ((box.x1 - box.x0) * i) / ticks;
        ctx.moveTo(px(x), height);
        ctx.lineTo(px(x), height - 4);
        const y = box.y0 + ((box.y1 - box.y0) * i) / ticks;
        ctx.moveTo(0, py(y));
        ctx.lineTo(4, py(y));
      }
      ctx.stroke();
    },
    text(s, x, y, colour, align = "left") {
      ctx.fillStyle = colour;
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = align;
      ctx.fillText(s, px(x), py(y));
    },
  };
  return pen;
}
