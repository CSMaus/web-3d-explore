import { useRef, useState } from "react";
import { Choices, Readout, Verdict } from "@kit/index";
import type { Pen } from "@/components/Plot";
import { EDGE, FAINT, GROUND, INK, MUTED, ONE, SKY, TWO } from "@/lib/draw";
import { L } from "@/lib/lang";
import { Live } from "./Live";
import { ease, fill, ink, outline, say, shape } from "./paint";

/**
 * the figures of WebPAUT, on a simulated inspection: a steel plate 120 mm long and 40 mm thick
 * with one flat flaw inside it, 12 mm long at 22 mm deep. a probe on the top surface fires a fan
 * of beams; what comes back is drawn as the sector view, the echo trace of the straight-down beam,
 * and the strongest echo at every probe position. the flaw is found the way WebPAUT finds one: a
 * threshold set from the noise of a clean reference stretch (its mean plus four standard
 * deviations, 12 dB), and sized where the echo falls to half its peak (the 6 dB drop).
 */

const LONG = 120;
const THICK = 40;
const FLAW = { x0: 60, x1: 72, depth: 22 };
const GATE: [number, number] = [3, 36];
const REFERENCE: [number, number] = [5, 40];
const SPREAD = 2.4;
const FAN = (32 * Math.PI) / 180;
const GAINS = [1, 1.6, 2.5];

/** the normal distribution's share below z */
function below(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z / Math.SQRT2));
  const e = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? 0.5 * (1 + e) : 0.5 * (1 - e);
}

/** grain noise: the same small value for the same place, every time */
function grain(a: number, b: number): number {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return (s - Math.floor(s)) * 0.06;
}

/** the echo from a point of the plate reached by a beam at angle th from the probe at p */
function echo(p: number, th: number, r: number): number {
  const depth = r * Math.cos(th);
  if (depth > THICK + 1.5) return 0;
  const hit = p + FLAW.depth * Math.tan(th);
  const wide = SPREAD / Math.cos(th);
  const flaw = (below((FLAW.x1 - hit) / wide) - below((FLAW.x0 - hit) / wide)) * Math.exp(-(((depth - FLAW.depth) / 1.1) ** 2)) * Math.cos(th) ** 4;
  const wall = 0.75 * Math.exp(-(((depth - THICK) / 1.2) ** 2)) * Math.cos(th) ** 6 * (1 - 0.9 * flawShadow(p, th));
  return Math.min(1, flaw + wall + grain(Math.round(p * 2), Math.round(r * 3) + Math.round(th * 40) * 97));
}

/** how much of the beam the flaw hides from the back wall */
function flawShadow(p: number, th: number): number {
  const hit = p + FLAW.depth * Math.tan(th);
  const wide = SPREAD / Math.cos(th);
  return below((FLAW.x1 - hit) / wide) - below((FLAW.x0 - hit) / wide);
}

/** the strongest echo inside the gate on the straight-down beam, at every half millimetre */
const PROFILE: number[] = Array.from({ length: LONG * 2 + 1 }, (_, i) => {
  let most = 0;
  for (let r = GATE[0]; r <= GATE[1]; r += 0.25) most = Math.max(most, echo(i / 2, 0, r));
  return most;
});

const NOISE = (() => {
  const ref = PROFILE.slice(REFERENCE[0] * 2, REFERENCE[1] * 2 + 1);
  const mean = ref.reduce((a, b) => a + b, 0) / ref.length;
  const sd = Math.sqrt(ref.reduce((a, b) => a + (b - mean) ** 2, 0) / ref.length);
  return { mean, sd, threshold: mean + 10 ** (12 / 20) * sd };
})();

const PEAK = PROFILE.reduce((best, v, i) => (v > PROFILE[best] ? i : best), 0);
/** the stretch round the peak where the echo stays above half the peak */
const SIZED = (() => {
  let a = PEAK;
  let b = PEAK;
  while (a > 0 && PROFILE[a - 1] >= PROFILE[PEAK] / 2) a--;
  while (b < PROFILE.length - 1 && PROFILE[b + 1] >= PROFILE[PEAK] / 2) b++;
  return { from: a / 2, to: b / 2 };
})();

/** a colour for an echo between nothing and full scale: the light, stronger with the echo, over whatever is behind */
function heat(v: number): string {
  const k = Math.max(0, Math.min(1, v));
  return ink(k < 0.55 ? SKY : ONE, 0.08 + 0.92 * k);
}

/** where the plate sits in a figure: its left edge, its top, and world units per millimetre */
type Place = { x: number; y: number; k: number };

function plate(pen: Pen, at: Place, weld = true) {
  fill(pen, at.x, at.y - THICK * at.k, LONG * at.k, THICK * at.k, FAINT, 0.4);
  outline(pen, at.x, at.y - THICK * at.k, LONG * at.k, THICK * at.k, EDGE, 1, 0);
  if (weld) {
    // the weld: a V of filler metal across the plate
    const mid = at.x + 66 * at.k;
    shape(pen, [[mid - 9 * at.k, at.y], [mid + 9 * at.k, at.y], [mid + 2 * at.k, at.y - THICK * at.k], [mid - 2 * at.k, at.y - THICK * at.k]], EDGE, 0.35);
  }
}

function flawMark(pen: Pen, at: Place, colour = TWO) {
  const y = at.y - FLAW.depth * at.k;
  pen.line([[at.x + FLAW.x0 * at.k, y], [at.x + FLAW.x1 * at.k, y]], colour, 2.5);
}

/** the sector view inside the fan of beams, drawn as small cells of echo */
function sector(pen: Pen, at: Place, p: number, gain: number, cells = 46) {
  const ox = at.x + p * at.k;
  const reach = (THICK + 2) / Math.cos(FAN);
  const ctx = pen.ctx;
  for (let i = 0; i < cells; i++) {
    const th0 = -FAN + (2 * FAN * i) / cells;
    const th1 = th0 + (2 * FAN) / cells;
    const th = (th0 + th1) / 2;
    const rows = Math.round(cells * 1.2);
    for (let j = 0; j < rows; j++) {
      const r0 = (reach * j) / rows;
      const r1 = (reach * (j + 1)) / rows;
      const r = (r0 + r1) / 2;
      if (r * Math.cos(th) > THICK) break;
      // the fan is drawn only inside the plate
      const across = p + r * Math.sin(th);
      if (across < 0 || across > LONG) continue;
      const v = Math.min(1, echo(p, th, r) * gain);
      ctx.fillStyle = heat(v);
      ctx.beginPath();
      const pts: [number, number][] = [
        [ox + r0 * Math.sin(th0) * at.k, at.y - r0 * Math.cos(th0) * at.k],
        [ox + r1 * Math.sin(th0) * at.k, at.y - r1 * Math.cos(th0) * at.k],
        [ox + r1 * Math.sin(th1) * at.k, at.y - r1 * Math.cos(th1) * at.k],
        [ox + r0 * Math.sin(th1) * at.k, at.y - r0 * Math.cos(th1) * at.k],
      ];
      pts.forEach(([x, y], n) => (n ? ctx.lineTo(pen.px(x), pen.py(y)) : ctx.moveTo(pen.px(x), pen.py(y))));
      ctx.closePath();
      ctx.fill();
    }
  }
  // the probe on the surface
  fill(pen, ox - 3 * at.k, at.y, 6 * at.k, 2.2 * at.k, INK);
}

/** the probe's position when nobody holds it: a slow sweep along the plate */
function sweep(t: number): number {
  return 12 + (LONG - 24) * (0.5 - 0.5 * Math.cos(t * 0.3));
}

export function WebpautThumb() {
  return (
    <Live
      label={L("A probe sliding along a welded plate, its fan of sound lighting up a hidden flaw")}
      fps={15}
      still={5.65}
      className="h-full"
      draw={(pen, t) => {
        const at = { x: 0.5, y: 7.4, k: 15 / LONG };
        plate(pen, at);
        sector(pen, at, sweep(t), 1.6, 26);
      }}
    />
  );
}

export function WebpautHero() {
  const [held, setHeld] = useState<number | null>(null);
  const [p, setP] = useState(sweep(5.65));
  const [gain, setGain] = useState(1.6);
  // the flaw shows once every position of its echo has been scanned
  const [found, setFound] = useState(false);
  const seen = useRef(new Uint8Array(PROFILE.length));
  const cross: Place = { x: 0.3, y: 8.2, k: 10 / LONG };
  const mark = (q: number) => {
    const i = Math.round(q * 2);
    for (let j = Math.max(0, i - 2); j <= Math.min(PROFILE.length - 1, i + 2); j++) seen.current[j] = 1;
  };
  return (
    <div className="space-y-3">
      <Live
        label={L("A simulated weld inspection: the plate with its probe and fan of beams, the echo trace, and the echo along the scan")}
        fps={held === null ? 20 : 8}
        still={5.65}
        className="aspect-[16/9] w-full"
        deps={[held, gain, found]}
        onDrag={(x, y) => {
          if (y < 4.4 || x > 10.4) return;
          const q = Math.max(0, Math.min(LONG, (x - cross.x) / cross.k));
          setHeld(q);
          setP(q);
          mark(q);
        }}
        draw={(pen, t) => {
          const now = held ?? sweep(t);
          mark(now);
          if (held === null && Math.abs(now - p) > 0.5) queueMicrotask(() => setP(now));
          plate(pen, cross);
          sector(pen, cross, now, gain);
          say(pen, L("Drag the probe along the plate"), cross.x, 8.75, MUTED, { size: 12 });
          // the echo trace of the straight-down beam, its depth on the same scale as the plate
          const ax = 10.9;
          const aw = 4.8;
          const depthY = (d: number) => cross.y - d * cross.k;
          outline(pen, ax, depthY(45), aw, 45 * cross.k, EDGE, 1, 2);
          fill(pen, ax, depthY(GATE[1]), aw, (GATE[1] - GATE[0]) * cross.k, SKY, 0.05);
          const trace: [number, number][] = [];
          for (let r = 0; r <= 45; r += 0.2) trace.push([ax + Math.min(1, echo(now, 0, r) * gain) * aw * 0.95, depthY(r)]);
          pen.line(trace, ONE, 1.2);
          say(pen, L("Echo trace, straight down"), ax, cross.y + 0.35, MUTED, { size: 11 });
          say(pen, L("gate"), ax + aw - 0.1, depthY(GATE[1]) + 0.15, MUTED, { size: 10, align: "right" });
          // how to read the colours of the fan
          const kx = 10.9;
          for (let i = 0; i < 40; i++) fill(pen, kx + (i / 40) * 4.8, 2.2, 4.8 / 40 + 0.01, 0.4, heat(i / 39));
          say(pen, L("weak echo"), kx, 1.65, MUTED, { size: 10 });
          say(pen, L("strong echo"), kx + 4.8, 1.65, MUTED, { size: 10, align: "right" });
          say(pen, L("Colours of the fan"), kx, 2.95, MUTED, { size: 11 });
          // the strongest echo at every probe position seen so far
          const bx = 0.3;
          const bw = 10;
          const by = 0.5;
          const bh = 3.0;
          outline(pen, bx, by, bw, bh, EDGE, 1, 2);
          fill(pen, bx + (REFERENCE[0] / LONG) * bw, by, ((REFERENCE[1] - REFERENCE[0]) / LONG) * bw, bh, MUTED, 0.08);
          const line: [number, number][] = [];
          PROFILE.forEach((v, i) => line.push(seen.current[i] ? [bx + (i / 2 / LONG) * bw, by + Math.min(1, v * gain) * bh * 0.95] : [NaN, NaN]));
          pen.line(line, ONE, 1.2);
          const ty = by + Math.min(1, NOISE.threshold * gain) * bh * 0.95;
          pen.line([[bx, ty], [bx + bw, ty]], TWO, 1);
          say(pen, L("threshold"), bx + bw - 0.1, ty + 0.15, TWO, { size: 10, align: "right" });
          say(pen, L("reference"), bx + (REFERENCE[0] / LONG) * bw + 0.1, by + bh - 0.35, MUTED, { size: 10 });
          const px = bx + (now / LONG) * bw;
          pen.line([[px, by], [px, by + bh]], INK, 1);
          const whole = seen.current.slice(SIZED.from * 2, SIZED.to * 2 + 1).every(Boolean);
          if (whole && !found) queueMicrotask(() => setFound(true));
          if (whole) {
            const a = bx + (SIZED.from / LONG) * bw;
            const b = bx + (SIZED.to / LONG) * bw;
            const hy = by + Math.min(1, (PROFILE[PEAK] / 2) * gain) * bh * 0.95;
            pen.line([[a, hy], [b, hy]], SKY, 2);
            say(pen, L("6 dB"), b + 0.15, hy - 0.1, SKY, { size: 10 });
            flawMark(pen, cross, TWO);
          }
          say(pen, L("Strongest echo at each probe position"), bx, by + bh + 0.3, MUTED, { size: 11 });
        }}
      />
      <Verdict good={found ? true : undefined}>
        {found
          ? L("Flaw found and sized: {{len}} mm long at {{depth}} mm deep. The simulated flaw is 12 mm long.", { len: (SIZED.to - SIZED.from).toFixed(1), depth: FLAW.depth })
          : L("Move the probe across the weld: the flaw shows once its whole echo has been scanned.")}
      </Verdict>
      <Readout
        rows={[
          [L("Probe position"), L("{{v}} mm", { v: p.toFixed(1) })],
          [L("Echo on the straight-down beam"), L("{{v}} % of full scale", { v: Math.round(Math.min(1, PROFILE[Math.round(p * 2)] * gain) * 100) })],
          [L("Threshold from the reference noise"), L("{{v}} % of full scale", { v: Math.round(Math.min(1, NOISE.threshold * gain) * 100) })],
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <span data-text="label">{L("Gain")}</span>
        <Choices
          options={GAINS.map((g) => ({ id: String(g), label: `+${(20 * Math.log10(g)).toFixed(0)} dB` }))}
          value={String(gain)}
          onPick={(id) => setGain(Number(id))}
        />
        <span data-text="note" className="text-muted-foreground">{L("The threshold rises with the gain, because it is set from the noise.")}</span>
      </div>
    </div>
  );
}

/** a pulse going down, part of it coming back from the flaw and the rest from the back wall */
export function WebpautPulse() {
  return (
    <Live
      label={L("A pulse of sound travelling into the plate and its echoes coming back, drawn as the echo trace")}
      still={2.6}
      draw={(pen, t) => {
        const at = { x: 0.5, y: 7.6, k: 7 / THICK / 1.1 };
        const p = 66;
        const cycle = (t % 4) / 4;
        const left = at.x - (p - 20) * at.k;
        fill(pen, at.x, at.y - THICK * at.k, 6.6, THICK * at.k, FAINT, 0.4);
        outline(pen, at.x, at.y - THICK * at.k, 6.6, THICK * at.k, EDGE, 1, 0);
        pen.line([[left + FLAW.x0 * at.k, at.y - FLAW.depth * at.k], [left + FLAW.x1 * at.k, at.y - FLAW.depth * at.k]], TWO, 2.5);
        const ox = left + p * at.k + 0.6;
        fill(pen, ox - 0.6, at.y, 1.2, 0.4, INK);
        // the pulse: down to the wall and back up, its depth at this moment
        const depth = cycle < 0.5 ? (cycle / 0.5) * THICK : ((1 - cycle) / 0.5) * THICK;
        const y = at.y - depth * at.k;
        pen.line([[ox - 0.9, y], [ox + 0.9, y]], SKY, 3);
        if (cycle > FLAW.depth / THICK / 2 && cycle < 1 - FLAW.depth / THICK / 2) {
          // the part sent back by the flaw, on its way up
          const back = FLAW.depth - (cycle - FLAW.depth / THICK / 2) * 2 * THICK;
          if (back > 0) pen.line([[ox - 0.5, at.y - back * at.k], [ox + 0.5, at.y - back * at.k]], TWO, 2);
        }
        // the echo trace so far: time on the across axis
        const tx = 8.2;
        const tw = 7.4;
        const ty = 2;
        outline(pen, tx, ty, tw, 5, EDGE, 1, 2);
        const trace: [number, number][] = [];
        for (let s = 0; s <= cycle; s += 0.004) {
          const d = s * THICK;
          const v = 0.9 * Math.exp(-(((d - FLAW.depth) / 0.9) ** 2)) + 0.6 * Math.exp(-(((d - THICK) / 0.9) ** 2)) + 0.5 * Math.exp(-((d / 0.7) ** 2)) + grain(s * 500, 3);
          trace.push([tx + s * tw, ty + v * 4.4]);
        }
        pen.line(trace, ONE, 1.2);
        say(pen, L("flaw"), tx + (FLAW.depth / THICK) * tw, ty + 4.6, TWO, { size: 11, align: "center", alpha: ease(cycle, FLAW.depth / THICK, FLAW.depth / THICK + 0.05) });
        say(pen, L("back wall"), tx + tw - 0.2, ty + 3.1, MUTED, { size: 11, align: "right", alpha: ease(cycle, 0.95, 1) });
        say(pen, L("time"), tx + tw, ty - 0.45, MUTED, { size: 10, align: "right" });
      }}
    />
  );
}

/** the probe moving along, each position adding one column of the side view */
export function WebpautBscan() {
  return (
    <Live
      label={L("The probe moving along the plate, each position adding one column to a picture of the inside")}
      still={5}
      fps={20}
      draw={(pen, t) => {
        const at = { x: 0.6, y: 7.4, k: 14.8 / LONG };
        const front = ((t % 7) / 6) * LONG;
        const cols = 90;
        for (let i = 0; i < cols; i++) {
          const p = (i / cols) * LONG;
          if (p > front) break;
          for (let j = 0; j < 30; j++) {
            const d = ((j + 0.5) / 30) * THICK;
            fill(pen, at.x + p * at.k, at.y - ((j + 1) / 30) * THICK * at.k, (LONG / cols) * at.k + 0.01, (THICK / 30) * at.k + 0.01, heat(Math.min(1, echo(p, 0, d) * 1.6)));
          }
        }
        outline(pen, at.x, at.y - THICK * at.k, LONG * at.k, THICK * at.k, EDGE, 1, 0);
        fill(pen, at.x + Math.min(front, LONG) * at.k - 0.3, at.y, 0.6, 0.35, INK);
        say(pen, L("probe position"), at.x + LONG * at.k, at.y + 0.7, MUTED, { size: 10, align: "right" });
        say(pen, L("depth"), at.x - 0.1, at.y - THICK * at.k - 0.45, MUTED, { size: 10 });
      }}
    />
  );
}

/** the whole file on the server, a window of it on the screen, and only that window travelling */
export function WebpautStream() {
  return (
    <Live
      label={L("The whole scan stays on the server; only the part on screen travels to the browser")}
      still={2}
      draw={(pen, t) => {
        // the volume: slices stacked in depth
        for (let k = 5; k >= 0; k--) {
          const o = k * 0.28;
          fill(pen, 0.6 + o, 1.6 + o, 5, 4.4, k ? FAINT : GROUND, k ? 0.7 : 1);
          outline(pen, 0.6 + o, 1.6 + o, 5, 4.4, EDGE, 1, 2);
        }
        const zoom = 0.55 + 0.25 * Math.sin(t * 0.6);
        const vx = 0.9 + (1 + Math.sin(t * 0.4)) * 1.2;
        const vy = 2.0 + (1 + Math.cos(t * 0.5)) * 0.6;
        outline(pen, vx, vy, 3.6 * zoom, 2.6 * zoom, ONE, 1.6, 2);
        say(pen, L("Server: the whole scan"), 0.6, 0.8, MUTED, { size: 11 });
        // the screen
        outline(pen, 11, 2.3, 4.4, 3.4, EDGE, 1.2, 4);
        fill(pen, 11.2, 2.5, 4, 3, SKY, 0.12 + 0.1 * zoom);
        pen.line([[12.4, 1.6], [14, 1.6]], EDGE, 2);
        say(pen, L("Browser: the pixels on screen"), 15.4, 0.8, MUTED, { size: 11, align: "right" });
        // the packets along the line between them
        pen.line([[7.4, 4], [10.8, 4]], EDGE, 1);
        for (let i = 0; i < 4; i++) {
          const s = (t * 0.7 + i / 4) % 1;
          fill(pen, 7.4 + s * 3.2, 3.8, 0.4, 0.4, ONE, 1 - Math.abs(s - 0.5));
        }
        say(pen, L("one websocket"), 9.1, 4.5, MUTED, { size: 10, align: "center" });
      }}
    />
  );
}

/** the top view with its noise, the flaw found by the threshold, sized, and written into the report */
export function WebpautReport() {
  const cells = 40;
  const field: number[][] = Array.from({ length: cells }, (_, i) =>
    Array.from({ length: Math.round(cells / 2) }, (_, j) => {
      const x = (i / cells) * LONG;
      const y = (j / (cells / 2)) * 40;
      const fx = below((FLAW.x1 - x) / SPREAD) - below((FLAW.x0 - x) / SPREAD);
      const fy = below((23 - y) / SPREAD) - below((17 - y) / SPREAD);
      return fx * fy + grain(i * 3.1, j * 7.3) * 1.4;
    }),
  );
  return (
    <Live
      label={L("A top view of the plate with its noise, the flaw boxed by the threshold, and its line in the report")}
      still={6}
      draw={(pen, t) => {
        const cycle = t % 8;
        const x0 = 0.5;
        const y0 = 1;
        const w = 9;
        const h = 5.4;
        field.forEach((col, i) =>
          col.forEach((v, j) => fill(pen, x0 + (i / cells) * w, y0 + (j / col.length) * h, w / cells + 0.01, h / col.length + 0.01, heat(Math.min(1, v * 1.5)))),
        );
        outline(pen, x0, y0, w, h, EDGE, 1, 0);
        const box = ease(cycle, 1.5, 2.2);
        if (box > 0) {
          const bx = x0 + (FLAW.x0 / LONG) * w;
          const bw = ((FLAW.x1 - FLAW.x0) / LONG) * w;
          const by = y0 + (17 / 40) * h;
          const bh = (6 / 40) * h;
          outline(pen, bx - 0.15, by - 0.15, bw + 0.3, bh + 0.3, TWO, 1.6 * box, 2);
          say(pen, L("12 × 6 mm"), bx + bw / 2, by + bh + 0.45, TWO, { size: 11, align: "center", alpha: box });
        }
        say(pen, L("Top view"), x0, y0 + h + 0.4, MUTED, { size: 11 });
        // the report
        outline(pen, 10.3, 1, 5.3, 5.4, EDGE, 1, 4);
        say(pen, L("Report"), 10.6, 5.8, INK, { size: 12, bold: true });
        const lines = [L("Defect 1"), L("Length 12 mm"), L("Width 6 mm"), L("Depth 22 mm"), L("Peak above threshold")];
        lines.forEach((s, i) => say(pen, s, 10.6, 5 - i * 0.75, i ? MUTED : INK, { size: 11, alpha: ease(cycle, 2.4 + i * 0.4, 2.8 + i * 0.4) }));
      }}
    />
  );
}
