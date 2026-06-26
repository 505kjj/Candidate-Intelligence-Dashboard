"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, FileText, Loader2, PlayCircle, X } from "lucide-react";
import { DiscoveryOverlay } from "@/components/DiscoveryOverlay";

export function LandingActions() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [running, setRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleViewShortlist() {
    setChecking(true);
    setError(null);
    try {
      const response = await fetch("/api/shortlist-status", { cache: "no-store" });
      const status = await response.json();
      if (status.jsonExists) {
        router.push("/dashboard");
      } else {
        setShowModal(true);
      }
    } catch {
      setShowModal(true);
    } finally {
      setChecking(false);
    }
  }

  async function handleRunDiscovery() {
    setRunning(true);
    setError(null);
    try {
      const response = await fetch("/api/run-ranking", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Ranking failed.");
      }
      setShowModal(false);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ranking failed.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleViewShortlist}
          disabled={checking}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-black shadow-[0_18px_60px_rgba(255,255,255,0.16)] transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
        >
          {checking ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
          View Shortlist
        </motion.button>
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={handleRunDiscovery}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-black/35 px-6 py-3 font-semibold text-white backdrop-blur-md transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
        >
          {running ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
          Run Discovery
        </motion.button>
        <motion.div whileHover={{ y: -2 }}>
          <Link
            href="/methodology"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-black/30 px-6 py-3 font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
          >
            See Methodology
            <FileText size={18} />
          </Link>
        </motion.div>
      </div>

      <DiscoveryOverlay active={running} />

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !running && setShowModal(false)}
          >
            <motion.div
              className="glass relative w-full max-w-md rounded-2xl p-6"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-white/50 transition hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>
              <h2 className="text-xl font-semibold text-white">No shortlist found.</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">
                No shortlist found. Run Discovery to generate ranked candidates.
              </p>
              {error && (
                <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-300">
                  {error}
                </p>
              )}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleRunDiscovery}
                  disabled={running}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 font-semibold text-black transition hover:bg-white/90 disabled:cursor-wait disabled:opacity-70"
                >
                  {running ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                  Run Discovery
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
