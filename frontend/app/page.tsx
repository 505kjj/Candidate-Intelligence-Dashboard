import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { SignalRings } from "@/components/SignalRings";

export default function Home() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-145px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
      <div>
        <div className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-cyan">
          <Sparkles size={16} />
          Explainable AI ranking for high-signal recruiting
        </div>
        <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
          Candidate Intelligence Dashboard
        </h1>
        <p className="mt-6 max-w-2xl text-2xl text-slate-200">
          Discover the best-fit candidates beyond keywords.
        </p>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-400">
          An explainable AI ranking engine that understands job context, career evidence, and behavioral hiring signals.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan px-5 py-3 font-semibold text-ink transition hover:bg-cyan/90"
          >
            View Shortlist
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/methodology"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            See Methodology
            <FileText size={18} />
          </Link>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["Hybrid ranker", "TF-IDF plus explicit evidence"],
            ["Trap-aware", "Keyword stuffing penalties"],
            ["CPU only", "No hosted model calls"]
          ].map(([title, text]) => (
            <div key={title} className="glass rounded-lg p-4">
              <ShieldCheck className="mb-3 text-cyan" size={18} />
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="mt-1 text-sm text-slate-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
      <SignalRings />
    </section>
  );
}
