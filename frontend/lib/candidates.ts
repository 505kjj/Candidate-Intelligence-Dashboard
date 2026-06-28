import fs from "fs";
import path from "path";

export type Candidate = {
  candidate_id: string;
  rank: number;
  score: number;
  reasoning: string;
  title: string;
  location: string;
  experience_years: number;
  top_skills: string[];
  risk_level: "Low" | "Medium" | "High";
  strengths: string[];
  concerns: string[];
  score_breakdown: Record<string, number>;
  behavioral_signals: {
    open_to_work: boolean;
    last_active: string;
    response_rate: string;
    notice_period: string;
  };
};

export type ShortlistStatus = {
  localOutputExists: boolean;
  bundledOutputExists: boolean;
  submissionExists: boolean;
  jsonExists: boolean;
  ready: boolean;
  candidateCount: number;
  submissionModifiedAt: string | null;
  jsonModifiedAt: string | null;
  submissionPath: string;
  jsonPath: string;
  source: CandidateSource;
};

export type CandidateSource = "local-output" | "bundled-generated" | "demo";

export type CandidatesResponse = {
  demo: boolean;
  source: CandidateSource;
  message: string;
  candidates: Candidate[];
};

export const demoCandidates: Candidate[] = [
  {
    candidate_id: "DEMO_0001",
    rank: 1,
    score: 91.8,
    reasoning:
      "Demo data: career history shows production retrieval, embeddings, and NDCG evaluation. Minor concern: vector database operations are represented at a summary level.",
    title: "Senior AI Engineer",
    location: "Pune, Maharashtra",
    experience_years: 7.1,
    top_skills: ["Python", "Embeddings", "Vector Search", "Qdrant", "NLP"],
    risk_level: "Low",
    strengths: ["Production retrieval evidence", "Evaluation metrics", "Open to work"],
    concerns: ["Limited company-specific detail in demo data"],
    score_breakdown: {
      semantic_match: 26.4,
      career_evidence: 20.8,
      core_skill_fit: 14.7,
      seniority_fit: 10,
      product_company_fit: 7.4,
      behavioral_signal_fit: 8.8,
      logistics_fit: 5.2,
      penalties: -1.5
    },
    behavioral_signals: {
      open_to_work: true,
      last_active: "2026-06-10",
      response_rate: "82%",
      notice_period: "30 days"
    }
  },
  {
    candidate_id: "DEMO_0002",
    rank: 2,
    score: 86.3,
    reasoning:
      "Demo data: recommender-system and search-quality work aligns with the JD, with Python and ML infrastructure skills present. Minor concern: relocation details are incomplete.",
    title: "Machine Learning Engineer",
    location: "Bengaluru, Karnataka",
    experience_years: 6.4,
    top_skills: ["Python", "Recommendation Systems", "MLflow", "Spark", "Elasticsearch"],
    risk_level: "Low",
    strengths: ["Recommendation systems", "ML deployment", "Product company context"],
    concerns: ["Relocation willingness not shown"],
    score_breakdown: {
      semantic_match: 24.8,
      career_evidence: 19.3,
      core_skill_fit: 13.9,
      seniority_fit: 10,
      product_company_fit: 7.2,
      behavioral_signal_fit: 7.7,
      logistics_fit: 4.6,
      penalties: -1.2
    },
    behavioral_signals: {
      open_to_work: true,
      last_active: "2026-06-01",
      response_rate: "74%",
      notice_period: "45 days"
    }
  },
  {
    candidate_id: "DEMO_0003",
    rank: 3,
    score: 78.9,
    reasoning:
      "Demo data: strong backend and data-pipeline foundation supports ML infrastructure needs, though direct ranking and vector-search evidence is lighter.",
    title: "Backend Engineer",
    location: "Noida, Uttar Pradesh",
    experience_years: 5.9,
    top_skills: ["Python", "Spark", "Kafka", "Airflow", "Docker"],
    risk_level: "Medium",
    strengths: ["Scalable data systems", "Python backend", "Good logistics fit"],
    concerns: ["Limited explicit vector database evidence", "Ranking metrics not explicit"],
    score_breakdown: {
      semantic_match: 20.4,
      career_evidence: 15.8,
      core_skill_fit: 12.2,
      seniority_fit: 10,
      product_company_fit: 6.4,
      behavioral_signal_fit: 8.2,
      logistics_fit: 5.5,
      penalties: -0.6
    },
    behavioral_signals: {
      open_to_work: true,
      last_active: "2026-05-25",
      response_rate: "68%",
      notice_period: "15 days"
    }
  }
];

export function getProjectRoot() {
  const cwd = process.cwd();
  const parentRoot = path.resolve(cwd, "..");

  if (fs.existsSync(path.join(parentRoot, "backend", "rank.py"))) {
    return parentRoot;
  }

  if (fs.existsSync(path.join(cwd, "backend", "rank.py"))) {
    return cwd;
  }

  return parentRoot;
}

export function getFrontendRoot() {
  const cwd = process.cwd();

  if (fs.existsSync(path.join(cwd, "public")) && fs.existsSync(path.join(cwd, "package.json"))) {
    return cwd;
  }

  if (fs.existsSync(path.join(cwd, "frontend", "public"))) {
    return path.join(cwd, "frontend");
  }

  return cwd;
}

export const projectRoot = getProjectRoot();
export const frontendRoot = getFrontendRoot();
export const outputPaths = {
  submission: path.join(projectRoot, "outputs", "submission.csv"),
  topCandidates: path.join(projectRoot, "outputs", "top_candidates.json"),
  candidates: path.join(projectRoot, "data", "candidates.jsonl"),
  bundledSubmission: path.join(frontendRoot, "public", "generated", "submission.csv"),
  bundledTopCandidates: path.join(frontendRoot, "public", "generated", "top_candidates.json")
};

export function isVercelRuntime() {
  return process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
}

function modifiedAt(filePath: string): string | null {
  try {
    return fs.statSync(filePath).mtime.toISOString();
  } catch {
    return null;
  }
}

function readCandidates(filePath: string): Candidate[] | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as Candidate[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function getCandidates(): { candidates: Candidate[]; source: CandidateSource } {
  const localCandidates = readCandidates(outputPaths.topCandidates);
  if (localCandidates) {
    return { candidates: localCandidates, source: "local-output" };
  }

  const bundledCandidates = readCandidates(outputPaths.bundledTopCandidates);
  if (bundledCandidates) {
    return { candidates: bundledCandidates, source: "bundled-generated" };
  }

  return { candidates: demoCandidates, source: "demo" };
}

export function getCandidateById(id: string): { candidate?: Candidate; isDemo: boolean } {
  const { candidates, source } = getCandidates();
  return { candidate: candidates.find((candidate) => candidate.candidate_id === id), isDemo: source === "demo" };
}

export function getShortlistStatus(): ShortlistStatus {
  const localSubmissionExists = fs.existsSync(outputPaths.submission);
  const localJsonExists = fs.existsSync(outputPaths.topCandidates);
  const bundledSubmissionExists = fs.existsSync(outputPaths.bundledSubmission);
  const bundledJsonExists = fs.existsSync(outputPaths.bundledTopCandidates);
  const localOutputExists = localSubmissionExists && localJsonExists;
  const bundledOutputExists = bundledSubmissionExists && bundledJsonExists;
  const source: CandidateSource = localOutputExists ? "local-output" : bundledOutputExists ? "bundled-generated" : "demo";
  const submissionPath = source === "bundled-generated" ? "frontend/public/generated/submission.csv" : "outputs/submission.csv";
  const jsonPath = source === "bundled-generated" ? "frontend/public/generated/top_candidates.json" : "outputs/top_candidates.json";
  const selectedSubmissionPath = source === "bundled-generated" ? outputPaths.bundledSubmission : outputPaths.submission;
  const selectedJsonPath = source === "bundled-generated" ? outputPaths.bundledTopCandidates : outputPaths.topCandidates;
  const submissionExists = source === "local-output" ? localSubmissionExists : bundledSubmissionExists;
  const jsonExists = source === "local-output" ? localJsonExists : bundledJsonExists;
  let candidateCount = 0;

  if (jsonExists) {
    try {
      const parsed = JSON.parse(fs.readFileSync(selectedJsonPath, "utf-8"));
      candidateCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      candidateCount = 0;
    }
  }

  return {
    localOutputExists,
    bundledOutputExists,
    submissionExists,
    jsonExists,
    ready: submissionExists && jsonExists && candidateCount > 0,
    candidateCount,
    submissionModifiedAt: modifiedAt(selectedSubmissionPath),
    jsonModifiedAt: modifiedAt(selectedJsonPath),
    submissionPath,
    jsonPath,
    source
  };
}

export function getCandidatesResponse(): CandidatesResponse {
  const { candidates, source } = getCandidates();
  return {
    demo: source === "demo",
    source,
    message:
      source === "local-output"
        ? "Real ranked shortlist loaded from local backend outputs."
        : source === "bundled-generated"
          ? "Generated shortlist loaded from bundled Vercel output files."
          : "Demo data shown. Run backend locally to generate real ranked results.",
    candidates
  };
}
