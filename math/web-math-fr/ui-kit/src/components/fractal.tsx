import { useEffect, useRef, type RefObject } from "react";
import type { Fractal } from "../../config/kinds.ts";

/** the class that keeps the fractal away from an element; the kit's interactive elements carry it */
export const OBSTACLE = "fractal-obstacle";

/** segments drawn into one path element before the next is started, so no path grows long */
const PER_PATH = 400;
/** turns a blocked tip tries before it stops, each a little wider than the last */
const TURNS = 8;
/** a tip that has stopped is replaced from a random point already drawn; after this many failed tries in a row the growth is complete */
const GIVE_UP = 400;
/** tips kept growing at once, at the least */
const TIPS = 8;
/** how long the page must be still before the obstacles are measured again, in ms */
const SETTLE = 250;
/** drawn points looked at when a stopped branch is replaced; the one nearest the top-right corner wins */
const SAMPLES = 6;
/** stacked layers the lines are spread over, each at its own opacity */
const DRIFTS = 6;
/** opacity levels the lines are spread over */
const LEVELS = 4;
/** segments of the flowsnake in a row, along its own path, that keep one opacity, so a level reads as a line */
const RUN = 24;
/** waves summed for the pace of the directions out of the corner: more gives more, narrower tongues */
const WAVES = 4;

/** the deepest flowsnake drawn: 7 to this power segments, about 118 thousand */
const DEEPEST = 6;
/** the flowsnake's two rules, Gosper's: each letter is one step forward, - and + turn by a sixth of a circle */
const RULE_A = "A-B--B+A++AA+B-";
const RULE_B = "+A-AA--B-A++A+B-";
/** turns tried when the curve is laid so that it starts at the top-right corner, in degrees */
const ROTATIONS = 72;

type Box = { x0: number; y0: number; x1: number; y1: number };

/**
 * the indices of a curve's segments (by their end point), ordered by how far each
 * segment's middle is from the page's top-right corner. with chaos above nothing each
 * direction out of the corner gets its own pace, changing smoothly from one direction
 * to the next: along a fast direction the lines run ahead, along a slow one they lag,
 * and since the pace is the same all along a direction, everything stays joined to the
 * corner and grows outward from it.
 */
function byCorner(pts: [number, number][], width: number, chaos: number): Int32Array {
  const n = Math.max(0, pts.length - 1);
  const far = new Float64Array(n);
  const out = new Int32Array(n);
  // a few waves of random phase over the quarter circle of directions, summed
  const waves = Array.from({ length: WAVES }, (_, k) => ({ f: 2 + k * 3 + Math.random() * 2, p: Math.random() * Math.PI * 2 }));
  const paceOf = (x: number, y: number) => {
    const a = Math.atan2(y, width - x);
    const s = waves.reduce((sum, w) => sum + Math.sin(a * w.f + w.p), 0) / WAVES;
    return 1 + s * chaos * 0.8;
  };
  for (let i = 0; i < n; i += 1) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    far[i] = Math.hypot(width - mx, my) / paceOf(mx, my);
    out[i] = i + 1;
  }
  out.sort((a, b) => far[a - 1] - far[b - 1]);
  return out;
}

/** the flowsnake of one depth as points one unit apart, starting at the origin */
function flowsnake(depth: number): [number, number][] {
  const pts: [number, number][] = [[0, 0]];
  let x = 0;
  let y = 0;
  let a = 0;
  const walk = (rule: string, level: number) => {
    for (const ch of rule) {
      if (ch === "+") a += Math.PI / 3;
      else if (ch === "-") a -= Math.PI / 3;
      else if (level === 0) {
        x += Math.cos(a);
        y += Math.sin(a);
        pts.push([x, y]);
      } else walk(ch === "A" ? RULE_A : RULE_B, level - 1);
    }
  };
  walk("A", depth);
  return pts;
}

/** the bounding box of points turned by an angle about the origin */
function spread(pts: [number, number][], angle: number): Box {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  for (const [px, py] of pts) {
    const x = px * c - py * s;
    const y = px * s + py * c;
    if (x < box.x0) box.x0 = x;
    if (x > box.x1) box.x1 = x;
    if (y < box.y0) box.y0 = y;
    if (y > box.y1) box.y1 = y;
  }
  return box;
}

/**
 * the flowsnake laid over a page: deep enough that a step is no longer than the
 * setting allows, turned so that its first point sits nearest the top-right corner
 * of its own outline, and scaled and moved so that the outline covers the page with
 * that corner on the page's top-right corner. points in page coordinates, in the
 * order the curve visits them.
 */
function laid(width: number, height: number, step: number): [number, number][] {
  let depth = 1;
  let pts = flowsnake(depth);
  let box = spread(pts, 0);
  while (depth < DEEPEST && Math.max((box.x1 - box.x0) * step, (box.y1 - box.y0) * step) < Math.hypot(width, height)) {
    depth += 1;
    pts = flowsnake(depth);
    box = spread(pts, 0);
  }
  let best = 0;
  let worst = Infinity;
  for (let k = 0; k < ROTATIONS; k += 1) {
    const angle = (k / ROTATIONS) * Math.PI * 2;
    const b = spread(pts, angle);
    // the start is the origin: how far it is from the outline's top-right corner, in outline sizes
    const miss = b.x1 / (b.x1 - b.x0) + -b.y0 / (b.y1 - b.y0);
    if (miss < worst) {
      worst = miss;
      best = angle;
    }
  }
  const b = spread(pts, best);
  const scale = Math.max(step, width / (b.x1 - b.x0), height / (b.y1 - b.y0));
  const c = Math.cos(best);
  const s = Math.sin(best);
  return pts.map(([px, py]) => [width - (b.x1 - (px * c - py * s)) * scale, ((px * s + py * c) - b.y0) * scale]);
}
/** a growing branch: where it is, which way it points, its grid cell, its own pace (the chance it grows when its turn comes) and its opacity level */
type Tip = { x: number; y: number; a: number; cell: number; rate: number; level: number };

/** how an element sits: inside a fixed layer (the bar, a dialog), which moves with the screen and is no obstacle on the page; inside a sticky one, which slides within its parent while the page scrolls; or in the page */
function placing(el: Element): { kind: "fixed" | "sticky" | "page"; holder?: Element } {
  for (let n: Element | null = el; n && n !== document.body; n = n.parentElement) {
    const p = getComputedStyle(n).position;
    if (p === "fixed") return { kind: "fixed" };
    if (p === "sticky") return { kind: "sticky", holder: n.parentElement ?? undefined };
  }
  return { kind: "page" };
}

/**
 * every obstacle on the page, in page coordinates, grown by the gap. an element in a
 * sticky layer can be anywhere along its holder while the page scrolls, so its
 * obstacle runs the holder's whole height; an element in a fixed layer is left out.
 */
function obstacles(gap: number): Box[] {
  const out: Box[] = [];
  for (const el of Array.from(document.getElementsByClassName(OBSTACLE))) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const at = placing(el);
    if (at.kind === "fixed") continue;
    let top = r.top;
    let bottom = r.bottom;
    if (at.kind === "sticky" && at.holder) {
      const h = at.holder.getBoundingClientRect();
      top = Math.min(top, h.top);
      bottom = Math.max(bottom, h.bottom);
    }
    out.push({ x0: r.left + window.scrollX - gap, y0: top + window.scrollY - gap, x1: r.right + window.scrollX + gap, y1: bottom + window.scrollY + gap });
  }
  return out;
}

const inside = (b: Box[], x: number, y: number) => b.some((o) => x >= o.x0 && x <= o.x1 && y >= o.y0 && y <= o.y1);

/**
 * the fractal behind the page. it starts at the top-right corner and covers the
 * whole page, either as the Gosper flowsnake drawn along its own path or as a
 * random branching growth, as the setting says, keeping the gap around every
 * element with the class fractal-obstacle: the flowsnake breaks where it would
 * cross one, the branches turn away from it. it is one layer in the page's
 * coordinates, so a scroll moves it with the content and nothing is redrawn. the
 * segments are written straight into the svg, so no frame renders anything in
 * react. it grows again when the page's width or its obstacles change, draws the
 * finished picture at once for a reader who asks for less motion, and lets go of
 * every frame and observer when it is removed. `of` is the element whose height
 * is the page's.
 */
export function FractalBackground({ settings, of }: { settings: Fractal; of: RefObject<HTMLElement | null> }) {
  const host = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const box = host.current;
    const page = of.current;
    if (!box || !page || !settings.on) return;
    // the stacked layers the lines are spread over, each at an opacity of its own between full and
    // `drift` below it. the opacities hold still: an opacity that moves makes the browser keep
    // every layer as a texture the height of the whole page, and six of those are more than a
    // graphics card keeps, so Chrome dropped parts of the page while scrolling
    const layers: SVGSVGElement[] = Array.from({ length: DRIFTS }, (_, i) => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("data-slot", "fractal-layer");
      s.setAttribute("focusable", "false");
      s.style.opacity = (1 - (settings.drift * i) / Math.max(1, DRIFTS - 1)).toFixed(2);
      box.appendChild(s);
      return s;
    });
    const clear = () => layers.forEach((s) => { while (s.firstChild) s.removeChild(s.firstChild); });
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
    let frame = 0;
    let settle = 0;
    let width = 0;
    let height = 0;
    let signature = "";
    let boxes: Box[] = [];
    let tips: Tip[] = [];
    let drawn: [number, number][] = [];
    let grid = new Uint8Array(0);
    let cols = 0;
    let count = 0;
    let failed = 0;
    let limit = 0;
    let curve: [number, number][] = [];
    // the flowsnake's segments by the index of their end point, nearest the top-right corner first
    let order: Int32Array = new Int32Array(0);
    let next = 0;
    // one open path per opacity level, with its drawing so far and its segment count
    let paths: (SVGPathElement | null)[] = Array(LEVELS).fill(null);
    let ds: string[] = Array(LEVELS).fill("");
    let counts: number[] = Array(LEVELS).fill(0);
    // the opacity level of each stretch of the flowsnake along its own path
    let runs: Uint8Array = new Uint8Array(0);
    const cell = settings.step;

    const cellOf = (x: number, y: number) => Math.floor(y / cell) * cols + Math.floor(x / cell);
    // a branch's pace: always growing with no chaos, often waiting its turn with much
    const rate = () => 1 - Math.random() * settings.chaos * 0.85;

    // a level's stroke opacity: the first level full, the last as faint as vary allows
    const strength = (level: number) => (1 - (settings.vary * level) / (LEVELS - 1)).toFixed(2);
    const level = () => Math.floor(Math.random() * LEVELS);

    const flush = () => {
      for (let l = 0; l < LEVELS; l += 1) {
        const p = paths[l];
        if (p && ds[l]) p.setAttribute("d", ds[l]);
      }
    };

    /** closes the open paths, so the next lines start new ones */
    const close = () => {
      flush();
      paths = Array(LEVELS).fill(null);
      ds = Array(LEVELS).fill("");
      counts = Array(LEVELS).fill(0);
    };

    const segment = (x0: number, y0: number, x1: number, y1: number, l: number) => {
      if (!paths[l] || counts[l] >= PER_PATH) {
        const p = paths[l];
        if (p && ds[l]) p.setAttribute("d", ds[l]);
        const made = document.createElementNS("http://www.w3.org/2000/svg", "path");
        made.setAttribute("stroke-opacity", strength(l));
        layers[Math.floor(Math.random() * DRIFTS)].appendChild(made);
        paths[l] = made;
        ds[l] = "";
        counts[l] = 0;
      }
      ds[l] += `M${x0.toFixed(1)} ${y0.toFixed(1)}L${x1.toFixed(1)} ${y1.toFixed(1)}`;
      counts[l] += 1;
      count += 1;
    };

    const free = (x: number, y: number, own: number) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return false;
      if (inside(boxes, x, y)) return false;
      const c = cellOf(x, y);
      return c === own || grid[c] === 0;
    };

    /** one step of one tip: forward with a little bend, turning away when blocked; false when it has stopped */
    const grow = (t: Tip): boolean => {
      const base = t.a + (Math.random() - 0.5) * 2 * settings.bend;
      for (let k = 0; k <= TURNS; k += 1) {
        const turn = k === 0 ? 0 : Math.ceil(k / 2) * 0.35 * (k % 2 === 0 ? 1 : -1);
        const a = base + turn;
        const x = t.x + Math.cos(a) * settings.step;
        const y = t.y + Math.sin(a) * settings.step;
        const mx = (t.x + x) / 2;
        const my = (t.y + y) / 2;
        if (!free(x, y, t.cell) || inside(boxes, mx, my)) continue;
        segment(t.x, t.y, x, y, t.level);
        const c = cellOf(x, y);
        grid[c] = 1;
        drawn.push([x, y]);
        t.x = x;
        t.y = y;
        t.a = a;
        t.cell = c;
        if (Math.random() < settings.branch) tips.push({ x, y, a: a + (Math.random() < 0.5 ? -1 : 1) * (0.45 + Math.random() * 0.35), cell: c, rate: rate(), level: level() });
        return true;
      }
      return false;
    };

    /** a stopped tip is replaced from a drawn point near the top-right corner, the nearest of a few picked at random, pointing anywhere, so the growth spreads out from the corner */
    const respawn = () => {
      if (!drawn.length) return;
      let x = 0;
      let y = 0;
      let near = Infinity;
      for (let s = 0; s < SAMPLES; s += 1) {
        const [px, py] = drawn[Math.floor(Math.random() * drawn.length)];
        const d = Math.hypot(width - px, py);
        if (d < near) {
          near = d;
          x = px;
          y = py;
        }
      }
      tips.push({ x, y, a: Math.random() * Math.PI * 2, cell: cellOf(x, y), rate: rate(), level: level() });
    };

    /** the next stretch of the flowsnake along its own path; a segment off the page or over an obstacle is left out, so the curve breaks around it; false at the curve's end */
    const snake = (n: number): boolean => {
      for (let i = 0; i < n; i += 1) {
        if (next >= order.length) return false;
        const k = order[next];
        const [x0, y0] = curve[k - 1];
        const [x1, y1] = curve[k];
        next += 1;
        const on = (x: number, y: number) => x >= 0 && y >= 0 && x <= width && y <= height;
        if (!on(x0, y0) || !on(x1, y1)) continue;
        if (inside(boxes, x0, y0) || inside(boxes, x1, y1) || inside(boxes, (x0 + x1) / 2, (y0 + y1) / 2)) continue;
        segment(x0, y0, x1, y1, runs[Math.floor(k / RUN)]);
      }
      return true;
    };

    /** a batch of growth; false when the page is full or the limit is reached */
    const batch = (n: number): boolean => {
      if (settings.shape === "flowsnake") return snake(n);
      for (let i = 0; i < n; i += 1) {
        if (count >= limit || failed >= GIVE_UP) return false;
        while (tips.length < TIPS && failed < GIVE_UP) {
          respawn();
          failed += 1;
        }
        const k = Math.floor(Math.random() * tips.length);
        if (Math.random() > tips[k].rate) continue;
        if (grow(tips[k])) failed = 0;
        else {
          tips.splice(k, 1);
          failed += 1;
        }
      }
      return true;
    };

    const loop = () => {
      // each frame's lines go into paths of their own, so they fade in together
      close();
      const going = batch(settings.speed);
      flush();
      frame = going ? requestAnimationFrame(loop) : 0;
    };

    /** clears the layer and grows again from the top-right corner */
    const start = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      clear();
      close();
      count = 0;
      failed = 0;
      width = document.documentElement.clientWidth;
      height = Math.max(page.offsetTop + page.offsetHeight, window.innerHeight);
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
      for (const s of layers) {
        s.setAttribute("width", String(width));
        s.setAttribute("height", String(height));
        s.setAttribute("viewBox", `0 0 ${width} ${height}`);
      }
      if (width === 0 || height === 0) return;
      cols = Math.ceil(width / cell) + 1;
      grid = new Uint8Array(cols * (Math.ceil(height / cell) + 1));
      limit = Math.round((settings.density * width * height) / 1e6);
      boxes = settings.avoid ? obstacles(settings.gap) : [];
      curve = settings.shape === "flowsnake" ? laid(width, height, settings.step) : [];
      order = byCorner(curve, width, settings.chaos);
      runs = Uint8Array.from({ length: Math.ceil(curve.length / RUN) + 1 }, level);
      next = 0;
      const x = width - 1;
      const y = 1;
      drawn = [[x, y]];
      tips = [];
      // the first tips fan out from the corner, between pointing left and pointing down
      for (let i = 0; i < TIPS; i += 1) tips.push({ x, y, a: Math.PI / 2 + (Math.PI / 2) * (i / (TIPS - 1)), cell: cellOf(x, y), rate: rate(), level: level() });
      if (still) {
        while (batch(settings.speed)) {
          // grows to the end before anything is shown
        }
        flush();
      } else frame = requestAnimationFrame(loop);
    };

    // the page is drawn once: it grows again only when another page is opened or the page's width or
    // height changes, never because an element moved while the page scrolled
    const measure = () => {
      const w = document.documentElement.clientWidth;
      const h = Math.max(page.offsetTop + page.offsetHeight, window.innerHeight);
      return `${w}x${h}@${window.location.pathname}`;
    };

    const look = () => {
      clearTimeout(settle);
      settle = window.setTimeout(() => {
        const now = measure();
        if (now === signature) return;
        signature = now;
        start();
      }, SETTLE);
    };

    signature = measure();
    start();
    const sizes = new ResizeObserver(look);
    sizes.observe(page);
    const changes = new MutationObserver(look);
    changes.observe(page, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", look);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      sizes.disconnect();
      changes.disconnect();
      window.removeEventListener("resize", look);
      for (const s of layers) s.remove();
    };
  }, [settings, of]);

  return <div ref={host} data-slot="fractal" aria-hidden="true" />;
}
