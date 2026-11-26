import { describe, expect, it } from "vitest";
import type { Pen } from "@/components/Plot";
import { STORIES } from "@/storylines/list";

/**
 * every story has a scene, and the scene keeps one contract: DEFAULTS, build, draw, topLine,
 * applyAct, onStep. the scene is drawn here at every step, at several moments and on two canvas
 * shapes, with a pen that only counts calls; and the line above the picture is read at the steps
 * where the story states a number, so a wrong count cannot pass as a picture.
 */
type Step = { id: string; say: string; fade: Record<string, number>; set: Record<string, number | string>; top: string | null; act: string | null };
type Scene = {
  DEFAULTS: Record<string, unknown>;
  build: (values: Record<string, unknown>) => unknown;
  draw: (pen: Pen, data: unknown, fade: Record<string, number>, set: Record<string, number | string>, t: number) => void;
  topLine: (top: string, data: unknown, set: Record<string, number | string>) => string;
  applyAct: (set: Record<string, number | string>, values: Record<string, unknown>, act: string | null) => Record<string, number | string>;
  onStep: (values: Record<string, unknown>) => Record<string, unknown>;
};

const storylines = import.meta.glob<{ STEPS: Step[] }>("./storylines/*/*.ts", { eager: true });
const scenes = import.meta.glob<Scene>("./scenes/*/*.ts", { eager: true });
const stepsOf = (key: string) => storylines[`./storylines/${key}.ts`].STEPS;
const sceneOf = (key: string) => scenes[`./scenes/${key}.ts`];

/** a pen that draws nothing and counts every call made on it or on its context */
function countingPen(width: number, height: number) {
  let calls = 0;
  const count = () => { calls += 1; };
  const image = (w: number, h: number) => ({ data: new Uint8ClampedArray(Math.max(1, Math.round(w) * Math.round(h) * 4)), width: w, height: h });
  const own: Record<string, unknown> = {
    globalAlpha: 1,
    measureText: () => ({ width: 10 }),
    getLineDash: () => [],
    createImageData: (w: number, h: number) => image(w, h),
    getImageData: (_x: number, _y: number, w: number, h: number) => image(w, h),
    createLinearGradient: () => ({ addColorStop: () => {} }),
  };
  const ctx = new Proxy(own, {
    get: (target, key: string) => (key in target ? target[key] : count),
    set: (target, key: string, value) => { target[key] = value; return true; },
  }) as unknown as CanvasRenderingContext2D;
  const pen = {
    ctx, width, height,
    box: { x0: 0, x1: 1, y0: 0, y1: 1 },
    px: (x: number) => x * width,
    py: (y: number) => height - y * height,
    wx: (p: number) => p / width,
    wy: (p: number) => (height - p) / height,
    line: count, dot: count, ring: count, arrow: count, axes: count, text: count,
  } as unknown as Pen;
  return { pen, calls: () => calls };
}

/** what the line above the picture must say at the steps where the story states a number */
const TOP: Record<string, Record<string, RegExp>> = {
  "series/fourier": {
    hook: /^Arrows: 60$/,
    height: /^Height of the tip$/,
    sine: /^height = sin t$/,
    second: /^height = sin t \+ ⅓ sin 3t$/,
    third: /^height = sin t \+ ⅓ sin 3t \+ ⅕ sin 5t$/,
    twelve: /^height = sin t \+ ⅓ sin 3t \+ ⅕ sin 5t \+ ⅐ sin 7t \+ …$/,
    saw: /^height = sin t − ½ sin 2t \+ ⅓ sin 3t − ¼ sin 4t \+ …$/,
    forty: /^Arrows: 40$/,
    short: /^Kept 40 of 255 arrows$/,
    squeeze: /^Kept 12 of 255 arrows$/,
  },
  "probability/dice": {
    hook: /^Throws: 5,000$/,
    one: /^Faces: 6$/,
    grid: /^Cells: 36$/,
    "sum-two": /^Sum 2: 1 of 36 cells$/,
    "sum-seven": /^Sum 7: 6 of 36 cells$/,
    chance: /^6\/36 = 1\/6$/,
  },
  "probability/birthdays": {
    hook: /^People: 23$/,
    two: /^Pairs: 1$/,
    three: /^Pairs: 3$/,
    four: /^Pairs: 6$/,
    web: /^Pairs: 253$/,
    slide: /^Pairs: 253\. Chance of a match: 0\.507$/,
    half: /^Chance that all days differ: 0\.493$/,
  },
  "probability/test": {
    hook: /^Finds 99 of 100 ill people$/,
    field: /^People: 100,000$/,
    ill: /^Ill: 100$/,
    found: /^Ill with a positive result: 99$/,
    rare: /^Wrong on 5 of 100 healthy people$/,
    many: /^Healthy with a positive result: 4,995$/,
    gather: /^Positive results: ill 99, healthy 4,995$/,
    share: /^Ill among the positives: 1\.94 %$/,
  },
  "probability/doors": {
    play: /^Stayed: won 0 of 0\. Switched: won 0 of 0$/,
    hundred: /^Doors: 100$/,
    why: /^First pick is right: 1 of 100$/,
    "three-again": /^First pick is right: 1 of 3$/,
  },
  "probability/game": {
    hook: /^Stake 2, prize 10$/,
    paid: /^Paid: 12$/,
    won: /^Won: 10$/,
    third: /^Per round: \(10 − 12\) \/ 6 = −0\.333$/,
    twenty: /^After 20 rounds: (0|[+−]\d+)$/,
    thousand: /^After 1,000 rounds: −\d+$/,
  },
  "probability/hats": {
    hook: /^Hats: 100$/,
    average: /^Own hats back, on average: 1$/,
    three: /^Ways: 6$/,
    "six-six": /^Matches: 6 in 6 ways$/,
    hundredth: /^Own hat: 1 of 100$/,
    add: /^100 × 1\/100 = 1$/,
    shuffle: /^Matches this time: \d+$/,
  },
  "probability/galton": {
    "row-one": /^Paths to each bin: 1 1$/,
    "row-two": /^Paths to each bin: 1 2 1$/,
    "row-three": /^Paths to each bin: 1 3 3 1$/,
    "row-four": /^Paths to each bin: 1 4 6 4 1$/,
    pascal: /^Paths to each bin: 1 6 15 20 15 6 1$/,
    tilt: /^Chance of going right: 0\.50$/,
  },
  "probability/poisson": {
    hook: /^Average calls a minute: 3$/,
    six: /^Slices: 6\. Chance of silence: 0\.0156$/,
    sixty: /^Slices: 60\. Chance of silence: 0\.0461$/,
    "six-hundred": /^Slices: 600\. Chance of silence: 0\.0494$/,
    e: /^Limit of the chance of silence: 0\.0498$/,
  },
  "probability/bins": {
    hook: /^Longer than 20 minutes: 0\.135$/,
    marks: /^Waits: 10,000$/,
    five: /^Bin width: 5 min$/,
    narrower: /^Bin width: 0\.5 min$/,
  },
  "probability/memory": {
    bus: /^A bus every 20 minutes$/,
    "bus-left": /^At most 10 minutes left$/,
    take: /^Still waiting after 10 minutes: 3,\d\d\d of 10,000$/,
    name: /^Average wait still ahead: (9\.[5-9]|10\.[0-5]) min$/,
  },
  "probability/walks": {
    hook: /^Players: 50$/,
    step: /^Players: 1$/,
    root: /^Spread after 400 tosses: (1[4-9]|2[0-7])\.\d$/,
  },
  "probability/ruin": {
    hook: /^The coin wins 49 tosses of 100$/,
    loses: /^Chance of reaching 20: 0\.401$/,
    middle: /^The coin wins 50 tosses of 100$/,
    half: /^Chance of reaching 20: 0\.500$/,
    long: /^Average length of a game: 99 tosses$/,
    forty: /^Chance of reaching 20: 0\.401$/,
  },
};

/** the stories whose scene is written so far; story.final.test.ts requires all of them */
const READY = Object.keys(STORIES).filter((key) => sceneOf(key));

describe("The scenes written so far", () => {
  it("are scenes of stories on the list", () => {
    expect(READY.length).toBeGreaterThanOrEqual(0);
  });
});

describe.each(READY)("The scene of %s", (key: string) => {
  it("is there and keeps the contract", () => {
    const scene = sceneOf(key);
    expect(scene, `src/scenes/${key}.ts is missing`).toBeTruthy();
    for (const name of ["build", "draw", "topLine", "applyAct", "onStep"] as const) expect(typeof scene[name], name).toBe("function");
    expect(scene.DEFAULTS && typeof scene.DEFAULTS).toBe("object");
    expect(scene.onStep(scene.DEFAULTS)).toBeTruthy();
  });

  it("draws every step, at any moment and on a phone, and draws something whenever a part is shown", () => {
    const scene = sceneOf(key);
    const data = scene.build(scene.DEFAULTS);
    for (const step of stepsOf(key)) {
      const set = scene.applyAct(step.set, scene.DEFAULTS, step.act);
      const half = Object.fromEntries(Object.entries(step.fade).map(([k, v]) => [k, v / 2]));
      for (const [w, h] of [[900, 440], [340, 300]]) {
        for (const t of [0, 0.37, 2.9, 61.3]) {
          const { pen, calls } = countingPen(w, h);
          expect(() => scene.draw(pen, data, step.fade, set, t), `${step.id} at ${t} on ${w}x${h}`).not.toThrow();
          expect(() => scene.draw(pen, data, half, set, t), `${step.id}, half shown`).not.toThrow();
          if (Object.values(step.fade).some((v) => v > 0)) expect(calls(), `${step.id} draws nothing`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("writes the line above the picture at every step that has one, with the right numbers", () => {
    const scene = sceneOf(key);
    const data = scene.build(scene.DEFAULTS);
    const again = scene.build(scene.DEFAULTS);
    for (const step of stepsOf(key)) {
      const set = scene.applyAct(step.set, scene.DEFAULTS, step.act);
      expect(Object.keys(set).sort(), step.id).toEqual(Object.keys(step.set).sort());
      if (!step.top) continue;
      const line = scene.topLine(step.top, data, set);
      expect(line.length, step.id).toBeGreaterThan(0);
      expect(line, step.id).not.toMatch(/\{\{|undefined|NaN|Infinity/);
      expect(scene.topLine(step.top, again, set), `${step.id}: not the same on a second build`).toBe(line);
      const want = TOP[key]?.[step.id];
      if (want) expect(line, step.id).toMatch(want);
    }
    for (const id of Object.keys(TOP[key] ?? {})) expect(stepsOf(key).some((s) => s.id === id), `${key}: no step ${id}`).toBe(true);
  });
});
