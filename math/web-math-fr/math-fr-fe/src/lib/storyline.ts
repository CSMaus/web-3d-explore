/**
 * the data of a page's story and the two motions every story picture uses. a story is a list of
 * steps; a step is one sentence and one change of the picture. the page keeps a shown copy of the
 * step's fade values and moves it towards the step's values every frame, so nothing on the picture
 * jumps. nothing here draws and nothing here reads the clock: the tests call these as they are.
 */

/**
 * one step of a story.
 * fade: parts of the picture by name, 0 hidden to 1 shown; the page eases them.
 * set: values that switch at once when the step opens (a count, a mode).
 * top: which line stands above the picture on this step, or null for none.
 * act: the one thing the reader can do on this step, or null for nothing.
 */
export type StoryStep<F extends Record<string, number>, S extends Record<string, number | string>, T extends string = never, A extends string = never> = {
  id: string;
  say: string;
  fade: F;
  set: S;
  top: T | null;
  act: A | null;
};

/** a value moved towards its aim by a share of the gap that grows with the time passed; lands on the aim when close */
export function approach(from: number, to: number, dt: number, rate = 5): number {
  const gap = to - from;
  if (Math.abs(gap) < 0.002) return to;
  return from + gap * Math.min(1, Math.max(0, dt) * rate);
}

/**
 * a count moved towards its aim at a steady pace, faster when far behind, never past the aim.
 * a chain of arrows uses it: the shown count is a fraction, and the last arrow is drawn at that
 * fraction of its length, so a new arrow grows out of the tip.
 */
export function grow(shown: number, target: number, dt: number, perSecond = 2.2): number {
  const gap = target - shown;
  const move = Math.max(perSecond, Math.abs(gap) * 1.6) * Math.max(0, dt);
  return Math.abs(gap) <= move ? target : shown + Math.sign(gap) * move;
}

/** every fade value of the shown copy moved towards the step's, as a new object */
export function easeFade<F extends Record<string, number>>(shown: F, target: F, dt: number, rate = 5): F {
  const out = { ...shown };
  for (const key of Object.keys(target) as (keyof F)[]) {
    out[key] = approach(shown[key] ?? 0, target[key], dt, rate) as F[keyof F];
  }
  return out;
}

/** whether the shown copy has arrived at the step's values */
export function settled<F extends Record<string, number>>(shown: F, target: F): boolean {
  return (Object.keys(target) as (keyof F)[]).every((key) => shown[key] === target[key]);
}

/** a step number held inside the story */
export function clampStep(step: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(step)));
}

/** a whole number as the pages write it: 5,000 and 100,000 */
export function num(n: number): string {
  return Math.round(n).toLocaleString("en");
}

/** a fraction in lowest terms, "6/36 = 1/6"; when it is already lowest, only "1/36" */
export function share(k: number, n: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(k, n) || 1;
  return g === 1 ? `${k}/${n}` : `${k}/${n} = ${k / g}/${n / g}`;
}
