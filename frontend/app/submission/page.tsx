import { CheckCircle2, FileJson, Github, TerminalSquare } from "lucide-react";
import type { ReactNode } from "react";
import { SubmissionClient } from "@/components/SubmissionClient";

const checks = [
  "Run backend ranking on ./data/candidates.jsonl",
  "Validate ./outputs/submission.csv",
  "Confirm exactly 100 ranked rows",
  "Push repo without full candidates.jsonl",
  "Update submission_metadata.yaml with real team details",
  "Provide GitHub repository and sandbox/demo link"
];

export default function SubmissionPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan">Submission</p>
        <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">Submission Ready</h1>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          <SubmissionClient />
          <Command
            icon={<TerminalSquare />}
            title="Ranking Command"
            command="python backend/rank.py --candidates ./data/candidates.jsonl --out ./outputs/submission.csv --json ./outputs/top_candidates.json"
          />
          <Command icon={<CheckCircle2 />} title="Validation Command" command="python validate_submission.py ./outputs/submission.csv" />
          <div className="glass rounded-lg p-6">
            <div className="mb-4 flex items-center gap-3">
              <FileJson className="text-cyan" />
              <h2 className="text-xl font-semibold text-white">Output Files</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <span className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-slate-300">outputs/submission.csv</span>
              <span className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-slate-300">outputs/top_candidates.json</span>
            </div>
          </div>
        </div>
        <aside className="glass rounded-lg p-6">
          <div className="mb-5 flex items-center gap-3">
            <Github className="text-cyan" />
            <h2 className="text-xl font-semibold text-white">GitHub Checklist</h2>
          </div>
          <div className="space-y-3">
            {checks.map((check) => (
              <div key={check} className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
                <CheckCircle2 className="mt-0.5 shrink-0 text-cyan" size={17} />
                {check}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Command({ icon, title, command }: { icon: ReactNode; title: string; command: string }) {
  return (
    <div className="glass rounded-lg p-6">
      <div className="mb-4 flex items-center gap-3 text-cyan">
        {icon}
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <pre className="overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 text-sm text-slate-200">
        <code>{command}</code>
      </pre>
    </div>
  );
}
