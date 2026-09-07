"""
builds the banner image used by the repository README.

four systems from the series, one panel each, all in the same palette the site
uses: an iterated function system, a growth model driven by a solved field, and
two escape-time sets. nothing here is drawn by hand; every panel is the output
of the rule printed beside it in the README.

    python math/01-fractals/tools/readme_banner.py

writes readme/banner.png at the top of the repository, wherever it is run from.

needs numpy and pillow, which code2/requirements.txt already pulls in.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image

# the site's "ice" palette, dark end first
RAMP = ("#061a30", "#0f4c80", "#2e97c9", "#8fe0f5", "#f2feff")
BACK = "#04080f"
BODY = "#0a2137"

H = 460
GAP = 10


def rgb(value: str) -> tuple[int, int, int]:
    h = value.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def ramp(stops: tuple[str, ...], bands: int = 256) -> np.ndarray:
    cols = np.array([rgb(s) for s in stops], dtype=float)
    idx = np.linspace(0, len(cols) - 1, bands)
    lo = np.floor(idx).astype(int)
    hi = np.minimum(lo + 1, len(cols) - 1)
    t = (idx - lo).reshape(-1, 1)
    return (cols[lo] * (1 - t) + cols[hi] * t).astype(np.uint8)


TABLE = ramp(RAMP)


def tint(field: np.ndarray, lo: float = 0.0, hi: float = 1.0) -> np.ndarray:
    """a 0..1 field to rgb through the palette."""
    f = np.clip(field, 0, 1) * (hi - lo) + lo
    return TABLE[(np.clip(f, 0, 1) * 255).astype(int)]


# ----------------------------------------------------------------- iterated maps

FERN = (
    # a, b, c, d, e, f, probability
    (0.00, 0.00, 0.00, 0.16, 0.00, 0.00, 0.01),
    (0.85, 0.04, -0.04, 0.85, 0.00, 1.60, 0.85),
    (0.20, -0.26, 0.23, 0.22, 0.00, 1.60, 0.07),
    (-0.15, 0.28, 0.26, 0.24, 0.00, 0.44, 0.07),
)


def fern(width: int, height: int, points: int, seed: int = 7) -> np.ndarray:
    """the chaos game: one point, one map drawn from the weights each step."""
    rng = np.random.default_rng(seed)
    maps = np.array([m[:6] for m in FERN])
    weights = np.array([m[6] for m in FERN])
    picks = rng.choice(len(FERN), size=points, p=weights / weights.sum())

    x = y = 0.0
    xs = np.empty(points)
    ys = np.empty(points)
    for i in range(points):
        a, b, c, d, e, f = maps[picks[i]]
        x, y = a * x + b * y + e, c * x + d * y + f
        xs[i] = x
        ys[i] = y

    keep = 100  # the first few land before the attractor is reached
    xs, ys = xs[keep:], ys[keep:]
    # fitted to what was actually drawn, so a change of maps needs no new bounds
    lo_x, hi_x = xs.min(), xs.max()
    lo_y, hi_y = ys.min(), ys.max()
    pad = 0.02 * (hi_y - lo_y)
    lo_y, hi_y = lo_y - pad, hi_y + pad
    cx = ((xs - lo_x) / (hi_x - lo_x) * (width - 1)).astype(int)
    cy = ((1 - (ys - lo_y) / (hi_y - lo_y)) * (height - 1)).astype(int)
    ok = (cx >= 0) & (cx < width) & (cy >= 0) & (cy < height)

    hits = np.zeros((height, width), dtype=np.int32)
    np.add.at(hits, (cy[ok], cx[ok]), 1)
    dense = np.log1p(hits) / np.log1p(hits.max())
    out = tint(dense ** 0.75, 0.18, 1.0)
    out[hits == 0] = rgb(BACK)
    return out


# --------------------------------------------------------------- dielectric breakdown


def breakdown(size: int, sites: int, eta: float = 1.0, sweeps: int = 24, seed: int = 3):
    """
    the field is relaxed on the grid, then the next site to light up is drawn
    with a chance proportional to its field strength raised to a power.
    """
    rng = np.random.default_rng(seed)
    phi = np.zeros((size, size))
    on = np.zeros((size, size), dtype=bool)
    mid = size // 2
    on[mid, mid] = True

    def relax(times: int) -> None:
        for _ in range(times):
            nxt = phi.copy()
            nxt[1:-1, 1:-1] = 0.25 * (
                phi[:-2, 1:-1] + phi[2:, 1:-1] + phi[1:-1, :-2] + phi[1:-1, 2:]
            )
            nxt[0, :] = nxt[-1, :] = nxt[:, 0] = nxt[:, -1] = 1.0
            nxt[on] = 0.0
            phi[...] = nxt

    # jacobi relaxation carries the boundary value inward one cell a sweep, so
    # the field does not reach the seed at all until the sweep count passes half
    # the grid width. short of that the first growth step finds zero field
    # everywhere and the whole figure comes out blank with no error, so the
    # settling pass is sized from the grid rather than from the per-step count.
    settle = max(sweeps * 8, size * 2)
    relax(settle)
    mid_field = float(phi[mid - 1, mid])
    if mid_field <= 0.0:
        raise RuntimeError(
            f"the field never reached the seed: {settle} settling sweeps on a "
            f"{size} grid, which needs more than {size // 2}"
        )

    age = np.zeros((size, size))
    for step in range(sites):
        grown = np.zeros_like(on)
        grown[1:-1, 1:-1] = (
            on[:-2, 1:-1] | on[2:, 1:-1] | on[1:-1, :-2] | on[1:-1, 2:]
        )[...]
        edge = grown & ~on
        if not edge.any():
            break
        strength = np.where(edge, np.clip(phi, 0, None) ** eta, 0.0)
        total = strength.sum()
        if total <= 0:
            # stopping here on the first step means nothing was drawn at all,
            # which is worth an error rather than a blank panel
            if step == 0:
                raise RuntimeError("no field at the seed's neighbours on the first step")
            break
        flat = rng.choice(strength.size, p=(strength / total).ravel())
        r, c = divmod(int(flat), size)
        on[r, c] = True
        age[r, c] = (step + 1) / sites
        relax(sweeps)
    return on, age


def breakdown_panel(width: int, height: int, quick: bool = False) -> np.ndarray:
    size = 161
    on, age = breakdown(size, sites=340 if quick else 1500, sweeps=12 if quick else 20)
    field = np.where(on, 0.28 + 0.72 * age, 0.0)
    img = tint(field, 0.22, 1.0)
    img[~on] = rgb(BACK)

    # cropped to what actually grew, or the figure sits as a speck in a field
    rows, cols = np.where(on)
    pad = 3
    r0, r1 = max(0, rows.min() - pad), min(size, rows.max() + pad + 1)
    c0, c1 = max(0, cols.min() - pad), min(size, cols.max() + pad + 1)
    img = img[r0:r1, c0:c1]
    return np.array(
        Image.fromarray(img, "RGB").resize((width, height), Image.NEAREST)
    )


# ------------------------------------------------------------------- escape time


def escape(
    cx: float,
    cy: float,
    span: float,
    width: int,
    height: int,
    iters: int,
    julia: complex | None = None,
) -> np.ndarray:
    ratio = height / width
    xs = np.linspace(cx - span, cx + span, width)
    ys = np.linspace(cy + span * ratio, cy - span * ratio, height)
    grid = xs[None, :] + 1j * ys[:, None]

    if julia is None:
        c = grid
        z = np.zeros_like(grid)
    else:
        c = np.full(grid.shape, julia)
        z = grid.copy()

    out = np.zeros(grid.shape)
    alive = np.ones(grid.shape, dtype=bool)
    for n in range(iters):
        z[alive] = z[alive] * z[alive] + c[alive]
        big = alive & (np.abs(z) > 8.0)
        # the smooth count, so the bands do not step
        out[big] = n + 1 - np.log2(np.log(np.abs(z[big])) / np.log(8.0))
        alive &= ~big
        if not alive.any():
            break

    inside = alive
    # normalised to the counts actually present. a deep view escapes late
    # everywhere, so dividing by the iteration cap puts the whole picture in the
    # light end of the ramp and the structure disappears.
    outside = out[~inside]
    lo, hi = (outside.min(), outside.max()) if outside.size else (0.0, 1.0)
    span_n = max(hi - lo, 1e-9)
    frac = np.where(inside, 0.0, (out - lo) / span_n) ** 0.72
    img = tint(frac, 0.04, 1.0)
    img[inside] = rgb(BODY)
    return img


def panels(quick: bool) -> list[tuple[str, np.ndarray]]:
    pts = 120_000 if quick else 900_000
    return [
        ("iterated maps", fern(int(H * 0.52), H, pts)),
        ("dielectric breakdown", breakdown_panel(int(H * 0.9), H, quick)),
        (
            "a Julia set",
            escape(0.0, 0.0, 1.45, int(H * 1.25), H, 220, julia=complex(-0.7269, 0.1889)),
        ),
        (
            "the Mandelbrot boundary",
            escape(-0.743643887037151, 0.13182590420533, 6.0e-4, int(H * 1.45), H, 420),
        ),
    ]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quick", action="store_true", help="fewer points, for a fast look")
    # resolved against the top of the repository rather than the working
    # directory, so the command in the README works from anywhere
    root = Path(__file__).resolve().parents[3]
    ap.add_argument("--out", default=str(root / "readme" / "banner.png"))
    args = ap.parse_args()

    built = panels(args.quick)
    total = sum(p.shape[1] for _, p in built) + GAP * (len(built) - 1)
    sheet = np.zeros((H, total, 3), dtype=np.uint8)
    sheet[:, :] = rgb(BACK)
    at = 0
    for name, panel in built:
        w = panel.shape[1]
        sheet[:, at : at + w] = panel
        print(f"  {name:24s} {w} by {H}")
        at += w + GAP

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    # a palette image, since every panel is drawn from one 256-entry ramp anyway
    Image.fromarray(sheet, "RGB").convert(
        "P", palette=Image.Palette.ADAPTIVE, colors=256
    ).save(out, optimize=True)
    print(f"\n  {out}  {out.stat().st_size / 1024:.0f} KB  {total} by {H}")


if __name__ == "__main__":
    main()
