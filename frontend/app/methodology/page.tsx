import { CandidateHead } from "@/components/CandidateHead";
import { MethodologyReveal, type MethodologyStep } from "@/components/MethodologyReveal";

const steps: MethodologyStep[] = [
  {
    title: "Deep Job Understanding",
    text: "The JD is interpreted as a production AI engineering role centered on retrieval, ranking, embeddings, evaluation, and startup product judgment.",
    icon: "BrainCircuit"
  },
  {
    title: "Semantic Candidate Matching",
    text: "CPU-friendly TF-IDF compares candidate text against the interpreted role context without hosted APIs or model training.",
    icon: "FileSearch"
  },
  {
    title: "Career Evidence Scoring",
    text: "Career descriptions carry more weight than skill lists, especially for shipped ML systems, search, recommendation, evaluation, and data infrastructure.",
    icon: "BadgeCheck"
  },
  {
    title: "Behavioral Signal Integration",
    text: "Availability, recent activity, recruiter response rate, notice period, completeness, and GitHub activity modify ranking quality.",
    icon: "GitBranch"
  },
  {
    title: "Trap Detection",
    text: "Contradictions such as non-technical titles with dense AI skills, unsupported expert claims, and tutorial-only RAG signals receive explicit penalties.",
    icon: "ShieldAlert"
  },
  {
    title: "Final Shortlist Generation",
    text: "Weighted components produce a deterministic top 100 with specific reasoning and a dashboard-ready score breakdown.",
    icon: "Filter"
  }
];

export default function MethodologyPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan">Methodology</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Explainable Hybrid Ranking</h1>
          <p className="mt-4 text-lg leading-8 text-slate-400">
            The ranker uses transparent local features rather than supervised training because the challenge provides no ground-truth labels.
          </p>
        </div>
        <CandidateHead size={96} variant="ghost" className="hidden shrink-0 sm:block" />
      </div>
      <MethodologyReveal steps={steps} />
      <div className="mt-8 glass rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-white">Final Score</h2>
        <p className="mt-3 max-w-4xl leading-8 text-slate-400">
          0.25 semantic match + 0.25 career evidence + 0.15 core skill fit + 0.10 seniority fit +
          0.08 product/company fit + 0.10 behavioral signal fit + 0.07 logistics fit minus trap and data-quality penalties.
        </p>
      </div>
    </section>
  );
}
