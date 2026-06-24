"use client";

import { motion } from "framer-motion";

export function SignalRings() {
  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[560px] sm:h-[480px]">
      <div className="absolute inset-8 rounded-full border border-cyan/25 shadow-glow ring-spin" />
      <div className="absolute inset-20 rounded-full border border-violet/25 shadow-violet ring-spin-reverse" />
      <div className="absolute inset-32 rounded-full border border-white/10" />
      {[0, 1, 2, 3].map((item) => (
        <motion.div
          key={item}
          className="glass absolute w-56 rounded-lg p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: item * 0.12, duration: 0.55 }}
          style={{
            left: item % 2 === 0 ? "4%" : "52%",
            top: `${12 + item * 19}%`
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Candidate {item + 1}</span>
            <span className="rounded-md bg-cyan/10 px-2 py-1 text-xs text-cyan">{92 - item * 4}.4</span>
          </div>
          <div className="h-2 rounded bg-white/10">
            <div className="h-2 rounded bg-cyan" style={{ width: `${88 - item * 8}%` }} />
          </div>
          <div className="mt-3 flex gap-2">
            <span className="h-2 w-14 rounded bg-white/15" />
            <span className="h-2 w-20 rounded bg-white/10" />
          </div>
        </motion.div>
      ))}
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan/40 bg-cyan/10 blur-[1px] shadow-glow" />
    </div>
  );
}
