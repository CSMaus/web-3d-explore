import { L } from "@/lib/lang";

export const TOPIC = "fractals";

export const SYSTEMS = [
  { id: "ifs", to: "/topics/fractals/play/ifs", label: L("Iterated maps") },
  { id: "lsystem", to: "/topics/fractals/play/lsystem", label: L("Rewriting systems") },
  { id: "lichtenberg", to: "/topics/fractals/play/lichtenberg", label: L("Lichtenberg") },
  { id: "dla", to: "/topics/fractals/play/dla", label: L("Particles") },
  { id: "julia", to: "/topics/fractals/play/julia", label: L("Julia") },
  { id: "mandelbrot", to: "/topics/fractals/play/mandelbrot", label: L("Mandelbrot") },
  { id: "mandelbulb", to: "/topics/fractals/play/mandelbulb", label: L("Mandelbulb 3D") },
] as const;

export type SystemRoute = (typeof SYSTEMS)[number]["to"];

export function routeOf(id: string): SystemRoute {
  const hit = SYSTEMS.find((s) => s.id === id);
  return (hit ?? SYSTEMS[0]).to;
}
