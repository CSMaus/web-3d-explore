import importlib
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "out"
MEDIA = OUT / "media"
CACHE = ROOT / "voice_cache"
ENV_FILE = os.getenv("SHORT_ENV_FILE", str(ROOT.parents[1] / "web-math-fr" / ".env"))
ENV_COMMENT, ENV_EXPORT, ENV_QUOTES = "#", "export ", ("'", '"')


def load_env(path: str) -> None:
    if not path or not Path(path).is_file():
        return
    for raw in Path(path).read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith(ENV_COMMENT) or "=" not in line:
            continue
        if line.startswith(ENV_EXPORT):
            line = line[len(ENV_EXPORT):]
        key, value = (part.strip() for part in line.split("=", 1))
        if len(value) > 1 and value[0] == value[-1] and value[0] in ENV_QUOTES:
            value = value[1:-1]
        if key and value and key not in os.environ:
            os.environ[key] = value


load_env(ENV_FILE)

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

VOICE = os.getenv("SHORT_VOICE_NAME", "cedar")
SPEECH_VOICE = "onyx"
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

REALTIME_MODEL = os.getenv("SHORT_REALTIME_MODEL", "gpt-realtime-2.1-mini")
REALTIME_URL = "wss://api.openai.com/v1/realtime"
REALTIME_RATE = 24000
REALTIME_FORMAT = "audio/pcm"
REALTIME_WAIT = 60
VOICE_TRIES = 3
READ_STYLE = {
    "ru": "Прочитай вслух текст пользователя слово в слово, на языке самого текста. Голос рассказчика: мужской, низкий, спокойный, неторопливый. Ничего не добавляй и ничего не пропускай. Не комментируй текст и не отвечай на него.",
    "en": "Read the user's text aloud word for word, in the language of the text. The voice of a narrator: male, low, calm, unhurried. Add nothing and omit nothing. Do not comment on the text and do not answer it.",
}
LONE_BEAT = "line"

NUMBER_MARK = "0"
SAME_LETTERS = ("ё", "е")
RU_CASES = "(?:две|двух|двум|двумя|три|трех|трем|тремя|четыре|четырех|четырем|четырьмя|пять|пяти|пятью|шесть|шести|шестью|семь|семи|семью|восемь|восьми|восемью|восьмью|девять|девяти|девятью)"
NUMBER_WORDS = {
    "ru": "|".join((
        "н[оу]л(?:ь|я|ю|ем|е|и|ей|ям|ями|ях)",
        "од(?:ин|н(?:а|о|и|ого|ой|ому|им|ом|у|их|ими))",
        "дв(?:а|е|ух|ум|умя)",
        "тр(?:и|ех|ем|емя)",
        "четыр(?:е|ех|ем|ьмя)",
        "(?:пят|шест|сем|восем|восьм|девят|десят|двадцат|тридцат)(?:ь|и|ью)",
        "(?:один|две|три|четыр|пят|шест|сем|восем|девят)надцат(?:ь|и|ью)",
        "сорока?",
        "(?:пят|шест|сем|восем|восьм)(?:ь|и|ью)десят(?:и|ью)?",
        "девяност[оа]",
        "ст[оа]",
        f"{RU_CASES}(?:сти|ста|сот|стам|стами|стах)",
        "тысяч(?:а|и|е|у|ей|ью|ам|ами|ах)?",
        "милли(?:он|ард)(?:а|у|ом|е|ы|ов|ам|ами|ах)?",
    )),
    "en": "|".join((
        "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve",
        "(?:thir|four|fif|six|seven|eigh|nine)teen",
        "(?:twen|thir|for|fif|six|seven|eigh|nine)ty",
        "(?:hundred|thousand|million)s?",
    )),
}

AUDITION_VOICES = ("cedar", "ash", "echo", "ballad", "verse", "marin")
AUDITION_VIDEO = "v01_dice"
AUDITION_BEAT = "b01"

LOUDNESS = "loudnorm=I=-16:TP=-1.5:LRA=11"
LANG_ENV = "SHORT_LANG"
TOP_FADE = 0.25
CAPTION_OUTLINE = 4
CAPTION_MAX_PX = 960
CAPTION_CHAR_W = 0.62
VIDEO_CRF = 18
RENDER_LIMIT = int(os.getenv("SHORT_RENDER_LIMIT", "900"))
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
