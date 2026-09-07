import argparse
import importlib
import inspect

import numpy as np
from manim import ImageMobject, Scene, Text, VMobject, config

import settings

HALF_W = config.frame_width / 2
HALF_H = config.frame_height / 2


def texts(mobs):
    found = []
    for m in mobs:
        if isinstance(m, Text):
            found.append(m)
        else:
            found.extend(texts(m.submobjects))
    return found


def ink(mobs):
    found = []
    for m in mobs:
        if isinstance(m, Text):
            continue
        if isinstance(m, ImageMobject):
            found.append(m)
            continue
        if isinstance(m, VMobject) and not m.submobjects:
            if len(m.points) and (m.get_stroke_opacity() > 0 or m.get_fill_opacity() > 0):
                found.append(m)
            continue
        found.extend(ink(m.submobjects))
    return found


def bbox(m):
    return (float(m.get_left()[0]), float(m.get_right()[0]),
            float(m.get_bottom()[1]), float(m.get_top()[1]))


def shrink(box, by):
    return (box[0] + by, box[1] - by, box[2] + by, box[3] - by)


def overlap(a, b):
    wide = min(a[1], b[1]) - max(a[0], b[0])
    high = min(a[3], b[3]) - max(a[2], b[2])
    if wide <= 0 or high <= 0:
        return 0.0
    return wide * high


def off_frame(box):
    return (box[0] < -HALF_W + settings.CHECK_EDGE or box[1] > HALF_W - settings.CHECK_EDGE
            or box[2] < -HALF_H + settings.CHECK_EDGE or box[3] > HALF_H - settings.CHECK_EDGE)


def glyph_boxes(t):
    parts = [g for g in t.submobjects if len(g.points)]
    if not parts:
        return [bbox(t)]
    return [shrink(bbox(g), settings.CHECK_GLYPH_TRIM) for g in parts]


def inside(pts, box):
    return ((pts[:, 0] >= box[0]) & (pts[:, 0] <= box[1])
            & (pts[:, 1] >= box[2]) & (pts[:, 1] <= box[3]))


def gather(shapes):
    chunks = []
    owners = []
    for i, m in enumerate(shapes):
        pts = m.points[:, :2]
        if not len(pts):
            continue
        chunks.append(pts)
        owners.append(np.full(len(pts), i, dtype=np.int64))
    if not chunks:
        return np.zeros((0, 2)), np.zeros(0, dtype=np.int64)
    return np.concatenate(chunks), np.concatenate(owners)


def hits_by_owner(pts, owners, boxes, count):
    total = np.zeros(count, dtype=np.int64)
    if not len(pts):
        return total
    for box in boxes:
        keep = inside(pts, box)
        if keep.any():
            total += np.bincount(owners[keep], minlength=count)
    return total


def image_cover(m, boxes):
    arr = m.pixel_array
    if arr is None or arr.ndim != 3:
        return 0.0
    x0, x1, y0, y1 = bbox(m)
    if x1 <= x0 or y1 <= y0:
        return 0.0
    h, w = arr.shape[0], arr.shape[1]
    alpha = arr[..., 3] if arr.shape[2] == 4 else np.full((h, w), 255, dtype=np.uint8)
    covered = 0
    total = 0
    n = settings.CHECK_IMG_SAMPLES
    for box in boxes:
        xs = np.linspace(box[0], box[1], n)
        ys = np.linspace(box[2], box[3], n)
        gx, gy = np.meshgrid(xs, ys)
        keep = (gx >= x0) & (gx <= x1) & (gy >= y0) & (gy <= y1)
        total += gx.size
        if not keep.any():
            continue
        cx = np.clip(((gx - x0) / (x1 - x0) * (w - 1)).astype(int), 0, w - 1)
        cy = np.clip(((y1 - gy) / (y1 - y0) * (h - 1)).astype(int), 0, h - 1)
        covered += int(((alpha[cy, cx] > settings.CHECK_IMG_ALPHA) & keep).sum())
    return covered / max(total, 1)


def label(m):
    if isinstance(m, ImageMobject):
        return f"image {m.pixel_array.shape[1]}x{m.pixel_array.shape[0]}"
    return f"{type(m).__name__} at {m.get_center()[0]:.1f},{m.get_center()[1]:.1f}"


def inspect_scene(scene, step, faults):
    items = texts(scene.mobjects)
    for m in items:
        box = bbox(m)
        if off_frame(box):
            faults.append((step, "off frame", m.original_text.strip()[:44], ""))
    for i, a in enumerate(items):
        for b in items[i + 1:]:
            area = overlap(bbox(a), bbox(b))
            if area > settings.CHECK_OVERLAP:
                faults.append((step, f"overlap {area:.2f}", a.original_text.strip()[:34],
                               b.original_text.strip()[:34]))
    drawn = ink(scene.mobjects)
    if not drawn:
        return
    shapes = [m for m in drawn if not isinstance(m, ImageMobject)]
    pictures = [m for m in drawn if isinstance(m, ImageMobject)]
    pts, owners = gather(shapes)
    for t in items:
        boxes = glyph_boxes(t)
        if len(shapes):
            hits = hits_by_owner(pts, owners, boxes, len(shapes))
            for i in np.nonzero(hits >= settings.CHECK_INK_HITS)[0]:
                faults.append((step, f"on ink {int(hits[i])}",
                               t.original_text.strip()[:34], label(shapes[int(i)])))
        for m in pictures:
            if not overlap(bbox(t), bbox(m)):
                continue
            cover = image_cover(m, boxes)
            if cover > settings.CHECK_IMG_COVER:
                faults.append((step, f"on image {cover:.2f}",
                               t.original_text.strip()[:34], label(m)))


def run(module_name, only=None):
    module = importlib.import_module(module_name)
    report = {}
    for name, obj in vars(module).items():
        if not (inspect.isclass(obj) and issubclass(obj, Scene) and obj.__module__ == module_name):
            continue
        if only and name != only:
            continue
        faults = []
        counter = {"step": 0}
        original = Scene.play

        def patched(self, *args, **kwargs):
            original(self, *args, **kwargs)
            counter["step"] += 1
            inspect_scene(self, counter["step"], faults)

        Scene.play = patched
        try:
            scene = obj()
            scene.renderer.skip_animations = True
            scene.render()
            leftover = len(texts(scene.mobjects))
        finally:
            Scene.play = original
        seen = set()
        unique = []
        for f in faults:
            key = (f[1].split()[0], f[2], f[3])
            if key not in seen:
                seen.add(key)
                unique.append(f)
        report[name] = (unique, leftover, counter["step"])
    return report


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--m", nargs="+", required=True)
    parser.add_argument("--s", default=None)
    args = parser.parse_args()
    config.quality = "low_quality"
    config.dry_run = True
    config.disable_caching = True
    config.verbosity = "ERROR"
    config.progress_bar = "none"
    for mod in args.m:
        for name, (faults, leftover, steps) in run(mod, args.s).items():
            head = f"{mod}.{name}  steps={steps}  text left at end={leftover}"
            print(head)
            for step, kind, a, b in faults[:settings.CHECK_MAX_REPORT]:
                print(f"    step {step:3} {kind:14} {a!r} {b!r}")
            if not faults:
                print("    clean")


if __name__ == "__main__":
    main()
