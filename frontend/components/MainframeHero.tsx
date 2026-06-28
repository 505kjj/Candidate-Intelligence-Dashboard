"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, PlayCircle, X } from "lucide-react";
import { MouseScrubVideo } from "@/components/MouseScrubVideo";
import { MainframeNav } from "@/components/MainframeNav";
import { CursorGlow } from "@/components/CursorGlow";
import { DiscoveryOverlay } from "@/components/DiscoveryOverlay";
import { useTypewriter } from "@/components/useTypewriter";

const INTRO_LINE_1 = "Hey there, meet A.R.I.A,";
const INTRO_LINE_2 = "Adaptive Recruiting Intelligence Agent";
const TYPEWRITER_TEXT = "Glad you stopped in. Good talent tends to find us. Now, who are we discovering?";

const PILL_BASE =
  "inline-flex rounded-full text-[13px] sm:text-[15px] px-4 sm:px-5 py-[0.3em] mx-[0.2em] mb-[0.4em] whitespace-nowrap transition-colors duration-200 items-center gap-2";
const PILL_PRIMARY = "bg-white text-black border border-black/10 hover:bg-black hover:text-white";
const PILL_OUTLINE = "bg-transparent border border-white text-white hover:bg-white hover:text-black";

export function MainframeHero() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [running, setRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { displayed, done } = useTypewriter(TYPEWRITER_TEXT, { speed: 38, startDelay: 600 });

  async function handleViewShortlist() {
    setChecking(true);
    setError(null);
    setRunDetails(null);
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
    setRunDetails(null);
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
      setShowModal(false);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ranking failed.");
    } finally {
      setRunning(false);
    }
  }

  function handleCopyContact() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("candidate-intelligence@dashboard.ai").catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <section className="relative h-screen min-h-screen w-full overflow-hidden bg-black">
      <MouseScrubVideo />

      {/* blur-fade overlay: frosted glass at the bottom for legibility, clear toward the top */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] backdrop-blur-xl"
        style={{
          maskImage: "linear-gradient(to top, black 0%, transparent 45%)",
          WebkitMaskImage: "linear-gradient(to top, black 0%, transparent 45%)"
        }}
      />

      <CursorGlow />
      <MainframeNav checking={checking} onViewShortlist={handleViewShortlist} />

      <div className="absolute inset-0 z-10 flex flex-col justify-end px-5 pb-12 sm:px-8 md:justify-center md:px-10 md:pb-0">
        <div className="relative z-10 max-w-xl">
          <p
            aria-hidden="true"
            className="pointer-events-none mb-5 select-none text-white sm:mb-6"
            style={{
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: 1.3,
              fontWeight: 400,
              filter: "blur(4px)"
            }}
          >
            {INTRO_LINE_1}
            <br />
            {INTRO_LINE_2}
          </p>

          <p
            className="mb-5 text-white sm:mb-6"
            style={{
              fontSize: "clamp(18px, 4vw, 26px)",
              lineHeight: 1.35,
              fontWeight: 400,
              minHeight: 54
            }}
          >
            {displayed}
            {!done && <span className="typewriter-caret">|</span>}
          </p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button
              type="button"
              onClick={handleViewShortlist}
              disabled={checking}
              className={`${PILL_BASE} ${PILL_PRIMARY} disabled:cursor-wait disabled:opacity-70`}
            >
              {checking && <Loader2 className="animate-spin" size={14} />}
              View Shortlist
            </button>
            <button
              type="button"
              onClick={handleRunDiscovery}
              disabled={running}
              className={`${PILL_BASE} ${PILL_PRIMARY} disabled:cursor-wait disabled:opacity-70`}
            >
              {running ? <Loader2 className="animate-spin" size={14} /> : <PlayCircle size={14} />}
              Run Discovery
            </button>
            <Link href="/methodology" className={`${PILL_BASE} ${PILL_OUTLINE}`}>
              See Methodology
            </Link>
            <Link href="/dashboard" className={`${PILL_BASE} ${PILL_OUTLINE}`}>
              View Dashboard
            </Link>
            <button type="button" onClick={handleCopyContact} className={`${PILL_BASE} ${PILL_OUTLINE}`}>
              {copied ? "Copied!" : "Reach us: candidate-intelligence"}
            </button>
          </motion.div>
        </div>
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
              {runDetails && (
                <pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap rounded-lg border border-rose-400/20 bg-rose-950/25 p-3 text-xs leading-5 text-rose-100">
                  {runDetails}
                </pre>
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
    </section>
  );
}
