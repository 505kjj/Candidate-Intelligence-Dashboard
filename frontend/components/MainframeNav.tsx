"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/job", label: "Job Intelligence" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/methodology", label: "Methodology" },
  { href: "/submission", label: "Submission" }
];

export function MainframeNav({ checking, onViewShortlist }: { checking: boolean; onViewShortlist: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
      <Link href="/" className="flex items-center gap-2 text-white mix-blend-difference">
        <span aria-hidden="true">✳︎</span>
        <span className="text-sm font-medium tracking-wide sm:text-base">Candidate Intelligence Dashboard</span>
      </Link>

      <nav className="hidden items-center gap-6 text-white mix-blend-difference md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[18px] transition-opacity hover:opacity-60 lg:text-[20px]"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={onViewShortlist}
        disabled={checking}
        className="hidden items-center gap-2 rounded-full border border-white px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-black disabled:cursor-wait disabled:opacity-70 md:inline-flex"
      >
        {checking && <Loader2 className="animate-spin" size={14} />}
        View Shortlist
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-label="Toggle menu"
        className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
      >
        <span
          className={`h-[1.5px] w-5 bg-white transition-transform duration-200 ${menuOpen ? "translate-y-[6.5px] rotate-45" : ""}`}
        />
        <span className={`h-[1.5px] w-5 bg-white transition-opacity duration-200 ${menuOpen ? "opacity-0" : "opacity-100"}`} />
        <span
          className={`h-[1.5px] w-5 bg-white transition-transform duration-200 ${menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""}`}
        />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 flex flex-col items-start justify-center gap-6 bg-black/95 px-8 backdrop-blur-sm md:hidden"
          >
            {links.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-3xl font-medium text-white"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: links.length * 0.05 }}
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onViewShortlist();
              }}
              disabled={checking}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-white px-5 py-3 text-lg font-semibold text-white disabled:cursor-wait disabled:opacity-70"
            >
              {checking && <Loader2 className="animate-spin" size={16} />}
              View Shortlist
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
