import argparse
import io
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

import settings
import timeline


def frame(path, at: float) -> Image.Image:
    shot = subprocess.run([
        settings.FFMPEG, "-v", "error", "-ss", f"{at:.3f}", "-i", str(path),
        "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-",
    ], capture_output=True, check=True)
    return Image.open(io.BytesIO(shot.stdout)).convert("RGB")


def probe(path) -> str:
    seen = subprocess.run([
        settings.FFPROBE, "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height:format=duration", "-of", "csv=p=0", str(path),
    ], capture_output=True, text=True, check=True)
    return " ".join(seen.stdout.split())


def moments(made: timeline.Timeline) -> list[tuple[str, float]]:
    return [(s.id, s.start + settings.SHEET_SHARE * (s.end - s.start)) for s in made.slots]


def sheet(path, out_path, made: timeline.Timeline) -> int:
    cols, tile_w = settings.SHEET_COLS, settings.SHEET_TILE_W
    tile_h = tile_w * settings.PIXEL_H // settings.PIXEL_W
    shots = moments(made)
    rows = -(-len(shots) // cols)
    board = Image.new("RGB", (cols * tile_w, rows * tile_h), settings.BACKGROUND)
    draw = ImageDraw.Draw(board)
    for i, (name, at) in enumerate(shots):
        corner = ((i % cols) * tile_w, (i // cols) * tile_h)
        board.paste(frame(path, at).resize((tile_w, tile_h), Image.LANCZOS), corner)
        draw.text((corner[0] + settings.SHEET_MARGIN, corner[1] + settings.SHEET_MARGIN), name, fill=settings.ACCENT_MATH)
    board.save(out_path)
    return len(shots)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--v", required=True)
    args = parser.parse_args()
    video, lang = Path(args.v).stem.rsplit("_", 1)
    made = timeline.load(video, lang)
    out_path = timeline.folder(video, lang) / "sheet.png"
    count = sheet(args.v, out_path, made)
    print(f"{out_path} {count} frames")
    print(f"video {probe(args.v)} timeline {made.total}")


if __name__ == "__main__":
    main()
