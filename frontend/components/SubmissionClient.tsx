"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownToLine, CheckCircle2, Loader2, PlayCircle, XCircle } from "lucide-react";
import type { ShortlistStatus } from "@/lib/candidates";
import { DiscoveryOverlay } from "@/components/DiscoveryOverlay";

const emptyStatus: ShortlistStatus = {
  localOutputExists: false,
  bundledOutputExists: false,
  submissionExists: false,
  jsonExists: false,
  ready: false,
  candidateCount: 0,
  submissionModifiedAt: null,
  jsonModifiedAt: null,
  submissionPath: "outputs/submission.csv",
  jsonPath: "outputs/top_candidates.json",
  source: "demo"
};

export function SubmissionClient() {
  const [status, setStatus] = useState<ShortlistStatus>(emptyStatus);
  const [message, setMessage] = useState("Checking output status...");
  const [runDetails, setRunDetails] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function loadStatus() {
    const response = await fetch("/api/shortlist-status", { cache: "no-store" });
    const payload = (await response.json()) as ShortlistStatus;
    setStatus(payload);
    setMessage(payload.ready ? "Outputs are ready for submission." : "No complete shortlist output found yet.");
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
      await loadStatus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ranking failed.");
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => {
    loadStatus().catch(() => setMessage("Unable to read output status."));
  }, []);

  return (
    <div className="glass rounded-lg p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Output Status</h2>
          <p className="mt-2 text-sm text-slate-400">{message}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/45">
            Source: <span className="text-white/75">{sourceLabel(status.source)}</span>
          </p>
        </div>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={runDiscovery}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-3 font-semibold text-ink transition hover:bg-cyan/90 disabled:cursor-wait disabled:opacity-70"
        >
          {running ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
          Run Discovery
        </motion.button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="submission.csv" exists={status.submissionExists} modified={status.submissionModifiedAt} delay={0} />
        <StatusRow label="top_candidates.json" exists={status.jsonExists} modified={status.jsonModifiedAt} delay={0.08} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Candidates in JSON: <span className="font-semibold text-white">{status.candidateCount}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Local outputs: <span className="font-semibold text-white">{status.localOutputExists ? "Found" : "Missing"}</span>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
          Bundled outputs: <span className="font-semibold text-white">{status.bundledOutputExists ? "Found" : "Missing"}</span>
        </div>
      </div>

      {runDetails && (
        <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-400/20 bg-rose-950/25 p-4 text-xs leading-5 text-rose-100">
          {runDetails}
        </pre>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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

      <DiscoveryOverlay active={running} />
    </div>
  );
}

function sourceLabel(source: ShortlistStatus["source"]) {
  if (source === "local-output") return "Local backend outputs";
  if (source === "bundled-generated") return "Bundled Vercel outputs";
  return "Demo fallback";
}

function StatusRow({ label, exists, modified, delay }: { label: string; exists: boolean; modified: string | null; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-white">{label}</span>
        <motion.span
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.3, delay: delay + 0.15, ease: "easeOut" }}
        >
          {exists ? <CheckCircle2 className="text-emerald-300" size={18} /> : <XCircle className="text-rose-300" size={18} />}
        </motion.span>
      </div>
      <p className="mt-2 text-xs text-slate-500">{modified ? `Modified ${modified}` : "Missing"}</p>
    </motion.div>
  );
}
