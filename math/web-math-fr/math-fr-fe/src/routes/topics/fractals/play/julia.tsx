import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Escape } from "@/components/Escape";
import { PaletteBar } from "@/components/PaletteBar";
import { PlayTabs } from "@/components/PlayTabs";
import { TopicBar } from "@/components/TopicBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
import { useLook } from "@/lib/store";

export const Route = createFileRoute("/topics/fractals/play/julia")({
  loader: () => api.system(TOPIC, "julia"),
  component: JuliaPage,
});

function JuliaPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [cx, setCx] = useState(-0.5);
  const [cy, setCy] = useState(0.5);
  const [zoom, setZoom] = useState(0);
  const [iters, setIters] = useState(180);
  const [radius, setRadius] = useState(2);
  const [shift, setShift] = useState(0);
  const [centre, setCentre] = useState<[number, number]>([0, 0]);

  const span = 1.8 / Math.pow(2, zoom);

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="font-mono text-sm tracking-wide text-leaf">{system?.name ?? "Julia sets"}</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">CONSTANT C</h2>
            <div className="mt-3 space-y-2">
              <Slider label="c real" min={-2} max={1} step={0.002} value={cx} onChange={setCx} />
              <Slider label="c imaginary" min={-1.5} max={1.5} step={0.002} value={cy} onChange={setCy} />
            </div>
            <div className="mt-3 overflow-hidden rounded border border-leaf/40">
              <div className="relative h-[190px] w-full">
                <Escape
                  kind="mandelbrot"
                  cx={0}
                  cy={0}
                  centre={[-0.6, 0]}
                  span={1.5}
                  iters={90}
                  radius={2}
                  ramp={palette.ramp}
                  body={palette.roles[1] ?? palette.ink}
                  className="absolute inset-0 h-full w-full"
                  onPick={(x, y) => {
                    setCx(x);
                    setCy(y);
                  }}
                />
                <span
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
                  style={{
                    borderColor: palette.roles[0],
                    left: `calc(50% + ${((cx + 0.6) / 1.5) * 50}%)`,
                    top: `calc(50% - ${(cy / 1.5) * 50}%)`,
                  }}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              the small map is the Mandelbrot set - click it to put c anywhere. inside it the Julia
              set holds together in one piece, outside it breaks into dust.
            </p>
          </section>

          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">VIEW</h2>
            <div className="mt-3 space-y-2">
              <Slider label="zoom" min={0} max={10} step={0.05} value={zoom} format={(v) => `x${Math.pow(2, v).toFixed(v > 6 ? 0 : 2)}`} onChange={setZoom} />
              <Slider label="max steps" min={30} max={500} step={10} value={iters} format={(v) => String(Math.round(v))} onChange={(v) => setIters(Math.round(v))} />
              <Slider label="escape radius" min={2} max={6} step={0.1} value={radius} format={(v) => v.toFixed(1)} onChange={setRadius} />
              <Slider label="colour offset" min={0} max={1} step={0.01} value={shift} format={(v) => v.toFixed(2)} onChange={setShift} />
              <PaletteBar />
            </div>
            <p className="mt-3 text-[11px] text-muted">
              click the big picture to centre it there. the colour of a point outside is how many
              steps it took to pass the escape distance.
            </p>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section ref={stage} className="h-[min(620px,calc(100vh-12rem))] overflow-hidden rounded border border-edge">
            <Escape
              kind="julia"
              cx={cx}
              cy={cy}
              centre={centre}
              span={span}
              iters={iters}
              radius={radius}
              shift={shift}
              ramp={palette.ramp}
              body={palette.roles[1] ?? palette.ink}
              className="h-full w-full"
              onPick={(x, y) => setCentre([x, y])}
            />
          </section>
          <SaveImage stage={stage} name="julia" />
          <Readout
            rows={[
              ["c", `${cx.toFixed(3)} ${cy < 0 ? "-" : "+"} ${Math.abs(cy).toFixed(3)}i`],
              ["half width", span.toFixed(6)],
              ["centre", `${centre[0].toFixed(4)}, ${centre[1].toFixed(4)}`],
              ["steps tried", String(iters)],
            ]}
          />
        </div>
      </div>
    </main>
  );
}
