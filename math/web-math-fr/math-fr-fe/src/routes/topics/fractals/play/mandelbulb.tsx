import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { PlayTabs } from "@/components/PlayTabs";
import { TopicBar } from "@/components/TopicBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { FRACTALS } from "@/lib/topic";

const Bulb = lazy(() => import("@/components/Bulb").then((m) => ({ default: m.Bulb })));

const START = {
  power: 8,
  inner: 9,
  zoom: 1,
  period: 42,
  pulse: 0,
  keyLight: 0,
  fill: 0.26,
  shine: 0,
  glow: 1.78,
  haze: 0.5,
};
const AIM = { azimuth: 0, elevation: 0.45 };

export const Route = createFileRoute("/topics/fractals/play/mandelbulb")({
  loader: () => api.system(TOPIC, "mandelbulb"),
  component: BulbPage,
});

function BulbPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [look, setLook] = useState(START);
  const [aim, setAim] = useState(AIM);
  const [turning, setTurning] = useState(true);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [grabbing, setGrabbing] = useState(false);

  const set = <K extends keyof typeof START>(name: K) => (v: number) =>
    setLook((prev) => ({ ...prev, [name]: v }));

  return (
    <main className="mx-auto max-w-6xl px-6 pt-24 pb-16">
      <TopicBar topic={FRACTALS} />
      <div className="mt-4">
        <PlayTabs />
      </div>
      <h1 className="font-mono text-sm tracking-wide text-leaf">{system?.name ?? "The three-dimensional set"}</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section className="rounded border border-edge p-4">
            <h2 className="font-mono text-[11px] uppercase tracking-wider text-sky">SOLID</h2>
            <div className="mt-3 space-y-2">
              <Slider label="Power" min={2} max={12} step={1} value={look.power} format={(v) => String(Math.round(v))} onChange={(v) => set("power")(Math.round(v))} />
              <Slider label="Iterations" min={3} max={18} step={1} value={look.inner} format={(v) => String(Math.round(v))} onChange={(v) => set("inner")(Math.round(v))} />
              <Slider label="Zoom" min={0.6} max={3} step={0.02} value={look.zoom} format={(v) => `x${v.toFixed(2)}`} onChange={set("zoom")} />
              <Slider label="Loop time" min={8} max={90} step={1} value={look.period} format={(v) => `${Math.round(v)} s`} onChange={(v) => set("period")(Math.round(v))} />
              <Slider label="Pulses per loop" min={0} max={8} step={1} value={look.pulse} format={(v) => (v === 0 ? "off" : String(Math.round(v)))} onChange={(v) => set("pulse")(Math.round(v))} />
              <PaletteBar />
            </div>
            <div className="mt-4 border-t border-edge pt-3">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">ROTATION MODE</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {([true, false] as const).map((on) => (
                  <button
                    key={String(on)}
                    type="button"
                    onClick={() => setTurning(on)}
                    aria-pressed={turning === on}
                    className={
                      turning === on
                        ? "rounded border border-leaf px-2.5 py-1 font-mono text-[11px] text-leaf"
                        : "rounded border border-edge px-2.5 py-1 font-mono text-[11px] text-muted hover:border-muted"
                    }
                  >
                    {on ? "Auto" : "Manual"}
                  </button>
                ))}
              </div>
              {turning ? (
                <p className="mt-2 text-[11px] text-muted">
                  The camera turns by one of the solid's folds across the loop, so the last frame is
                  the first frame.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  <Slider
                    label="Azimuth"
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.005}
                    value={aim.azimuth}
                    format={(v) => `${((v * 180) / Math.PI).toFixed(0)} deg`}
                    onChange={(v) => setAim((prev) => ({ ...prev, azimuth: v }))}
                  />
                  <Slider
                    label="Elevation"
                    min={-Math.PI / 2}
                    max={Math.PI / 2}
                    step={Math.PI / 360}
                    value={aim.elevation}
                    format={(v) => `${((v * 180) / Math.PI).toFixed(0)} deg`}
                    onChange={(v) => setAim((prev) => ({ ...prev, elevation: v }))}
                  />
                  <p className="text-[11px] text-muted">Drag the picture to turn it.</p>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-edge pt-3">
              <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted">LIGHT</h3>
              <div className="mt-2 space-y-2">
                <Slider label="Key light" min={0} max={2.6} step={0.02} value={look.keyLight} format={(v) => v.toFixed(2)} onChange={set("keyLight")} />
                <Slider label="Fill" min={0} max={0.8} step={0.01} value={look.fill} format={(v) => v.toFixed(2)} onChange={set("fill")} />
                <Slider label="Shine" min={0} max={2.5} step={0.02} value={look.shine} format={(v) => v.toFixed(2)} onChange={set("shine")} />
                <Slider label="Inner light" min={0} max={2.5} step={0.02} value={look.glow} format={(v) => v.toFixed(2)} onChange={set("glow")} />
                <Slider label="Haze" min={0} max={1.2} step={0.01} value={look.haze} format={(v) => v.toFixed(2)} onChange={set("haze")} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-edge pt-3">
              <button
                type="button"
                onClick={() => setAim(AIM)}
                className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-leaf"
              >
                Reset view
              </button>
              <button
                type="button"
                onClick={() => {
                  setLook(START);
                  setTurning(true);
                }}
                className="rounded border border-edge px-3 py-1.5 font-mono text-[11px] text-muted hover:border-leaf"
              >
                Reset all
              </button>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              The power sets how many folds the solid has about its axis, and the camera turns by
              exactly one of those folds over the loop, so the animation returns to the frame it
              started on with no fade and no reset. The marching budget and the render scale follow
              the frame time, so weak hardware loses sharpness rather than frames.
            </p>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section
            ref={stage}
            className="h-[min(620px,calc(100vh-12rem))] touch-none overflow-hidden rounded border border-edge"
            style={{ cursor: turning ? "default" : grabbing ? "grabbing" : "grab" }}
            onPointerDown={(e) => {
              if (turning) return;
              drag.current = { x: e.clientX, y: e.clientY };
              setGrabbing(true);
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const from = drag.current;
              if (!from) return;
              const dx = e.clientX - from.x;
              const dy = e.clientY - from.y;
              drag.current = { x: e.clientX, y: e.clientY };
              setAim((prev) => ({
                azimuth: prev.azimuth - dx * 0.006,
                elevation: Math.min(Math.PI / 2, Math.max(-Math.PI / 2, prev.elevation + dy * 0.006)),
              }));
            }}
            onPointerUp={() => {
              drag.current = null;
              setGrabbing(false);
            }}
            onPointerCancel={() => {
              drag.current = null;
              setGrabbing(false);
            }}
          >
            <Suspense fallback={<div className="h-full w-full bg-ground" />}>
              <Bulb
                className="h-full w-full"
                power={look.power}
                inner={look.inner}
                zoom={look.zoom}
                period={look.period * 1000}
                pulse={look.pulse}
                keyLight={look.keyLight}
                fill={look.fill}
                shine={look.shine}
                glow={look.glow}
                haze={look.haze}
                turning={turning}
                azimuth={aim.azimuth}
                elevation={aim.elevation}
              />
            </Suspense>
          </section>
          <SaveImage stage={stage} name="mandelbulb" />
          <Readout
            rows={[
              ["Folds about the axis", String(look.power)],
              ["Turn over one loop", `${(360 / look.power).toFixed(1)} degrees`],
              ["Rotation mode", turning ? "auto" : "manual"],
              [
                "Aimed at",
                `${((aim.azimuth * 180) / Math.PI).toFixed(0)} by ${((aim.elevation * 180) / Math.PI).toFixed(0)} deg`,
              ],
              ["Loop length", turning ? `${look.period} s` : "-"],
              [
                "One pulse every",
                look.pulse ? `${(look.period / look.pulse).toFixed(1)} s` : "No pulse",
              ],
              ["Iterations a sample", String(look.inner)],
              ["Key / fill / shine", `${look.keyLight.toFixed(2)} / ${look.fill.toFixed(2)} / ${look.shine.toFixed(2)}`],
              ["Inner light / haze", `${look.glow.toFixed(2)} / ${look.haze.toFixed(2)}`],
            ]}
          />
        </div>
      </div>
    </main>
  );
}
