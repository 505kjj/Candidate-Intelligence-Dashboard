# Ranking Audit Report

Candidate Intelligence — Senior / Founding AI Engineer shortlist
Re-ranked from the full 100,000-candidate pool. Output: `outputs/submission.csv`
(format) + `outputs/top_candidates.json` (explainability). Reproduce with
`python backend/rank.py` and verify with `python validate_outputs.py`.

## 1. Why the first submission was re-done

The previous output passed the CSV format check but was not defensible for manual
judging:

- **Every** candidate was `risk_level: Low` and **every** `penalties` value was
  `-0.0`. The penalty channel only captured keyword-stuffing traps, so clean-looking
  keyword matches incurred nothing — behavioural and logistics problems never moved
  the score.
- All 100 reasonings began `Strong match because …` — a single template.
- Reasoning said *"Relocation willingness not shown"* even where the raw field was
  explicitly `willing_to_relocate: false`.
- Risky profiles sat in the top 10 (a London candidate who will not relocate at
  rank 8; a not-open-to-work, 16%-response candidate at rank 9; a 90-day-notice
  candidate at rank 7).

## 2. Before vs after (top-100 composition)

| Signal (counted in the top 100) | Before | After |
|---|---:|---:|
| Outside India | 10 | **2** |
| Not open to work | 23 | **12** |
| Notice period > 60 days | 31 | **24** |
| Not willing to relocate (`false`) | 54 | **50** |
| GitHub missing (`-1`/null) | 16 | 19 |
| Experience outside 5–9 yrs | 14 | **9** |
| Experience-inconsistency honeypots | 3 | **1** |
| `risk_level` = Low / Medium / High | 100 / 0 / 0 | **41 / 50 / 9** |
| Rows with a non-zero penalty | 0 | **70** |
| Distinct reasoning openings | 1 | **75** |

Notes on the two counts that did **not** fall:

- **GitHub missing (16 → 19):** intentional. The JD values engineering proof, but a
  missing GitHub score is common (~64% of the whole pool) and is treated as a
  *minor* signal (−1.5), never a rejection. Demoting strong, evidence-backed
  engineers purely for a missing GitHub link would lower shortlist quality, so this
  count is allowed to drift.
- **Not willing to relocate (54 → 50):** also intentional. Among India-based
  candidates this is a real but *soft* concern, not a disqualifier. It is now (a)
  worded correctly, (b) penalised (−4 when the candidate is not already in the
  Pune/Delhi-NCR zone), and (c) reflected in the risk level (these are Medium, not
  Low). Ranking a weaker candidate above a stronger one solely on relocation would
  hurt quality, so the count stays high while the *handling* is fixed.

## 3. Scoring methodology

Seven positive components are scored 0–100 and blended (weights sum to 1.0), then
penalties are subtracted on the same 0–100 scale:

```
final = 0.25*semantic_match      # TF-IDF similarity to the interpreted JD
      + 0.25*career_evidence     # production ML / retrieval / ranking / vector work in JOB TEXT
      + 0.15*core_skill_fit      # Python, PyTorch, FAISS/Qdrant/…, Elasticsearch, NLP, etc.
      + 0.10*seniority_fit       # prefers 5–9 yrs; penalises junior / manager-only
      + 0.08*product_company_fit # product/AI/search/marketplace vs. pure services
      + 0.10*behavioral_signal_fit
      + 0.07*logistics_fit       # India / hub / relocation / notice
      − penalties                # feasibility + data-trust + traps (capped at 60)
```

The weighting deliberately puts **career evidence on par with semantic match**
(0.25 each) so that demonstrated work in job descriptions counts as much as raw
keyword overlap. This is the core defence against keyword-stuffed profiles.

## 4. Penalty logic (the part that was missing)

A single `compute_feasibility_penalty` now applies real, additive penalties and is
the single source of truth for behavioural/logistics/trust concerns (so wording is
consistent and never double-listed):

| Concern | Penalty | Severity |
|---|---:|---|
| Not open to work | 7 | hard |
| Recruiter response < 25% / 25–34% | 8 / 3 | hard / medium |
| Inactive > 180d / 120–180d | 6 / 3 | hard / medium |
| Notice ≥ 120 / 90–119 / 61–89 days | 7 / 5 / 2 | hard / medium / medium |
| Abroad & not relocating / abroad & willing | 13 / 6 | hard / medium |
| In India, not in hub, won't relocate / unstated | 4 / 2 | medium |
| GitHub missing | 1.5 | minor (no risk impact) |
| Experience < 3 / 3–4 / >12 / 10–12 yrs | 6 / 2 / 4 / 1 | medium |
| **Honeypot: declared ≫ documented (≥5y gap, ≥1.6×)** | **14** | **hard** |
| Over-claim 3–5y gap / under-claim ≥2y | 6 / 4 | medium |

Keyword-stuffing traps (non-technical title with many AI skills, advanced skills
unsupported by job text, expert skills with near-zero duration, tutorial-style
LangChain/RAG with no production evidence, etc.) are scored separately and added in.
Total penalty is capped at 60.

**Risk level** is derived from concern *severity*, not penalty size alone:
`risk_points = 2·(hard concerns) + 1·(medium concerns)`. A profile is **High** if it
is a strong over-claim honeypot, is abroad-and-not-relocating, has penalty ≥ 20,
`risk_points ≥ 4`, or (≥1 hard and `risk_points ≥ 3`); **Medium** for any single
real concern; **Low** only when clean.

## 5. Trap detection & why high-keyword candidates were demoted

The dataset plants several trap archetypes; each is handled:

- **Experience-inconsistency honeypots** — declared years far exceeding the duration
  documented in `career_history`. Caught by comparing `years_of_experience` to the
  summed `duration_months`. Example: a "Senior Applied Scientist, 16.2y" whose
  career history sums to ~8.2y is penalised −14 and marked High.
- **Keyword-stuffed / unsupported skills** — advanced AI skills that never appear in
  the candidate's actual job descriptions are penalised, and `career_evidence`
  (job-text based) is weighted as heavily as semantic match so tags alone cannot
  carry a candidate.
- **Behavioural twins / poor feasibility** — two candidates with similar keywords
  diverge once availability, response rate, notice and location are scored, so the
  more hireable one ranks higher.

Concrete demotions (all manually requested for review):

| Candidate | Was | Now | Reason |
|---|---|---|---|
| CAND_0033861 | rank 9 | **removed** | not open to work + 16% recruiter response |
| CAND_0091534 | rank 51 | **removed** | declares 16.6y vs ~7.1y documented + not open |
| CAND_0055992 | rank 52 | **removed** | declares 16.9y vs ~6.7y documented + abroad |
| CAND_0001610 | rank 81 | **removed** | career (~5.1y) exceeds declared 3.0y + 90-day notice |
| CAND_0055905 | rank 8 | rank 54, **High** | London, `willing_to_relocate: false` |
| CAND_0039754 | rank 17 | rank 91, **High** | declares 16.2y vs ~8.2y documented |

### Candidates intentionally kept despite concerns

Two of the flagged profiles remain in the list, deep in the tail and clearly
labelled High risk, because their JD/skill match is genuinely strong and the
challenge asks for the *best 100* with honest tradeoffs rather than silent removal:

- **CAND_0055905 (rank 54, High)** — strong retrieval/search stack (Flipkart, Uber),
  but the reasoning states plainly: *"based in UK and not relocating to India."*
- **CAND_0039754 (rank 91, High)** — strong applied-science background, but the
  reasoning states the honeypot directly: *"declares 16y but career history
  documents only ~8y."*

In both cases the penalty is applied, the rank reflects the discount, and the
explanation names the tradeoff — nothing is hidden.

## 6. How hallucination was prevented

Reasoning is assembled only from fields that exist on the record:

- Company names are pulled from `career_history`; evidence phrases come from keyword
  matches against the actual job-description text; skills come from the candidate's
  own skill list.
- Relocation wording is driven by the literal field: `false → "not willing to
  relocate"`, `true → "willing to relocate"`, missing → "relocation preference not
  stated". (In this dataset the field is always an explicit boolean, so the old
  "not shown" phrasing was simply wrong.)
- Availability/notice/response figures are formatted directly from the signal
  values; nothing is inferred.
- The banned vague filler ("no major trap indicators detected") is gone; clean
  profiles instead get a factual `Clean signals: …` line built from real values.

## 7. Final validation summary

`python validate_submission.py outputs/submission.csv` → **Submission is valid.**

`python validate_outputs.py` → **all checks passed:**

- 100 rows; ranks 1–100 unique; scores within [0, 100] and non-increasing by rank.
- All 100 `candidate_id`s match `CAND_XXXXXXX` and exist in `data/candidates.jsonl`.
- `top_candidates.json` carries every required field, valid risk levels, and
  non-empty reasoning for all 100 entries.
- `submission.csv` and `top_candidates.json` agree on candidate_id, rank and score.

The pipeline is deterministic (fixed tie-break on `candidate_id`); re-running
`backend/rank.py` reproduces byte-identical rankings.
