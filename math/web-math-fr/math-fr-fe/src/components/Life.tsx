import { Text } from "@kit/index";
import { useEffect, useMemo, useRef, useState } from "react";
import { L, language } from "@/lib/lang";
import { arc, kmBetween, project, routeKm, type Place } from "@/lib/globe";
import { useInView, useRise } from "@/lib/reveal";
import { FAINT, INK, MUTED, ONE, SKY, retone } from "@/lib/draw";
import type { LifeHobby, LifePhoto, LifePlace } from "@/content/life";
import { circlesAt, circlesOf, outlineOf, resample, type C } from "@/systems/series";

const still = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
const photoUrl = (p: LifePhoto) => `${import.meta.env.BASE_URL}about/${p.file}`;

/** a canvas sized to its box at the device's pixel ratio; the draw function gets the context and the size in css pixels */
function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, deps: unknown[]) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    const k = window.devicePixelRatio || 1;
    c.width = Math.round(w * k);
    c.height = Math.round(h * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, w, h);
    retone();
    draw(ctx, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

const N = 512;
const CIRCLES = 80;
const SECONDS = 9;

/**
 * the dog drawn by circles: the outline of the first photo, found in the browser, redrawn by the
 * circles of the series topic while the drawing is on screen, then the photo fades in under it.
 * a photo with no clear outline is shown as it is.
 */
export function DogByCircles({ photo, name, line }: { photo: LifePhoto; name?: string; line?: string }) {
  const [shape, setShape] = useState<C[] | null>(null);
  const [moved, setT] = useState(0);
  const [seen, setSeen] = useState(false);
  const host = useInView<HTMLDivElement>(setSeen, 0.4);
  // a reader who asked for less motion gets the finished drawing
  const t = still() ? 1 : moved;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const side = 300;
      const c = document.createElement("canvas");
      c.width = side;
      c.height = side;
      const ctx = c.getContext("2d");
      if (!ctx) return setShape([]);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, side, side);
      const s = Math.min(side / img.width, side / img.height);
      ctx.drawImage(img, (side - img.width * s) / 2, (side - img.height * s) / 2, img.width * s, img.height * s);
      const d = ctx.getImageData(0, 0, side, side).data;
      const grey = new Uint8ClampedArray(side * side);
      for (let i = 0; i < grey.length; i += 1) grey[i] = Math.round(0.299 * d[4 * i] + 0.587 * d[4 * i + 1] + 0.114 * d[4 * i + 2]);
      const raw = outlineOf(grey, side, side);
      setShape(raw.length > 40 ? resample(raw, N).map(([x, y]) => [x / side - 0.5, 0.5 - y / side]) : []);
    };
    img.onerror = () => setShape([]);
    img.src = photoUrl(photo);
  }, [photo]);

  const circles = useMemo(() => (shape && shape.length ? circlesOf(shape).slice(0, CIRCLES) : []), [shape]);
  // every point of the finished line, worked out once; the drawing shows the share reached so far
  const tips = useMemo(() => Array.from({ length: 401 }, (_, i) => (circles.length ? circlesAt(circles, circles.length, i / 400).pop()! : ([0, 0] as C))), [circles]);

  useEffect(() => {
    if (!seen || !circles.length || still()) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const v = Math.min(1, (now - start) / (SECONDS * 1000));
      setT(v);
      if (v < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, circles]);

  const canvas = useCanvas(
    (ctx, w, h) => {
      if (!circles.length) return;
      // the photo fills the same square (object-contain), so the outline is drawn at the same scale
      const k = Math.min(w, h);
      const at = (p: C) => [w / 2 + p[0] * k, h / 2 - p[1] * k] as const;
      const steps = Math.max(2, Math.round(t * 400));
      ctx.lineWidth = 2;
      ctx.strokeStyle = ONE;
      ctx.beginPath();
      for (let i = 0; i <= steps; i += 1) {
        const [x, y] = at(tips[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      if (t < 1) {
        const chain = circlesAt(circles, Math.min(24, circles.length), t);
        ctx.lineWidth = 1;
        ctx.strokeStyle = SKY;
        ctx.globalAlpha = 0.6;
        ctx.beginPath();
        chain.forEach((p, i) => {
          const [x, y] = at(p);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    },
    [circles, tips, t],
  );

  const drawn = shape !== null && (shape.length === 0 || t >= 1);
  return (
    <figure className="m-0 min-w-0">
      <div ref={host} className="relative aspect-square w-full max-w-md overflow-hidden" data-slot="shot">
        <img src={photoUrl(photo)} alt={photo.alt} data-fade={drawn ? "shown" : "hidden"} className="absolute inset-0 h-full w-full object-contain" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      </div>
      {name || line ? (
        <figcaption className="mt-2">
          {name ? <span data-text="itemTitle">{name}</span> : null}
          {line ? <Text kind="note" as="span" className="ml-2">{line}</Text> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/**
 * the places as one line over a globe: the route drawn place to place along the shortest paths,
 * while the globe turns to follow it; under it the counts of countries and cities and the
 * kilometres, computed from the coordinates.
 */
export function RouteGlobe({ places }: { places: LifePlace[] }) {
  const [moved, setT] = useState(0);
  const [seen, setSeen] = useState(false);
  const host = useInView<HTMLDivElement>(setSeen, 0.35);
  const t = still() || places.length < 2 ? 1 : moved;
  const legs = useMemo(() => places.slice(1).map((p, i) => arc(places[i], p, 64)), [places]);
  const km = useMemo(() => routeKm(places), [places]);
  const countries = new Set(places.map((p) => p.country)).size;
  const cities = new Set(places.map((p) => `${p.city}|${p.country}`)).size;

  useEffect(() => {
    if (!seen || still() || legs.length === 0) return;
    let frame = 0;
    const start = performance.now();
    const total = Math.max(6, legs.length * 1.6) * 1000;
    const tick = (now: number) => {
      const v = Math.min(1, (now - start) / total);
      setT(v);
      if (v < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [seen, legs]);

  // how far along: whole legs done, and the share of the current one
  const along = t * legs.length;
  const done = Math.floor(along);
  const part = along - done;
  const current = legs[Math.min(done, legs.length - 1)];
  const facing: Place = current ? current[Math.min(current.length - 1, Math.round(part * (current.length - 1)))] : places[0] ?? { lat: 20, lon: 0 };

  const canvas = useCanvas(
    (ctx, w, h) => {
      const r = Math.min(w, h) * 0.46;
      const cx = w / 2;
      const cy = h / 2;
      const lat0 = Math.max(-60, Math.min(60, facing.lat));
      const lon0 = facing.lon;
      const draw = (pts: Place[], colour: string, width: number) => {
        ctx.strokeStyle = colour;
        ctx.lineWidth = width;
        ctx.beginPath();
        let pen = false;
        for (const p of pts) {
          const q = project(p, lat0, lon0);
          if (!q.near) {
            pen = false;
            continue;
          }
          const x = cx + q.x * r;
          const y = cy - q.y * r;
          if (!pen) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          pen = true;
        }
        ctx.stroke();
      };
      // the globe: its rim and a grid of meridians and parallels in the faint line
      ctx.strokeStyle = MUTED;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.stroke();
      for (let lon = -180; lon < 180; lon += 30) draw(Array.from({ length: 91 }, (_, i) => ({ lat: -90 + 2 * i, lon })), FAINT, 1);
      for (let lat = -60; lat <= 60; lat += 30) draw(Array.from({ length: 181 }, (_, i) => ({ lat, lon: -180 + 2 * i })), FAINT, 1);
      // the route so far
      legs.forEach((leg, i) => {
        if (i < done) draw(leg, ONE, 2.2);
        else if (i === done) draw(leg.slice(0, Math.max(1, Math.round(part * (leg.length - 1))) + 1), ONE, 2.2);
      });
      places.forEach((p, i) => {
        if (i > done + 1) return;
        const q = project(p, lat0, lon0);
        if (!q.near) return;
        ctx.fillStyle = INK;
        ctx.beginPath();
        ctx.arc(cx + q.x * r, cy - q.y * r, 3.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    },
    [legs, done, part, facing.lat, facing.lon],
  );

  const reached = places.slice(0, Math.min(places.length, done + 2));
  return (
    <div ref={host} className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center">
      <canvas ref={canvas} role="img" aria-label={L("A globe with the route from place to place")} className="block aspect-square w-full max-w-md" />
      <div className="min-w-0">
        <dl className="m-0 grid grid-cols-3 gap-4">
          {[
            { value: String(countries), label: L("countries") },
            { value: String(cities), label: L("cities") },
            { value: Math.round(km).toLocaleString(language()), label: L("km along the route") },
          ].map((f) => (
            <div key={f.label} className="flex min-w-0 flex-col">
              <dt data-text="note" className="order-2 mt-1">{f.label}</dt>
              <dd data-text="factValue" className="order-1 m-0 tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
        <ol className="mt-6 space-y-2">
          {reached.map((p, i) => (
            <li key={`${p.city}-${p.year}-${i}`} className="flex items-baseline gap-3">
              <span data-text="label" data-tone="accent" className="tabular-nums">{p.year}</span>
              <span data-text="body">{p.city}, {p.country}</span>
              {i > 0 ? <Text kind="note" as="span" className="tabular-nums">{L("{{n}} km", { n: Math.round(kmBetween(places[i - 1], p)).toLocaleString(language()) })}</Text> : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** the hobbies: a photo, if there is one, and a name and a line each, rising in as they come on screen */
export function Hobbies({ hobbies }: { hobbies: LifeHobby[] }) {
  return (
    <ul className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
      {hobbies.map((h, i) => (
        <Hobby key={h.name} hobby={h} delay={i * 80} />
      ))}
    </ul>
  );
}

function Hobby({ hobby, delay }: { hobby: LifeHobby; delay: number }) {
  const ref = useRise<HTMLLIElement>(delay);
  return (
    <li ref={ref} className="rise min-w-0">
      {hobby.photo ? <img data-slot="shot" src={photoUrl(hobby.photo)} alt={hobby.photo.alt} loading="lazy" className="block aspect-[4/3] w-full object-cover" /> : null}
      <div data-text="itemTitle" className="mt-2">{hobby.name}</div>
      <Text kind="note" as="p" className="mt-1">{hobby.line}</Text>
    </li>
  );
}
