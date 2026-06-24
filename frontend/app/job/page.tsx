import { Brain, Building2, Gauge, MapPin, Target } from "lucide-react";

const needs = [
  "Production ML Systems",
  "Search / Ranking / Retrieval",
  "Embeddings and Vector Databases",
  "Evaluation Metrics: NDCG, MRR, MAP",
  "Product Engineering Mindset",
  "Startup/Future Founding Team Fit"
];

export default function JobPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan">Job Intelligence</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Senior AI Engineer</h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-400">
          Interpreted as a hands-on founding-style AI engineering role focused on production retrieval, ranking,
          semantic search, evaluation infrastructure, and recruiter-facing product impact.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Role", "Senior AI Engineer", Brain],
          ["Seniority", "5-9 years preferred", Gauge],
          ["Location", "Pune / Noida flexible", MapPin],
          ["Company stage", "AI-native startup", Building2]
        ].map(([label, value, Icon]) => (
          <div key={String(label)} className="glass rounded-lg p-5">
            <Icon className="mb-4 text-cyan" size={22} />
            <p className="text-sm text-slate-500">{String(label)}</p>
            <p className="mt-1 font-semibold text-white">{String(value)}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 glass rounded-lg p-6">
        <div className="mb-5 flex items-center gap-3">
          <Target className="text-violet" />
          <h2 className="text-2xl font-semibold text-white">Core Needs</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {needs.map((need) => (
            <div key={need} className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-slate-200">
              {need}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
