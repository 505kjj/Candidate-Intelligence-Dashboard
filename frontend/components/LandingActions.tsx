"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, FileText, Loader2, PlayCircle, X } from "lucide-react";
import type { ShortlistStatus } from "@/lib/candidates";

type RunState = "idle" | "running" | "success" | "error";

export function LandingActions() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [runState, setRunState] = useState<RunState>("idle");
  const [message, setMessage] = useState("");

  async function viewShortlist() {
    const response = await fetch("/api/shortlist-status", { cache: "no-store" });
    const status = (await response.json()) as ShortlistStatus;
    if (status.ready) {
      router.push("/dashboard");
      return;
    }
    setMessage("No shortlist found. Run Discovery to generate ranked candidates.");
    setModalOpen(true);
  }

  async function runDiscovery() {
    setRunState("running");
    setMessage("Ranking candidates and generating outputs...");
    setModalOpen(true);

    try {
      const response = await fetch("/api/run-ranking", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Ranking failed.");
      }
      setRunState("success");
      setMessage("Shortlist generated successfully.");
    } catch (error) {
      setRunState("error");
      setMessage(error instanceof Error ? error.message : "Ranking failed.");
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={viewShortlist}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-5 py-3 font-semibold text-ink transition hover:bg-cyan/90"
        >
          View Shortlist
          <ArrowRight size={18} />
        </button>
        <button
          type="button"
          onClick={runDiscovery}
          disabled={runState === "running"}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan/30 bg-cyan/10 px-5 py-3 font-semibold text-cyan transition hover:bg-cyan/15 disabled:cursor-wait disabled:opacity-70"
        >
          {runState === "running" ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
          Run Discovery
        </button>
        <Link
          href="/methodology"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
        >
          See Methodology
          <FileText size={18} />
        </Link>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="glass w-full max-w-lg rounded-lg p-6 shadow-glow">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-cyan">Discovery</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {runState === "success" ? "Shortlist Ready" : "No shortlist found"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 hover:bg-white/10"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <p className="leading-7 text-slate-300">{message || "No shortlist found. Run Discovery to generate ranked candidates."}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {runState === "success" ? (
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-3 font-semibold text-ink"
                >
                  Open Dashboard
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={runDiscovery}
                  disabled={runState === "running"}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-4 py-3 font-semibold text-ink disabled:cursor-wait disabled:opacity-70"
                >
                  {runState === "running" ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                  Run Discovery
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
