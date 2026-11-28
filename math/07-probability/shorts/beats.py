import importlib
from dataclasses import dataclass

import settings

LANGS = ("ru", "en")
VIDEOS = ("v01_dice", "v02_test", "v03_game", "v04_silence", "v05_taxi", "v06_ruin")


@dataclass(frozen=True)
class Beat:
    id: str
    ru: str
    en: str
    pause: float = settings.PAUSE

    def say(self, lang: str) -> str:
        if lang not in LANGS:
            raise KeyError(lang)
        return getattr(self, lang)


def load(video: str) -> tuple[dict[str, str], list[Beat]]:
    script = importlib.import_module(f"{video}.script")
    return script.TITLE, list(script.BEATS)
