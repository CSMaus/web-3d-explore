import { createFileRoute } from "@tanstack/react-router";
import { Label, Text, Heading } from "@kit/index";
import { useCallback, useMemo, useRef, useState } from "react";
import { Chips } from "@/components/Chips";
import { Equations } from "@/components/Equations";
import { Frame } from "@/components/Frame";
import { MapMaths } from "@/components/MapMaths";
import { PaletteBar } from "@/components/PaletteBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { useLook } from "@/lib/store";
import {
  IFS_PRESETS,
  KEYS,
  LIMITS,
  boxDim,
  carrierOf,
  contraction,
  runGame,
  type Map2,
} from "@/systems/ifs";

export const Route = createFileRoute("/topics/fractals/play/ifs")({
  loader: () => api.system(TOPIC, "ifs"),
  component: IfsPage,
});

const MODES = ["single", "per move", "by branch", "one move"] as const;
type Mode = (typeof MODES)[number];

function IfsPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [preset, setPreset] = useState("Barnsley fern");
  const [maps, setMaps] = useState<Map2[]>(() => IFS_PRESETS["Barnsley fern"].map((m) => ({ ...m })));
  const [active, setActive] = useState(1);
  const [points, setPoints] = useState(90000);
  const [drop, setDrop] = useState(20);
  const [mode, setMode] = useState<Mode>("per move");

  const run = useMemo(
    () => runGame(maps, { points, startx: 0, starty: 0, drop }),
    [maps, points, drop],
  );

  const spot = Math.min(active, maps.length - 1);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = palette.back;
      ctx.fillRect(0, 0, w, h);
      const { xs, ys, who, tag, kept, escaped } = run;
      if (escaped || kept < 10) return;
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (let i = 0; i < kept; i++) {
        if (xs[i] < x0) x0 = xs[i];
        if (xs[i] > x1) x1 = xs[i];
        if (ys[i] < y0) y0 = ys[i];
        if (ys[i] > y1) y1 = ys[i];
      }
      const pad = 0.05;
      const sx = x1 - x0 || 1;
      const sy = y1 - y0 || 1;
      const k = Math.min((w * (1 - 2 * pad)) / sx, (h * (1 - 2 * pad)) / sy);
      const ox = (w - sx * k) / 2 - x0 * k;
      const oy = h - (h - sy * k) / 2 + y0 * k;
      const single = palette.roles[1] ?? palette.ink;
      const dim = "#3a4048";
      for (let i = 0; i < kept; i++) {
        const px = xs[i] * k + ox;
        const py = oy - ys[i] * k;
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        if (mode === "single") ctx.fillStyle = single;
        else if (mode === "per move") ctx.fillStyle = palette.roles[who[i] % palette.roles.length];
        else if (mode === "by branch") ctx.fillStyle = palette.roles[tag[i] % palette.roles.length];
        else ctx.fillStyle = tag[i] === spot ? palette.roles[0] : dim;
        ctx.fillRect(px, py, 1, 1);
      }
    },
    [run, palette, mode, spot],
  );

  const dimension = useMemo(() => boxDim(run.xs, run.ys, run.kept), [run]);
  const tally = useMemo(() => {
    const out = new Array(maps.length).fill(0);
    const key = mode === "by branch" || mode === "one move" ? run.tag : run.who;
    for (let i = 0; i < run.kept; i++) out[key[i]]++;
    return out;
  }, [run, maps.length, mode]);

  const carrier = useMemo(() => carrierOf(maps), [maps]);

  const setCoeff = (key: string, value: number) => {
    setMaps((prev) =>
      prev.map((m, i) => (i === spot ? { ...m, [key]: value } : m)),
    );
  };

  const pickPreset = (name: string) => {
    setPreset(name);
    setMaps(IFS_PRESETS[name].map((m) => ({ ...m })));
    setActive((a) => Math.min(a, IFS_PRESETS[name].length - 1));
  };

  return (
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? "Iterated maps"}</Heading>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <section data-slot="panel">
            <Label>PRESET</Label>
            <div className="mt-3">
              <Chips items={Object.keys(IFS_PRESETS)} active={preset} onPick={pickPreset} />
            </div>
          </section>

          <section data-slot="panel">
            <Label>MOVE</Label>
            <div className="mt-3">
              <Chips
                items={maps.map((_, i) => `move ${i + 1}`)}
                active={`move ${spot + 1}`}
                onPick={(item) => setActive(Number(item.split(" ")[1]) - 1)}
                tint={(_, i) =>
                  mode === "single" ? undefined : palette.roles[i % palette.roles.length]
                }
              />
            </div>
            <div className="mt-4 space-y-2">
              {KEYS.map((key) => (
                <Slider
                  key={key}
                  label={key}
                  min={-LIMITS[key]}
                  max={LIMITS[key]}
                  step={0.005}
                  value={maps[spot][key]}
                  onChange={(v) => setCoeff(key, v)}
                />
              ))}
              <Slider
                label="Probability"
                min={0}
                max={1}
                step={0.005}
                value={maps[spot].p}
                onChange={(v) => setCoeff("p", v)}
              />
            </div>
            <div data-text="caption" className="mt-4 space-y-1">
              {maps.map((m, i) => {
                const s = contraction(m);
                return (
                  <div key={i} className={s < 1 ? "text-muted-foreground" : "text-destructive"}>
                    {`Move ${i + 1} shrinks by ${s.toFixed(3)}`}
                    {s < 1 ? "" : "  - Above 1, this one spreads out"}
                  </div>
                );
              })}
            </div>
          </section>

          <section data-slot="panel">
            <Label>EQUATIONS</Label>
            <Text kind="note" as="p" className="mt-2">
              Each move is coloured to match the points it puts on the picture, so a change to one
              of its six numbers is a change to the part of the shape in that colour. Tap one to
              edit it above.
            </Text>
            <div className="mt-3">
              <MapMaths
                maps={maps}
                active={spot}
                carrier={carrier}
                colourOf={(i) => palette.roles[i % palette.roles.length]}
                tinted={mode !== "single"}
                onPick={setActive}
              />
            </div>
          </section>

          <section data-slot="panel">
            <Label>COLOUR</Label>
            <div className="mt-3 space-y-3">
              <Chips items={MODES.map((m) => m[0].toUpperCase() + m.slice(1))} active={mode[0].toUpperCase() + mode.slice(1)} onPick={(m) => setMode(m.toLowerCase() as Mode)} />
              <PaletteBar />
              <Slider
                label="Points"
                min={2000}
                max={300000}
                step={2000}
                value={points}
                format={(v) => Math.round(v).toLocaleString()}
                onChange={(v) => setPoints(Math.round(v))}
              />
              <Slider
                label="Discard"
                min={0}
                max={200}
                step={5}
                value={drop}
                format={(v) => String(Math.round(v))}
                onChange={(v) => setDrop(Math.round(v))}
              />
            </div>
          </section>

          <Equations system={system} />
        </div>

        <div className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section
            ref={stage}
            data-slot="plot"
            className="relative h-[min(620px,calc(100vh-12rem))] overflow-hidden"
            style={{ background: palette.back }}
          >
            <Frame draw={draw} className="block h-full w-full" />
            {run.escaped ? (
              <Text kind="warning" as="p" className="absolute inset-x-0 top-1/2 px-8 text-center">
                The point ran away - at least one move stretches instead of shrinking, so there is
                no attractor to draw
              </Text>
            ) : null}
          </section>
          <SaveImage stage={stage} name="iterated-maps" />
          <Readout
            rows={[
              ["Points kept", run.kept.toLocaleString()],
              ["Measured box dimension", dimension ? dimension.toFixed(3) : "-"],
              [
                "Grouped by",
                mode === "by branch" || mode === "one move"
                  ? `branch, with move ${carrier + 1} as the carrier`
                  : "The last move used",
              ],
              ...maps.map(
                (_, i) => [`points from move ${i + 1}`, tally[i].toLocaleString()] as [string, string],
              ),
            ]}
          />
        </div>
      </div>
    </div>
  );
}
