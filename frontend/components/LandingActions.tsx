import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";

export function LandingActions() {
  return (
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
  );
}
