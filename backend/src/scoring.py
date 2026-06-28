from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .features import (
    ADVANCED_AI_SKILLS,
    CAREER_EVIDENCE_KEYWORDS,
    CORE_SKILL_KEYWORDS,
    INDIA_HUB_TERMS,
    LOCATION_TERMS,
    NON_TECH_TITLE_TERMS,
    PRODUCT_INDUSTRY_TERMS,
    SERVICE_COMPANIES,
    TECH_TITLE_TERMS,
    WEIGHTS,
)
from .loader import CandidateRecord
from .utils import clamp, count_keyword_hits, days_since, lower_text, safe_bool, safe_float, safe_int, token_hit, uniq_keep_order


@dataclass
class ComponentScore:
    score: float
    evidence: list[str]
    concerns: list[str]


@dataclass
class CandidateScore:
    final_score: float
    components: dict[str, ComponentScore]
    penalty: float
    penalty_reasons: list[str]
    strengths: list[str]
    concerns: list[str]
    risk_level: str
    meta: dict[str, Any]


def _skill_lookup(candidate: CandidateRecord) -> dict[str, dict[str, Any]]:
    return {lower_text(skill.get("name")): skill for skill in candidate.skills if skill.get("name")}


def score_career_evidence(candidate: CandidateRecord) -> ComponentScore:
    career_low = lower_text(candidate.career_text)
    profile_low = lower_text(candidate.profile_text)
    hits = count_keyword_hits(candidate.career_text, CAREER_EVIDENCE_KEYWORDS)
    score = min(70.0, len(set(h.lower() for h in hits)) * 6.5)

    high_value = count_keyword_hits(
        candidate.career_text,
        ["ranking system", "retrieval", "semantic search", "hybrid search", "vector search", "recommendation engine", "ndcg", "mrr", "map", "a/b test", "production ml", "model serving"],
    )
    score += min(25.0, len(set(h.lower() for h in high_value)) * 5.0)

    if any(token_hit(candidate.title, term) for term in TECH_TITLE_TERMS):
        score += 6
    if "production" in career_low and ("user" in career_low or "scale" in career_low or "real-time" in career_low):
        score += 8
        hits.append("production user-facing systems")
    if "self-directed" in profile_low or "side project" in profile_low or "kaggle" in profile_low:
        score -= 8
    if not hits:
        return ComponentScore(10.0 if any(token_hit(candidate.title, term) for term in TECH_TITLE_TERMS) else 3.0, [], ["No direct production AI/search evidence in career descriptions"])

    evidence = uniq_keep_order(hits, 5)
    concerns: list[str] = []
    if "vector" not in career_low and "embedding" not in career_low:
        concerns.append("Limited explicit vector database or embeddings evidence")
    if "ndcg" not in career_low and "mrr" not in career_low and "map" not in career_low and "a/b" not in career_low:
        concerns.append("Ranking evaluation metrics are not explicit")
    return ComponentScore(clamp(score), evidence, concerns[:2])


def score_core_skills(candidate: CandidateRecord) -> ComponentScore:
    skill_map = _skill_lookup(candidate)
    skill_names_low = set(skill_map.keys())
    career_low = lower_text(candidate.career_text)
    hits: list[str] = []
    score = 0.0

    for keyword in CORE_SKILL_KEYWORDS:
        key = keyword.lower()
        in_skills = any(key == name or key in name for name in skill_names_low)
        in_career = key in career_low
        if in_skills or in_career:
            base = 4.0
            if keyword in {"Python", "embeddings", "vector search", "ranking", "NLP", "Elasticsearch", "OpenSearch", "FAISS", "Milvus", "Qdrant", "Pinecone", "Weaviate"}:
                base = 5.5
            if in_career:
                base += 2.5
            if key == "langchain" and not any(term in career_low for term in ["production", "deployed", "retrieval", "ranking"]):
                base *= 0.25
            score += base
            hits.append(keyword)

    advanced_skill_count = sum(1 for name in skill_names_low if name in ADVANCED_AI_SKILLS or any(term in name for term in ADVANCED_AI_SKILLS))
    supported_advanced = sum(1 for name in skill_names_low if (name in career_low or any(part in career_low for part in name.split() if len(part) > 4)) and (name in ADVANCED_AI_SKILLS or any(term in name for term in ADVANCED_AI_SKILLS)))

    if advanced_skill_count >= 6 and supported_advanced <= 1:
        score -= 15

    concerns: list[str] = []
    if "python" not in skill_names_low and "python" not in career_low:
        concerns.append("Python is not explicit")
    if supported_advanced <= 1 and advanced_skill_count >= 4:
        concerns.append("Several AI skills are weakly supported by career text")
    return ComponentScore(clamp(score), uniq_keep_order(hits, 8), concerns[:2])


def score_seniority(candidate: CandidateRecord) -> ComponentScore:
    years = candidate.experience_years
    title_low = lower_text(candidate.title)
    score = 0.0
    concerns: list[str] = []
    evidence = [f"{years:.1f} years experience"] if years else []

    if 5 <= years <= 9:
        score = 100
    elif 4 <= years < 5 or 9 < years <= 10:
        score = 82
    elif 3 <= years < 4 or 10 < years <= 12:
        score = 58
    elif years < 3:
        score = 25
        concerns.append("Below preferred seniority range")
    else:
        score = 42
        concerns.append("Above target range and may be less hands-on")

    if any(term in title_low for term in ["manager", "director", "head of", "vp"]) and not any(term in title_low for term in ["engineer", "architect", "scientist"]):
        score -= 25
        concerns.append("Current title appears manager-focused")
    if any(term in title_low for term in ["intern", "student", "trainee"]):
        score -= 45
        concerns.append("Student/intern profile")
    return ComponentScore(clamp(score), evidence, concerns[:2])


def score_product_company_fit(candidate: CandidateRecord) -> ComponentScore:
    combined = lower_text(" ".join([candidate.current_company, candidate.current_industry, candidate.career_text, candidate.profile_text]))
    product_hits = count_keyword_hits(combined, PRODUCT_INDUSTRY_TERMS)
    service_hits = [company for company in SERVICE_COMPANIES if company in combined]
    score = 35 + min(45, len(set(product_hits)) * 7)
    evidence = uniq_keep_order(product_hits, 5)
    concerns: list[str] = []

    if any(term in combined for term in ["startup", "founding", "0 to 1", "early-stage", "series a"]):
        score += 15
        evidence.append("startup/founding context")
    if any(term in combined for term in ["recruiter", "candidate", "talent", "marketplace"]):
        score += 8
        evidence.append("marketplace or talent workflow context")
    if service_hits and not evidence:
        score -= 18
        concerns.append("Service/consulting background with limited product evidence")
    elif service_hits and len(evidence) <= 1:
        score -= 8
        concerns.append("Service-company experience needs stronger product ML proof")

    if any(term in combined for term in ["mechanical", "civil", "accounting", "brand design", "seo strategy"]) and not any(term in combined for term in ["machine learning", "retrieval", "ranking"]):
        score -= 16
        concerns.append("Domain appears distant from AI product engineering")
    return ComponentScore(clamp(score), uniq_keep_order(evidence, 5), concerns[:2])


def score_behavioral_signal(candidate: CandidateRecord) -> ComponentScore:
    signals = candidate.redrob_signals
    score = 45.0
    evidence: list[str] = []
    concerns: list[str] = []

    if safe_bool(signals.get("open_to_work_flag")):
        score += 14
        evidence.append("open to work")
    else:
        score -= 8
        concerns.append("Not marked open to work")

    active_days = days_since(signals.get("last_active_date"))
    if active_days is not None:
        if active_days <= 30:
            score += 14
            evidence.append(f"active {active_days} days ago")
        elif active_days <= 90:
            score += 6
            evidence.append(f"active {active_days} days ago")
        elif active_days > 180:
            score -= 14
            concerns.append(f"inactive for {active_days} days")

    response_rate = safe_float(signals.get("recruiter_response_rate"), -1)
    if response_rate >= 0:
        score += response_rate * 14
        if response_rate >= 0.7:
            evidence.append(f"{response_rate:.0%} recruiter response rate")
        elif response_rate < 0.15:
            concerns.append(f"low response rate ({response_rate:.0%})")

    response_hours = safe_float(signals.get("avg_response_time_hours"), -1)
    if response_hours >= 0:
        if response_hours <= 24:
            score += 7
            evidence.append("fast recruiter response time")
        elif response_hours >= 120:
            score -= 6
            concerns.append("slow recruiter response time")

    completeness = safe_float(signals.get("profile_completeness_score"), 0)
    score += max(0, completeness - 50) * 0.15
    if completeness >= 80:
        evidence.append(f"{completeness:.0f}% profile completeness")
    elif completeness and completeness < 45:
        score -= 7
        concerns.append(f"low profile completeness ({completeness:.0f}%)")

    github = safe_float(signals.get("github_activity_score"), -1)
    if github >= 50:
        score += 7
        evidence.append("strong GitHub activity")
    elif github == -1:
        concerns.append("GitHub not linked")

    saved = safe_int(signals.get("saved_by_recruiters_30d"), 0)
    if saved >= 5:
        score += 5
        evidence.append(f"saved by {saved} recruiters in 30d")

    interview = safe_float(signals.get("interview_completion_rate"), -1)
    if interview >= 0.8:
        score += 5
        evidence.append("strong interview completion")
    elif 0 <= interview < 0.4:
        score -= 5
        concerns.append("low interview completion")

    notice = safe_int(signals.get("notice_period_days"), 999)
    if notice <= 30:
        score += 6
        evidence.append(f"{notice}-day notice")
    elif notice >= 90:
        score -= 12
        concerns.append(f"{notice}-day notice period")

    return ComponentScore(clamp(score), uniq_keep_order(evidence, 6), concerns[:3])


def location_flags(candidate: CandidateRecord) -> dict[str, Any]:
    """Resolve India / hub residency from the country field first (most reliable),
    falling back to location-term matching when country is missing."""
    country_low = lower_text(candidate.country)
    combined_location = lower_text(f"{candidate.location} {candidate.country}")
    if country_low:
        in_india = country_low == "india"
    else:
        in_india = any(term in combined_location for term in LOCATION_TERMS)
    in_hub = in_india and any(term in combined_location for term in INDIA_HUB_TERMS)
    return {
        "in_india": in_india,
        "in_hub": in_hub,
        "country": candidate.country or ("India" if in_india else ""),
        "combined_location": combined_location,
    }


def relocation_state(candidate: CandidateRecord) -> str:
    """'willing' | 'unwilling' | 'unstated' — distinguishes an explicit False from
    a genuinely missing field, so wording is never overstated."""
    raw = candidate.redrob_signals.get("willing_to_relocate")
    if raw is None:
        return "unstated"
    return "willing" if safe_bool(raw) else "unwilling"


def score_logistics(candidate: CandidateRecord, loc: dict[str, Any]) -> ComponentScore:
    signals = candidate.redrob_signals
    score = 45.0
    evidence: list[str] = []
    concerns: list[str] = []

    if loc["in_india"]:
        score += 25
        evidence.append(candidate.location or "India location")
        if loc["in_hub"]:
            score += 6
            evidence.append("already in the Pune/Delhi-NCR zone")
    elif candidate.country:
        score -= 15
        concerns.append(f"based in {candidate.country}, outside India")

    mode = lower_text(signals.get("preferred_work_mode"))
    if mode in {"hybrid", "flexible", "remote"}:
        score += 8
        evidence.append(f"{mode} work preference")

    reloc = relocation_state(candidate)
    if reloc == "willing":
        score += 12
        evidence.append("willing to relocate")
    elif reloc == "unwilling" and not loc["in_hub"]:
        score -= 10
        concerns.append("not willing to relocate")
    elif reloc == "unstated" and not loc["in_hub"]:
        concerns.append("relocation preference not stated")

    notice = safe_int(signals.get("notice_period_days"), 999)
    if notice <= 30:
        score += 8
    elif notice > 90:
        score -= 12

    return ComponentScore(clamp(score), uniq_keep_order(evidence, 4), concerns[:2])


def compute_trap_penalty(candidate: CandidateRecord, career_score: ComponentScore, skill_score: ComponentScore) -> tuple[float, list[str]]:
    title_low = lower_text(candidate.title)
    career_low = lower_text(candidate.career_text)
    profile_low = lower_text(candidate.profile_text)
    full_low = lower_text(candidate.full_text)
    skill_map = _skill_lookup(candidate)
    skill_names_low = set(skill_map.keys())
    ai_skill_count = sum(1 for name in skill_names_low if name in ADVANCED_AI_SKILLS or any(term in name for term in ADVANCED_AI_SKILLS))
    expert_low_duration = [
        skill.get("name", "")
        for skill in candidate.skills
        if lower_text(skill.get("proficiency")) == "expert" and safe_int(skill.get("duration_months"), 0) <= 6
    ]
    penalty = 0.0
    reasons: list[str] = []

    non_tech_title = any(term in title_low for term in NON_TECH_TITLE_TERMS)
    tech_title = any(term in title_low for term in TECH_TITLE_TERMS)
    if non_tech_title and ai_skill_count >= 5:
        penalty += 24
        reasons.append("Non-technical current title with many advanced AI skills")
    if ai_skill_count >= 7 and career_score.score < 35:
        penalty += 18
        reasons.append("AI skills are not backed by career descriptions")
    if ai_skill_count >= 10 and candidate.experience_years < 2:
        penalty += 22
        reasons.append("Too many advanced AI skills for very low experience")
    if expert_low_duration:
        penalty += min(14, 3 * len(expert_low_duration))
        reasons.append("Expert skills have very low stated duration")
    if ai_skill_count >= 4 and not any(term in career_low for term in ["ml", "machine learning", "retrieval", "ranking", "embedding", "model", "nlp", "search"]) and any(term in profile_low or term in full_low for term in ["ai", "ml", "rag", "llm"]):
        penalty += 14
        reasons.append("AI appears mainly in skills/profile rather than job descriptions")
    if "research" in full_low and not any(term in career_low for term in ["deployed", "production", "serving", "users", "pipeline"]):
        penalty += 8
        reasons.append("Research-heavy profile lacks deployment evidence")
    if "langchain" in skill_names_low and not any(term in career_low for term in ["production", "deployed", "retrieval", "ranking", "user"]):
        penalty += 8
        reasons.append("LangChain/RAG signal looks tutorial-like without production evidence")
    if not tech_title and career_score.score < 20 and skill_score.score > 55:
        penalty += 12
        reasons.append("Skill score materially exceeds career evidence")

    return min(45.0, penalty), uniq_keep_order(reasons, 5)


def career_history_years(candidate: CandidateRecord) -> float:
    months = sum(safe_int(role.get("duration_months"), 0) for role in candidate.career_history)
    return round(months / 12.0, 1)


def experience_consistency(candidate: CandidateRecord) -> dict[str, Any]:
    """Compare the declared years_of_experience against the duration documented in
    career_history. Large over-claims (profile says 16y, history shows ~7y) are the
    planted honeypot/inconsistency pattern in this dataset."""
    profile_years = round(float(candidate.experience_years or 0), 1)
    career_years = career_history_years(candidate)
    gap = round(profile_years - career_years, 1)
    has_history = career_years >= 1.0  # at least some documented duration to compare

    severity = "ok"
    penalty = 0.0
    note = ""
    if has_history and gap >= 5 and profile_years >= 1.6 * max(career_years, 0.1):
        severity = "overclaim_strong"
        penalty = 14.0
        note = f"declares {profile_years:.0f}y but career history documents only ~{career_years:.0f}y"
    elif has_history and gap >= 3:
        severity = "overclaim_moderate"
        penalty = 6.0
        note = f"declared {profile_years:.0f}y runs ahead of the ~{career_years:.0f}y in career history"
    elif has_history and gap <= -2:
        severity = "underclaim"
        penalty = 4.0
        note = f"career history (~{career_years:.0f}y) exceeds the declared {profile_years:.0f}y"
    elif not has_history and profile_years >= 5:
        severity = "sparse_history"
        penalty = 3.0
        note = f"declares {profile_years:.0f}y but career history is sparse/undocumented"

    return {
        "profile_years": profile_years,
        "career_years": career_years,
        "gap": gap,
        "severity": severity,
        "penalty": penalty,
        "note": note,
    }


def compute_feasibility_penalty(
    candidate: CandidateRecord, loc: dict[str, Any], consistency: dict[str, Any]
) -> tuple[float, list[tuple[str, str]]]:
    """Hiring-feasibility + data-trust penalties applied on the 0-100 final scale.
    Returns (penalty, concerns) where each concern is (severity, text); severity is
    'hard' or 'medium' and feeds the risk-level computation."""
    signals = candidate.redrob_signals
    penalty = 0.0
    concerns: list[tuple[str, str]] = []
    reloc = relocation_state(candidate)

    # --- availability ---
    if signals.get("open_to_work_flag") is not True:
        penalty += 7
        concerns.append(("hard", "not currently marked open to work"))

    response = safe_float(signals.get("recruiter_response_rate"), -1)
    if 0 <= response < 0.25:
        penalty += 8
        concerns.append(("hard", f"low recruiter response rate ({response:.0%})"))
    elif 0.25 <= response < 0.35:
        penalty += 3
        concerns.append(("medium", f"modest recruiter response rate ({response:.0%})"))

    inactive = days_since(signals.get("last_active_date"))
    if inactive is not None and inactive > 180:
        penalty += 6
        concerns.append(("hard", f"inactive for {inactive} days"))
    elif inactive is not None and inactive > 120:
        penalty += 3
        concerns.append(("medium", f"last active {inactive} days ago"))

    notice = safe_int(signals.get("notice_period_days"), -1)
    if notice >= 120:
        penalty += 7
        concerns.append(("hard", f"{notice}-day notice period"))
    elif notice >= 90:
        penalty += 5
        concerns.append(("medium", f"{notice}-day notice period"))
    elif notice > 60:
        penalty += 2
        concerns.append(("medium", f"{notice}-day notice period"))

    # --- location / relocation ---
    if not loc["in_india"] and candidate.country:
        if reloc == "willing":
            penalty += 6
            concerns.append(("medium", f"based in {candidate.country} but willing to relocate"))
        else:
            penalty += 13
            concerns.append(("hard", f"based in {candidate.country} and not relocating to India"))
    elif loc["in_india"] and not loc["in_hub"]:
        if reloc == "unwilling":
            penalty += 4
            concerns.append(("medium", "not willing to relocate toward the Pune/NCR zone"))
        elif reloc == "unstated":
            penalty += 2
            concerns.append(("medium", "relocation preference not stated"))

    # --- engineering proof (minor) ---
    github = signals.get("github_activity_score")
    if github is None or safe_float(github, -1) == -1:
        penalty += 1.5  # minor, per JD valuing engineering proof — never a hard reject

    # --- seniority range nudge (component already rewards 5-9) ---
    years = float(candidate.experience_years or 0)
    if years and years < 3:
        penalty += 6
        concerns.append(("medium", f"only {years:.1f}y experience, below the 5-9y target"))
    elif years and years < 4:
        penalty += 2
        concerns.append(("medium", f"{years:.1f}y experience, just under the target band"))
    elif years > 12:
        penalty += 4
        concerns.append(("medium", f"{years:.1f}y experience, well above the target band"))
    elif years > 10:
        penalty += 1

    # --- data-trust / honeypot ---
    if consistency["penalty"] > 0:
        penalty += consistency["penalty"]
        sev = "hard" if consistency["severity"] == "overclaim_strong" else "medium"
        concerns.append((sev, consistency["note"]))

    return penalty, concerns


def score_candidate(candidate: CandidateRecord, semantic_score: float) -> CandidateScore:
    loc = location_flags(candidate)
    consistency = experience_consistency(candidate)
    components = {
        "semantic_match": ComponentScore(clamp(semantic_score), [], []),
        "career_evidence": score_career_evidence(candidate),
        "core_skill_fit": score_core_skills(candidate),
        "seniority_fit": score_seniority(candidate),
        "product_company_fit": score_product_company_fit(candidate),
        "behavioral_signal_fit": score_behavioral_signal(candidate),
        "logistics_fit": score_logistics(candidate, loc),
    }

    trap_penalty, trap_reasons = compute_trap_penalty(
        candidate, components["career_evidence"], components["core_skill_fit"]
    )
    feasibility_penalty, feasibility_concerns = compute_feasibility_penalty(candidate, loc, consistency)
    penalty = min(60.0, trap_penalty + feasibility_penalty)

    final_score = sum(components[name].score * weight for name, weight in WEIGHTS.items()) - penalty
    final_score = clamp(final_score)

    # Evidence-quality concerns come from the content components; hiring-feasibility
    # and honeypot concerns come from the feasibility engine (single source of truth,
    # with correct relocation/availability wording).
    strengths: list[str] = []
    quality_concerns: list[str] = []
    for name, component in components.items():
        if name in {"semantic_match", "behavioral_signal_fit", "logistics_fit"}:
            continue
        if component.score >= 70 and component.evidence:
            strengths.extend(component.evidence[:2])
        quality_concerns.extend(component.concerns[:1])

    hard_concerns = [text for sev, text in feasibility_concerns if sev == "hard"]
    medium_concerns = [text for sev, text in feasibility_concerns if sev == "medium"]
    # Order concerns by severity: hard feasibility, then medium feasibility, then
    # trap reasons, then evidence-quality notes.
    concerns = uniq_keep_order(hard_concerns + medium_concerns + trap_reasons + quality_concerns, 5)

    # Risk level from concern severity + honeypot + location, not just penalty size.
    risk_points = 2 * len(hard_concerns) + len(medium_concerns)
    if trap_penalty >= 8:
        risk_points += 1
    strong_honeypot = consistency["severity"] == "overclaim_strong"
    # Abroad and not relocating is effectively unhirable for a Pune/Noida role.
    abroad_stuck = (not loc["in_india"]) and bool(candidate.country) and relocation_state(candidate) != "willing"
    if (
        strong_honeypot
        or abroad_stuck
        or penalty >= 20
        or risk_points >= 4
        or (hard_concerns and risk_points >= 3)
        or final_score < 45
    ):
        risk_level = "High"
    elif penalty >= 7 or risk_points >= 1 or final_score < 66:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    meta = {
        "in_india": loc["in_india"],
        "in_hub": loc["in_hub"],
        "country": loc["country"],
        "relocation": relocation_state(candidate),
        "profile_years": consistency["profile_years"],
        "career_years": consistency["career_years"],
        "consistency": consistency["severity"],
        "consistency_note": consistency["note"],
        "open_to_work": candidate.redrob_signals.get("open_to_work_flag") is True,
        "response_rate": safe_float(candidate.redrob_signals.get("recruiter_response_rate"), -1),
        "notice_days": safe_int(candidate.redrob_signals.get("notice_period_days"), -1),
        "hard_concerns": hard_concerns,
        "medium_concerns": medium_concerns,
        "trap_penalty": round(trap_penalty, 2),
        "feasibility_penalty": round(feasibility_penalty, 2),
        "primary_concern": (hard_concerns + medium_concerns + trap_reasons + ["none"])[0],
    }

    return CandidateScore(
        final_score=round(final_score, 6),
        components=components,
        penalty=-round(penalty, 4),
        penalty_reasons=trap_reasons + [t for _, t in feasibility_concerns],
        strengths=uniq_keep_order(strengths, 5),
        concerns=concerns,
        risk_level=risk_level,
        meta=meta,
    )
