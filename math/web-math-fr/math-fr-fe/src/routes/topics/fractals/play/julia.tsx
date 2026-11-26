import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Text, Heading } from "@kit/index";
import { useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { Escape } from "@/components/Escape";
import { PaletteBar } from "@/components/PaletteBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { useLook } from "@/lib/store";
import { PlayColumns } from "@/components/TaskPage";

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
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? L("Julia sets")}</Heading>
      <PlayColumns
        input={<>
          <section data-slot="panel">
            <Label>{L("THE ADDED NUMBER C")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("c, across (real part)")} min={-2} max={1} step={0.002} value={cx} onChange={setCx} />
              <Slider label={L("c, up (imaginary part)")} min={-1.5} max={1.5} step={0.002} value={cy} onChange={setCy} />
            </div>
            <div className="mt-3 overflow-hidden rounded border border-selected/40">
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
            <Text kind="note" as="p" className="mt-2">
              {L("The small picture is a map of all the values of c. Its solid part is the Mandelbrot set: the values of c for which the big shape holds together in one piece. A click on the small map moves c to that point, and the ring shows where c is now. With c inside the solid part, the big shape is one piece. With c outside it, the shape breaks into separate specks, like dust.")}
            </Text>
          </section>

          <section data-slot="panel">
            <Label>{L("VIEW")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("Zoom")} min={0} max={10} step={0.05} value={zoom} format={(v) => `x${Math.pow(2, v).toFixed(v > 6 ? 0 : 2)}`} onChange={setZoom} />
              <Slider label={L("Most steps per point")} min={30} max={500} step={10} value={iters} format={(v) => String(Math.round(v))} onChange={(v) => setIters(Math.round(v))} />
              <Slider label={L("Escape distance")} min={2} max={6} step={0.1} value={radius} format={(v) => v.toFixed(1)} onChange={setRadius} />
              <Slider label={L("Colour shift")} min={0} max={1} step={0.01} value={shift} format={(v) => v.toFixed(2)} onChange={setShift} />
              <PaletteBar />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("A click on the big picture moves that point to the centre. The zoom slider magnifies around the centre. For every point of the picture the step 'square, then add c' is repeated, up to the most steps set above. A point that gets further from the centre than the escape distance has escaped, and its shade shows how many steps that took. A point that never escapes is drawn in the solid tone. The colour shift slides the shades along the bands.")}
            </Text>
          </section>

          <Equations system={system} />
        </>}

        output={<>
          <section ref={stage} data-slot="plot" className="h-[min(620px,calc(100vh-12rem))] overflow-hidden">
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
              [L("The added number c"), `${cx.toFixed(3)} ${cy < 0 ? "-" : "+"} ${Math.abs(cy).toFixed(3)}i`],
              [L("Half the width of the view"), span.toFixed(6)],
              [L("Centre of the view"), `${centre[0].toFixed(4)}, ${centre[1].toFixed(4)}`],
              [L("Most steps per point"), String(iters)],
            ]}
          />
        </>}
      />
    </div>
  );
}
