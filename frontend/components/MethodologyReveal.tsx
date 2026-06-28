"use client";

import { motion } from "framer-motion";
import { BadgeCheck, BrainCircuit, FileSearch, Filter, GitBranch, ShieldAlert, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  BrainCircuit,
  FileSearch,
  BadgeCheck,
  GitBranch,
  ShieldAlert,
  Filter
};

export type MethodologyStep = {
  title: string;
  text: string;
  icon: keyof typeof ICONS;
};

export function MethodologyReveal({ steps }: { steps: MethodologyStep[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = ICONS[step.icon];
        return (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: (index % 3) * 0.08, ease: "easeOut" }}
            className="glass relative overflow-hidden rounded-lg p-6 transition hover:-translate-y-1 hover:border-cyan/30"
          >
            <motion.span
              className="absolute left-0 top-0 h-[2px] bg-white/60"
              style={{ transformOrigin: "left" }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: (index % 3) * 0.08 + 0.1, ease: "easeOut" }}
            />
            <span className="absolute right-5 top-6 h-1.5 w-1.5 rounded-full bg-white/40" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            </span>
            <Icon className="mb-5 text-cyan" size={24} />
            <h2 className="text-xl font-semibold text-white">{step.title}</h2>
            <p className="mt-3 leading-7 text-slate-400">{step.text}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
