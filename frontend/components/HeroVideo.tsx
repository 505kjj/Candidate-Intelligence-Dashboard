"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

const VIDEO_SRC = "/hero-mainframe-style.mp4";

/**
 * Full-screen hero video. The video simply autoplays + loops (muted) — we never
 * seek video.currentTime. Cursor interaction is a lightweight GPU parallax: a
 * pointermove listener feeds Framer Motion motion values (no React state per move),
 * so the heavy per-frame video seeking that caused the lag is gone.
 */
export function HeroVideo() {
  const [mounted, setMounted] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const reduceMotion = useReducedMotion();

  // Normalized pointer position in [-0.5, 0.5], smoothed by a spring.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 120, damping: 20, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 120, damping: 20, mass: 0.4 });
  const x = useTransform(sx, [-0.5, 0.5], [-10, 10]);
  const y = useTransform(sy, [-0.5, 0.5], [-6, 6]);

  useEffect(() => {
    setMounted(true);
    if (reduceMotion) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    function handleMove(event: PointerEvent) {
      px.set(event.clientX / window.innerWidth - 0.5);
      py.set(event.clientY / window.innerHeight - 0.5);
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reduceMotion, px, py]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {mounted && !videoFailed && (
        <motion.video
          className="h-full w-full object-cover object-[70%_center] grayscale contrast-[1.05] will-change-transform"
          style={{ x, y, scale: 1.03 }}
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controls={false}
          onError={() => setVideoFailed(true)}
        />
      )}

      {videoFailed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_55%),linear-gradient(135deg,#050505_0%,#0c0c0c_50%,#020202_100%)]" />
      )}
    </div>
  );
}
