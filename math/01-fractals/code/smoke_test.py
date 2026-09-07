from manim import Scene, Circle, Text, Create, Write, DOWN

import settings


class SmokeTest(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        shape = Circle(radius=1.5, color=settings.ACCENT_STRUCTURE)
        label = Text("fractals", color=settings.INK).next_to(shape, DOWN, buff=0.5)
        self.play(Create(shape))
        self.play(Write(label))
        self.wait(1)
