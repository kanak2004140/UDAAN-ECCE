"""Slow down password guessing.

Failed logins are counted per (email, client address). After `MAX_FAILURES`
within `WINDOW`, further attempts are refused until the window passes; a
successful login clears the count. State is in this process's memory, which is
right for a single server process; with several workers each keeps its own
count, so the real limit is a multiple of this one.
"""

import time
from collections import defaultdict, deque

MAX_FAILURES = 5
WINDOW_SECONDS = 15 * 60

_failures: dict[tuple[str, str], deque[float]] = defaultdict(deque)


def _recent(key: tuple[str, str], now: float) -> deque[float]:
    attempts = _failures[key]
    while attempts and now - attempts[0] > WINDOW_SECONDS:
        attempts.popleft()
    if not attempts:
        _failures.pop(key, None)
    return attempts


def seconds_until_allowed(email: str, client: str) -> int:
    """0 if a login attempt may proceed, otherwise how long to wait."""
    now = time.monotonic()
    key = (email.lower(), client)
    attempts = _recent(key, now)
    if len(attempts) < MAX_FAILURES:
        return 0
    return max(1, int(WINDOW_SECONDS - (now - attempts[0])))


def record_failure(email: str, client: str) -> None:
    _failures[(email.lower(), client)].append(time.monotonic())


def clear(email: str, client: str) -> None:
    _failures.pop((email.lower(), client), None)
