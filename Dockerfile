# Self-contained sandbox that RUNS the ranker end-to-end on a bundled <=100-candidate
# sample (CPU-only, no network, no LLM) and emits + validates a ranked CSV.
#
#   docker build -t candidate-ranker .
#   docker run --rm candidate-ranker
#
# To rank your own pool, mount a candidates.jsonl over the sample:
#   docker run --rm -v "$PWD/data/candidates.jsonl:/app/data/candidates.jsonl" \
#     candidate-ranker python backend/rank.py \
#     --candidates ./data/candidates.jsonl --out ./outputs/submission.csv \
#     --json ./outputs/top_candidates.json
FROM python:3.11-slim

WORKDIR /app

# Install only the minimal CPU-only deps (numpy, scipy, scikit-learn).
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy the repo (the full private candidates.jsonl is excluded via .dockerignore).
COPY . .

ENV PYTHONUNBUFFERED=1 PYTHONIOENCODING=utf-8

# On `docker run`: rank the bundled <=100 sample, validate, and print the CSV.
CMD ["sh", "-c", "python backend/rank.py --candidates ./data/sandbox_sample.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json && echo '----- validating -----' && python validate_submission.py ./outputs/submission.csv && echo '----- outputs/submission.csv -----' && cat ./outputs/submission.csv"]
