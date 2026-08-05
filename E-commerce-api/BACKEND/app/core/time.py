"""Shared UTC timestamp helpers."""

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return an aware datetime in UTC for persistence and comparisons."""
    return datetime.now(UTC)
