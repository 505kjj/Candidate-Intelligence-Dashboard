# Candidate Intelligence Dashboard

Candidate Intelligence Dashboard is a complete proof-of-concept for the India Runs Data & AI Challenge: Intelligent Candidate Discovery. It ranks the top 100 candidates for a Senior AI Engineer / Founding AI Engineer role using a reproducible, CPU-only, no-network hybrid ranking engine plus a premium Next.js dashboard.

## Sandbox / Reproduction (Section 10.5)

This repo ships a **self-contained sandbox that actually runs the ranker end-to-end** on a bundled sample of **≤100 candidates** (`data/sandbox_sample.jsonl`) — CPU-only, no network, no LLM — and emits a validated ranked CSV. Two equivalent ways to run it:

### Option A — Google Colab (zero setup)

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/505kjj/Candidate-Intelligence-Dashboard/blob/master/sandbox/run_sandbox.ipynb)

Open [`sandbox/run_sandbox.ipynb`](sandbox/run_sandbox.ipynb) and run all cells. It clones this repo, installs `requirements.txt`, runs `backend/rank.py` on the bundled sample, validates the output, and shows the ranked CSV as a dataframe.

### Option B — Docker (`docker run`)

```bash
docker build -t candidate-ranker .
docker run --rm candidate-ranker
```

On `docker run` the container ranks `data/sandbox_sample.jsonl`, runs `validate_submission.py` (prints `Submission is valid.`), and prints the resulting `outputs/submission.csv`. To rank your own full pool instead, mount it over the sample:

```bash
docker run --rm -v "$PWD/data/candidates.jsonl:/app/data/candidates.jsonl" \
  candidate-ranker python backend/rank.py \
  --candidates ./data/candidates.jsonl --out ./outputs/submission.csv \
  --json ./outputs/top_candidates.json
```

> The bundled sample is capped at ≤100 candidates and runs in seconds. The **Vercel dashboard is a display-only demo** — it shows precomputed results and does **not** run the Python ranker. Use this sandbox (Colab or Docker) for actual reproduction.

## Stage 3 Reproducibility & No-Hosted-LLM Guarantee

This submission is **fully reproducible offline and uses no hosted LLM/API at any point in scoring or ranking.**

- **No candidate data leaves the machine.** Nothing is sent to OpenAI, Anthropic/Claude, Google Gemini, Cohere, Groq, Together, HuggingFace hosted inference, or any other external model/API.
- **No hosted LLM is used for scoring or ranking** — not for semantic matching, not for career-evidence scoring, not for trap detection, not for the written reasoning. There are no API keys, tokens, or network calls anywhere in the ranking path.
- **Semantic scoring is local** TF-IDF + cosine similarity via `scikit-learn` (`TfidfVectorizer`) over candidate text vs the interpreted JD.
- **Career-evidence scoring is local, rule-based** heuristics over the candidate's actual `career_history` descriptions (genuine work-history evidence, not skills lists).
- **Trap / data-quality detection is local, rule-based** (keyword-stuffing, unsupported AI skills, non-technical titles with dense AI lists, and declared-vs-documented experience inconsistency).
- **CPU-only, no network, no GPU.** Runs in well under 5 minutes on the full 100K pool (~2–4 min, < 16 GB RAM). Deterministic: the same input always produces an identical CSV.
- **Vercel does not run the ranker.** The website is a read-only dashboard that displays the already-generated `submission.csv` / `top_candidates.json`. The ranking engine runs only via `backend/rank.py` (locally or in Docker).

**Proof from the code:** the entire backend imports only the Python standard library plus `numpy` and `sklearn.feature_extraction.text.TfidfVectorizer`. `requirements.txt` is exactly `numpy`, `scipy`, `scikit-learn` — no LLM SDK, no HTTP client, no network library. (Names like `LLM`, `LangChain`, `PyTorch`, or `Capgemini` appear only as literal keyword **strings** the ranker matches against candidate text — they are never imported or called.)

**Reproduce the exact submission:**

```bash
python -m pip install -r requirements.txt
python backend/rank.py --candidates ./data/candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json
python validate_submission.py ./outputs/submission.csv   # -> "Submission is valid."
```

Or run the bundled ≤100 sample with zero setup via the Colab badge above, or `docker run --rm candidate-ranker`.

## Problem Statement

The task is to discover the best-fit candidates from `candidates.jsonl` for a role that needs hands-on production AI engineering: search, ranking, retrieval, embeddings, vector databases, evaluation metrics, Python, ML infrastructure, product judgment, and startup/founding-team mindset.

The challenge provides no ground-truth labels, so this repo does **not** train a supervised model. Instead, it uses an explainable ranker designed around the job description, candidate schema, Redrob behavioral signals, and the submission validator.

## Why No Supervised Training

There are no relevance labels in the public dataset. Training a model would either overfit synthetic assumptions or require external labels. This project uses transparent feature scoring, local TF-IDF semantic matching, and deterministic tie-breaking so every score can be reproduced and defended.

## Methodology

Final score:

```text
0.25 * semantic_match
+ 0.25 * career_evidence
+ 0.15 * core_skill_fit
+ 0.10 * seniority_fit
+ 0.08 * product_company_fit
+ 0.10 * behavioral_signal_fit
+ 0.07 * logistics_fit
- trap_and_data_quality_penalties
```

These weights are the single source of truth in `backend/src/features.py` (`WEIGHTS`),
shared by both the scorer and the JSON breakdown so they can never drift. The
`trap_and_data_quality_penalties` term covers honeypot/keyword-stuffing traps and
experience-inconsistency (declared vs documented years) deductions; all penalty
magnitudes are named constants in `backend/src/features.py` for transparent tuning.

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

## Vercel Deployment

Vercel is used for the frontend demo only. The full 100K-candidate ranking should still be run locally with the Python backend command.

Import the GitHub repository into Vercel and use these settings:

- Root Directory: `frontend`
- Framework Preset: `Next.js`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `.next`

On Vercel, `/api/run-ranking` does not start Python. It returns:

```text
Run Discovery is available locally only. For Vercel, use bundled generated outputs in frontend/public/generated.
```

For a Vercel demo with real ranked results, generate outputs locally and copy them into `frontend/public/generated/` before pushing:

```bash
python backend/rank.py --candidates ./data/candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json
python validate_submission.py ./outputs/submission.csv
node scripts/copy-outputs-to-frontend.js
```

The Vercel API routes read outputs in this order:

1. Local root outputs: `outputs/submission.csv` and `outputs/top_candidates.json`.
2. Bundled frontend outputs: `frontend/public/generated/submission.csv` and `frontend/public/generated/top_candidates.json`.
3. Demo fallback data.

If bundled generated data is used, the dashboard shows:

```text
Generated shortlist loaded from bundled Vercel output files.
```

If no generated output is available, the dashboard shows polished demo candidates with the banner:

```text
Demo data shown. Run backend locally to generate real ranked results.
```

Typical Vercel workflow:

```bash
python backend/rank.py --candidates ./data/candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json
python validate_submission.py ./outputs/submission.csv
node scripts/copy-outputs-to-frontend.js
git add .
git commit -m "Add generated outputs for Vercel demo"
git push
```

## Frontend Pages

- `/`: premium landing page for Candidate Intelligence Dashboard.
- `/job`: interpreted Senior AI Engineer job intelligence.
- `/dashboard`: searchable/filterable ranked candidate shortlist.
- `/candidate/[id]`: candidate detail with reasoning, strengths, concerns, behavioral signals, and score breakdown.
- `/methodology`: scoring approach, trap detection, reproducibility.
- `/submission`: output status, download actions, backend command, and validation command.

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

For Vercel, do not rely on `/api/run-ranking`; run the backend locally and use the hosted frontend as a demo dashboard.

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
