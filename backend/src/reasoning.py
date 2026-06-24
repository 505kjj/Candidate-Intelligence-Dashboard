from __future__ import annotations

from .loader import CandidateRecord
from .scoring import CandidateScore
from .utils import clean_text, safe_bool, safe_float, safe_int, uniq_keep_order


def top_skills(candidate: CandidateRecord, limit: int = 6) -> list[str]:
    ranked = sorted(
        candidate.skills,
        key=lambda s: (
            {"expert": 4, "advanced": 3, "intermediate": 2, "beginner": 1}.get(clean_text(s.get("proficiency")).lower(), 0),
            safe_int(s.get("endorsements"), 0),
            safe_int(s.get("duration_months"), 0),
        ),
        reverse=True,
    )
    return uniq_keep_order([skill.get("name", "") for skill in ranked], limit)


def build_reasoning(candidate: CandidateRecord, score: CandidateScore, rank: int) -> str:
    career = score.components["career_evidence"]
    skills = score.components["core_skill_fit"]
    seniority = score.components["seniority_fit"]
    behavior = score.components["behavioral_signal_fit"]

    positives: list[str] = []
    if career.evidence:
        positives.append("career history shows " + ", ".join(career.evidence[:3]))
    if skills.evidence:
        positives.append("skills include " + ", ".join(top_skills(candidate, 4)))
    if seniority.evidence:
        positives.append(seniority.evidence[0])
    if behavior.evidence:
        positives.append("signals show " + ", ".join(behavior.evidence[:2]))

    if not positives:
        positives.append(f"profile has adjacent technical evidence for rank {rank}")

    concerns = score.concerns[:2]
    if score.risk_level == "Low" and not concerns:
        concerns = ["no major trap indicators detected"]
    elif not concerns:
        concerns = ["limited explicit retrieval/ranking proof"]

    sentence = "Strong match because " if score.final_score >= 72 else "Ranked here because "
    sentence += "; ".join(positives[:3]) + "."
    sentence += " Minor concern: " + "; ".join(concerns) + "."
    return sentence[:700]


def behavioral_summary(candidate: CandidateRecord) -> dict[str, object]:
    signals = candidate.redrob_signals
    response = signals.get("recruiter_response_rate")
    if response is not None:
        response_rate = f"{safe_float(response):.0%}"
    else:
        response_rate = ""
    notice = signals.get("notice_period_days")
    notice_period = f"{safe_int(notice)} days" if notice is not None else ""
    return {
        "open_to_work": safe_bool(signals.get("open_to_work_flag")),
        "last_active": clean_text(signals.get("last_active_date")),
        "response_rate": response_rate,
        "notice_period": notice_period,
    }
