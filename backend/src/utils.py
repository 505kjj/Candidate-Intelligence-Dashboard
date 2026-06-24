from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Iterable


TODAY = date(2026, 6, 24)


def clean_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return str(value).lower()
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value)
    return re.sub(r"\s+", " ", text).strip()


def lower_text(value: Any) -> str:
    return clean_text(value).lower()


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, tuple):
        return list(value)
    return [value]


def safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None or value == "":
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None or value == "":
            return default
        return int(float(value))
    except (TypeError, ValueError):
        return default


def safe_bool(value: Any, default: bool = False) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        val = value.strip().lower()
        if val in {"true", "yes", "y", "1"}:
            return True
        if val in {"false", "no", "n", "0"}:
            return False
    return default


def parse_date(value: Any) -> date | None:
    text = clean_text(value)
    if not text:
        return None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%Y-%m"):
        try:
            parsed = datetime.strptime(text[:10] if fmt == "%Y-%m-%d" else text, fmt)
            return parsed.date()
        except ValueError:
            continue
    return None


def days_since(value: Any) -> int | None:
    parsed = parse_date(value)
    if not parsed:
        return None
    return max(0, (TODAY - parsed).days)


def clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def get_any(obj: dict[str, Any], keys: Iterable[str], default: Any = None) -> Any:
    if not isinstance(obj, dict):
        return default
    normalized = {re.sub(r"[^a-z0-9]", "", str(k).lower()): k for k in obj.keys()}
    for key in keys:
        direct = obj.get(key)
        if direct not in (None, ""):
            return direct
        folded = re.sub(r"[^a-z0-9]", "", key.lower())
        actual = normalized.get(folded)
        if actual is not None and obj.get(actual) not in (None, ""):
            return obj[actual]
    return default


def token_hit(text: str, term: str) -> bool:
    pattern = r"(?<![a-z0-9])" + re.escape(term.lower()) + r"(?![a-z0-9])"
    return re.search(pattern, text.lower()) is not None


def count_keyword_hits(text: str, keywords: Iterable[str]) -> list[str]:
    low = text.lower()
    hits: list[str] = []
    for keyword in keywords:
        if keyword.lower() in low:
            hits.append(keyword)
    return hits


def uniq_keep_order(values: Iterable[str], limit: int | None = None) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        text = clean_text(value)
        key = text.lower()
        if not text or key in seen:
            continue
        seen.add(key)
        out.append(text)
        if limit and len(out) >= limit:
            break
    return out


def estimate_years_from_history(history: list[dict[str, Any]]) -> float:
    months = 0
    for role in history:
        months += safe_int(get_any(role, ["duration_months", "duration", "months"]), 0)
    if months:
        return round(months / 12.0, 1)

    starts: list[date] = []
    ends: list[date] = []
    for role in history:
        start = parse_date(get_any(role, ["start_date", "start"]))
        end = parse_date(get_any(role, ["end_date", "end"])) or TODAY
        if start:
            starts.append(start)
            ends.append(end)
    if starts and ends:
        return round(max(0, (max(ends) - min(starts)).days) / 365.25, 1)
    return 0.0
