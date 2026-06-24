from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .features import (
    ADVANCED_AI_SKILLS,
    CAREER_EVIDENCE_KEYWORDS,
    CORE_SKILL_KEYWORDS,
    LOCATION_TERMS,
    NON_TECH_TITLE_TERMS,
    PRODUCT_INDUSTRY_TERMS,
    SERVICE_COMPANIES,
    TECH_TITLE_TERMS,
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


def score_logistics(candidate: CandidateRecord) -> ComponentScore:
    signals = candidate.redrob_signals
    combined_location = lower_text(f"{candidate.location} {candidate.country}")
    score = 45.0
    evidence: list[str] = []
    concerns: list[str] = []

    if any(term in combined_location for term in LOCATION_TERMS):
        score += 25
        evidence.append(candidate.location or candidate.country or "India location")
    elif candidate.country and lower_text(candidate.country) != "india":
        score -= 15
        concerns.append(f"Outside India ({candidate.country})")

    mode = lower_text(signals.get("preferred_work_mode"))
    if mode in {"hybrid", "flexible", "remote"}:
        score += 10
        evidence.append(f"{mode} work preference")
    if safe_bool(signals.get("willing_to_relocate")):
        score += 12
        evidence.append("willing to relocate")
    elif not any(term in combined_location for term in ["pune", "noida", "delhi", "ncr"]):
        concerns.append("Relocation willingness not shown")

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

    total_months = sum(safe_int(role.get("duration_months"), 0) for role in candidate.career_history)
    if candidate.experience_years > 0 and total_months > candidate.experience_years * 12 * 1.75:
        penalty += 6
        reasons.append("Career timeline looks inconsistent")

    return min(45.0, penalty), uniq_keep_order(reasons, 5)


def score_candidate(candidate: CandidateRecord, semantic_score: float) -> CandidateScore:
    components = {
        "semantic_match": ComponentScore(clamp(semantic_score), [], []),
        "career_evidence": score_career_evidence(candidate),
        "core_skill_fit": score_core_skills(candidate),
        "seniority_fit": score_seniority(candidate),
        "product_company_fit": score_product_company_fit(candidate),
        "behavioral_signal_fit": score_behavioral_signal(candidate),
        "logistics_fit": score_logistics(candidate),
    }
    penalty, penalty_reasons = compute_trap_penalty(candidate, components["career_evidence"], components["core_skill_fit"])
    weights = {
        "semantic_match": 0.28,
        "career_evidence": 0.22,
        "core_skill_fit": 0.16,
        "seniority_fit": 0.10,
        "product_company_fit": 0.08,
        "behavioral_signal_fit": 0.10,
        "logistics_fit": 0.06,
    }
    final_score = sum(components[name].score * weight for name, weight in weights.items()) - penalty
    final_score = clamp(final_score)

    strengths: list[str] = []
    concerns: list[str] = []
    for name, component in components.items():
        if name == "semantic_match":
            continue
        if component.score >= 70 and component.evidence:
            strengths.extend(component.evidence[:2])
        concerns.extend(component.concerns[:2])
    concerns.extend(penalty_reasons[:2])
    risk_level = "Low"
    if penalty >= 18 or final_score < 45:
        risk_level = "High"
    elif penalty >= 8 or final_score < 65:
        risk_level = "Medium"

    return CandidateScore(
        final_score=round(final_score, 6),
        components=components,
        penalty=-round(penalty, 4),
        penalty_reasons=penalty_reasons,
        strengths=uniq_keep_order(strengths, 5),
        concerns=uniq_keep_order(concerns, 5),
        risk_level=risk_level,
    )
