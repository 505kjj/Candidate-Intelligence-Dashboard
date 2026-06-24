from __future__ import annotations

from typing import Any

from .utils import as_list, clean_text, get_any, uniq_keep_order


def normalize_skills(raw_skills: Any) -> list[dict[str, Any]]:
    skills: list[dict[str, Any]] = []
    for item in as_list(raw_skills):
        if isinstance(item, dict):
            name = clean_text(get_any(item, ["name", "skill", "skill_name", "title"]))
            if name:
                skills.append(
                    {
                        "name": name,
                        "proficiency": clean_text(get_any(item, ["proficiency", "level"], "")),
                        "endorsements": get_any(item, ["endorsements", "endorsement_count"], 0),
                        "duration_months": get_any(item, ["duration_months", "months", "experience_months"], 0),
                    }
                )
        else:
            name = clean_text(item)
            if name:
                skills.append({"name": name, "proficiency": "", "endorsements": 0, "duration_months": 0})
    return skills


def normalize_history(raw_history: Any) -> list[dict[str, Any]]:
    roles: list[dict[str, Any]] = []
    for item in as_list(raw_history):
        if not isinstance(item, dict):
            continue
        roles.append(
            {
                "company": clean_text(get_any(item, ["company", "employer", "organization"])),
                "title": clean_text(get_any(item, ["title", "role", "position", "designation"])),
                "start_date": clean_text(get_any(item, ["start_date", "start"])),
                "end_date": get_any(item, ["end_date", "end"]),
                "duration_months": get_any(item, ["duration_months", "duration", "months"], 0),
                "is_current": get_any(item, ["is_current", "current"], False),
                "industry": clean_text(get_any(item, ["industry", "domain"])),
                "company_size": clean_text(get_any(item, ["company_size", "size"])),
                "description": clean_text(get_any(item, ["description", "summary", "responsibilities", "achievements"])),
            }
        )
    return roles


def normalize_education(raw_education: Any) -> list[dict[str, Any]]:
    education: list[dict[str, Any]] = []
    for item in as_list(raw_education):
        if not isinstance(item, dict):
            continue
        education.append(
            {
                "institution": clean_text(get_any(item, ["institution", "school", "college", "university"])),
                "degree": clean_text(get_any(item, ["degree", "qualification"])),
                "field_of_study": clean_text(get_any(item, ["field_of_study", "field", "major", "specialization"])),
                "tier": clean_text(get_any(item, ["tier", "institution_tier"])),
            }
        )
    return education


def normalize_certifications(raw_certifications: Any) -> list[dict[str, Any]]:
    certifications: list[dict[str, Any]] = []
    for item in as_list(raw_certifications):
        if isinstance(item, dict):
            name = clean_text(get_any(item, ["name", "certification", "title"]))
            issuer = clean_text(get_any(item, ["issuer", "authority"]))
            if name:
                certifications.append({"name": name, "issuer": issuer})
        else:
            name = clean_text(item)
            if name:
                certifications.append({"name": name, "issuer": ""})
    return certifications


def build_candidate_text(
    profile: dict[str, Any],
    history: list[dict[str, Any]],
    skills: list[dict[str, Any]],
    education: list[dict[str, Any]],
    certifications: list[dict[str, Any]],
    projects: Any = None,
) -> dict[str, str]:
    profile_parts = [
        get_any(profile, ["headline", "title"]),
        get_any(profile, ["summary", "about", "bio"]),
        get_any(profile, ["current_title", "current_role"]),
        get_any(profile, ["current_company"]),
        get_any(profile, ["current_industry", "industry", "domain"]),
    ]

    career_parts: list[str] = []
    for role in history:
        career_parts.extend(
            [
                role.get("title", ""),
                role.get("company", ""),
                role.get("industry", ""),
                role.get("description", ""),
            ]
        )

    skill_parts = [skill["name"] for skill in skills if skill.get("name")]

    education_parts: list[str] = []
    for item in education:
        education_parts.extend([item.get("degree", ""), item.get("field_of_study", ""), item.get("institution", ""), item.get("tier", "")])

    cert_parts: list[str] = []
    for item in certifications:
        cert_parts.extend([item.get("name", ""), item.get("issuer", "")])

    project_parts: list[str] = []
    for item in as_list(projects):
        if isinstance(item, dict):
            project_parts.extend(str(v) for v in item.values() if isinstance(v, (str, int, float)))
        else:
            project_parts.append(clean_text(item))

    profile_text = " ".join(clean_text(x) for x in profile_parts if clean_text(x))
    career_text = " ".join(clean_text(x) for x in career_parts if clean_text(x))
    skills_text = " ".join(uniq_keep_order(skill_parts))
    education_text = " ".join(clean_text(x) for x in education_parts if clean_text(x))
    cert_text = " ".join(clean_text(x) for x in cert_parts if clean_text(x))
    project_text = " ".join(clean_text(x) for x in project_parts if clean_text(x))

    full_text = " ".join(part for part in [profile_text, career_text, project_text, skills_text, education_text, cert_text] if part)
    return {
        "profile_text": profile_text,
        "career_text": career_text,
        "skills_text": skills_text,
        "education_text": education_text,
        "certifications_text": cert_text,
        "project_text": project_text,
        "full_text": full_text,
    }
