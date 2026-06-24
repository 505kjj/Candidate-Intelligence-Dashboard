import { DashboardClient } from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan">Ranked Shortlist</p>
          <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Top Candidates</h1>
        </div>
        <div className="glass rounded-lg px-4 py-3 text-sm text-slate-300">
          Live data source: <span className="text-cyan">/api/candidates</span>
        </div>
      </div>
      <DashboardClient />
    </section>
  );
}
