import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

import settings

NEIGHBOURS = ((-1, 0), (-1, 1), (0, 1), (1, 1), (1, 0), (1, -1), (0, -1), (-1, -1))


def config(name):
    cfg = dict(settings.COAST_DEFAULTS)
    cfg.update(settings.COAST_IMAGES[name])
    return cfg


def load(name):
    cfg = config(name)
    img = Image.open(f"{settings.COAST_DIR}/{cfg['file']}").convert("RGB")
    x0, y0, x1, y1 = cfg["crop"]
    box = (int(x0 * img.width), int(y0 * img.height),
           int(x1 * img.width), int(y1 * img.height))
    img = img.crop(box)
    scale = cfg["work"] / max(img.width, img.height)
    if scale < 1:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))),
                         Image.LANCZOS)
    return img, cfg


def land_index(rgb, mode):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if mode == "green":
        return g - b
    if mode == "bright":
        return (r + g + b) / 3
    if mode == "dark":
        return -(r + g + b) / 3
    if mode == "warm":
        return r - b
    raise ValueError(mode)


def fill_cloud(mask, cloud):
    if not cloud.any():
        return mask
    _, (iy, ix) = ndimage.distance_transform_edt(cloud, return_indices=True)
    out = mask.copy()
    out[cloud] = mask[iy[cloud], ix[cloud]]
    return out


def land_mask(img, cfg):
    rgb = np.asarray(img, dtype=float)
    index = land_index(rgb, cfg["mode"])
    if cfg["blur"] > 0:
        index = ndimage.gaussian_filter(index, cfg["blur"])
    mask = index > cfg["thresh"]
    if cfg["cloud"] > 0:
        bright = ndimage.gaussian_filter(rgb.mean(axis=2), cfg["blur"])
        mask = fill_cloud(mask & (bright <= cfg["cloud"]), bright > cfg["cloud"])
    if cfg["close"]:
        mask = ndimage.binary_closing(mask, iterations=cfg["close"])
    if cfg["open"]:
        mask = ndimage.binary_opening(mask, iterations=cfg["open"])
    if cfg["fill"]:
        mask = ndimage.binary_fill_holes(mask)
    labels, count = ndimage.label(mask)
    if count == 0:
        return mask
    fx, fy = cfg["seed"]
    sy = int(fy * (mask.shape[0] - 1))
    sx = int(fx * (mask.shape[1] - 1))
    tag = labels[sy, sx]
    if tag == 0:
        sizes = ndimage.sum(mask, labels, range(1, count + 1))
        tag = int(np.argmax(sizes)) + 1
    return labels == tag


def trace(mask):
    pad = np.zeros((mask.shape[0] + 2, mask.shape[1] + 2), dtype=bool)
    pad[1:-1, 1:-1] = mask
    hits = np.argwhere(pad)
    start = tuple(hits[0])
    back = (start[0], start[1] - 1)
    here = start
    out = [start]
    first_step = None
    while True:
        idx = NEIGHBOURS.index((back[0] - here[0], back[1] - here[1]))
        nxt = None
        for k in range(1, 9):
            d = NEIGHBOURS[(idx + k) % 8]
            cand = (here[0] + d[0], here[1] + d[1])
            if pad[cand]:
                nxt = cand
                back = (here[0] + NEIGHBOURS[(idx + k - 1) % 8][0],
                        here[1] + NEIGHBOURS[(idx + k - 1) % 8][1])
                break
        if nxt is None:
            break
        if first_step is None:
            first_step = nxt
        elif here == start and nxt == first_step:
            break
        here = nxt
        out.append(here)
        if len(out) > settings.COAST_MAX_PTS:
            break
    return np.array([(c - 1, r - 1) for r, c in out], dtype=float)


def longest_run(flags):
    n = len(flags)
    best_start, best_len = 0, 0
    start, run = 0, 0
    for i in range(2 * n):
        if flags[i % n]:
            if run == 0:
                start = i
            run += 1
            if run > best_len:
                best_len, best_start = run, start
        else:
            run = 0
        if run >= n:
            break
    return best_start % n, min(best_len, n)


def trim_border(pts, size, pad):
    w, h = size
    inside = ((pts[:, 0] > pad) & (pts[:, 0] < w - 1 - pad)
              & (pts[:, 1] > pad) & (pts[:, 1] < h - 1 - pad))
    if inside.all():
        return pts
    start, length = longest_run(inside)
    idx = [(start + k) % len(pts) for k in range(length)]
    return pts[idx]


def outline(name):
    img, cfg = load(name)
    mask = land_mask(img, cfg)
    pts = trace(mask)
    if cfg["open_border"]:
        pts = trim_border(pts, img.size, cfg["border_pad"])
    if cfg["step"] > 1:
        pts = pts[::cfg["step"]]
    return img, mask, pts, cfg


def to_screen(pts, size, height, centre):
    w, h = size
    scale = height / h
    out = np.zeros((len(pts), 3))
    out[:, 0] = (pts[:, 0] - w / 2) * scale + centre[0]
    out[:, 1] = (h / 2 - pts[:, 1]) * scale + centre[1]
    return out


def photo_array(img, alpha=255):
    rgb = np.asarray(img.convert("RGB"), dtype=np.uint8)
    arr = np.zeros((rgb.shape[0], rgb.shape[1], 4), dtype=np.uint8)
    arr[..., :3] = rgb
    arr[..., 3] = alpha
    return arr


def photo_box(size, height, centre):
    w, h = size
    width = height * w / h
    return (centre[0] - width / 2, centre[0] + width / 2,
            centre[1] - height / 2, centre[1] + height / 2)


def check_image(name, path):
    img, mask, pts, cfg = outline(name)
    shot = img.convert("RGB").copy()
    draw = ImageDraw.Draw(shot)
    line_pts = [tuple(p) for p in pts]
    if not cfg["open_border"]:
        line_pts.append(line_pts[0])
    draw.line(line_pts, fill=settings.COAST_CHECK_COLOUR, width=settings.COAST_CHECK_WIDTH)
    for end in (line_pts[0], line_pts[-1]):
        draw.ellipse([end[0] - 6, end[1] - 6, end[0] + 6, end[1] + 6],
                     outline=settings.COAST_END_COLOUR, width=3)
    shot.save(path)
    return len(pts), img.size
