from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.src.features import JD_QUERY
from backend.src.loader import CandidateRecord, iter_candidates
from backend.src.output import write_outputs
from backend.src.scoring import CandidateScore, score_candidate


def resolve_candidate_path(requested: str | Path) -> Path:
    requested_path = Path(requested)
    if requested_path.exists():
        return requested_path
    sample = ROOT / "data" / "sample_candidates.jsonl"
    if sample.exists():
        print(f"Candidate file not found at {requested_path}. Falling back to {sample}.")
        return sample
    raise FileNotFoundError(f"No candidate file found at {requested_path} or {sample}.")


def compute_semantic_scores(records: list[CandidateRecord]) -> np.ndarray:
    documents = [JD_QUERY] + [record.full_text for record in records]
    vectorizer = TfidfVectorizer(
        max_features=45000,
        ngram_range=(1, 2),
        stop_words="english",
        lowercase=True,
        dtype=np.float32,
        min_df=2 if len(records) > 1000 else 1,
        sublinear_tf=True,
    )
    matrix = vectorizer.fit_transform(documents)
    similarities = (matrix[1:] @ matrix[0].T).toarray().ravel()
    if similarities.size == 0:
        return np.array([], dtype=np.float32)
    p95 = float(np.percentile(similarities, 95)) or float(similarities.max()) or 1.0
    scores = np.clip((similarities / p95) * 92.0, 0, 100)
    return scores.astype(np.float32)


def quick_preselect_score(record: CandidateRecord) -> float:
    text = f"{record.title} {record.profile_text} {record.career_text} {record.skills_text}".lower()
    career = record.career_text.lower()
    title = record.title.lower()
    score = 0.0
    positive_terms = [
        "python", "machine learning", "ml engineer", "ai engineer", "retrieval", "ranking",
        "semantic search", "vector search", "embedding", "recommendation", "recommender",
        "elasticsearch", "opensearch", "faiss", "milvus", "qdrant", "pinecone", "weaviate",
        "ndcg", "mrr", "map", "a/b", "production", "deployed", "ml pipeline", "spark", "airflow",
        "kafka", "mlflow", "docker", "kubernetes", "startup", "product",
    ]
    for term in positive_terms:
        if term in career:
            score += 5.0
        elif term in text:
            score += 1.8
    if 5 <= record.experience_years <= 9:
        score += 18
    elif 4 <= record.experience_years <= 10:
        score += 10
    elif record.experience_years < 3:
        score -= 16
    if any(term in title for term in ["ai engineer", "ml engineer", "machine learning engineer", "data scientist", "search engineer", "ranking engineer"]):
        score += 18
    elif any(term in title for term in ["backend engineer", "data engineer", "software engineer"]):
        score += 8
    if any(term in title for term in ["hr", "recruiter", "marketing", "sales", "graphic designer", "accountant", "operations", "content writer", "customer support"]):
        score -= 35
    if any(company in text for company in ["tcs", "infosys", "wipro", "accenture", "cognizant", "capgemini"]) and not any(term in career for term in ["retrieval", "ranking", "recommendation", "embedding", "production ml"]):
        score -= 10
    signals = record.redrob_signals
    if signals.get("open_to_work_flag") is True:
        score += 4
    if signals.get("notice_period_days", 999) and signals.get("notice_period_days", 999) <= 30:
        score += 3
    return score


def load_preselected(path: Path, keep: int = 12000) -> tuple[int, list[CandidateRecord]]:
    import heapq

    heap: list[tuple[float, str, CandidateRecord]] = []
    total = 0
    for record in iter_candidates(path):
        total += 1
        quick = quick_preselect_score(record)
        item = (quick, record.candidate_id, record)
        if len(heap) < keep:
            heapq.heappush(heap, item)
        elif item > heap[0]:
            heapq.heapreplace(heap, item)
        if total % 25000 == 0:
            print(f"Candidates read so far: {total}")
    selected = [item[2] for item in heap]
    selected.sort(key=lambda record: (-quick_preselect_score(record), record.candidate_id))
    return total, selected


def rank_candidates(records: list[CandidateRecord]) -> list[tuple[CandidateRecord, CandidateScore]]:
    semantic_scores = compute_semantic_scores(records)
    scored: list[tuple[CandidateRecord, CandidateScore]] = []
    for record, semantic in zip(records, semantic_scores):
        scored.append((record, score_candidate(record, float(semantic))))
    scored.sort(key=lambda item: (-item[1].final_score, item[0].candidate_id))
    return scored


def main() -> None:
    parser = argparse.ArgumentParser(description="Rank candidates for the Candidate Intelligence Dashboard.")
    parser.add_argument("--candidates", default="./data/candidates.jsonl", help="Path to candidates JSONL.")
    parser.add_argument("--out", default="./outputs/submission.csv", help="Output CSV path.")
    parser.add_argument("--json", default="./outputs/top_candidates.json", help="Output JSON path for dashboard.")
    args = parser.parse_args()

    started = time.perf_counter()
    candidates_path = resolve_candidate_path(args.candidates)
    total_read, records = load_preselected(candidates_path)
    print(f"Candidates read: {total_read} from {candidates_path}")
    print(f"Candidates selected for semantic rerank: {len(records)}")
    if total_read < 100:
        raise ValueError("At least 100 candidates are required to create a valid top-100 submission CSV.")

    scored = rank_candidates(records)
    print(f"Candidates successfully scored: {total_read} coarse, {len(scored)} full rerank")

    top100 = scored[:100]
    write_outputs(top100, args.out, args.json)

    print("Top 10 preview:")
    for idx, (candidate, score) in enumerate(top100[:10], 1):
        print(f"{idx:02d}. {candidate.candidate_id} | {score.final_score:.4f} | {candidate.title} | {candidate.location}")
    elapsed = time.perf_counter() - started
    print(f"Output CSV: {Path(args.out).resolve()}")
    print(f"Output JSON: {Path(args.json).resolve()}")
    print(f"Runtime seconds: {elapsed:.2f}")
    print(f"Validation reminder: python validate_submission.py {args.out}")


if __name__ == "__main__":
    main()
