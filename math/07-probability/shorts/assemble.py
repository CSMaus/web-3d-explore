import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

import beats
import captions
import chunks
import settings
import timeline
import voice

ROOT = settings.ROOT
OUT = Path("out")
MEDIA = OUT / "media"


def scene_name(video: str) -> str:
    source = (ROOT / video / "scene.py").read_text(encoding="utf-8")
    named = re.search(r'^SCENE\s*=\s*"(\w+)"', source, re.M)
    if not named:
        raise ValueError(f"{video}/scene.py: no SCENE line")
    return named.group(1)


def has_filter(name: str) -> bool:
    listed = subprocess.run([settings.FFMPEG, "-hide_banner", "-filters"], capture_output=True, text=True, check=True)
    return re.search(rf"^\s*\S+\s+{name}\s", listed.stdout, re.M) is not None


def pitch_filter(pitch: float, rubber: bool) -> str:
    if rubber:
        return f"rubberband=pitch={pitch}"
    rate = settings.AUDIO_RATE
    return f"asetrate={round(rate * pitch)},aresample={rate},atempo={1 / pitch:.6f}"


def ffmpeg_command(video, track, ass, out, total: float, pitch: float, rubber: bool = False) -> list[str]:
    cmd = [settings.FFMPEG, "-y", "-v", "error", "-i", str(video), "-i", str(track), "-vf", f"ass={ass}"]
    if pitch != 1.0:
        cmd += ["-af", pitch_filter(pitch, rubber)]
    cmd += [
        "-map", "0:v:0", "-map", "1:a:0",
        "-c:v", "libx264", "-crf", str(settings.VIDEO_CRF), "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", settings.SOUND_RATE,
        "-t", f"{total:.3f}", str(out),
    ]
    return cmd


def render(video: str, lang: str, quality: str) -> Path:
    name = f"{video}_{lang}"
    env = os.environ | {settings.LANG_ENV: lang, settings.QUALITY_ENV: quality}
    subprocess.run([
        sys.executable, "-m", "manim", "render", f"{video}/scene.py", scene_name(video),
        "-o", name, "--media_dir", str(MEDIA), "--disable_caching",
    ], cwd=ROOT, env=env, check=True, timeout=settings.RENDER_LIMIT)
    made = sorted((ROOT / MEDIA / "videos").glob(f"*/*/{name}.mp4"), key=lambda p: p.stat().st_mtime)
    if not made:
        raise FileNotFoundError(f"{name}.mp4 under {MEDIA}")
    return made[-1].relative_to(ROOT)


def describe(video: str, lang: str) -> str:
    title, steps = beats.load(video)
    rows = [title[lang], chunks.sentences(steps[0].say(lang))[0]]
    if voice.provider().name != "silent":
        rows.append(settings.VOICE_NOTE[lang])
    return "\n".join(rows) + "\n"


def assemble(video: str, lang: str, quality: str, pitch: float) -> Path:
    made = timeline.build(video, lang)
    timeline.save(made)
    folder = OUT / video / lang
    track = folder / "track.wav"
    timeline.track(made, ROOT / track)
    picture = render(video, lang, quality)
    ass = folder / "captions.ass"
    captions.write(made, ROOT / ass)
    out = OUT / f"{video}_{lang}.mp4"
    rubber = pitch != 1.0 and has_filter("rubberband")
    subprocess.run(ffmpeg_command(picture, track, ass, out, made.total, pitch, rubber), cwd=ROOT, check=True)
    (ROOT / out).with_suffix(".txt").write_text(describe(video, lang), encoding="utf-8")
    return ROOT / out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v", required=True)
    parser.add_argument("--l", default=beats.LANGS[0], choices=beats.LANGS)
    parser.add_argument("--q", default=settings.quality(), choices=sorted(settings.QUALITIES))
    parser.add_argument("--p", type=float, default=1.0)
    args = parser.parse_args()
    print(assemble(args.v, args.l, args.q, args.p))


if __name__ == "__main__":
    main()
