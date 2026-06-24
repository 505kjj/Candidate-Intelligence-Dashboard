from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterator

from .text_builder import (
    build_candidate_text,
    normalize_certifications,
    normalize_education,
    normalize_history,
    normalize_skills,
)
from .utils import clean_text, estimate_years_from_history, get_any, safe_float


@dataclass(slots=True)
class CandidateRecord:
    candidate_id: str
    title: str
    location: str
    country: str
    current_company: str
    current_industry: str
    experience_years: float
    skills: list[dict[str, Any]]
    skill_names: list[str]
    career_history: list[dict[str, Any]]
    education: list[dict[str, Any]]
    certifications: list[dict[str, Any]]
    redrob_signals: dict[str, Any]
    profile_text: str
    career_text: str
    skills_text: str
    education_text: str
    full_text: str


def candidate_from_json(obj: dict[str, Any]) -> CandidateRecord | None:
    candidate_id = clean_text(get_any(obj, ["candidate_id", "id", "candidateId"]))
    if not candidate_id:
        return None

    profile = get_any(obj, ["profile", "candidate_profile"], {}) or {}
    if not isinstance(profile, dict):
        profile = {}

    history = normalize_history(get_any(obj, ["career_history", "experience", "work_experience", "employment_history"], []))
    education = normalize_education(get_any(obj, ["education", "educations"], []))
    skills = normalize_skills(get_any(obj, ["skills", "skill_set", "candidate_skills"], []))
    certifications = normalize_certifications(get_any(obj, ["certifications", "certificates"], []))
    redrob_signals = get_any(obj, ["redrob_signals", "signals", "behavioral_signals"], {}) or {}
    if not isinstance(redrob_signals, dict):
        redrob_signals = {}

    title = clean_text(
        get_any(profile, ["current_title", "headline", "title", "role"])
        or (history[0].get("title", "") if history else "")
    )
    location = clean_text(get_any(profile, ["location", "city", "region"]))
    country = clean_text(get_any(profile, ["country"]))
    current_company = clean_text(get_any(profile, ["current_company"]) or (history[0].get("company", "") if history else ""))
    current_industry = clean_text(get_any(profile, ["current_industry", "industry"]) or (history[0].get("industry", "") if history else ""))
    experience_years = safe_float(get_any(profile, ["years_of_experience", "experience_years", "total_experience"]), 0.0)
    if experience_years <= 0:
        experience_years = estimate_years_from_history(history)

    texts = build_candidate_text(
        profile=profile,
        history=history,
        skills=skills,
        education=education,
        certifications=certifications,
        projects=get_any(obj, ["projects", "portfolio", "project_history"], []),
    )
    skill_names = [skill["name"] for skill in skills if skill.get("name")]

    return CandidateRecord(
        candidate_id=candidate_id,
        title=title,
        location=location,
        country=country,
        current_company=current_company,
        current_industry=current_industry,
        experience_years=experience_years,
        skills=skills,
        skill_names=skill_names,
        career_history=history,
        education=education,
        certifications=certifications,
        redrob_signals=redrob_signals,
        profile_text=texts["profile_text"],
        career_text=texts["career_text"],
        skills_text=texts["skills_text"],
        education_text=texts["education_text"],
        full_text=texts["full_text"][:5000],
    )


def iter_candidates(path: str | Path) -> Iterator[CandidateRecord]:
    data_path = Path(path)
    with data_path.open("r", encoding="utf-8") as handle:
        first = handle.read(1)
        handle.seek(0)
        if first == "[":
            data = json.load(handle)
            for obj in data:
                if isinstance(obj, dict):
                    record = candidate_from_json(obj)
                    if record:
                        yield record
        else:
            for line_no, line in enumerate(handle, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"Invalid JSON on line {line_no}: {exc}") from exc
                if isinstance(obj, dict):
                    record = candidate_from_json(obj)
                    if record:
                        yield record


def load_candidates(path: str | Path) -> list[CandidateRecord]:
    return list(iter_candidates(path))
