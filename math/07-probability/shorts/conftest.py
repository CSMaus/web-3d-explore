import os
import sys
from pathlib import Path

ROOT = str(Path(__file__).resolve().parent)
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

os.environ.setdefault("SHORT_ENV_FILE", "")

import settings

settings.apply(settings.quality())
