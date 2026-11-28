import re
from dataclasses import dataclass
from pathlib import Path

import chunks
import settings
from timeline import Timeline

STYLE = "Say"
HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: {style},{font},{size},{main},{main},{edge},{edge},-1,0,0,0,100,100,0,0,1,{outline},0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


@dataclass(frozen=True)
class Event:
    start: float
    end: float
    words: tuple[str, ...]
    lit: int


def bgr(colour: str) -> str:
    digits = colour.lstrip("#").upper()
    return digits[4:6] + digits[2:4] + digits[0:2]


def ass_colour(colour: str) -> str:
    return f"&H{bgr(colour)}&"


def stamp(seconds: float) -> str:
    hundredths = round(seconds * 100)
    minutes, rest = divmod(hundredths, 6000)
    hours, minutes = divmod(minutes, 60)
    return f"{hours}:{minutes:02d}:{rest // 100:02d}.{rest % 100:02d}"


def letters(word: str) -> int:
    return max(1, len(re.sub(r"[^\w]", "", word, flags=re.UNICODE)))


def events(timeline: Timeline) -> list[Event]:
    out = []
    for slot in timeline.slots:
        parts = chunks.chunks(slot.text, timeline.lang)
        spans = []
        for part, share in zip(parts, chunks.weights(parts)):
            words = tuple(part.split())
            total = sum(letters(w) for w in words)
            spans += [(words, lit, share * letters(w) / total) for lit, w in enumerate(words)]
        done = 0.0
        for at, (words, lit, share) in enumerate(spans):
            start = slot.start + slot.speech * done
            done = 1.0 if at == len(spans) - 1 else done + share
            out.append(Event(start, slot.start + slot.speech * done, words, lit))
    return out


def line(event: Event) -> str:
    lit, plain = ass_colour(settings.INK), ass_colour(settings.MUTED)
    words = [f"{{\\c{lit}}}{w}{{\\c{plain}}}" if i == event.lit else w for i, w in enumerate(event.words)]
    place = f"{{\\an5\\pos({settings.PIXEL_W // 2},{settings.CAPTION_Y_PX})}}"
    return f"Dialogue: 0,{stamp(event.start)},{stamp(event.end)},{STYLE},,0,0,0,,{place}{' '.join(words)}"


def write(timeline: Timeline, path) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    head = HEAD.format(
        width=settings.PIXEL_W,
        height=settings.PIXEL_H,
        style=STYLE,
        font=settings.CAPTION_FONT,
        size=settings.CAPTION_SIZE_PX,
        main=f"&H00{bgr(settings.MUTED)}",
        edge=f"&H00{bgr(settings.BACKGROUND)}",
        outline=settings.CAPTION_OUTLINE,
    )
    path.write_text(head + "\n".join(line(e) for e in events(timeline)) + "\n", encoding="utf-8")
    return path
