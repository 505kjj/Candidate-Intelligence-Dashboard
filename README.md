# Candidate Intelligence Dashboard

Candidate Intelligence Dashboard is a complete proof-of-concept for the India Runs Data & AI Challenge: Intelligent Candidate Discovery. It ranks the top 100 candidates for a Senior AI Engineer / Founding AI Engineer role using a reproducible, CPU-only, no-network hybrid ranking engine plus a premium Next.js dashboard.

## Problem Statement

The task is to discover the best-fit candidates from `candidates.jsonl` for a role that needs hands-on production AI engineering: search, ranking, retrieval, embeddings, vector databases, evaluation metrics, Python, ML infrastructure, product judgment, and startup/founding-team mindset.

The challenge provides no ground-truth labels, so this repo does **not** train a supervised model. Instead, it uses an explainable ranker designed around the job description, candidate schema, Redrob behavioral signals, and the submission validator.

## Why No Supervised Training

There are no relevance labels in the public dataset. Training a model would either overfit synthetic assumptions or require external labels. This project uses transparent feature scoring, local TF-IDF semantic matching, and deterministic tie-breaking so every score can be reproduced and defended.

## Methodology

Final score:

```text
0.28 * semantic_match
+ 0.22 * career_evidence
+ 0.16 * core_skill_fit
+ 0.10 * seniority_fit
+ 0.08 * product_company_fit
+ 0.10 * behavioral_signal_fit
+ 0.06 * logistics_fit
- penalties
```

Components:

- `semantic_match`: CPU-friendly TF-IDF similarity between candidate text and the interpreted JD.
- `career_evidence`: rewards work history showing production ML, retrieval, ranking, recommendations, embeddings, vector search, ML pipelines, evaluation, A/B testing, and scalable data/backend systems.
- `core_skill_fit`: rewards Python, ML frameworks, search/retrieval tooling, vector databases, NLP, infrastructure, and data pipeline skills, with support from career text where needed.
- `seniority_fit`: prefers 5-9 years, accepts 4-10 years, and penalizes junior, intern/student, or manager-only profiles.
- `product_company_fit`: boosts product, AI, SaaS, internet, marketplace, fintech, data platform, search/recommendation, and startup experience.
- `behavioral_signal_fit`: uses Redrob signals such as open-to-work, recent activity, response rate, response time, profile completeness, GitHub activity, recruiter saves, interview completion, and notice period.
- `logistics_fit`: considers India/Pune/Noida-adjacent location, relocation, work mode, and notice period without over-prioritizing location.

## Trap Detection

The ranker explicitly penalizes likely honeypots and keyword-stuffed profiles:

- Non-technical titles with dense AI skill lists.
- AI skills that are not backed by career descriptions.
- 10+ advanced AI skills with less than 2 years of experience.
- Expert skills with very low stated duration.
- AI/ML appearing mainly in skills rather than actual job descriptions.
- Research-heavy profiles without deployment evidence.
- Tutorial-style LangChain/RAG signals without production retrieval or ranking work.
- Timeline inconsistencies.

## Backend Setup

```bash
python -m pip install -r requirements.txt
```

Place the full organiser dataset at:

```text
data/candidates.jsonl
```

The full file is intentionally ignored by git because it is large and private. The evaluator can place `candidates.jsonl` in `./data/candidates.jsonl` and run the same command.

## Ranking Command

```bash
python backend/rank.py --candidates ./data/candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json
```

If `./data/candidates.jsonl` is missing, the backend falls back to `./data/sample_candidates.jsonl` so the demo and UI remain runnable.

## Validation Command

```bash
python validate_submission.py ./outputs/submission.csv
```

The generated CSV uses UTF-8 and the required columns:

```text
candidate_id,rank,score,reasoning
```

The backend emits exactly 100 rows when the input contains at least 100 candidates, ranks 1 through 100, unique candidate IDs, non-increasing scores, and deterministic candidate_id tie-breaking.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The dashboard reads:

```text
../outputs/top_candidates.json
```

If that file is missing, it shows polished demo data and displays: `Demo data shown. Run backend ranking to load real results.`

## Frontend Pages

- `/`: premium landing page for Candidate Intelligence Dashboard.
- `/job`: interpreted Senior AI Engineer job intelligence.
- `/dashboard`: searchable/filterable ranked candidate shortlist.
- `/candidate/[id]`: candidate detail with reasoning, strengths, concerns, behavioral signals, and score breakdown.
- `/methodology`: scoring approach, trap detection, reproducibility.
- `/submission`: commands, output files, and GitHub checklist.

## CPU-Only / No-Network Statement

Ranking uses local Python code and scikit-learn TF-IDF only. It does not call OpenAI, Gemini, Claude, Cohere, or any hosted LLM/API during ranking. It does not require GPU. It is designed to run within the challenge constraints: under 5 minutes, under 16 GB RAM, CPU only, and no network during ranking.

## Demo Flow

```bash
python -m pip install -r requirements.txt
python backend/rank.py --candidates ./data/sample_candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json
python validate_submission.py ./outputs/submission.csv
cd frontend
npm install
npm run dev
```

## GitHub Submission Checklist

- Update `submission_metadata.yaml` with real team/contact/repo/sandbox details.
- Do not commit `data/candidates.jsonl`.
- Run the backend on the full dataset.
- Validate `outputs/submission.csv`.
- Confirm `outputs/top_candidates.json` loads in the dashboard.
- Push the repository and submit the GitHub repo link.

## Repository Structure

```text
india-runs-candidate-discovery/
├── README.md
├── requirements.txt
├── .gitignore
├── submission_metadata.yaml
├── validate_submission.py
├── data/
│   ├── .gitkeep
│   └── sample_candidates.jsonl
├── outputs/
│   └── .gitkeep
├── backend/
│   ├── rank.py
│   └── src/
│       ├── __init__.py
│       ├── loader.py
│       ├── text_builder.py
│       ├── features.py
│       ├── scoring.py
│       ├── reasoning.py
│       ├── output.py
│       └── utils.py
└── frontend/
    ├── app/
    ├── components/
    ├── lib/
    ├── package.json
    ├── tailwind.config.ts
    └── tsconfig.json
```
