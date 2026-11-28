import os
import sys
from dataclasses import dataclass
from pathlib import Path

import beats
import settings
import voice

FOLDER = settings.OUT / "audition"
STYLES = {"calm": settings.VOICE_STYLE, "story": settings.STORY_STYLE}
NO_KEY = f"no {settings.KEY_ENV}: nothing to audition"
NO_KEY_CODE = 2


@dataclass(frozen=True)
class Take:
    voice: str
    style: str
    lang: str
    number: int
    text: str

    @property
    def path(self) -> Path:
        return FOLDER / f"{self.voice}-{self.style}-{self.lang}-{self.number}.wav"


def plan() -> list[Take]:
    _, steps = beats.load(settings.AUDITION_VIDEO)
    lines = [b for b in steps if b.id in settings.AUDITION_BEATS]
    return [
        Take(name, style, lang, number, beat.say(lang))
        for name in settings.AUDITION_VOICES
        for style in STYLES
        for lang in beats.LANGS
        for number, beat in enumerate(lines, start=1)
    ]


def index(takes: list[Take]) -> str:
    rows = ["| File | Voice | Style | Language | Text |", "|---|---|---|---|---|"]
    rows += [f"| `{t.path.name}` | {t.voice} | {t.style} | {t.lang} | {t.text} |" for t in takes]
    return "\n".join(rows) + "\n"


def main() -> int:
    if not os.getenv(settings.KEY_ENV):
        print(NO_KEY)
        return NO_KEY_CODE
    takes = plan()
    FOLDER.mkdir(parents=True, exist_ok=True)
    for take in takes:
        source = voice.SpeechProvider(voice=take.voice, style=STYLES[take.style])
        source.synth(take.text, take.lang, take.path)
        print(take.path.name)
    (FOLDER / "index.md").write_text(index(takes), encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
