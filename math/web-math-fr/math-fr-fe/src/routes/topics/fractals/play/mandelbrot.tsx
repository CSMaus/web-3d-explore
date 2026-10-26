import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Button, Text, Heading } from "@kit/index";
import { useRef, useState } from "react";
import { DeepView } from "@/components/DeepView";
import { Equations } from "@/components/Equations";
import { Escape, type Detail } from "@/components/Escape";
import { PaletteBar } from "@/components/PaletteBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { useDeep } from "@/lib/deep";
import { useLook } from "@/lib/store";

export const Route = createFileRoute("/topics/fractals/play/mandelbrot")({
  loader: () => api.system(TOPIC, "mandelbrot"),
  component: MandelbrotPage,
});

const GPU_LIMIT = 5;
// the server render is asked for at the size of the stage, capped so the work
// budget on the other end is never the thing that refuses it.
const MAX_W = 1100;
const MAX_H = 800;

function MandelbrotPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(0);
  const [iters, setIters] = useState(200);
  const [shift, setShift] = useState(0);
  const [centre, setCentre] = useState<[number, number]>([-0.6, 0]);
  const [fine, setFine] = useState(0);
  const [factor, setFactor] = useState(3);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [stale, setStale] = useState(true);

  const span = 1.6 / Math.pow(2, zoom);
  const deep = Math.log10(1 / span) > GPU_LIMIT;

  const { tile, stage: shot, ask, stop } = useDeep(deep);
  const [drifted, setDrifted] = useState(false);

  const change = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setStale(true);
    setDrifted(true);
  };

  const render = () => {
    const box = stage.current?.getBoundingClientRect();
    ask({
      cx: centre[0],
      cy: centre[1],
      span,
      width: Math.min(MAX_W, Math.round(box?.width ?? 640)),
      height: Math.min(MAX_H, Math.round(box?.height ?? 640)),
      iters: Math.max(iters, 400),
      ramp: palette.ramp,
      body: palette.roles[1] ?? palette.ink,
      shift,
    });
    setDrifted(false);
  };

  // a picture of a view the reader has left is worse than no picture, so the
  // one on screen is hidden the moment the view moves rather than being left
  // to look current. leaving the deep range hides it too, since the card can
  // draw that range itself.
  const showing = deep && tile !== null && !drifted;

  return (
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? L("The Mandelbrot set")}</Heading>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section data-slot="panel">
            <Label>{L("VIEW")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("Zoom")} min={0} max={22} step={0.05} value={zoom} format={(v) => `x${Math.pow(2, v).toExponential(1)}`} onChange={change(setZoom)} />
              <Slider label={L("Centre x")} min={-2.5} max={1.5} step={0.0005} value={centre[0]} format={(v) => v.toFixed(5)} onChange={change((v: number) => setCentre([v, centre[1]]))} />
              <Slider label={L("Centre y")} min={-1.6} max={1.6} step={0.0005} value={centre[1]} format={(v) => v.toFixed(5)} onChange={change((v: number) => setCentre([centre[0], v]))} />
              <Slider label={L("Max steps")} min={40} max={900} step={20} value={iters} format={(v) => String(Math.round(v))} onChange={change((v: number) => setIters(Math.round(v)))} />
              <Slider label={L("Colour offset")} min={0} max={1} step={0.01} value={shift} format={(v) => v.toFixed(2)} onChange={change(setShift)} />
              <PaletteBar />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("Click the picture to centre on that point, then wind the zoom up.")}
            </Text>
          </section>

          <section data-slot="panel">
            <Label>{L("RESOLUTION")}</Label>
            <div className="mt-3 space-y-2">
              <Slider
                label={L("Supersample")}
                min={1}
                max={4}
                step={0.5}
                value={factor}
                format={(v) => `${v.toFixed(1)} x`}
                onChange={change(setFactor)}
              />
              <Button
                variant="outline"
                className="w-full"
                type="button"
                aria-pressed={stale}
                onClick={() => {
                  setFine((n) => n + 1);
                  setStale(false);
                }}
              >
                {stale ? L("Recalculate") : L("Up to date")}
              </Button>
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("The sharper pass redraws the same view at more pixels than the screen has and lets the screen shrink it back down, which is what removes the stair edges. It reuses the one drawing surface rather than keeping a second copy, so nothing accumulates, and the detail is stepped down until it fits both the hardware limit and a pixel budget.")}
            </Text>
          </section>

          {deep ? (
            <section className="rounded border border-destructive/40 p-4">
              <Heading level={2} data-tone="destructive">
                {L("SERVER RENDER")}
              </Heading>
              <Text kind="note" as="p" className="mt-2">
                {L("Past about a hundred thousand times, single precision on the graphics card runs out of digits and the picture goes blocky. This view is deeper than that, so it is rendered on the server in double precision and streamed back one pass at a time, each four times finer than the last.")}
              </Text>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="outline" size="sm"
                  type="button"
                  onClick={render}
                  disabled={shot.kind === "working" || shot.kind === "opening"}
                >
                  {shot.kind === "working" || shot.kind === "opening"
                    ? L("Rendering")
                    : L("Render on the server")}
                </Button>
                <Button variant="outline" size="sm"
                  type="button"
                  onClick={stop}
                  disabled={shot.kind === "idle"}
                >
                  {L("Stop")}
                </Button>
              </div>
              <div data-text="caption" className="mt-3">
                {shot.kind === "working" ? L("Pass {{done}} of 4", { done: shot.done }) : null}
                {shot.kind === "done" ? L("Finished, full resolution") : null}
                {shot.kind === "idle" ? L("Not started") : null}
                {shot.kind === "opening" ? L("Opening the connection") : null}
                {shot.kind === "refused" || shot.kind === "busy" || shot.kind === "lost" ? (
                  <span className="text-destructive">{shot.reason}</span>
                ) : null}
              </div>
              {showing ? (
                <Text kind="note" as="p" className="mt-2">
                  {L("The connection is closed as soon as a view finishes, because the server holds capacity for as long as a socket is open whether or not it is computing.")}
                </Text>
              ) : null}
              {drifted && tile ? (
                <Text kind="warning" as="p" className="mt-2">
                  {L("The view moved, so the server picture was dropped. Render again.")}
                </Text>
              ) : null}
            </section>
          ) : null}

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section
            ref={stage}
            data-slot="plot"
            className="relative h-[min(620px,calc(100vh-12rem))] overflow-hidden"
          >
            <Escape
              kind="mandelbrot"
              cx={0}
              cy={0}
              centre={centre}
              span={span}
              iters={iters}
              radius={2}
              shift={shift}
              ramp={palette.ramp}
              body={palette.roles[1] ?? palette.ink}
              className="h-full w-full"
              onPick={(x, y) => {
                setCentre([x, y]);
                setStale(true);
              }}
              fine={fine}
              fineFactor={factor}
              fineIters={Math.round(iters * 1.6)}
              onDetail={setDetail}
            />
            {showing ? (
              <DeepView
                tile={tile}
                stage={shot}
                className="pointer-events-none absolute inset-0"
              />
            ) : null}
          </section>
          <SaveImage stage={stage} name="mandelbrot" />
          <Readout
            rows={[
              [L("Half width"), span.toExponential(3)],
              [L("centre"), `${centre[0].toFixed(8)}, ${centre[1].toFixed(8)}`],
              [L("Steps tried"), showing && tile ? String(tile.iters) : String(iters)],
              [
                L("Drawn at"),
                detail
                  ? L("{{w}} by {{h}}, {{mp}}M pixels", { w: detail.width, h: detail.height, mp: (detail.pixels / 1e6).toFixed(1) })
                  : "-",
              ],
              [L("Detail in the picture"), detail ? L("{{f}} x screen", { f: detail.factor.toFixed(1) }) : "-"],
              [L("Drawn by"), showing ? L("The server, double precision") : L("The graphics card")],
              [
                L("Server pass"),
                showing && tile ? L("{{w}} by {{h}}, step {{step}}", { w: tile.width, h: tile.height, step: tile.step }) : "-",
              ],
            ]}
          />
        </div>
      </div>
    </div>
  );
}
