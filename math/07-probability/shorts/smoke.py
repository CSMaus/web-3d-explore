from manim import Rectangle, Scene

import layout
import settings

settings.apply(settings.quality())


def band(y0: float, y1: float, width: float) -> Rectangle:
    rect = Rectangle(width=width, height=y1 - y0)
    rect.move_to([0, (y0 + y1) / 2, 0])
    return rect


def zones() -> list[tuple[str, Rectangle, float, str]]:
    stage_w = settings.STAGE_W * settings.STAGE_UNIT
    title = band(settings.TITLE_Y - settings.TITLE_H, settings.TITLE_Y + settings.TITLE_H, settings.TOP_MAX_W)
    top = band(settings.TOP_Y - settings.TOP_H, settings.TOP_Y + settings.TOP_H, settings.TOP_MAX_W)
    captions = band(settings.CAPTION_Y0, settings.CAPTION_Y1, stage_w)
    bottom = band(-settings.FRAME_H / 2, settings.BOTTOM_Y, settings.FRAME_W)
    return [
        ("Title", title, settings.TITLE_H, settings.MUTED),
        ("Top line", top, settings.TOP_H, settings.INK),
        ("Stage", layout.stage_rect(), settings.TOP_H, settings.MUTED),
        ("Captions", captions, settings.TOP_H, settings.MUTED),
        ("Bottom", bottom, settings.TOP_H, settings.MUTED),
    ]


class Smoke(Scene):
    def construct(self):
        for name, rect, height, colour in zones():
            rect.set_stroke(settings.ACCENT_STRUCTURE, settings.FRAME_STROKE)
            words = layout.label(name, height, colour).move_to(rect.get_center())
            self.add(rect, words)
        self.wait(settings.SMOKE_HOLD)
