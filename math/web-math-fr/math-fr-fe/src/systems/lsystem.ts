export type Seg = { x0: number; y0: number; x1: number; y1: number; depth: number };

export type Rule = { axiom: string; rules: string; angle: number; passes: number };

export const LSYS_PRESETS: Record<string, Rule> = {
  plant: { axiom: "X", rules: "X = F+[[X]-X]-F[-FX]+X\nF = FF", angle: 25, passes: 6 },
  "Levy C curve": { axiom: "F", rules: "F = +F--F+", angle: 45, passes: 12 },
  "Koch curve": { axiom: "F", rules: "F = F+F--F+F", angle: 60, passes: 4 },
  "Koch snowflake": { axiom: "F--F--F", rules: "F = F+F--F+F", angle: 60, passes: 4 },
  "Sierpinski arrowhead": { axiom: "A", rules: "A = B-A-B\nB = A+B+A", angle: 60, passes: 7 },
  "Gosper flowsnake": {
    axiom: "A",
    rules: "A = A-B--B+A++AA+B-\nB = +A-BB--B-A++A+B",
    angle: 60,
    passes: 4,
  },
  dragon: { axiom: "FX", rules: "X = X+YF+\nY = -FX-Y", angle: 90, passes: 11 },
};

export function parseRules(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\n+/)) {
    const m = line.trim().match(/^([A-Za-z])\s*(?:=|->)\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

export function expand(axiom: string, rules: Record<string, string>, passes: number, cap: number) {
  let word = axiom;
  for (let i = 0; i < passes; i++) {
    let next = "";
    for (const ch of word) next += rules[ch] !== undefined ? rules[ch] : ch;
    if (next.length > cap) return { word, reached: i, capped: true };
    word = next;
  }
  return { word, reached: passes, capped: false };
}

const DRAWN = /[A-WZ]/;

export function rngFrom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function turtle(word: string, angleDeg: number, jitter: number, rand: () => number): Seg[] {
  const a = (angleDeg * Math.PI) / 180;
  let x = 0;
  let y = 0;
  let h = Math.PI / 2;
  let depth = 0;
  const stack: [number, number, number, number][] = [];
  const segs: Seg[] = [];
  const wobble = () => (jitter > 0 ? 1 + (rand() * 2 - 1) * jitter : 1);
  for (const ch of word) {
    if (ch === "+") h += a * wobble();
    else if (ch === "-") h -= a * wobble();
    else if (ch === "[") {
      stack.push([x, y, h, depth]);
      depth++;
    } else if (ch === "]") {
      const s = stack.pop();
      if (s) {
        x = s[0];
        y = s[1];
        h = s[2];
        depth = s[3];
      }
    } else if (ch === "f") {
      x += Math.cos(h);
      y += Math.sin(h);
    } else if (DRAWN.test(ch)) {
      const nx = x + Math.cos(h);
      const ny = y + Math.sin(h);
      segs.push({ x0: x, y0: y, x1: nx, y1: ny, depth });
      x = nx;
      y = ny;
    }
  }
  return segs;
}
