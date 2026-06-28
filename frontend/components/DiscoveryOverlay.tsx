"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DiscoveryLoader } from "@/components/DiscoveryLoader";

export function DiscoveryOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-sm"
          >
            <DiscoveryLoader />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
