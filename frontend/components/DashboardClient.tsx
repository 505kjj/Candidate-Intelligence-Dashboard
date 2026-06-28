"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDownToLine, ArrowUpDown, Eye, Loader2, PlayCircle, Search, SlidersHorizontal } from "lucide-react";
import type { Candidate, CandidatesResponse } from "@/lib/candidates";
import { CandidateHead } from "@/components/CandidateHead";
import { DiscoveryOverlay } from "@/components/DiscoveryOverlay";

type SortMode = "score-desc" | "rank-asc";

export function DashboardClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isDemo, setIsDemo] = useState(true);
  const [message, setMessage] = useState("Loading candidates...");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runDetails, setRunDetails] = useState<string | null>(null);
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
    setRunDetails(null);
    setMessage("Ranking candidates and generating outputs...");
    try {
      const response = await fetch("/api/run-ranking", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        const detail = [payload.error, payload.stdout && `stdout:\n${payload.stdout}`, payload.stderr && `stderr:\n${payload.stderr}`]
          .filter(Boolean)
          .join("\n\n");
        setRunDetails(detail || null);
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
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white"
        >
          <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0" />
          <ArrowDownToLine size={18} className="relative z-10" />
          <span className="relative z-10">Download submission.csv</span>
        </a>
        <a
          href="/api/download/top-candidates"
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white"
        >
          <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0" />
          <ArrowDownToLine size={18} className="relative z-10" />
          <span className="relative z-10">Download top_candidates.json</span>
        </a>
      </div>
      {runDetails && (
        <pre className="mb-6 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-400/20 bg-rose-950/25 p-4 text-xs leading-5 text-rose-100">
          {runDetails}
        </pre>
      )}
      <DiscoveryOverlay active={running} />
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
          {filtered.map((candidate, index) => (
            <motion.article
              key={candidate.candidate_id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
              whileHover={{ y: -3 }}
              className="grid gap-4 px-5 py-5 transition-colors hover:bg-white/[0.035] lg:grid-cols-[70px_1fr_90px_120px_120px_120px] lg:items-center"
            >
              <div className="flex items-center gap-2 text-2xl font-semibold text-cyan">
                <CandidateHead size={28} animated={false} variant="compact" />
                #{candidate.rank}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-semibold text-white">{candidate.candidate_id}</h3>
                  <span className="rounded-md bg-white/10 px-2 py-1 text-xs text-slate-300">{candidate.title || "Untitled"}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{candidate.reasoning}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {candidate.top_skills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-cyan/20 bg-cyan/10 px-2 py-1 text-xs text-cyan transition hover:border-cyan/50 hover:bg-cyan/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xl font-semibold text-white">{candidate.score.toFixed(2)}</div>
                <div className="mt-2 h-1 w-16 rounded-full bg-white/10">
                  <motion.div
                    className="h-1 rounded-full bg-white/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${candidate.score}%` }}
                    transition={{ duration: 0.8, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
                  />
                </div>
              </div>
              <div className="text-sm text-slate-300">{candidate.experience_years.toFixed(1)} yrs</div>
              <RiskBadge risk={candidate.risk_level} />
              <Link
                href={`/candidate/${candidate.candidate_id}`}
                className="group relative inline-flex w-fit items-center gap-2 overflow-hidden rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-300 group-hover:translate-x-0" />
                <Eye size={16} className="relative z-10" />
                <span className="relative z-10">View Profile</span>
              </Link>
            </motion.article>
          ))}
          {!filtered.length && (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center text-slate-400">
              <CandidateHead size={72} variant="ghost" />
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
