"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const primaryVideo = "/hero-candidates-pingpong.mp4";
const fallbackVideo = "/hero-candidates.mp4";

export function HeroProfessionalReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoSrc, setVideoSrc] = useState(primaryVideo);
  const [mounted, setMounted] = useState(false);
  const [reveal, setReveal] = useState(82);
  const [interactive, setInteractive] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setMounted(true);
    const supportsPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setInteractive(supportsPointer);
    if (!supportsPointer) {
      setReveal(100);
      return;
    }

    let frame = 0;
    function handlePointerMove(event: PointerEvent) {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const node = containerRef.current;
        if (!node) return;
        const rect = node.getBoundingClientRect();
        const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
        const percentage = Math.round((x / rect.width) * 100);
        setReveal(Math.min(100, Math.max(18, percentage)));
        frame = 0;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const enhancedClip = interactive ? `inset(0 ${100 - reveal}% 0 0)` : "inset(0 0 0 0)";

  return (
    <motion.div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-black"
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(255,255,255,0.14),transparent_32%),linear-gradient(110deg,#050505_0%,#101010_48%,#050505_100%)]" />

      {mounted && (
        <>
          <video
            className="absolute inset-0 h-full w-full object-cover object-[70%_center] opacity-85 grayscale contrast-90 brightness-[0.72] blur-[1px] saturate-0 sm:object-right lg:object-[58%_center]"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => {
              if (videoSrc !== fallbackVideo) setVideoSrc(fallbackVideo);
            }}
          />
          <video
            className="absolute inset-0 h-full w-full object-cover object-[70%_center] grayscale contrast-[1.22] brightness-[0.9] saturate-0 sm:object-right lg:object-[58%_center]"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{ clipPath: enhancedClip }}
            onError={() => {
              if (videoSrc !== fallbackVideo) setVideoSrc(fallbackVideo);
            }}
          />
        </>
      )}

      {interactive && (
        <motion.div
          className="absolute bottom-0 top-0 hidden w-px bg-gradient-to-b from-transparent via-white/55 to-transparent shadow-[0_0_34px_rgba(255,255,255,0.4)] md:block"
          animate={{ left: `${reveal}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 24, mass: 0.3 }}
        />
      )}

      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.72)_34%,rgba(0,0,0,0.34)_62%,rgba(0,0,0,0.2)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/55 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 to-transparent" />
    </motion.div>
  );
}
