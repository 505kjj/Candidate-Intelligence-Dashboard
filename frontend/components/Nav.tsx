"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BrainCircuit } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/job", label: "Job Intelligence" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/methodology", label: "Methodology" },
  { href: "/submission", label: "Submission" }
];

export function Nav() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-[0_0_28px_rgba(255,255,255,0.1)]">
            <BrainCircuit size={21} />
          </span>
          <span className="text-sm font-semibold tracking-wide text-white sm:text-base">
            Candidate Intelligence Dashboard
          </span>
        </Link>
        <nav className="hidden items-center gap-2 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/15"
        >
          <BarChart3 size={16} />
          <span className="hidden sm:inline">View Shortlist</span>
        </Link>
      </div>
      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 sm:px-6 lg:hidden lg:px-8">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
