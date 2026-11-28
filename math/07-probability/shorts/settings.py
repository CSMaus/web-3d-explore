import importlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
MEDIA = OUT / "media"
CACHE = ROOT / "voice_cache"

PIXEL_W, PIXEL_H, FPS = 1080, 1920, 30
DRAFT_W, DRAFT_H, DRAFT_FPS = 540, 960, 15
FRAME_W, FRAME_H = 4.5, 8.0
BACKGROUND = "#0E1116"; INK = "#E8E8EA"; MUTED = "#7C828C"
ACCENT_STRUCTURE = "#58C4DD"; ACCENT_MATH = "#FFC857"; ACCENT_CONTRAST = "#FF6B6B"; ACCENT_STABLE = "#63D471"
TITLE_Y, TOP_Y = 3.45, 2.9
TITLE_H, TOP_H, TOP_MAX_W = 0.16, 0.24, 4.0
STAGE_X0, STAGE_Y0, STAGE_UNIT = -2.0, -1.4, 0.04
STAGE_W, STAGE_H = 100, 97.5
CAPTION_Y_PX, CAPTION_SIZE_PX = 1488, 64
CAPTION_FONT = "DejaVu Sans"
LEAD, TAIL, PAUSE = 0.4, 0.8, 0.35

VOICE = "onyx"
VOICE_MODEL = "gpt-4o-mini-tts"
VOICE_STYLE = {
    "ru": "Низкий спокойный мужской голос. Говори неторопливо и тепло, без дикторского пафоса. Чистый русский язык без акцента. Короткая пауза в конце каждой фразы.",
    "en": "A low, calm male voice. Speak unhurriedly and warmly, with no announcer tone. A short pause at the end of each sentence.",
}
SILENT_CHARS_PER_SECOND = 14.0
AUDIO_RATE = 48000

SILENT_LEAD = 0.25
SAMPLE_BYTES = 2
TRIM_DB = -45
KEY_SIZE = 24
VOICE_ENV, VOICE_DEFAULT = "SHORT_VOICE", "auto"
KEY_ENV = "OPENAI_API_KEY"
FFMPEG = os.getenv("SHORT_FFMPEG", "ffmpeg")
FFPROBE = os.getenv("SHORT_FFPROBE", "ffprobe")

REALTIME_MODEL = "gpt-realtime-2.1-mini"
REALTIME_URL = "wss://api.openai.com/v1/realtime"
REALTIME_RATE = 24000
REALTIME_READ = "Прочитай вслух текст пользователя дословно. Ничего не добавляй, не убирай и не объясняй."
CHECK_MODEL = "whisper-1"
VOICE_TRIES = 3

AUDITION_VOICES = ("onyx", "cedar", "ash", "echo")
AUDITION_VIDEO = "v01_dice"
AUDITION_BEATS = ("b02", "b06", "b14")
STORY_STYLE = {
    "ru": "Низкий мужской голос рассказчика. Чуть медленнее обычной речи, с интересом, как будто показываешь фокус.",
    "en": "A low male narrator's voice. A little slower than ordinary speech, with interest, as if showing a trick.",
}

LOUDNESS = "loudnorm=I=-16:TP=-1.5:LRA=11"
LANG_ENV = "SHORT_LANG"
TOP_FADE = 0.25
CAPTION_OUTLINE = 4
VIDEO_CRF = 18
SOUND_RATE = "192k"
VOICE_NOTE = {
    "ru": "Голос синтезирован (OpenAI).",
    "en": "The voice is AI-generated (OpenAI).",
}
SHEET_COLS = 4
SHEET_TILE_W = 270
SHEET_SHARE = 0.85
SHEET_MARGIN = 6

CAPTION_Y0, CAPTION_Y1 = -2.7, -1.7
BOTTOM_Y = -3.2
TEXT_PROBE = "Хg"
FRAME_STROKE = 2
SMOKE_HOLD = 2.0

QUALITY_ENV, QUALITY_DEFAULT = "SHORT_QUALITY", "draft"
QUALITIES = {
    "final": (PIXEL_W, PIXEL_H, FPS),
    "draft": (DRAFT_W, DRAFT_H, DRAFT_FPS),
}


def quality() -> str:
    return os.getenv(QUALITY_ENV, QUALITY_DEFAULT)


def apply(quality: str) -> None:
    config = importlib.import_module("manim").config
    width, height, rate = QUALITIES[quality]
    config.media_dir = str(MEDIA)
    config.pixel_width = width
    config.pixel_height = height
    config.frame_rate = rate
    config.frame_height = FRAME_H
    config.frame_width = FRAME_W
    config.background_color = BACKGROUND
