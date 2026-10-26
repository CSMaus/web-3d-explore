import { Plot, type Box, type Pen } from "@/components/Plot";
import { useClock } from "./clock";

/**
 * a project figure that moves: the plot's canvas, redrawn with the time in seconds. `still` is
 * the moment shown to a reader who asked for less motion. a figure that is moved by hand passes
 * its own state in `deps`, so it redraws on a drag as well as on the clock.
 */
export function Live({
  draw,
  box = { x0: 0, x1: 16, y0: 0, y1: 9 },
  still = 0,
  fps = 30,
  className = "aspect-[16/9] w-full",
  label,
  deps = [],
  onDrag,
  onPick,
}: {
  draw: (pen: Pen, t: number) => void;
  box?: Box;
  still?: number;
  fps?: number;
  className?: string;
  /** what the figure shows, for a reader who cannot see it */
  label: string;
  deps?: unknown[];
  onDrag?: (x: number, y: number) => void;
  onPick?: (x: number, y: number) => void;
}) {
  const [t, host] = useClock(still, fps);
  return (
    <div ref={host} role={onDrag || onPick ? undefined : "img"} aria-label={label} className={`${className} overflow-hidden`}>
      <Plot box={box} equal draw={(pen) => draw(pen, t)} deps={[t, ...deps]} onDrag={onDrag} onPick={onPick} className="h-full w-full" />
    </div>
  );
}
