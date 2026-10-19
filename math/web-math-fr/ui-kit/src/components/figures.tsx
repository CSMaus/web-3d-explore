import * as React from "react";
import { FIGURES, type FigureKind } from "../lib/figures";

/**
 * a line figure: a fractal drawn as thin edges with a light travelling along
 * them. every piece of the figure is in one path, so a figure is a handful of
 * elements however many pieces it has, and the light runs along all of them in
 * turn. the light is three strokes on the same path: a wide faint halo, a
 * longer fading tail, and a short bright core, so it reads as a point of light
 * with a trail rather than a band. every path carries pathLength 1, so the
 * lengths in the sheet are fractions of the whole figure.
 */
export function EdgeFigure({ kind, className, ...props }: React.ComponentProps<"svg"> & { kind: FigureKind }) {
  const d = React.useMemo(() => FIGURES[kind]().join(" "), [kind]);
  return (
    <svg data-slot="edge-figure" data-kind={kind} viewBox="0 0 100 100" className={className} aria-hidden="true" {...props}>
      <path className="edge-low" d={d} pathLength={1} />
      <path className="edge-high" d={d} pathLength={1} />
      <path className="edge-base" d={d} pathLength={1} />
      <path className="edge-halo" d={d} pathLength={1} />
      <path className="edge-tail" d={d} pathLength={1} />
      <path className="edge-core" d={d} pathLength={1} />
    </svg>
  );
}
