import { BadgeCheck, BrainCircuit, FileSearch, Filter, GitBranch, ShieldAlert } from "lucide-react";

const steps = [
  ["Deep Job Understanding", "The JD is interpreted as a production AI engineering role centered on retrieval, ranking, embeddings, evaluation, and startup product judgment.", BrainCircuit],
  ["Semantic Matching", "CPU-friendly TF-IDF compares candidate text against the interpreted role context without hosted APIs or model training.", FileSearch],
  ["Career Evidence Scoring", "Career descriptions carry more weight than skill lists, especially for shipped ML systems, search, recommendation, evaluation, and data infrastructure.", BadgeCheck],
  ["Behavioral Signal Integration", "Availability, recent activity, recruiter response rate, notice period, completeness, and GitHub activity modify ranking quality.", GitBranch],
  ["Trap Detection", "Contradictions such as non-technical titles with dense AI skills, unsupported expert claims, and tutorial-only RAG signals receive explicit penalties.", ShieldAlert],
  ["Final Shortlist Generation", "Weighted components produce a deterministic top 100 with specific reasoning and a dashboard-ready score breakdown.", Filter]
];

export default function MethodologyPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan">Methodology</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Explainable Hybrid Ranking</h1>
        <p className="mt-4 text-lg leading-8 text-slate-400">
          The ranker uses transparent local features rather than supervised training because the challenge provides no ground-truth labels.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {steps.map(([title, text, Icon]) => (
          <div key={String(title)} className="glass rounded-lg p-6 transition hover:-translate-y-1 hover:border-cyan/30">
            <Icon className="mb-5 text-cyan" size={24} />
            <h2 className="text-xl font-semibold text-white">{String(title)}</h2>
            <p className="mt-3 leading-7 text-slate-400">{String(text)}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 glass rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-white">Final Score</h2>
        <p className="mt-3 max-w-4xl leading-8 text-slate-400">
          0.28 semantic match + 0.22 career evidence + 0.16 core skill fit + 0.10 seniority fit +
          0.08 product/company fit + 0.10 behavioral signal fit + 0.06 logistics fit minus trap penalties.
        </p>
      </div>
    </section>
  );
}
