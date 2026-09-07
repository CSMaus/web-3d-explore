import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

from app.core.config import settings


def setup() -> logging.Logger:
    root = logging.getLogger("mathfr")
    if root.handlers:
        return root
    root.setLevel(settings.log.level)
    line = logging.Formatter(settings.log.line)

    stream = logging.StreamHandler()
    stream.setFormatter(line)
    root.addHandler(stream)

    # a serverless container has no durable disk and its writable layer is held in
    # memory, so an empty path means the stream handler alone.
    if not settings.log.path:
        return root

    folder = Path(settings.log.path)
    folder.mkdir(parents=True, exist_ok=True)
    rolling = RotatingFileHandler(
        folder / settings.log.filename,
        maxBytes=settings.log.rotate_mb * 1024 * 1024,
        backupCount=settings.log.keep,
        encoding="utf-8",
    )
    rolling.setFormatter(line)
    root.addHandler(rolling)
    return root
