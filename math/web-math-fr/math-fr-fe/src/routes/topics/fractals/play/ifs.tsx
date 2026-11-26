import { PlayColumns } from "@/components/TaskPage";
import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
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
const MODE_LABEL: Record<Mode, string> = {
  single: L("One colour"),
  "per move": L("By move"),
  "by branch": L("By branch"),
  "one move": L("One branch"),
};

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
      <Heading level={1} className="mt-4">{system?.name ?? L("Iterated maps")}</Heading>
      <Text kind="body" as="p" className="mt-2 max-w-2xl">
        {L("Can a few rules draw a fern? This page draws a shape with one point and a few moves. A move is a rule that takes a point and gives a new one: it shrinks the plane, turns it and shifts it. The page starts from one point, picks a move at random, applies it, marks the new point and repeats this about 90,000 times. The points do not scatter: they pile up on one fixed shape, at first a fern made by four moves. The chips load other shapes, and the sliders change the numbers of one move. Two things to look for: which part of the shape each move draws, and the dimension, a number that says how much of the plane the shape fills (1 for a line, 2 for a filled area).")}
      </Text>
      <PlayColumns
        input={<>
          <section data-slot="panel">
            <Label>{L("READY-MADE SHAPES")}</Label>
            <div className="mt-3">
              <Chips items={Object.keys(IFS_PRESETS).map((k) => L(k))} active={L(preset)} onPick={(item) => pickPreset(Object.keys(IFS_PRESETS).find((k) => L(k) === item) ?? item)} />
            </div>
          </section>

          <section data-slot="panel">
            <Label>{L("MOVE")}</Label>
            <div className="mt-3">
              <Chips
                items={maps.map((_, i) => L("Move {{n}}", { n: i + 1 }))}
                active={L("Move {{n}}", { n: spot + 1 })}
                onPick={(item) => setActive(maps.findIndex((_, i) => L("Move {{n}}", { n: i + 1 }) === item))}
                tint={(_, i) =>
                  mode === "single" ? undefined : palette.roles[i % palette.roles.length]
                }
              />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("The chips pick the move to change. A move sends a point with coordinates x (across) and y (up) to a new point: new x = a·x + b·y + e, new y = c·x + d·y + f. The numbers a, b, c and d shrink, stretch and turn the shape, e and f shift it. The last slider sets how often this move is picked at each step.")}
            </Text>
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
                label={L("Chance of being picked")}
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
                    {L("Move {{n}} multiplies lengths by at most {{s}}", { n: i + 1, s: s.toFixed(3) })}
                    {s < 1 ? "" : `  - ${L("more than 1, so this move stretches")}`}
                  </div>
                );
              })}
            </div>
          </section>

          <section data-slot="panel">
            <Label>{L("EQUATIONS")}</Label>
            <Text kind="note" as="p" className="mt-2">
              {L("Every move written out with its current numbers: x' and y' are the coordinates of the new point. A move has the same colour as the points it places on the picture, so changing its numbers changes the part of the shape in that colour. Tapping a move selects it for the sliders above.")}
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
            <Label>{L("COLOUR")}</Label>
            <div className="mt-3 space-y-3">
              <Chips items={MODES.map((m) => MODE_LABEL[m])} active={MODE_LABEL[mode]} onPick={(item) => setMode(MODES.find((m) => MODE_LABEL[m] === item) ?? mode)} />
              <PaletteBar />
              <Slider
                label={L("Points drawn")}
                min={2000}
                max={300000}
                step={2000}
                value={points}
                format={(v) => Math.round(v).toLocaleString()}
                onChange={(v) => setPoints(Math.round(v))}
              />
              <Slider
                label={L("Points skipped at the start")}
                min={0}
                max={200}
                step={5}
                value={drop}
                format={(v) => String(Math.round(v))}
                onChange={(v) => setDrop(Math.round(v))}
              />
              <Text kind="note" as="p">
                {L("One colour paints every point alike. By move gives each point the colour of the move that placed it. By branch gives each point the colour of the last move it went through, not counting the move that shrinks the least, because that move only repeats the whole shape a little smaller. In the fern this colours the leaves on one side of the stem, the leaves on the other side and the stem itself. One branch lights only the branch of the move chosen above. The first points are computed but not drawn, because they have not yet reached the shape.")}
              </Text>
            </div>
          </section>

          <Equations system={system} />
        </>}

        output={<>
          <section
            ref={stage}
            data-slot="plot"
            className="relative h-[min(620px,calc(100vh-12rem))] overflow-hidden"
            style={{ background: palette.back }}
          >
            <Frame draw={draw} className="block h-full w-full" />
            {run.escaped ? (
              <Text kind="warning" as="p" className="absolute inset-x-0 top-1/2 px-8 text-center">
                {L("The point flew off far away, so there is no shape to draw. This happens when a move stretches lengths (its number above is more than 1) and is picked too often.")}
              </Text>
            ) : null}
          </section>
          <SaveImage stage={stage} name="iterated-maps" />
          <Readout
            rows={[
              [L("Points on the picture"), run.kept.toLocaleString()],
              [L("Dimension (1 means a line, 2 a filled area)"), dimension ? dimension.toFixed(3) : "-"],
              [
                L("Points counted by"),
                mode === "by branch" || mode === "one move"
                  ? L("Branch (move {{n}} shrinks the least and is not counted)", { n: carrier + 1 })
                  : L("The move that placed them"),
              ],
              ...maps.map(
                (_, i) => [
                  mode === "by branch" || mode === "one move"
                    ? L("Points on the branch of move {{n}}", { n: i + 1 })
                    : L("Points placed by move {{n}}", { n: i + 1 }),
                  tally[i].toLocaleString(),
                ] as [string, string],
              ),
            ]}
          />
        </>}
      />
    </div>
  );
}
