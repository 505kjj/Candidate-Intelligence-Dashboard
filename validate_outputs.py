#!/usr/bin/env python3
"""
End-to-end output validator for the Candidate Intelligence submission.

Goes beyond the bare CSV format check in validate_submission.py: it also proves
that submission.csv and top_candidates.json agree, that the JSON carries every
required field, that scores/ranks are sane, and (optionally, if the raw dataset is
present) that every ranked candidate_id actually exists in the source pool.

Usage:
    python validate_outputs.py
    python validate_outputs.py --csv outputs/submission.csv --json outputs/top_candidates.json
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from pathlib import Path

CAND_RE = re.compile(r"^CAND_[0-9]{7}$")
REQUIRED_CSV_HEADER = ["candidate_id", "rank", "score", "reasoning"]
REQUIRED_JSON_KEYS = {
    "candidate_id", "rank", "score", "reasoning", "title", "location",
    "experience_years", "top_skills", "risk_level", "strengths", "concerns",
    "score_breakdown", "behavioral_signals",
}
VALID_RISK = {"Low", "Medium", "High"}


def load_csv(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.reader(f)
        header = next(reader)
        if header != REQUIRED_CSV_HEADER:
            raise SystemExit(f"FAIL: CSV header must be {REQUIRED_CSV_HEADER}, got {header}")
        rows = [dict(zip(header, r)) for r in reader if any(c.strip() for c in r)]
    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default="outputs/submission.csv")
    ap.add_argument("--json", default="outputs/top_candidates.json")
    ap.add_argument("--dataset", default="data/candidates.jsonl")
    args = ap.parse_args()

    errors: list[str] = []
    csv_rows = load_csv(Path(args.csv))
    payload = json.load(open(args.json, encoding="utf-8"))

    # 1. counts
    if len(csv_rows) != 100:
        errors.append(f"CSV has {len(csv_rows)} data rows, expected 100.")
    if len(payload) != 100:
        errors.append(f"JSON has {len(payload)} entries, expected 100.")

    # 2. CSV-internal: ids, ranks, scores
    ids = [r["candidate_id"] for r in csv_rows]
    if len(set(ids)) != len(ids):
        errors.append("Duplicate candidate_id in CSV.")
    if any(not CAND_RE.match(i) for i in ids):
        errors.append("A candidate_id does not match CAND_XXXXXXX.")
    ranks = [int(r["rank"]) for r in csv_rows]
    if sorted(ranks) != list(range(1, 101)):
        errors.append("CSV ranks are not exactly 1..100.")
    scores = [float(r["score"]) for r in csv_rows]
    if any(not (0.0 <= s <= 100.0) for s in scores):
        errors.append("A CSV score is outside [0, 100].")
    ordered = [float(r["score"]) for r in sorted(csv_rows, key=lambda x: int(x["rank"]))]
    if any(ordered[i] < ordered[i + 1] for i in range(len(ordered) - 1)):
        errors.append("CSV scores are not non-increasing by rank.")

    # 3. JSON schema + values
    for e in payload:
        missing = REQUIRED_JSON_KEYS - set(e)
        if missing:
            errors.append(f"{e.get('candidate_id','?')}: JSON missing keys {sorted(missing)}")
        if e.get("risk_level") not in VALID_RISK:
            errors.append(f"{e.get('candidate_id','?')}: invalid risk_level {e.get('risk_level')!r}")
        if not str(e.get("reasoning", "")).strip():
            errors.append(f"{e.get('candidate_id','?')}: empty reasoning")

    # 4. CSV <-> JSON agreement (id + rank + score)
    csv_pairs = [(r["candidate_id"], int(r["rank"]), round(float(r["score"]), 2)) for r in csv_rows]
    json_pairs = [(e["candidate_id"], e["rank"], round(float(e["score"]), 2)) for e in payload]
    if csv_pairs != json_pairs:
        errors.append("CSV and JSON disagree on (candidate_id, rank, score) ordering.")

    # 5. ids exist in dataset (optional)
    ds = Path(args.dataset)
    if ds.exists():
        wanted = set(ids)
        found = set()
        with ds.open(encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                cid = json.loads(line).get("candidate_id")
                if cid in wanted:
                    found.add(cid)
                if len(found) == len(wanted):
                    break
        if found != wanted:
            errors.append(f"{len(wanted - found)} ranked candidate_id(s) not found in dataset.")
        else:
            print(f"OK: all 100 candidate_ids exist in {ds}.")
    else:
        print(f"SKIP: dataset {ds} not present; candidate_id existence not checked.")

    if errors:
        print(f"\nVALIDATION FAILED ({len(errors)} issue(s)):")
        for e in errors:
            print(f"  - {e}")
        return 1

    print("\nALL OUTPUT VALIDATION CHECKS PASSED:")
    print("  - 100 rows, ranks 1..100 unique, scores in [0,100] non-increasing")
    print("  - JSON carries all required fields, valid risk levels, non-empty reasoning")
    print("  - CSV and JSON agree on candidate_id / rank / score")
    return 0


if __name__ == "__main__":
    sys.exit(main())
