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

Open:

```text
http://localhost:3000
```

The frontend includes local server API routes that connect the UI to the Python ranking engine:

- `GET /api/shortlist-status` checks whether `outputs/submission.csv` and `outputs/top_candidates.json` exist, counts JSON candidates, and returns modified times.
- `POST /api/run-ranking` runs the backend command from the project root.
- `GET /api/candidates` returns `outputs/top_candidates.json`, or demo data if outputs are missing.
- `GET /api/download/submission` downloads `outputs/submission.csv`.
- `GET /api/download/top-candidates` downloads `outputs/top_candidates.json`.

Because `/api/run-ranking` starts a local Python process, this integration is intended for local demo/server deployments. It will not work on static-only hosting unless the Python backend is hosted separately.

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
cd frontend
npm install
npm run dev
```

Then open `http://localhost:3000`.

Frontend flow:

1. Click `View Shortlist`.
2. If outputs exist, the app opens `/dashboard`.
3. If outputs are missing, the app shows `No shortlist found. Run Discovery to generate ranked candidates.`
4. Click `Run Discovery` to call `/api/run-ranking`.
5. The API runs:

```bash
python backend/rank.py --candidates ./data/candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json
```

6. After success, the dashboard loads real candidates from `outputs/top_candidates.json`.
7. Use the dashboard or submission page download buttons for `submission.csv` and `top_candidates.json`.

If `data/candidates.jsonl` is not present, `/api/run-ranking` returns a clear error asking you to place the organiser dataset at `data/candidates.jsonl`. The dashboard still works with demo data through `/api/candidates`.

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
