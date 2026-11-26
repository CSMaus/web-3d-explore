import { createFileRoute } from "@tanstack/react-router";
import { Button, Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { Caption } from "@/components/Caption";
import { Choices } from "@/components/Choices";
import { Equations } from "@/components/Equations";
import { Readout } from "@/components/Readout";
import { RunBar } from "@/components/RunBar";
import { SaveImage } from "@/components/SaveImage";
import { TaskPage, Verdict } from "@/components/TaskPage";
import { api } from "@/lib/api";
import { L } from "@/lib/lang";
import { useRunner } from "@/lib/runner";
import { TOPIC } from "@/lib/series";
import { keepStrong } from "@/systems/series";

export const Route = createFileRoute("/topics/series/play/frequencies")({
  loader: () => api.system(TOPIC, "frequencies"),
  component: FrequenciesPage,
});

const SIDE = 256;
const MOST = 64;
const SAMPLES = [
  { id: "scene", label: L("A landscape") },
  { id: "rings", label: L("Rings") },
  { id: "text", label: L("Text") },
];

/** a SIDE by SIDE grey picture drawn by a function on a canvas; null where canvas is not there (tests) */
function greyFrom(paint: (ctx: CanvasRenderingContext2D) => void): number[] | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIDE, SIDE);
  paint(ctx);
  const data = ctx.getImageData(0, 0, SIDE, SIDE).data;
  return Array.from({ length: SIDE * SIDE }, (_, i) => Math.round(0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2]));
}

/** the three samples, painted in the page itself: soft areas, sharp rings, and sharp letters */
function sampleOf(id: string): number[] | null {
  return greyFrom((ctx) => {
    if (id === "scene") {
      const sky = ctx.createLinearGradient(0, 0, 0, SIDE);
      sky.addColorStop(0, "#5a7fb0");
      sky.addColorStop(0.6, "#e8d6b0");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, SIDE, SIDE);
      ctx.fillStyle = "#f6e7a8";
      ctx.beginPath();
      ctx.arc(180, 80, 26, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "#4a5a48";
      ctx.beginPath();
      ctx.moveTo(0, 190);
      [[40, 140], [90, 175], [140, 120], [200, 170], [256, 150], [256, 256], [0, 256]].forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.fill();
      ctx.fillStyle = "#2c352b";
      ctx.beginPath();
      ctx.moveTo(0, 225);
      [[60, 200], [130, 230], [190, 205], [256, 225], [256, 256], [0, 256]].forEach(([x, y]) => ctx.lineTo(x, y));
      ctx.fill();
    } else if (id === "rings") {
      for (let r = 120; r > 0; r -= 12) {
        ctx.fillStyle = (r / 12) % 2 ? "#202020" : "#e0e0e0";
        ctx.beginPath();
        ctx.arc(128, 128, r, 0, 2 * Math.PI);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#111111";
      ctx.font = "bold 46px Georgia, serif";
      ctx.fillText("Fourier", 22, 80);
      ctx.font = "24px Georgia, serif";
      ctx.fillText("sum of waves", 30, 130);
      ctx.font = "16px Georgia, serif";
      ctx.fillText("a b c d e f g h i j k l m", 20, 180);
      ctx.fillText("0 1 2 3 4 5 6 7 8 9", 20, 215);
    }
  });
}

/** one grey picture into a canvas element */
function GreyCanvas({ grey, label }: { grey: number[] | null; label: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || !grey) return;
    const img = ctx.createImageData(SIDE, SIDE);
    for (let i = 0; i < grey.length; i += 1) {
      img.data[4 * i] = img.data[4 * i + 1] = img.data[4 * i + 2] = grey[i];
      img.data[4 * i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [grey]);
  return <canvas ref={ref} width={SIDE} height={SIDE} role="img" aria-label={label} className="block aspect-square w-full [image-rendering:pixelated]" />;
}

/**
 * a picture cut into 8 by 8 blocks, each block written as 64 waves and rebuilt from only its
 * k strongest: the idea at the heart of JPEG. a sample painted in the page, or the reader's
 * own picture, which stays in the browser.
 */
function FrequenciesPage() {
  const system = Route.useLoaderData();
  const stage = useRef<HTMLElement | null>(null);
  const [sample, setSample] = useState("scene");
  const [own, setOwn] = useState<{ name: string; grey: number[] } | null>(null);
  const [k, setK] = useState(1);
  const [perFrame, setPerFrame] = useState(0.08);
  const runner = useRunner((n) => setK(Math.min(MOST, 1 + n)), { perFrame, stopAt: MOST - 1 });
  const grey = useMemo(() => own?.grey ?? sampleOf(sample), [own, sample]);
  const rebuilt = useMemo(() => (grey ? keepStrong(grey, SIDE, SIDE, k) : null), [grey, k]);
  const reset = () => {
    runner.reset();
    setK(1);
  };

  const upload = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const g = greyFrom((ctx) => {
        // the middle square of the picture, filling the frame
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIDE, SIDE);
      });
      URL.revokeObjectURL(url);
      if (g) {
        setOwn({ name: file.name, grey: g });
        reset();
      }
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const share = k / 64;
  const rms = rebuilt?.rms ?? 0;

  return (
    <TaskPage
      title={system?.name ?? L("A photograph kept with only its strongest waves")}
      job={L("How can a photograph be stored with far fewer numbers and still look the same? A grey photograph is a grid of tiny squares called pixels. Each pixel has a grey level from 0 (black) to 255 (white). The page cuts the picture into blocks of 8 by 8 pixels, so each block is 64 numbers. Each block can be written exactly as a sum of 64 simple patterns called waves. One wave is flat. The others go from light to dark and back, slowly or fast, across the block and down it. In a photograph most of a block is made of a few slow waves. So the page keeps only the strongest few waves in each block, throws the rest away, and rebuilds the picture from what is kept. This is the main idea of JPEG, the usual file format for photographs. The question: how few waves per block are enough before the eye notices, and which pictures show the loss first?")}
      input={
        <div className="space-y-3">
          <Choices options={SAMPLES} value={own ? "" : sample} onPick={(id) => { setOwn(null); setSample(id); reset(); }} />
          <label className="block">
            <span data-text="label">{L("Or a picture of one's own")}</span>
            <div className="mt-2">
              <Button variant="outline" size="sm" asChild>
                <span className="relative cursor-pointer">
                  {L("Choose a picture")}
                  <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={(e) => upload(e.target.files?.[0])} aria-label={L("Choose a picture")} />
                </span>
              </Button>
            </div>
          </label>
          {own ? <Text kind="note" as="p">{L("Picture in use: {{name}}, its middle square, in grey.", { name: own.name })}</Text> : null}
          <Text kind="note" as="p">{L("Run keeps one more wave in every block at each step, from 1 up to all 64. The picture stays in the browser: it is read on this page and sent nowhere.")}</Text>
        </div>
      }
      run={
        <RunBar
          running={runner.running}
          count={k}
          limit={MOST}
          what={L("waves kept per block")}
          onToggle={() => {
            if (!runner.running && k >= MOST) reset();
            runner.toggle();
          }}
          onStep={(many) => setK((v) => Math.min(MOST, v + many))}
          onReset={reset}
          perFrame={perFrame}
          onSpeed={setPerFrame}
          pace="slow"
        />
      }
      picture={
        <section className="grid grid-cols-2 gap-2">
          <div>
            <div data-slot="plot" className="overflow-hidden">
              <GreyCanvas grey={grey} label={L("The picture as it is")} />
            </div>
            <Caption>{L("Left: the picture as it is, with all 64 numbers in every block.")}</Caption>
          </div>
          <div ref={stage as React.RefObject<HTMLDivElement>}>
            <div data-slot="plot" className="overflow-hidden">
              <GreyCanvas grey={rebuilt?.out ?? null} label={L("The picture rebuilt from the strongest waves")} />
            </div>
            <Caption>{L("Right: the picture rebuilt from the {{k}} strongest waves of each block.", { k })}</Caption>
          </div>
        </section>
      }
      result={
        <div className="space-y-2">
          <Verdict good={k === 64 ? true : undefined}>
            {k === 64
              ? L("All 64 waves are kept, so the picture comes back exactly: each block went in as 64 numbers and came out as 64 numbers.")
              : L("{{k}} of the 64 waves are kept in every block, which is {{p}} per cent of the numbers. On average each pixel of the rebuilt picture is {{e}} grey levels away from the original, on a scale from 0 to 255.", { k, p: (share * 100).toFixed(1), e: rms.toFixed(1) })}
          </Verdict>
          <Readout
            rows={[
              [L("Waves kept per block"), `${k} / 64`],
              [L("Share of the numbers kept"), `${(share * 100).toFixed(1)} %`],
              [L("Average error per pixel, in grey levels from 0 to 255"), rms.toFixed(2)],
            ]}
          />
          <Text kind="note" as="p" className="pt-1">
            {L("Soft areas come back well from one or two waves. Sharp edges, rings and letters need many. With too few waves they get ripples and square blocks, the marks of a strongly compressed JPEG file. A real JPEG also rounds the waves it keeps and stores colour with fewer numbers than brightness. This page shows only the main idea.")}
          </Text>
        </div>
      }
      below={
        <>
          <SaveImage stage={stage} name="series-strong-frequencies" />
          <Equations system={system} />
        </>
      }
    />
  );
}
