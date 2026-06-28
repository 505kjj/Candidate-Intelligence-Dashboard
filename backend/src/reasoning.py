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


# Acronyms/terms that read better in their conventional casing.
_CASING = {
    "ml": "ML", "ai": "AI", "nlp": "NLP", "rag": "RAG", "llm": "LLM",
    "ndcg": "NDCG", "mrr": "MRR", "map": "MAP", "a/b test": "A/B testing",
    "ab test": "A/B testing", "production ml": "production ML",
    "production machine learning": "production ML", "ml pipeline": "ML pipelines",
    "feature pipeline": "feature pipelines", "data pipeline": "data pipelines",
    "recommender": "recommender systems", "recommendation engine": "recommendation engines",
    # vector / search / framework proper nouns (matched from career text in lowercase)
    "pinecone": "Pinecone", "faiss": "FAISS", "qdrant": "Qdrant", "milvus": "Milvus",
    "weaviate": "Weaviate", "pgvector": "pgvector", "elasticsearch": "Elasticsearch",
    "opensearch": "OpenSearch", "langchain": "LangChain", "llamaindex": "LlamaIndex",
    "haystack": "Haystack", "pytorch": "PyTorch", "tensorflow": "TensorFlow",
    "bm25": "BM25", "mlflow": "MLflow", "bentoml": "BentoML", "fastapi": "FastAPI",
    "spark": "Spark", "kafka": "Kafka", "airflow": "Airflow",
}


def _humanize(term: str) -> str:
    return _CASING.get(term.lower().strip(), term)


def _dedupe_near(items: list[str]) -> list[str]:
    """Drop singular/plural near-duplicates, e.g. 'embedding' vs 'embeddings'."""
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        key = item.lower().strip().rstrip("s")
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _join_human(items: list[str], limit: int = 3) -> str:
    parts = [_humanize(x) for x in _dedupe_near(items)[:limit]]
    if not parts:
        return ""
    if len(parts) == 1:
        return parts[0]
    if len(parts) == 2:
        return f"{parts[0]} and {parts[1]}"
    return f"{', '.join(parts[:-1])}, and {parts[-1]}"


def _real_companies(candidate: CandidateRecord, limit: int = 3) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for role in candidate.career_history:
        company = clean_text(role.get("company"))
        if not company or company.lower() in seen:
            continue
        seen.add(company.lower())
        out.append(company)
        if len(out) >= limit:
            break
    return out


def _availability_phrase(candidate: CandidateRecord) -> str:
    """Short factual availability summary, only from fields that are present."""
    s = candidate.redrob_signals
    bits: list[str] = []
    if s.get("open_to_work_flag") is True:
        bits.append("open to work")
    resp = safe_float(s.get("recruiter_response_rate"), -1)
    if resp >= 0.5:
        bits.append(f"{resp:.0%} recruiter response")
    notice = safe_int(s.get("notice_period_days"), -1)
    if 0 <= notice <= 30:
        bits.append(f"{notice}-day notice")
    return ", ".join(bits[:3])


def build_reasoning(candidate: CandidateRecord, score: CandidateScore, rank: int) -> str:
    meta = score.meta
    career_ev = score.components["career_evidence"].evidence
    skills = top_skills(candidate, 4)
    companies = _real_companies(candidate, 3)
    years = float(candidate.experience_years or 0)
    title = candidate.title or "AI engineer"
    loc = candidate.location or meta.get("country") or "India"
    seed = sum(ord(c) for c in candidate.candidate_id)

    # --- evidence clause (real career keywords + real companies, no invention) ---
    ev_phrase = _join_human(career_ev, 3)
    co_phrase = _join_human(companies, 3)
    if ev_phrase and co_phrase:
        evid = f"direct {ev_phrase} work across {co_phrase}"
    elif ev_phrase:
        evid = f"{ev_phrase} experience"
    elif co_phrase:
        evid = f"engineering experience across {co_phrase}"
    elif skills:
        evid = f"a {_humanize(skills[0])}-oriented background"
    else:
        evid = "an applied engineering background"

    openers = [
        f"{years:.1f}-year {title} in {loc} with {evid}.",
        f"{title} out of {loc} ({years:.1f}y), bringing {evid}.",
        f"{years:.1f} years as a {title} in {loc}, with {evid}.",
        f"{loc}-based {title} ({years:.1f}y) showing {evid}.",
    ]
    sentence = openers[seed % len(openers)]

    # --- skill clause (only when there is real skill signal) ---
    if skills and score.components["core_skill_fit"].evidence:
        skill_phrase = _join_human(skills, 4)
        skill_variants = [
            f" {skill_phrase} line up with the role's retrieval and ranking stack.",
            f" Core tooling like {skill_phrase} fits the JD's search and ML needs.",
            f" {skill_phrase} back the embeddings and vector-search requirements.",
            f" Stack spans {skill_phrase}.",
        ]
        sentence += skill_variants[seed % len(skill_variants)]

    # --- concern clause (correct wording) or clean-availability affirmation ---
    notable = meta.get("hard_concerns", []) + meta.get("medium_concerns", [])
    if notable:
        concern_text = notable[0] if len(notable) == 1 else f"{notable[0]}, and {notable[1]}"
        concern_variants = [
            f" Main concern: {concern_text}.",
            f" Watch-out: {concern_text}.",
            f" Tradeoff to weigh: {concern_text}.",
            f" Flagged for {concern_text}.",
        ]
        sentence += concern_variants[seed % len(concern_variants)]
        if score.risk_level == "High":
            sentence += " Retained on JD fit, but ranked with the penalty applied."
    else:
        avail = _availability_phrase(candidate)
        if avail:
            sentence += f" Clean signals: {avail}."

    return sentence[:520]


def behavioral_summary(candidate: CandidateRecord) -> dict[str, object]:
    signals = candidate.redrob_signals
    response = signals.get("recruiter_response_rate")
    response_rate = f"{safe_float(response):.0%}" if response is not None else ""
    notice = signals.get("notice_period_days")
    notice_period = f"{safe_int(notice)} days" if notice is not None else ""
    return {
        "open_to_work": safe_bool(signals.get("open_to_work_flag")),
        "last_active": clean_text(signals.get("last_active_date")),
        "response_rate": response_rate,
        "notice_period": notice_period,
    }
