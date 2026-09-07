import secrets

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

hasher = PasswordHasher()


def hash_secret(raw: str) -> str:
    return hasher.hash(raw)


def check_secret(stored: str, raw: str) -> bool:
    try:
        hasher.verify(stored, raw)
    except (VerifyMismatchError, ValueError):
        return False
    return True


def new_token() -> str:
    return secrets.token_urlsafe(32)[:64]


def new_slug() -> str:
    return secrets.token_urlsafe(16)[:22]
