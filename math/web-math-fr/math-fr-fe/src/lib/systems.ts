export const TOPIC = "fractals";

export const SYSTEMS = [
  { id: "ifs", to: "/topics/fractals/play/ifs", label: "iterated maps" },
  { id: "lsystem", to: "/topics/fractals/play/lsystem", label: "rewriting" },
  { id: "lichtenberg", to: "/topics/fractals/play/lichtenberg", label: "Lichtenberg" },
  { id: "dla", to: "/topics/fractals/play/dla", label: "particles" },
  { id: "julia", to: "/topics/fractals/play/julia", label: "Julia" },
  { id: "mandelbrot", to: "/topics/fractals/play/mandelbrot", label: "Mandelbrot" },
  { id: "mandelbulb", to: "/topics/fractals/play/mandelbulb", label: "Mandelbulb 3D" },
] as const;

export type SystemRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): SystemRoute {
  const hit = SYSTEMS.find((s) => s.id === id);
  return (hit ?? SYSTEMS[0]).to;
}
