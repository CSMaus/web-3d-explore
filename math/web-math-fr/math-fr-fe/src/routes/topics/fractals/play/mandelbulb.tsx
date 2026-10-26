import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Button, Text, Heading } from "@kit/index";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Equations } from "@/components/Equations";
import { PaletteBar } from "@/components/PaletteBar";
import { useLook } from "@/lib/store";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";

const Bulb = lazy(() => import("@/components/Bulb").then((m) => ({ default: m.Bulb })));

const START = {
  power: 8,
  inner: 9,
  zoom: 1,
  period: 42,
  pulse: 0,
  keyLight: 0.26,
  fill: 0.8,
  shine: 0,
  glow: 2.5,
  haze: 1.2,
};
const AIM = { azimuth: 0, elevation: 0.45 };
// the palette being built in the picker is kept in the browser on every change, so a reload or an
// edit of this page never loses it
const DRAFT_KEY = "mathfr_palette_draft";

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
  const stored = useLook((s) => s.palette);
  const addPalette = useLook((s) => s.addPalette);
  const savedCount = useLook((s) => s.saved.length);
  const [own, setOwn] = useState<{ ramp: string[]; back: string } | null>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as { ramp: string[]; back: string }) : null;
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      if (own) localStorage.setItem(DRAFT_KEY, JSON.stringify(own));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      return;
    }
  }, [own]);
  const palette = own ? { ...stored, ...own } : stored;
  const tint = (i: number, hex: string) => setOwn((p) => ({ back: (p ?? stored).back, ramp: (p ?? stored).ramp.map((c, k) => (k === i ? hex : c)) }));

  const set = <K extends keyof typeof START>(name: K) => (v: number) =>
    setLook((prev) => ({ ...prev, [name]: v }));

  return (
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? L("The three-dimensional set")}</Heading>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <section data-slot="panel">
            <Label>{L("SOLID")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("Power")} min={2} max={12} step={1} value={look.power} format={(v) => String(Math.round(v))} onChange={(v) => set("power")(Math.round(v))} />
              <Slider label={L("Iterations")} min={3} max={18} step={1} value={look.inner} format={(v) => String(Math.round(v))} onChange={(v) => set("inner")(Math.round(v))} />
              <Slider label={L("Zoom")} min={0.6} max={3} step={0.02} value={look.zoom} format={(v) => `x${v.toFixed(2)}`} onChange={set("zoom")} />
              <Slider label={L("Loop time")} min={8} max={90} step={1} value={look.period} format={(v) => `${Math.round(v)} s`} onChange={(v) => set("period")(Math.round(v))} />
              <Slider label={L("Pulses per loop")} min={0} max={8} step={1} value={look.pulse} format={(v) => (v === 0 ? L("off") : String(Math.round(v)))} onChange={(v) => set("pulse")(Math.round(v))} />
              <PaletteBar />
              {import.meta.env.DEV ? (
                <div className="mt-2 space-y-1 border-t border-border pt-2">
                  <span data-text="label">Own palette, dark to light, then the background</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {palette.ramp.map((hex, i) => (
                      <input key={i} type="color" value={hex} aria-label={`Stop `} onChange={(e) => tint(i, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-border bg-transparent" />
                    ))}
                    <input type="color" value={palette.back} aria-label="Background" onChange={(e) => setOwn((p) => ({ ramp: (p ?? stored).ramp, back: e.target.value }))} className="ml-2 h-7 w-9 cursor-pointer rounded border border-border bg-transparent" />
                    {own ? (
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          const n = savedCount + 1;
                          addPalette({ id: `own-${n}`, name: `Own ${n}`, back: palette.back, ink: stored.ink, roles: [palette.ramp[2], palette.ramp[3], palette.ramp[1], palette.ramp[4]], ramp: palette.ramp });
                          setOwn(null);
                        }}
                      >
                        Add palette
                      </Button>
                    ) : null}
                    {own ? <Button variant="link" type="button" onClick={() => setOwn(null)}>reset</Button> : null}
                  </div>
                  <code data-text="caption" className="block">{[...palette.ramp, palette.back].join(" ")}</code>
                </div>
              ) : null}
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <Label>{L("ROTATION MODE")}</Label>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {([true, false] as const).map((on) => (
                  <Button variant="outline" size="sm"
                    key={String(on)}
                    type="button"
                    onClick={() => setTurning(on)}
                    aria-pressed={turning === on}
                  >
                    {on ? L("Auto") : L("Manual")}
                  </Button>
                ))}
              </div>
              {turning ? (
                <Text kind="note" as="p" className="mt-2">
                  {L("The camera turns by one of the solid's folds across the loop, so the last frame is the first frame.")}
                </Text>
              ) : (
                <div className="mt-2 space-y-2">
                  <Slider
                    label={L("Azimuth")}
                    min={-Math.PI}
                    max={Math.PI}
                    step={0.005}
                    value={aim.azimuth}
                    format={(v) => L("{{v}} deg", { v: ((v * 180) / Math.PI).toFixed(0) })}
                    onChange={(v) => setAim((prev) => ({ ...prev, azimuth: v }))}
                  />
                  <Slider
                    label={L("Elevation")}
                    min={-Math.PI / 2}
                    max={Math.PI / 2}
                    step={Math.PI / 360}
                    value={aim.elevation}
                    format={(v) => L("{{v}} deg", { v: ((v * 180) / Math.PI).toFixed(0) })}
                    onChange={(v) => setAim((prev) => ({ ...prev, elevation: v }))}
                  />
                  <Text kind="note" as="p">{L("Drag the picture to turn it.")}</Text>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <Label>{L("LIGHT")}</Label>
              <div className="mt-2 space-y-2">
                <Slider label={L("Key light")} min={0} max={4} step={0.02} value={look.keyLight} format={(v) => v.toFixed(2)} onChange={set("keyLight")} />
                <Slider label={L("Fill")} min={0} max={2} step={0.01} value={look.fill} format={(v) => v.toFixed(2)} onChange={set("fill")} />
                <Slider label={L("Shine")} min={0} max={4} step={0.02} value={look.shine} format={(v) => v.toFixed(2)} onChange={set("shine")} />
                <Slider label={L("Inner light")} min={0} max={5} step={0.02} value={look.glow} format={(v) => v.toFixed(2)} onChange={set("glow")} />
                <Slider label={L("Haze")} min={0} max={3} step={0.01} value={look.haze} format={(v) => v.toFixed(2)} onChange={set("haze")} />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              <Button variant="outline" size="sm"
                type="button"
                onClick={() => setAim(AIM)}
              >
                {L("Reset view")}
              </Button>
              <Button variant="outline" size="sm"
                type="button"
                onClick={() => {
                  setLook(START);
                  setTurning(true);
                }}
              >
                {L("Reset all")}
              </Button>
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("The power sets how many folds the solid has about its axis, and the camera turns by exactly one of those folds over the loop, so the animation returns to the frame it started on with no fade and no reset. The marching budget and the render scale follow the frame time, so weak hardware loses sharpness rather than frames.")}
            </Text>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section
            ref={stage}
            data-slot="plot"
            className="h-[min(620px,calc(100vh-12rem))] touch-none overflow-hidden"
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
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
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
                palette={palette}
                turning={turning}
                azimuth={aim.azimuth}
                elevation={aim.elevation}
              />
            </Suspense>
          </section>
          <SaveImage stage={stage} name="mandelbulb" />
          <Readout
            rows={[
              [L("Folds about the axis"), String(look.power)],
              [L("Turn over one loop"), L("{{v}} degrees", { v: (360 / look.power).toFixed(1) })],
              [L("Rotation mode"), turning ? L("auto") : L("manual")],
              [
                L("Aimed at"),
                L("{{az}} by {{el}} deg", { az: ((aim.azimuth * 180) / Math.PI).toFixed(0), el: ((aim.elevation * 180) / Math.PI).toFixed(0) }),
              ],
              [L("Loop length"), turning ? `${look.period} s` : "-"],
              [
                L("One pulse every"),
                look.pulse ? `${(look.period / look.pulse).toFixed(1)} s` : L("No pulse"),
              ],
              [L("Iterations a sample"), String(look.inner)],
              [L("Key / fill / shine"), `${look.keyLight.toFixed(2)} / ${look.fill.toFixed(2)} / ${look.shine.toFixed(2)}`],
              [L("Inner light / haze"), `${look.glow.toFixed(2)} / ${look.haze.toFixed(2)}`],
            ]}
          />
        </div>
      </div>
    </div>
  );
}
