import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, MapPin, Shield } from "lucide-react";
import { getCandidateById } from "@/lib/candidates";

export default async function CandidatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { candidate, isDemo } = getCandidateById(id);
  if (!candidate) {
    notFound();
  }
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-cyan hover:text-cyan/80">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
      {isDemo && (
        <div className="mb-6 rounded-lg border border-cyan/25 bg-cyan/10 px-4 py-3 text-sm text-cyan">
          Demo data shown. Run backend ranking to load real results.
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="glass rounded-lg p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan">Rank #{candidate.rank}</p>
              <h1 className="mt-2 text-4xl font-semibold text-white">{candidate.candidate_id}</h1>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2"><Briefcase size={16} /> {candidate.title || "Untitled"}</span>
                <span className="inline-flex items-center gap-2"><MapPin size={16} /> {candidate.location || "Location unknown"}</span>
                <span>{candidate.experience_years.toFixed(1)} yrs</span>
              </div>
            </div>
            <div className="rounded-lg border border-cyan/25 bg-cyan/10 px-5 py-4 text-center">
              <p className="text-sm text-cyan">Overall Score</p>
              <p className="mt-1 text-4xl font-semibold text-white">{candidate.score.toFixed(2)}</p>
            </div>
          </div>
          <p className="mt-8 text-lg leading-8 text-slate-300">{candidate.reasoning}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Panel title="Strengths" items={candidate.strengths} />
            <Panel title="Concerns" items={candidate.concerns} />
          </div>
          <div className="mt-8">
            <h2 className="mb-3 text-xl font-semibold text-white">Top Skills</h2>
            <div className="flex flex-wrap gap-2">
              {candidate.top_skills.map((skill) => (
                <span key={skill} className="rounded-md border border-cyan/25 bg-cyan/10 px-3 py-2 text-sm text-cyan">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <aside className="space-y-6">
          <div className="glass rounded-lg p-5">
            <div className="mb-4 flex items-center gap-3">
              <Shield className="text-cyan" size={20} />
              <h2 className="text-xl font-semibold text-white">Behavioral Signals</h2>
            </div>
            {Object.entries(candidate.behavioral_signals).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-white/10 py-3 text-sm last:border-0">
                <span className="capitalize text-slate-500">{key.replaceAll("_", " ")}</span>
                <span className="font-medium text-white">{String(value)}</span>
              </div>
            ))}
          </div>
          <div className="glass rounded-lg p-5">
            <h2 className="mb-4 text-xl font-semibold text-white">Score Breakdown</h2>
            <div className="space-y-4">
              {Object.entries(candidate.score_breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="capitalize text-slate-400">{key.replaceAll("_", " ")}</span>
                    <span className={value < 0 ? "text-rose-300" : "text-white"}>{value.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded bg-white/10">
                    <div
                      className={value < 0 ? "h-2 rounded bg-rose-400" : "h-2 rounded bg-cyan"}
                      style={{ width: `${Math.min(100, Math.abs(value) * 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Panel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-3 font-semibold text-white">{title}</h2>
      <ul className="space-y-2 text-sm text-slate-300">
        {(items.length ? items : ["No items recorded"]).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
