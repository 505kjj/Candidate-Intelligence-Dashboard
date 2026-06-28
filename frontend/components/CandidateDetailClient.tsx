"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Briefcase, Loader2, MapPin, Shield } from "lucide-react";
import type { Candidate, CandidatesResponse } from "@/lib/candidates";
import { CandidateHead } from "@/components/CandidateHead";

export function CandidateDetailClient({ candidateId }: { candidateId: string }) {
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [message, setMessage] = useState("Loading candidate profile...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCandidate() {
      try {
        const response = await fetch("/api/candidates", { cache: "no-store" });
        const payload = (await response.json()) as CandidatesResponse;
        setIsDemo(payload.demo);
        setMessage(payload.message);
        setCandidate(payload.candidates.find((item) => item.candidate_id === candidateId) || null);
      } catch {
        setMessage("Unable to load candidate data.");
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, [candidateId]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm text-cyan hover:text-cyan/80">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>
      <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${isDemo ? "border-cyan/25 bg-cyan/10 text-cyan" : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"}`}>
        {loading ? "Loading candidate profile..." : message}
      </div>

      {loading && (
        <div className="glass flex min-h-64 items-center justify-center rounded-lg text-slate-300">
          <Loader2 className="mr-2 animate-spin text-cyan" size={20} />
          Loading profile
        </div>
      )}

      {!loading && !candidate && (
        <div className="glass flex flex-col items-center gap-4 rounded-lg p-8 text-center">
          <CandidateHead size={88} variant="ghost" />
          <h1 className="text-2xl font-semibold text-white">Candidate not found</h1>
          <p className="text-slate-400">
            No profile with ID {candidateId} is available in the current shortlist.
          </p>
        </div>
      )}

      {candidate && (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="glass rounded-lg p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <CandidateHead size={56} variant="compact" animated={false} className="hidden shrink-0 sm:block" />
                <div>
                  <motion.p
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="text-sm uppercase tracking-[0.2em] text-cyan"
                  >
                    Rank #{candidate.rank}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="mt-2 text-4xl font-semibold text-white"
                  >
                    {candidate.candidate_id}
                  </motion.h1>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span className="inline-flex items-center gap-2"><Briefcase size={16} /> {candidate.title || "Untitled"}</span>
                    <span className="inline-flex items-center gap-2"><MapPin size={16} /> {candidate.location || "Location unknown"}</span>
                    <span>{candidate.experience_years.toFixed(1)} yrs</span>
                  </div>
                </div>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="rounded-lg border border-cyan/25 bg-cyan/10 px-5 py-4 text-center"
              >
                <p className="text-sm text-cyan">Overall Score</p>
                <p className="mt-1 text-4xl font-semibold text-white">{candidate.score.toFixed(2)}</p>
              </motion.div>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 text-lg leading-8 text-slate-300"
            >
              {candidate.reasoning}
            </motion.p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Panel title="Strengths" items={candidate.strengths} delayOffset={0.25} />
              <Panel title="Concerns" items={candidate.concerns} delayOffset={0.32} />
            </div>
            <div className="mt-8">
              <h2 className="mb-3 text-xl font-semibold text-white">Top Skills</h2>
              <div className="flex flex-wrap gap-2">
                {candidate.top_skills.map((skill, index) => (
                  <motion.span
                    key={skill}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + index * 0.04 }}
                    className="rounded-md border border-cyan/25 bg-cyan/10 px-3 py-2 text-sm text-cyan transition hover:border-cyan/50 hover:bg-cyan/20"
                  >
                    {skill}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
          <aside className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass rounded-lg p-5"
            >
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
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
              className="glass rounded-lg p-5"
            >
              <h2 className="mb-4 text-xl font-semibold text-white">Score Breakdown</h2>
              <div className="space-y-4">
                {Object.entries(candidate.score_breakdown).map(([key, value], index) => (
                  <div key={key}>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="capitalize text-slate-400">{key.replaceAll("_", " ")}</span>
                      <span className={value < 0 ? "text-rose-300" : "text-white"}>{value.toFixed(2)}</span>
                    </div>
                    <div className="h-2 rounded bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.abs(value) * 4)}%` }}
                        transition={{ duration: 0.7, delay: 0.3 + index * 0.05, ease: "easeOut" }}
                        className={value < 0 ? "h-2 rounded bg-rose-400" : "h-2 rounded bg-cyan"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </aside>
        </div>
      )}
    </section>
  );
}

function Panel({ title, items, delayOffset = 0 }: { title: string; items: string[]; delayOffset?: number }) {
  const list = items.length ? items : ["No items recorded"];
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="mb-3 font-semibold text-white">{title}</h2>
      <ul className="space-y-2 text-sm text-slate-300">
        {list.map((item, index) => (
          <motion.li
            key={item}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: delayOffset + index * 0.06 }}
          >
            {item}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
