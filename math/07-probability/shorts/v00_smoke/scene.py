from manim import Create, FadeIn, Rectangle, VGroup

import layout
import settings
from short import Short, num

SCENE = "Smoke"
FRAMES_SHARE = 0.5
STEPS = 3


def band(y0: float, y1: float, width: float) -> Rectangle:
    rect = Rectangle(width=width, height=y1 - y0)
    rect.move_to([0, (y0 + y1) / 2, 0])
    return rect


def zones() -> list[tuple[str, Rectangle]]:
    stage_w = settings.STAGE_W * settings.STAGE_UNIT
    return [
        ("Title", band(settings.TITLE_Y - settings.TITLE_H, settings.TITLE_Y + settings.TITLE_H, settings.TOP_MAX_W)),
        ("Top line", band(settings.TOP_Y - settings.TOP_H, settings.TOP_Y + settings.TOP_H, settings.TOP_MAX_W)),
        ("Stage", layout.stage_rect()),
        ("Captions", band(settings.CAPTION_Y0, settings.CAPTION_Y1, stage_w)),
        ("Bottom", band(-settings.FRAME_H / 2, settings.BOTTOM_Y, settings.FRAME_W)),
    ]


class Smoke(Short):
    video = "v00_smoke"

    def construct(self):
        frames = VGroup(*[rect.set_stroke(settings.ACCENT_STRUCTURE, settings.FRAME_STROKE) for _, rect in zones()])
        stage = layout.label("Stage", settings.TOP_H, settings.MUTED).move_to(layout.S(settings.STAGE_W / 2, settings.STAGE_H / 2))
        with self.beat("b01") as b:
            self.play(Create(frames), run_time=b.share(FRAMES_SHARE))
        with self.beat("b02"):
            self.top("Шаг: {n} из {most} | Step: {n} of {most}", n=num(2, self.lang), most=num(STEPS, self.lang))
        with self.beat("b03"):
            self.top("Шаг: {n} из {most} | Step: {n} of {most}", n=num(STEPS, self.lang), most=num(STEPS, self.lang))
            self.play(FadeIn(stage), run_time=settings.TOP_FADE)
        self.finish()
