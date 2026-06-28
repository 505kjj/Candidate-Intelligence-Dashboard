"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CandidateHead } from "@/components/CandidateHead";

const STATUS_LINES = [
  "Reading candidate profiles...",
  "Scoring career evidence...",
  "Evaluating behavioral signals...",
  "Detecting keyword stuffing...",
  "Generating top 100 shortlist..."
];

export function DiscoveryLoader({ compact = false }: { compact?: boolean }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % STATUS_LINES.length);
    }, 1100);
    return () => clearInterval(id);
  }, []);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-slate-300">
        <CandidateHead size={26} animated variant="compact" />
        {STATUS_LINES[index]}
      </span>
    );
  }

  return (
    <div className="glass flex flex-col items-center gap-5 rounded-lg p-8 text-center">
      <div className="relative">
        <CandidateHead size={104} animated />
        <div className="pointer-events-none absolute inset-x-2 top-1/2 h-px overflow-hidden">
          <motion.div
            className="h-px w-1/3 bg-white/60"
            animate={{ x: ["-120%", "220%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        {STATUS_LINES.map((line, i) => (
          <p
            key={line}
            className={`text-sm transition-all duration-300 ${
              i === index ? "scale-100 text-white opacity-100" : "scale-95 text-slate-500 opacity-40"
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
