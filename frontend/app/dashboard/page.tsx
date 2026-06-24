import { DashboardClient } from "@/components/DashboardClient";
import { getCandidates } from "@/lib/candidates";

export default function DashboardPage() {
  const { candidates, isDemo } = getCandidates();
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan">Ranked Shortlist</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Top Candidates</h1>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Loaded" value={String(candidates.length)} />
          <Stat label="Best" value={candidates[0]?.score.toFixed(1) ?? "0"} />
          <Stat label="Low Risk" value={String(candidates.filter((c) => c.risk_level === "Low").length)} />
        </div>
      </div>
      <DashboardClient candidates={candidates} isDemo={isDemo} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass min-w-24 rounded-lg p-3 text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}
