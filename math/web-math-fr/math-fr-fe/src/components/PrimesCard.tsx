import { Link, type LinkProps } from "@tanstack/react-router";
import { Live } from "@/components/projects/Live";
import { ink } from "@/components/projects/paint";
import { L } from "@/lib/lang";

/**
 * the primes as one card: the numbers laid out on a square spiral from the centre, the primes lit
 * in the topic's own light as the spiral grows, so their diagonals come out of the noise; the
 * name large beside it. the whole card opens the primes' page.
 */

const SIDE = 61;
const COUNT = SIDE * SIDE;

const PRIME = (() => {
  const sieve = new Uint8Array(COUNT + 1).fill(1);
  sieve[0] = 0;
  sieve[1] = 0;
  for (let i = 2; i * i <= COUNT; i++) if (sieve[i]) for (let j = i * i; j <= COUNT; j += i) sieve[j] = 0;
  return sieve;
})();

/** where each number sits on the square spiral, the centre at 0, 0 */
const PLACE: [number, number][] = (() => {
  const out: [number, number][] = [[0, 0], [0, 0]];
  let x = 0;
  let y = 0;
  let run = 1;
  const steps: [number, number][] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  let turn = 0;
  while (out.length <= COUNT) {
    for (let twice = 0; twice < 2 && out.length <= COUNT; twice++) {
      const [dx, dy] = steps[turn % 4];
      for (let k = 0; k < run && out.length <= COUNT; k++) {
        x += dx;
        y += dy;
        out.push([x, y]);
      }
      turn++;
    }
    run++;
  }
  return out;
})();

export function PrimesCard({ to }: { to: LinkProps["to"] }) {
  return (
    <Link to={to} data-topic={5} data-tile="" className="group max-w-md items-center gap-5" style={{ padding: 14 }}>
      <Live
        label={L("The numbers on a square spiral, the primes lit")}
        still={12}
        fps={12}
        className="aspect-square w-[120px] shrink-0"
        box={{ x0: -31, x1: 31, y0: -31, y1: 31 }}
        draw={(pen, t) => {
          // the topic's light, read where the card sets it; a drawing surface with no element (a test) gets white
          const surface: unknown = pen.ctx.canvas;
          const light = (surface instanceof Element ? getComputedStyle(surface).getPropertyValue("--c-glow").trim() : "") || "#ffffff";
          const shown = Math.min(COUNT, Math.floor(((t % 16) / 10) * COUNT));
          const ctx = pen.ctx;
          const cell = Math.max(1, Math.abs(pen.px(1) - pen.px(0)));
          // no blur per cell: a page of blurred squares redrawn every frame costs the graphics card
          // more than the whole page; each prime gets a faint square behind it instead
          ctx.fillStyle = ink(light, 0.22);
          for (let n = 2; n <= shown; n++) {
            if (!PRIME[n]) continue;
            const [x, y] = PLACE[n];
            ctx.fillRect(pen.px(x) - cell * 0.9, pen.py(y) - cell * 0.9, cell * 1.8, cell * 1.8);
          }
          ctx.fillStyle = ink(light);
          for (let n = 2; n <= shown; n++) {
            if (!PRIME[n]) continue;
            const [x, y] = PLACE[n];
            ctx.fillRect(pen.px(x) - cell * 0.4, pen.py(y) - cell * 0.4, cell * 0.8, cell * 0.8);
          }
          // the newest number, where the spiral is growing
          if (shown < COUNT) {
            const [x, y] = PLACE[Math.max(1, shown)];
            pen.ring(x, y, cell * 1.4, light, 1.5);
          }
        }}
      />
      <div>
        <h2 data-topic-name="" data-text="itemTitle" className="m-0" style={{ fontSize: "1.5rem", lineHeight: 1.1 }}>
          {L("Prime numbers")}
        </h2>
        <span aria-hidden="true" className="mt-2 inline-block text-muted-foreground transition-transform group-hover:-translate-y-1 group-hover:translate-x-1">↗</span>
      </div>
    </Link>
  );
}
