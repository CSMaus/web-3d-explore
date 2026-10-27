import { createFileRoute } from "@tanstack/react-router";
import { L } from "@/lib/lang";
import { Label, Text, Heading } from "@kit/index";
import { useCallback, useMemo, useRef, useState } from "react";
import { Chips } from "@/components/Chips";
import { Equations } from "@/components/Equations";
import { Frame } from "@/components/Frame";
import { PaletteBar } from "@/components/PaletteBar";
import { Readout } from "@/components/Readout";
import { SaveImage } from "@/components/SaveImage";
import { Slider } from "@/components/Slider";
import { api } from "@/lib/api";
import { TOPIC } from "@/lib/systems";
import { useGrower } from "@/lib/grower";
import { useLook } from "@/lib/store";
import { boxDim } from "@/systems/ifs";

export const Route = createFileRoute("/topics/fractals/play/lichtenberg")({
  loader: () => api.system(TOPIC, "lichtenberg"),
  component: LichtenbergPage,
});

const WHERE = ["Point source", "Plate gap"] as const;

function LichtenbergPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [where, setWhere] = useState<string>(WHERE[0]);
  const [cols, setCols] = useState(121);
  const [eta, setEta] = useState(1);
  const [sites, setSites] = useState(400);
  const [seed, setSeed] = useState(9);
  const [warm, setWarm] = useState(12);

  const mode = where === "point source" ? "point" : "gap";
  const rows = mode === "point" ? Math.round(cols * 1.04) : Math.max(40, Math.round(cols * 0.58));

  const job = useMemo(
    () =>
      ({ kind: "dbm", mode, cols, rows, eta, sites, seed, sweeps: 300, warm }) as const,
    [mode, cols, rows, eta, sites, seed, warm],
  );
  const tick = useGrower(job);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = palette.back;
      ctx.fillRect(0, 0, w, h);
      if (!tick || tick.kind !== "dbm") return;
      const cell = Math.min(w / tick.cols, h / tick.rows);
      const ox = (w - cell * tick.cols) / 2;
      const oy = (h - cell * tick.rows) / 2;

      if (tick.phi) {
        const phi = tick.phi;
        const mag = new Float32Array(tick.rows * tick.cols);
        let peak = 0;
        for (let r = 1; r < tick.rows - 1; r++) {
          for (let c = 1; c < tick.cols - 1; c++) {
            const i = r * tick.cols + c;
            const gy = phi[i + tick.cols] - phi[i - tick.cols];
            const gx = phi[i + 1] - phi[i - 1];
            const m = Math.hypot(gx, gy);
            mag[i] = m;
            if (m > peak) peak = m;
          }
        }
        const glow = palette.roles[2] ?? palette.roles[0];
        ctx.save();
        for (let r = 0; r < tick.rows; r++) {
          for (let c = 0; c < tick.cols; c++) {
            const t = peak > 0 ? Math.pow(Math.min(mag[r * tick.cols + c] / peak, 1), 0.8) : 0;
            if (t < 0.04) continue;
            ctx.globalAlpha = t * 0.7;
            ctx.fillStyle = glow;
            ctx.fillRect(ox + c * cell, oy + r * cell, Math.max(1, cell), Math.max(1, cell));
          }
        }
        ctx.restore();
      }

      if (mode === "gap") {
        ctx.fillStyle = palette.ink;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(ox, oy, cell * tick.cols, Math.max(2, cell));
        ctx.fillRect(ox, oy + cell * (tick.rows - 1), cell * tick.cols, Math.max(2, cell));
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = palette.roles[1] ?? palette.ink;
      const side = Math.max(1, cell);
      for (let i = 0; i < tick.order.length; i++) {
        const at = tick.order[i];
        ctx.fillRect(ox + (at % tick.cols) * cell, oy + Math.floor(at / tick.cols) * cell, side, side);
      }
    },
    [tick, palette, mode],
  );

  const dimension = useMemo(() => {
    if (!tick) return null;
    const xs = new Float64Array(tick.order.length);
    const ys = new Float64Array(tick.order.length);
    for (let i = 0; i < tick.order.length; i++) {
      xs[i] = tick.order[i] % tick.cols;
      ys[i] = Math.floor(tick.order[i] / tick.cols);
    }
    return boxDim(xs, ys, tick.order.length, { least: 120, cuts: [2, 4, 8, 16] });
  }, [tick]);

  return (
    <div>
      <Heading level={1} className="mt-4">{system?.name ?? L("Dielectric breakdown")}</Heading>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div data-slot="task-in" className="min-w-0 space-y-4">
          <section data-slot="panel">
            <Label>{L("SOURCE")}</Label>
            <div className="mt-3">
              <Chips items={WHERE.map((w) => L(w))} active={L(where)} onPick={(item) => setWhere(WHERE.find((w) => L(w) === item) ?? item)} />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("From a point is the Lichtenberg figure: charge injected at one spot in an insulator, branching out in every direction, the burn left in glass or wood. Across a gap is the same model with two plates, which is a bolt crossing the gap.")}
            </Text>
          </section>

          <section data-slot="panel">
            <Label>{L("MODEL")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("Roughness")} min={0} max={3} step={0.05} value={eta} format={(v) => v.toFixed(2)} onChange={setEta} />
              <Slider label={L("Grid width")} min={61} max={161} step={10} value={cols} format={(v) => String(Math.round(v))} onChange={(v) => setCols(Math.round(v))} />
              <Slider label={L("Sites")} min={40} max={900} step={20} value={sites} format={(v) => String(Math.round(v))} onChange={(v) => setSites(Math.round(v))} />
              <Slider label={L("Sweeps per site")} min={4} max={40} step={1} value={warm} format={(v) => String(Math.round(v))} onChange={(v) => setWarm(Math.round(v))} />
              <Slider label={L("Seed")} min={1} max={200} step={1} value={seed} format={(v) => String(Math.round(v))} onChange={(v) => setSeed(Math.round(v))} />
              <PaletteBar />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("At roughness 0 every edge site is equally likely; raise it and the tips take over.")}
            </Text>
          </section>

          <Equations system={system} />
        </div>

        <div data-slot="task-out" className="min-w-0 space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section ref={stage} data-slot="plot" className="h-[min(620px,calc(100vh-12rem))] overflow-hidden" style={{ background: palette.back }}>
            <Frame draw={draw} className="block h-full w-full" />
          </section>
          <SaveImage stage={stage} name="lichtenberg" />
          <Readout
            rows={[
              [L("Sites lit"), tick ? L("{{lit}} of {{sites}}", { lit: tick.order.length.toLocaleString(), sites }) : L("starting")],
              [L("grid"), L("{{cols}} by {{rows}}", { cols, rows })],
              [L("Measured box dimension"), dimension ? dimension.toFixed(3) : "-"],
              [
                L("state"),
                tick?.done
                  ? mode === "point"
                    ? L("A branch reached the edge of the block")
                    : L("The tree reached the far plate")
                  : tick?.finished
                    ? L("finished")
                    : L("growing"),
              ],
            ]}
          />
        </div>
      </div>
    </div>
  );
}
