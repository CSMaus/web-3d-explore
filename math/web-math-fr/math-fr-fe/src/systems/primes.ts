/**
 * the primes and the gaps between them, and the one measurement the aside
 * makes on them: how much knowing one gap says about the next. the primes come
 * from a sieve, so nothing is looked up.
 */

export function sieve(upTo: number): number[] {
  const flags = new Uint8Array(upTo + 1);
  const out: number[] = [];
  for (let i = 2; i <= upTo; i++) {
    if (flags[i]) continue;
    out.push(i);
    for (let j = i * i; j <= upTo; j += i) flags[j] = 1;
  }
  return out;
}

/** the first n primes: sieve a range wide enough, by the prime number theorem with room to spare. */
export function firstPrimes(n: number): number[] {
  if (n < 6) return [2, 3, 5, 7, 11, 13].slice(0, n);
  const upTo = Math.ceil(n * (Math.log(n) + Math.log(Math.log(n))) * 1.2);
  return sieve(upTo).slice(0, n);
}

export function gaps(primes: number[]): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < primes.length; i++) out.push(primes[i + 1] - primes[i]);
  return out;
}

/** each value against the next. */
export function returnPairs(values: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i + 1 < values.length; i++) out.push([values[i], values[i + 1]]);
  return out;
}

export function histogram(values: number[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const v of values) out.set(v, (out.get(v) ?? 0) + 1);
  return out;
}

function sd(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
}

/**
 * how much knowing this value says about the next: the average spread of the
 * next value given this one, over the spread with nothing known. a rule gives
 * zero, since the next value is fixed by this one; independent draws give one.
 * only values seen at least `least` times count, so a rare value does not
 * report a spread of zero for want of company.
 */
export function predictability(values: number[], least = 8): { ratio: number; used: number } {
  const pairs = returnPairs(values);
  const total = sd(pairs.map((p) => p[1]));
  if (total === 0) return { ratio: 0, used: 0 };
  const by = new Map<number, number[]>();
  for (const [a, b] of pairs) {
    const list = by.get(a) ?? [];
    list.push(b);
    by.set(a, list);
  }
  let weighted = 0;
  let used = 0;
  for (const list of by.values()) {
    if (list.length < least) continue;
    weighted += sd(list) * list.length;
    used += list.length;
  }
  return { ratio: used ? weighted / used / total : 1, used };
}

/** a shuffled copy, for the comparison that says the order carried nothing. */
export function shuffled(values: number[], seed = 7): number[] {
  const out = values.slice();
  let s = seed >>> 0 || 1;
  const next = () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
