import argparse
import os
import sys
from dataclasses import dataclass
from pathlib import Path

import beats
import settings
import voice
import voice_realtime

FOLDER = settings.OUT / "audition"
NO_KEY = f"no {settings.KEY_ENV}: nothing to audition"
NO_KEY_CODE = 2


@dataclass(frozen=True)
class Take:
    voice: str
    lang: str
    text: str

    @property
    def path(self) -> Path:
        return FOLDER / f"{self.voice}-{self.lang}.wav"


def plan(video: str = settings.AUDITION_VIDEO, beat: str = settings.AUDITION_BEAT) -> list[Take]:
    _, steps = beats.load(video)
    line = {step.id: step for step in steps}[beat]
    return [Take(name, lang, line.say(lang)) for name in settings.AUDITION_VOICES for lang in beats.LANGS]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v", default=settings.AUDITION_VIDEO)
    parser.add_argument("--b", default=settings.AUDITION_BEAT)
    args = parser.parse_args(argv)
    if not os.getenv(settings.KEY_ENV):
        print(NO_KEY)
        return NO_KEY_CODE
    takes = plan(args.v, args.b)
    FOLDER.mkdir(parents=True, exist_ok=True)
    for name in settings.AUDITION_VOICES:
        lines = [(f"{args.b}-{t.lang}", t.text, t.lang, t.path) for t in takes if t.voice == name]
        voice_realtime.RealtimeProvider(voice=name).synth_mixed(lines)
    for take in takes:
        print(f"{take.path.name}  {voice.seconds(take.path):6.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
