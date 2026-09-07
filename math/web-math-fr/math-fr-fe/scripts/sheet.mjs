import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, crc32, inflateSync } from "node:zlib";

const S = process.env.OUT ?? "/tmp";
const sweeps = JSON.parse(process.argv[2]);
const label = process.argv[3];

function read(p) {
  const d = readFileSync(p);
  let i = 8, w, h, idat = [];
  while (i < d.length) {
    const ln = d.readUInt32BE(i), t = d.subarray(i + 4, i + 8).toString("ascii");
    const body = d.subarray(i + 8, i + 8 + ln);
    if (t === "IHDR") { w = body.readUInt32BE(0); h = body.readUInt32BE(4); }
    if (t === "IDAT") idat.push(body);
    i += 12 + ln;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * 3;
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
  return { w, h, rows };
}

const tiles = sweeps.map((env, k) => {
  const file = `${S}/sw-${k}.png`;
  execFileSync("node", ["scripts/preview-bulb.mjs", file], {
    env: { ...process.env, ...env, PHASES: "0.0833", W: env.W ?? "220" },
    stdio: "ignore",
  });
  return read(file);
});

const cols = Number(process.argv[4] ?? tiles.length);
const rows = Math.ceil(tiles.length / cols);
const tw = tiles[0].w, th = tiles[0].h;
const W = tw * cols, H = th * rows;
const raw = Buffer.alloc((W * 3 + 1) * H, 0);
tiles.forEach((tile, k) => {
  const cx = (k % cols) * tw, cy = Math.floor(k / cols) * th;
  for (let y = 0; y < th; y++) {
    tile.rows[y].copy(raw, (cy + y) * (W * 3 + 1) + 1 + cx * 3);
  }
});
const chunk = (t, d) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(d.length);
  const body = Buffer.concat([Buffer.from(t, "ascii"), d]);
  const tail = Buffer.alloc(4); tail.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, tail]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2;
writeFileSync(`${S}/${label}.png`, Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
]));
console.log("wrote", `${S}/${label}.png`, `${cols}x${rows}`);
