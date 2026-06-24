"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownToLine, ArrowUpDown, Eye, Loader2, PlayCircle, Search, SlidersHorizontal } from "lucide-react";
import type { Candidate, CandidatesResponse } from "@/lib/candidates";

type SortMode = "score-desc" | "rank-asc";

export function DashboardClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [message, setMessage] = useState("Loading candidates...");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState("All");
  const [scoreMin, setScoreMin] = useState(0);
  const [scoreMax, setScoreMax] = useState(100);
  const [experienceMin, setExperienceMin] = useState(0);
  const [experienceMax, setExperienceMax] = useState(20);
  const [openOnly, setOpenOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("score-desc");

  async function loadCandidates() {
    setLoading(true);
    const response = await fetch("/api/candidates", { cache: "no-store" });
    const payload = (await response.json()) as CandidatesResponse;
    setCandidates(payload.candidates);
    setIsDemo(payload.demo);
    setMessage(payload.message);
    setLoading(false);
  }

  async function runDiscovery() {
    setRunning(true);
    setMessage("Ranking candidates and generating outputs...");
    try {
      const response = await fetch("/api/run-ranking", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Ranking failed.");
      }
      setMessage("Shortlist generated successfully.");
      await loadCandidates();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ranking failed.");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    loadCandidates().catch(() => {
      setLoading(false);
      setMessage("Unable to load candidate data.");
    });
  }, []);

  const filtered = useMemo(() => {
    const low = query.toLowerCase();
    return candidates
      .filter((candidate) => {
        const haystack = `${candidate.candidate_id} ${candidate.title} ${candidate.top_skills.join(" ")}`.toLowerCase();
        return !low || haystack.includes(low);
      })
      .filter((candidate) => risk === "All" || candidate.risk_level === risk)
      .filter((candidate) => candidate.score >= scoreMin)
      .filter((candidate) => candidate.score <= scoreMax)
      .filter((candidate) => candidate.experience_years >= experienceMin)
      .filter((candidate) => candidate.experience_years <= experienceMax)
      .filter((candidate) => !openOnly || candidate.behavioral_signals.open_to_work)
      .sort((a, b) => {
        if (sortMode === "rank-asc") {
          return a.rank - b.rank || a.candidate_id.localeCompare(b.candidate_id);
        }
        return b.score - a.score || a.rank - b.rank || a.candidate_id.localeCompare(b.candidate_id);
      });
  }, [candidates, experienceMax, experienceMin, openOnly, query, risk, scoreMax, scoreMin, sortMode]);

  return (
    <div>
      <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${isDemo ? "border-cyan/25 bg-cyan/10 text-cyan" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"}`}>
        {loading ? "Loading candidates..." : message}
      </div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={runDiscovery}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-3 font-semibold text-ink transition hover:bg-cyan/90 disabled:cursor-wait disabled:opacity-70"
        >
          {running ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
          Run Discovery
        </button>
        <a
          href="/api/download/submission"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          <ArrowDownToLine size={18} />
          Download submission.csv
        </a>
        <a
          href="/api/download/top-candidates"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          <ArrowDownToLine size={18} />
          Download top_candidates.json
        </a>
      </div>
      <div className="glass mb-6 rounded-lg p-4">
        <div className="grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.8fr_1.1fr_1.1fr_auto]">
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
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
            aria-label="Sort candidates"
          >
            <option value="score-desc">Score descending</option>
            <option value="rank-asc">Rank ascending</option>
          </select>
          <select
            value={risk}
            onChange={(event) => setRisk(event.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none"
          >
            {["All", "Low", "Medium", "High"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
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
            <span className="text-xs text-slate-500">to</span>
            <input
              type="number"
              value={scoreMax}
              min={0}
              max={100}
              onChange={(event) => setScoreMax(Number(event.target.value))}
              className="w-full bg-transparent text-sm text-white outline-none"
              aria-label="Maximum score"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
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
            <span className="text-xs text-slate-500">to</span>
            <input
              type="number"
              value={experienceMax}
              min={0}
              max={30}
              step={0.5}
              onChange={(event) => setExperienceMax(Number(event.target.value))}
              className="w-full bg-transparent text-sm text-white outline-none"
              aria-label="Maximum experience"
            />
          </div>
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
          {!filtered.length && (
            <div className="px-5 py-10 text-center text-slate-400">
              No candidates match the current filters.
            </div>
          )}
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
