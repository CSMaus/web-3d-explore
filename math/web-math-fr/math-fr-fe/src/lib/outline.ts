import { outlineOf, resample, type C } from "@/systems/series";

export const SIDE = 300;
export const POINTS = 512;
/** the samples are drawn as text and then read back like any uploaded picture */
export const GLYPHS = [
  { id: "pi", label: "π", glyph: "π" },
  { id: "sigma", label: "∑", glyph: "∑" },
  { id: "amp", label: "&", glyph: "&" },
  { id: "three", label: "3", glyph: "3" },
];

/** a picture of SIDE by SIDE grey values, from an image or from a glyph; null where canvas is not there (tests) */
export function greyOf(draw: (ctx: CanvasRenderingContext2D) => void): Uint8ClampedArray | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = SIDE;
  canvas.height = SIDE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SIDE, SIDE);
  draw(ctx);
  const data = ctx.getImageData(0, 0, SIDE, SIDE).data;
  const grey = new Uint8ClampedArray(SIDE * SIDE);
  for (let i = 0; i < grey.length; i += 1) grey[i] = Math.round(0.299 * data[4 * i] + 0.587 * data[4 * i + 1] + 0.114 * data[4 * i + 2]);
  return grey;
}

/** the outline as N points centred on the origin, scaled into the unit square, y up */
export function shapeOf(grey: Uint8ClampedArray | null): C[] {
  if (!grey) return [];
  const raw = outlineOf(grey, SIDE, SIDE);
  if (raw.length < 24) return [];
  const pts = resample(raw, POINTS);
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  const reach = Math.max(...pts.map((p) => Math.hypot(p[0] - mx, p[1] - my))) || 1;
  return pts.map((p) => [(p[0] - mx) / reach, -(p[1] - my) / reach]);
}

export function glyphShape(glyph: string): C[] {
  return shapeOf(
    greyOf((ctx) => {
      ctx.fillStyle = "#000000";
      ctx.font = `bold ${Math.round(SIDE * 0.8)}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(glyph, SIDE / 2, SIDE / 2 + SIDE * 0.04);
    }),
  );
}

export function imageGrey(img: HTMLImageElement): Uint8ClampedArray | null {
  return greyOf((ctx) => {
    const scale = Math.min(SIDE / img.width, SIDE / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (SIDE - w) / 2, (SIDE - h) / 2, w, h);
  });
}
