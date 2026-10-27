import { useEffect, useRef, useState } from "react";
import box1 from "../assets/cat/box1.png";
import box2 from "../assets/cat/box2.png";
import box3 from "../assets/cat/box3.png";
import eating from "../assets/cat/eating.png";
import dance from "../assets/cat/playing.png";
import sleeping from "../assets/cat/sleeping.png";
import laydown from "../assets/cat/laydown.png";
import sick from "../assets/cat/sick.png";
import sitting from "../assets/cat/sitting.png";
import sleepy from "../assets/cat/sleepy.png";
import waiting from "../assets/cat/waiting.png";

/**
 * the pixel case's kittens, from the CatUI pack. one sleeps in the bottom right corner (CatRoom,
 * six 48 px frames). the other visits the bottom left: it fades in, plays a few animations from
 * the Classical sheets in one of the orders below, each repeated fifteen to twenty times, fading
 * out and the next fading in, then fades out and comes back after a while. some visits start
 * with the sick kitten. after eating comes a rest, lying down, never sleep. a sheet is a row of
 * frames, stepped and never blended, drawn larger with the pixels kept hard. a reader who asked
 * for less motion gets the sleeping kitten, still, and no visitor.
 */
type Sheet = { sheet: string; frames: number; frame: number };

const ASLEEP: Sheet = { sheet: sleeping, frames: 6, frame: 0.27 };
const SIT: Sheet = { sheet: sitting, frames: 10, frame: 0.18 };
const WAIT: Sheet = { sheet: waiting, frames: 6, frame: 0.2 };
const YAWN: Sheet = { sheet: sleepy, frames: 8, frame: 0.18 };
const LIE: Sheet = { sheet: laydown, frames: 12, frame: 0.18 };
const DANCE: Sheet = { sheet: dance, frames: 4, frame: 0.2 };
const EAT: Sheet = { sheet: eating, frames: 15, frame: 0.14 };
const SICK: Sheet = { sheet: sick, frames: 5, frame: 0.2 };
const BOX = [
  { sheet: box1, frames: 4, frame: 0.2 },
  { sheet: box2, frames: 12, frame: 0.16 },
  { sheet: box3, frames: 4, frame: 0.2 },
];
/** the orders a visit follows, one after another */
const VISITS: Sheet[][] = [
  [SIT, YAWN, LIE, ...BOX],
  [WAIT, DANCE, EAT, LIE],
  [SIT, EAT, LIE, ...BOX],
];
const SIDE = { sleeping: 72, playing: 64 } as const;
/** how many times an animation repeats before the next, at least and at most */
const LOOPS = [15, 20] as const;
/** the share of visits that start with the sick kitten */
const SICK_SHARE = 0.25;
/** the time away between visits, and one fade out or in, in seconds */
const AWAY = 20;
const FADE = 0.9;

const still = () => typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);

/** a sheet stepping through its frames, as often as asked, then calling back */
function play(el: HTMLElement, s: Sheet, side: number, times: number, done?: () => void) {
  const run = el.animate?.([{ backgroundPosition: "0 0" }, { backgroundPosition: `-${side * s.frames}px 0` }], {
    duration: s.frames * s.frame * 1000,
    iterations: times,
    easing: `steps(${s.frames})`,
  });
  if (run && done) run.onfinish = done;
  return run;
}

/** a soft fade, in or out, ending shown or hidden */
function fade(el: HTMLElement, show: boolean, done: () => void) {
  const run = el.animate?.([{ opacity: show ? 0 : 1 }, { opacity: show ? 1 : 0 }], { duration: FADE * 1000, easing: "ease-in-out", fill: "forwards" });
  if (run) run.onfinish = done;
  else done();
  return run;
}

export function Kitten({ kind = "sleeping" }: { kind?: keyof typeof SIDE }) {
  return kind === "sleeping" ? <Sleeper /> : still() ? null : <Visitor />;
}

function Sleeper() {
  const sprite = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sprite.current;
    if (!el || still()) return;
    const run = play(el, ASLEEP, SIDE.sleeping, Infinity);
    return () => run?.cancel();
  }, []);
  return (
    <div data-slot="kitten" data-kind="sleeping" aria-hidden="true">
      <Frames ref={sprite} s={ASLEEP} side={SIDE.sleeping} />
    </div>
  );
}

/** the acts of one visit: its order, with the sick kitten first on some visits */
function visitOf(n: number): Sheet[] {
  const order = VISITS[n % VISITS.length];
  return Math.random() < SICK_SHARE ? [SICK, ...order] : order;
}

function Visitor() {
  const host = useRef<HTMLDivElement | null>(null);
  const sprite = useRef<HTMLDivElement | null>(null);
  const [visit, setVisit] = useState(0);
  const [acts, setActs] = useState<Sheet[]>(() => visitOf(0));
  // the act on show, or null while away
  const [at, setAt] = useState<number | null>(0);
  const side = SIDE.playing;
  const s = acts[at ?? 0];

  useEffect(() => {
    const box = host.current;
    const el = sprite.current;
    if (!box || !el) return;
    if (at === null) {
      box.style.opacity = "0";
      const wait = window.setTimeout(() => {
        const next = visit + 1;
        setVisit(next);
        setActs(visitOf(next));
        setAt(0);
      }, AWAY * 1000);
      return () => window.clearTimeout(wait);
    }
    // fade in, play the act fifteen to twenty times, fade out, then the next act or away
    let run: Animation | undefined;
    let shown: Animation | undefined;
    const times = LOOPS[0] + Math.floor(Math.random() * (LOOPS[1] - LOOPS[0] + 1));
    shown = fade(box, true, () => {
      run = play(el, s, side, times, () => {
        shown = fade(box, false, () => setAt(at + 1 < acts.length ? at + 1 : null));
      });
    });
    return () => {
      run?.cancel();
      shown?.cancel();
    };
  }, [at, acts, s, side, visit]);

  return (
    <div ref={host} data-slot="kitten" data-kind="playing" aria-hidden="true" style={{ opacity: 0 }}>
      <Frames ref={sprite} s={s} side={side} />
    </div>
  );
}

function Frames({ s, side, ref }: { s: Sheet; side: number; ref: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      style={{
        width: side,
        height: side,
        backgroundImage: `url(${s.sheet})`,
        backgroundSize: `${side * s.frames}px ${side}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    />
  );
}
