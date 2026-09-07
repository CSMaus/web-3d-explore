SKIP = ("/health", "/docs", "/openapi.json", "/redoc", "/deep")


def worth_logging(path: str) -> bool:
    return not any(part in path for part in SKIP)
