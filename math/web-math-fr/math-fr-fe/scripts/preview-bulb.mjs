import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const W = Number(process.env.W ?? 260), H = W;
const STEPS = Number(process.env.STEPS ?? 70);
const INNER = Number(process.env.INNER ?? 9);
const POWER = Number(process.env.POWER ?? 8);
const FAR = 7, TAU = Math.PI * 2;
const LIFT = Number(process.env.LIFT ?? 0.45);
const ZOOM = Number(process.env.ZOOM ?? 1);
const PULSE = Number(process.env.PULSE ?? 3);
const KEY = Number(process.env.KEY ?? 1.3);
const FILL = Number(process.env.FILL ?? 0.12);
const SHINE = Number(process.env.SHINE ?? 0.55);
const GLOW = Number(process.env.GLOW ?? 0.8);
const HAZE = Number(process.env.HAZE ?? 0.34);

const RAMP = JSON.parse(
  process.argv[3] ?? process.env.RAMP ?? '["#061a30","#0f4c80","#2e97c9","#8fe0f5","#f2feff"]',
);
const BACK = process.argv[4] ?? process.env.BACK ?? "#04080f";

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const stops = RAMP.map(hex), back = hex(BACK);

function rampAt(t) {
  const x = Math.min(Math.max(t, 0), 1) * 4;
  const i = Math.min(Math.floor(x), 3), f = x - Math.floor(x);
  const a = stops[i], b = stops[i + 1];
  return [0, 1, 2].map((k) => a[k] * (1 - f) + b[k] * f);
}

function bulb(px, py, pz) {
  let zx = px, zy = py, zz = pz, dr = 1, r = 0, used = 0;
  for (let i = 0; i < INNER; i++) {
    r = Math.hypot(zx, zy, zz);
    if (r > 2) break;
    used = i;
    const theta = Math.acos(Math.min(Math.max(zz / r, -1), 1));
    const phi = Math.atan2(zy, zx);
    dr = Math.pow(r, POWER - 1) * POWER * dr + 1;
    const zr = Math.pow(r, POWER), th = theta * POWER, ph = phi * POWER;
    zx = zr * Math.sin(th) * Math.cos(ph) + px;
    zy = zr * Math.sin(th) * Math.sin(ph) + py;
    zz = zr * Math.cos(th) + pz;
  }
  return { d: (0.5 * Math.log(Math.max(r, 1e-6)) * r) / Math.max(dr, 1e-6), escape: used / (INNER - 1) };
}

const de = (x, y, z) => bulb(x, y, z).d;

function frame(phase) {
  const breath = 0.5 + 0.5 * Math.sin(TAU * phase * PULSE);
  const spin = (phase * TAU) / POWER, ca = Math.cos(spin), sa = Math.sin(spin);
  const reach = 2.45 / ZOOM;
  const eye = [reach * Math.cos(LIFT) * ca, reach * Math.cos(LIFT) * sa, reach * Math.sin(LIFT)];
  const len = Math.hypot(...eye);
  const fwd = eye.map((v) => -v / len);
  let side = [-fwd[1], fwd[0], 0];
  const sl = Math.hypot(...side); side = side.map((v) => v / sl);
  const up = [fwd[1] * side[2] - fwd[2] * side[1], fwd[2] * side[0] - fwd[0] * side[2], fwd[0] * side[1] - fwd[1] * side[0]];
  const keyRaw = [0.55 * ca - 0.62 * sa, 0.55 * sa + 0.62 * ca, 0.62];
  const kl = Math.hypot(...keyRaw); const key = keyRaw.map((v) => v / kl);

  const px = new Uint8Array(W * H * 3);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const ux = (i * 2 - W) / Math.min(W, H), uy = -((j * 2 - H) / Math.min(W, H));
      let rd = [fwd[0] * 1.55 + side[0] * ux + up[0] * uy, fwd[1] * 1.55 + side[1] * ux + up[1] * uy, fwd[2] * 1.55 + side[2] * ux + up[2] * uy];
      const rl = Math.hypot(...rd); rd = rd.map((v) => v / rl);
      let t = 0.35, hit = false, escape = 0, haze = 0, used = STEPS;
      for (let s = 0; s < STEPS; s++) {
        const p = [eye[0] + rd[0] * t, eye[1] + rd[1] * t, eye[2] + rd[2] * t];
        const got = bulb(p[0], p[1], p[2]); escape = got.escape;
        haze += 0.02 / (1 + 30 * got.d * got.d);
        if (got.d < 0.0009 * t) { hit = true; used = s; break; }
        t += Math.max(got.d, 0.0007);
        if (t > FAR) break;
      }
      let col = [...back];
      if (hit) {
        const p = [eye[0] + rd[0] * t, eye[1] + rd[1] * t, eye[2] + rd[2] * t];
        const e = Number(process.env.EPS ?? 0.0022) * t;
        let n = [
          de(p[0] + e, p[1], p[2]) - de(p[0] - e, p[1], p[2]),
          de(p[0], p[1] + e, p[2]) - de(p[0], p[1] - e, p[2]),
          de(p[0], p[1], p[2] + e) - de(p[0], p[1], p[2] - e),
        ];
        const nl = Math.hypot(...n) || 1; n = n.map((v) => v / nl);
        const facing = Math.max(-(n[0] * rd[0] + n[1] * rd[1] + n[2] * rd[2]), 0);
        const sheen = Math.pow(1 - facing, 3);
        const core = 1 / (1 + 5.5 * (p[0] * p[0] + p[1] * p[1] + p[2] * p[2]));
        const lam = Math.max(n[0] * key[0] + n[1] * key[1] + n[2] * key[2], 0);
        const ao = Math.min(Math.max(1 - (used / STEPS) * 1.7, 0), 1);
        const inFold = Math.pow(1 - ao, 1.6);
        const ice = rampAt(0.28 + 0.30 * escape);
        const lamp = rampAt(0.54 + 0.20 * inFold);
        const through = inFold * (0.22 + 0.78 * breath) * 1.35 + core * 0.25 * breath;
        const edge = rampAt(0.72);
        const hi = rampAt(0.86);
        let hv = [key[0] - rd[0], key[1] - rd[1], key[2] - rd[2]];
        const hl = Math.hypot(...hv) || 1; hv = hv.map((v) => v / hl);
        const nh = Math.max(n[0] * hv[0] + n[1] * hv[1] + n[2] * hv[2], 0);
        const spec = Math.pow(nh, 14) + 0.35 * Math.pow(nh, 3);
        const fade = 1 - Math.min(Math.max((t - 1.5) * 0.2, 0), 0.45);
        if (process.env.STATS) {
          globalThis.__acc ??= {};
          for (const [k, v] of Object.entries({ lam, ao, inFold, spec, facing, escape, core })) {
            const a = (globalThis.__acc[k] ??= { lo: 1e9, hi: -1e9, sum: 0, n: 0 });
            a.lo = Math.min(a.lo, v); a.hi = Math.max(a.hi, v); a.sum += v; a.n++;
          }
        }
        if (process.env.SHOW) {
          const term = { lam, ao, inFold, spec, facing, escape, core }[process.env.SHOW];
          const g = Math.min(Math.max(term, 0), 1);
          const at0 = (j * W + i) * 3;
          px[at0] = g * 255; px[at0 + 1] = g * 255; px[at0 + 2] = g * 255;
          continue;
        }
        col = [0, 1, 2].map((k) => (ice[k] * (FILL + KEY * lam) * (0.40 + 0.60 * ao) + lamp[k] * through * GLOW * (0.35 + 0.65 * facing) + hi[k] * spec * SHINE + edge[k] * sheen * 0.14) * fade);
      }
      const glow = rampAt(0.5);
      col = [0, 1, 2].map((k) => Math.pow(Math.min(Math.max(col[k] + glow[k] * haze * HAZE * (0.4 + 0.6 * breath), 0), 1), 0.94));
      const at = (j * W + i) * 3;
      px[at] = col[0] * 255; px[at + 1] = col[1] * 255; px[at + 2] = col[2] * 255;
    }
  }
  return px;
}

function png(rgb, w, h) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let j = 0; j < h; j++) {
    raw[j * (w * 3 + 1)] = 0;
    Buffer.from(rgb.subarray(j * w * 3, (j + 1) * w * 3)).copy(raw, j * (w * 3 + 1) + 1);
  }
  const crcTable = [...Array(256)].map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const tail = Buffer.alloc(4); tail.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

const phases = (process.env.PHASES ?? "0.0833,0.1667,0.25,0.3333").split(",").map(Number);
const tiles = phases.map(frame);
const strip = new Uint8Array(W * phases.length * H * 3);
for (let j = 0; j < H; j++) {
  for (let k = 0; k < phases.length; k++) {
    Buffer.from(tiles[k].subarray(j * W * 3, (j + 1) * W * 3)).copy(
      Buffer.from(strip.buffer), (j * W * phases.length + k * W) * 3);
  }
}
writeFileSync(process.argv[2], png(strip, W * phases.length, H));
console.log("wrote", process.argv[2], "phases", phases.map((p) => p.toFixed(3)).join(" "));
if (process.env.STATS && globalThis.__acc) {
  for (const [k, a] of Object.entries(globalThis.__acc)) {
    console.log(k.padEnd(8), "min", a.lo.toFixed(3), "max", a.hi.toFixed(3), "mean", (a.sum / a.n).toFixed(3));
  }
}
