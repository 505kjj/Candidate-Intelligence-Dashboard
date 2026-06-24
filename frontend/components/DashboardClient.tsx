"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Eye, Search, SlidersHorizontal } from "lucide-react";
import type { Candidate } from "@/lib/candidates";

export function DashboardClient({ candidates, isDemo }: { candidates: Candidate[]; isDemo: boolean }) {
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [scoreMin, setScoreMin] = useState(0);
  const [experienceMin, setExperienceMin] = useState(0);
  const [openOnly, setOpenOnly] = useState(false);

  const filtered = useMemo(() => {
    const low = query.toLowerCase();
    return candidates
      .filter((candidate) => {
        const haystack = `${candidate.candidate_id} ${candidate.title} ${candidate.top_skills.join(" ")}`.toLowerCase();
        return !low || haystack.includes(low);
      })
      .filter((candidate) => risk === "All" || candidate.risk_level === risk)
      .filter((candidate) => candidate.score >= scoreMin)
      .filter((candidate) => candidate.experience_years >= experienceMin)
      .filter((candidate) => !openOnly || candidate.behavioral_signals.open_to_work)
      .sort((a, b) => b.score - a.score || a.candidate_id.localeCompare(b.candidate_id));
  }, [candidates, experienceMin, openOnly, query, risk, scoreMin]);

  return (
    <div>
      {isDemo && (
        <div className="mb-6 rounded-lg border border-cyan/25 bg-cyan/10 px-4 py-3 text-sm text-cyan">
          Demo data shown. Run backend ranking to load real results.
        </div>
      )}
      <div className="glass mb-6 rounded-lg p-4">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_0.8fr_0.8fr_0.8fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 text-slate-500" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search candidate, title, skill"
              className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3 pl-10 pr-3 text-sm text-white outline-none transition focus:border-cyan/60"
            />
          </label>
          <select
            value={risk}
            onChange={(event) => setRisk(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            {["All", "Low", "Medium", "High"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <SlidersHorizontal size={17} className="text-slate-500" />
            <input
              type="number"
              value={scoreMin}
              min={0}
              max={100}
              onChange={(event) => setScoreMin(Number(event.target.value))}
              className="w-full bg-transparent text-sm text-white outline-none"
              aria-label="Minimum score"
            />
          </label>
          <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
            <span className="text-xs text-slate-500">YRS</span>
            <input
              type="number"
              value={experienceMin}
              min={0}
              max={20}
              step={0.5}
              onChange={(event) => setExperienceMin(Number(event.target.value))}
              className="w-full bg-transparent text-sm text-white outline-none"
              aria-label="Minimum experience"
            />
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300">
            <input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} />
            Open
          </label>
        </div>
      </div>
      <div className="glass overflow-hidden rounded-lg">
        <div className="hidden grid-cols-[70px_1fr_90px_120px_120px_120px] gap-4 border-b border-white/10 px-5 py-4 text-xs uppercase tracking-[0.18em] text-slate-500 lg:grid">
          <span>Rank</span>
          <span>Candidate</span>
          <span className="flex items-center gap-1">Score <ArrowUpDown size={13} /></span>
          <span>Experience</span>
          <span>Risk</span>
          <span>Profile</span>
        </div>
        <div className="divide-y divide-white/10">
          {filtered.map((candidate) => (
            <article key={candidate.candidate_id} className="grid gap-4 px-5 py-5 transition hover:bg-white/[0.035] lg:grid-cols-[70px_1fr_90px_120px_120px_120px] lg:items-center">
              <div className="text-2xl font-semibold text-cyan">#{candidate.rank}</div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-white">{candidate.candidate_id}</h3>
                  <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">{candidate.title || "Untitled"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{candidate.reasoning}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.top_skills.slice(0, 5).map((skill) => (
                    <span key={skill} className="rounded-md border border-cyan/20 bg-cyan/10 px-2 py-1 text-xs text-cyan">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xl font-semibold text-white">{candidate.score.toFixed(2)}</div>
              <div className="text-sm text-slate-300">{candidate.experience_years.toFixed(1)} yrs</div>
              <RiskBadge risk={candidate.risk_level} />
              <Link
                href={`/candidate/${candidate.candidate_id}`}
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white transition hover:bg-white/10"
              >
                <Eye size={16} />
                View Profile
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: Candidate["risk_level"] }) {
  const classes = {
    Low: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    Medium: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    High: "border-rose-400/30 bg-rose-400/10 text-rose-300"
  };
  return <span className={`w-fit rounded-md border px-2 py-1 text-xs font-medium ${classes[risk]}`}>{risk}</span>;
}
