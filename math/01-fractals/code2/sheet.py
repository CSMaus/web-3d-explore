import argparse
import os
import subprocess

from PIL import Image, ImageDraw

import settings


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", path], capture_output=True, text=True)
    return float(out.stdout.strip())


def sheet(path, out_path, cols=settings.SHEET_COLS, rows=settings.SHEET_ROWS,
          tile_w=settings.SHEET_TILE_W):
    total = duration(path)
    count = cols * rows
    tile_h = int(tile_w * 9 / 16)
    board = Image.new("RGB", (cols * tile_w, rows * tile_h), settings.BACKGROUND)
    draw = ImageDraw.Draw(board)
    for i in range(count):
        stamp = total * (i + 0.5) / count
        tmp = f"/tmp/sheet_{i}.png"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{stamp:.2f}", "-i", path,
                        "-frames:v", "1", tmp], check=True)
        im = Image.open(tmp).convert("RGB").resize((tile_w, tile_h), Image.LANCZOS)
        board.paste(im, ((i % cols) * tile_w, (i // cols) * tile_h))
        draw.text(((i % cols) * tile_w + 6, (i // cols) * tile_h + 4),
                  f"{stamp:.1f}s", fill=(255, 220, 90))
    board.save(out_path)
    return total


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--v", nargs="+", required=True)
    parser.add_argument("--o", required=True)
    args = parser.parse_args()
    os.makedirs(args.o, exist_ok=True)
    for path in args.v:
        name = os.path.basename(path).replace(".mp4", ".png")
        total = sheet(path, os.path.join(args.o, name))
        print(f"{name} {total:.1f}s")


if __name__ == "__main__":
    main()
