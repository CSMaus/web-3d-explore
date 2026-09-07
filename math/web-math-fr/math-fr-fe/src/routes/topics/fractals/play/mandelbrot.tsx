import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { DeepView } from "@/components/DeepView";
import { Equations } from "@/components/Equations";
import { Escape, type Detail } from "@/components/Escape";
import { PaletteBar } from "@/components/PaletteBar";
import { PlayTabs } from "@/components/PlayTabs";
import { TopicBar } from "@/components/TopicBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";
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
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="font-mono text-sm tracking-wide text-leaf">{system?.name ?? "the Mandelbrot set"}</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">VIEW</h2>
            <div className="mt-3 space-y-2">
              <Slider label="zoom" min={0} max={22} step={0.05} value={zoom} format={(v) => `x${Math.pow(2, v).toExponential(1)}`} onChange={change(setZoom)} />
              <Slider label="centre x" min={-2.5} max={1.5} step={0.0005} value={centre[0]} format={(v) => v.toFixed(5)} onChange={change((v: number) => setCentre([v, centre[1]]))} />
              <Slider label="centre y" min={-1.6} max={1.6} step={0.0005} value={centre[1]} format={(v) => v.toFixed(5)} onChange={change((v: number) => setCentre([centre[0], v]))} />
              <Slider label="max steps" min={40} max={900} step={20} value={iters} format={(v) => String(Math.round(v))} onChange={change((v: number) => setIters(Math.round(v)))} />
              <Slider label="colour offset" min={0} max={1} step={0.01} value={shift} format={(v) => v.toFixed(2)} onChange={change(setShift)} />
              <PaletteBar />
            </div>
            <p className="mt-3 text-[11px] text-muted">
              click the picture to centre on that point, then wind the zoom up.
            </p>
          </section>

          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">RESOLUTION</h2>
            <div className="mt-3 space-y-2">
              <Slider
                label="supersample"
                min={1}
                max={4}
                step={0.5}
                value={factor}
                format={(v) => `${v.toFixed(1)} x`}
                onChange={change(setFactor)}
              />
              <button
                type="button"
                onClick={() => {
                  setFine((n) => n + 1);
                  setStale(false);
                }}
                className={
                  stale
                    ? "w-full rounded border border-leaf px-3 py-2 font-mono text-xs text-leaf"
                    : "w-full rounded border border-edge px-3 py-2 font-mono text-xs text-muted"
                }
              >
                {stale ? "recalculate" : "up to date"}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              the sharper pass redraws the same view at more pixels than the screen has and lets
              the screen shrink it back down, which is what removes the stair edges. it reuses the
              one drawing surface rather than keeping a second copy, so nothing accumulates, and
              the detail is stepped down until it fits both the hardware limit and a pixel budget.
            </p>
          </section>

          {deep ? (
            <section className="rounded border border-warn/40 p-4">
              <h2 className="font-mono text-[11px] uppercase tracking-wider text-warn">
                SERVER RENDER
              </h2>
              <p className="mt-2 text-[11px] text-muted">
                past about a hundred thousand times, single precision on the graphics card runs out
                of digits and the picture goes blocky. this view is deeper than that, so it is
                rendered on the server in double precision and streamed back one pass at a time,
                each four times finer than the last.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={render}
                  disabled={shot.kind === "working" || shot.kind === "opening"}
                  className={
                    shot.kind === "working" || shot.kind === "opening"
                      ? "rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted"
                      : "rounded border border-warn px-3 py-1.5 font-mono text-[11px] text-warn"
                  }
                >
                  {shot.kind === "working" || shot.kind === "opening"
                    ? "rendering"
                    : "render on the server"}
                </button>
                <button
                  type="button"
                  onClick={stop}
                  disabled={shot.kind === "idle"}
                  className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-muted disabled:opacity-40"
                >
                  stop
                </button>
              </div>
              <div className="mt-3 font-mono text-[11px] text-muted">
                {shot.kind === "working" ? `pass ${shot.done} of 4` : null}
                {shot.kind === "done" ? "finished, full resolution" : null}
                {shot.kind === "idle" ? "not started" : null}
                {shot.kind === "opening" ? "opening the connection" : null}
                {shot.kind === "refused" || shot.kind === "busy" || shot.kind === "lost" ? (
                  <span className="text-warn">{shot.reason}</span>
                ) : null}
              </div>
              {showing ? (
                <p className="mt-2 text-[11px] text-muted">
                  the connection is closed as soon as a view finishes, because the server holds
                  capacity for as long as a socket is open whether or not it is computing.
                </p>
              ) : null}
              {drifted && tile ? (
                <p className="mt-2 text-[11px] text-warn">
                  the view moved, so the server picture was dropped. render again.
                </p>
              ) : null}
            </section>
          ) : null}

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section
            ref={stage}
            className="relative h-[min(620px,calc(100vh-12rem))] overflow-hidden rounded border border-edge"
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
              ["half width", span.toExponential(3)],
              ["centre", `${centre[0].toFixed(8)}, ${centre[1].toFixed(8)}`],
              ["steps tried", showing && tile ? String(tile.iters) : String(iters)],
              [
                "drawn at",
                detail
                  ? `${detail.width} by ${detail.height}, ${(detail.pixels / 1e6).toFixed(1)}M pixels`
                  : "-",
              ],
              ["detail in the picture", detail ? `${detail.factor.toFixed(1)} x screen` : "-"],
              ["drawn by", showing ? "the server, double precision" : "the graphics card"],
              [
                "server pass",
                showing && tile ? `${tile.width} by ${tile.height}, step ${tile.step}` : "-",
              ],
            ]}
          />
        </div>
      </div>
    </main>
  );
}
