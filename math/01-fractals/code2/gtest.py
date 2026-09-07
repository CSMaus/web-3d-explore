from manim import Scene, Text, FadeIn
import settings


class Glyphs(Scene):
    def construct(self):
        self.camera.background_color = settings.BACKGROUND
        t = Text("∇²φ = 0   |z² + c| ≥ |z|² − |c|   δᵖ   Σ", color=settings.INK).scale(0.7)
        self.play(FadeIn(t))
        self.wait(0.2)
