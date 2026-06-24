"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine, CheckCircle2, Loader2, PlayCircle, XCircle } from "lucide-react";
import type { ShortlistStatus } from "@/lib/candidates";

const emptyStatus: ShortlistStatus = {
  submissionExists: false,
  jsonExists: false,
  ready: false,
  candidateCount: 0,
  submissionModifiedAt: null,
  jsonModifiedAt: null,
  submissionPath: "outputs/submission.csv",
  jsonPath: "outputs/top_candidates.json"
};

export function SubmissionClient() {
  const [status, setStatus] = useState<ShortlistStatus>(emptyStatus);
  const [message, setMessage] = useState("Checking output status...");
  const [running, setRunning] = useState(false);

  async function loadStatus() {
    const response = await fetch("/api/shortlist-status", { cache: "no-store" });
    const payload = (await response.json()) as ShortlistStatus;
    setStatus(payload);
    setMessage(payload.ready ? "Outputs are ready for submission." : "No complete shortlist output found yet.");
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
        </div>
        <button
          type="button"
          onClick={runDiscovery}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-3 font-semibold text-ink transition hover:bg-cyan/90 disabled:cursor-wait disabled:opacity-70"
        >
          {running ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
          Run Discovery
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="submission.csv" exists={status.submissionExists} modified={status.submissionModifiedAt} />
        <StatusRow label="top_candidates.json" exists={status.jsonExists} modified={status.jsonModifiedAt} />
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
        Candidates in JSON: <span className="font-semibold text-white">{status.candidateCount}</span>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
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
    </div>
  );
}

function StatusRow({ label, exists, modified }: { label: string; exists: boolean; modified: string | null }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-white">{label}</span>
        {exists ? <CheckCircle2 className="text-emerald-300" size={18} /> : <XCircle className="text-rose-300" size={18} />}
      </div>
      <p className="mt-2 text-xs text-slate-500">{modified ? `Modified ${modified}` : "Missing"}</p>
    </div>
  );
}
