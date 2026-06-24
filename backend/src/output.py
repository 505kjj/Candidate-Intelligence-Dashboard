from __future__ import annotations

import csv
import json
from pathlib import Path

from .loader import CandidateRecord
from .reasoning import behavioral_summary, build_reasoning, top_skills
from .scoring import CandidateScore


WEIGHTS = {
    "semantic_match": 0.28,
    "career_evidence": 0.22,
    "core_skill_fit": 0.16,
    "seniority_fit": 0.10,
    "product_company_fit": 0.08,
    "behavioral_signal_fit": 0.10,
    "logistics_fit": 0.06,
}


def weighted_breakdown(score: CandidateScore) -> dict[str, float]:
    breakdown = {
        name: round(score.components[name].score * weight, 2)
        for name, weight in WEIGHTS.items()
    }
    breakdown["penalties"] = round(score.penalty, 2)
    return breakdown


def write_outputs(
    rows: list[tuple[CandidateRecord, CandidateScore]],
    csv_path: str | Path,
    json_path: str | Path,
) -> None:
    csv_out = Path(csv_path)
    json_out = Path(json_path)
    csv_out.parent.mkdir(parents=True, exist_ok=True)
    json_out.parent.mkdir(parents=True, exist_ok=True)

    enriched = []
    for rank, (candidate, score) in enumerate(rows[:100], 1):
        reasoning = build_reasoning(candidate, score, rank)
        enriched.append((rank, candidate, score, reasoning))

    with csv_out.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["candidate_id", "rank", "score", "reasoning"])
        for rank, candidate, score, reasoning in enriched:
            writer.writerow([candidate.candidate_id, rank, f"{score.final_score:.6f}", reasoning])

    payload = []
    for rank, candidate, score, reasoning in enriched:
        payload.append(
            {
                "candidate_id": candidate.candidate_id,
                "rank": rank,
                "score": round(score.final_score, 2),
                "reasoning": reasoning,
                "title": candidate.title,
                "location": candidate.location or candidate.country,
                "experience_years": candidate.experience_years,
                "top_skills": top_skills(candidate, 6),
                "risk_level": score.risk_level,
                "strengths": score.strengths,
                "concerns": score.concerns,
                "score_breakdown": weighted_breakdown(score),
                "behavioral_signals": behavioral_summary(candidate),
            }
        )

    with json_out.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
