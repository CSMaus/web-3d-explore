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
import { PlayColumns } from "@/components/TaskPage";

export const Route = createFileRoute("/topics/fractals/play/lichtenberg")({
  loader: () => api.system(TOPIC, "lichtenberg"),
  component: LichtenbergPage,
});

const WHERE = ["From one point", "Between two plates"] as const;

function LichtenbergPage() {
  const system = Route.useLoaderData();
  const palette = useLook((s) => s.palette);
  const stage = useRef<HTMLElement | null>(null);
  const [where, setWhere] = useState<string>(WHERE[1]);
  const [cols, setCols] = useState(121);
  const [eta, setEta] = useState(1);
  const [sites, setSites] = useState(400);
  const [seed, setSeed] = useState(9);
  const [warm, setWarm] = useState(12);

  const mode = where === WHERE[0] ? "point" : "gap";
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
      <PlayColumns
        input={<>
          <section data-slot="panel">
            <Label>{L("WHERE THE SPARK STARTS")}</Label>
            <div className="mt-3">
              <Chips items={WHERE.map((w) => L(w))} active={L(where)} onPick={(item) => setWhere(WHERE.find((w) => L(w) === item) ?? item)} />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("How does an electric spark choose its path through glass or wood? The picture is a block of such a material, which does not conduct electricity, cut into small square cells. The spark burns one cell at a time and leaves a branching mark. From one point: the spark starts at the centre of the block and spreads in every direction. A burn mark of this kind is called a Lichtenberg figure. Between two plates: the spark starts at the upper plate and grows down towards the lower plate, like a lightning bolt crossing a gap. The two plates are the thick bars along the top and bottom of the picture.")}
            </Text>
          </section>

          <section data-slot="panel">
            <Label>{L("GROWTH RULE")}</Label>
            <div className="mt-3 space-y-2">
              <Slider label={L("Field power η")} min={0} max={3} step={0.05} value={eta} format={(v) => v.toFixed(2)} onChange={setEta} />
              <Slider label={L("Block width in cells")} min={61} max={161} step={10} value={cols} format={(v) => String(Math.round(v))} onChange={(v) => setCols(Math.round(v))} />
              <Slider label={L("Cells to burn")} min={40} max={900} step={20} value={sites} format={(v) => String(Math.round(v))} onChange={(v) => setSites(Math.round(v))} />
              <Slider label={L("Averaging rounds per new cell")} min={4} max={40} step={1} value={warm} format={(v) => String(Math.round(v))} onChange={(v) => setWarm(Math.round(v))} />
              <Slider label={L("Random seed")} min={1} max={200} step={1} value={seed} format={(v) => String(Math.round(v))} onChange={(v) => setSeed(Math.round(v))} />
              <PaletteBar />
            </div>
            <Text kind="note" as="p" className="mt-3">
              {L("The burn has voltage 0. The outer edge of the block, or the lower plate, has voltage 1. The electric field at a cell is how sharply the voltage changes there. It is strongest at the tips of the burn, because they come closest to voltage 1. The faint shading in the picture shows the field: the more solid the shading, the stronger the field.")}
            </Text>
            <Text kind="note" as="p" className="mt-3">
              {L("Field power η (the Greek letter eta): each cell touching the burn gets a weight, equal to the field at that cell raised to this power. A cell with twice the weight is twice as likely to burn next. At 0 every weight is 1, so the field does not matter. Every cell touching the burn is equally likely, and the burn grows into a dense bush. The higher the power, the more often the cells with the strongest field win. These cells sit at the tips, so the burn turns into a few thin bolts.")}
            </Text>
            <Text kind="note" as="p" className="mt-3">
              {L("Block width: how many cells across the block is. Between two plates, a wider block also has a wider gap: 61 cells across gives 40 rows from top to bottom. Cells to burn: the growth stops after this many cells. Averaging rounds: after each new cell, the program works out the voltage again. In one round every cell takes the average of its four neighbours. More rounds give a more exact field and a slower run. Random seed: a number that fixes the chain of random choices, so the same seed always gives the same burn.")}
            </Text>
          </section>

          <Equations system={system} />
        </>}

        output={<>
          <section ref={stage} data-slot="plot" className="h-[min(620px,calc(100vh-12rem))] overflow-hidden" style={{ background: palette.back }}>
            <Frame draw={draw} className="block h-full w-full" />
          </section>
          <SaveImage stage={stage} name="lichtenberg" />
          <Readout
            rows={[
              [L("Cells burned"), tick ? L("{{lit}} of {{sites}}", { lit: tick.order.length.toLocaleString(), sites }) : L("Starting")],
              [L("Block size in cells"), L("{{cols}} wide, {{rows}} high", { cols, rows })],
              [L("Dimension, measured by counting boxes"), dimension ? dimension.toFixed(3) : "-"],
              [
                L("Status"),
                tick?.done
                  ? mode === "point"
                    ? L("Stopped: a branch reached the edge of the block")
                    : L("Stopped: the burn reached the lower plate")
                  : tick?.finished
                    ? L("Stopped: all the cells set on the slider have burned")
                    : L("Growing"),
              ],
            ]}
          />
          <Text kind="note" as="p" className="mt-3">
            {L("Dimension: a number that says how fully a shape fills a flat picture. A line has dimension 1, a filled square has dimension 2, and a branching burn lies between. It is measured by covering the picture with square boxes, counting the boxes the burn touches, and repeating with smaller boxes. How fast the count grows as the boxes shrink gives the dimension. A dash means fewer than 120 cells have burned, too few to measure.")}
          </Text>
        </>}
      />
    </div>
  );
}
