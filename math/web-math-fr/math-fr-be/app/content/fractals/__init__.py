import json
from pathlib import Path

from app.content.fractals.equations import DEFINITIONS, SYSTEMS

HERE = Path(__file__).parent
PARTS = json.loads((HERE / "parts.json").read_text(encoding="utf-8"))["parts"]

__all__ = ["DEFINITIONS", "PARTS", "SYSTEMS"]
