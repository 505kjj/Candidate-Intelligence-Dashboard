"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

const VIDEO_SRC = "/hero-agent-loop.mp4";
const POSTER_SRC = "/hero-agent-poster.webp";

/**
 * Single autoplay/loop hero video with a subtle cursor parallax. The video layer
 * (a motion.div wrapper) shifts a few pixels toward the cursor — translate only,
 * no rotation, no video.currentTime scrubbing, no per-frame image swapping. Motion
 * values + spring drive the transform, so there is no React state on pointermove.
 * A poster + stable black background prevent any black flash while the video loads.
 */
export function HeroVideo() {
  const [parallax, setParallax] = useState(false);
  const reduceMotion = useReducedMotion();

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 120, damping: 26, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 120, damping: 26, mass: 0.4 });

  useEffect(() => {
    if (reduceMotion) return;
    // Enable parallax only when a precise pointer (mouse/trackpad) exists.
    if (!window.matchMedia("(any-pointer: fine)").matches) return;
    setParallax(true);

    function handleMove(event: PointerEvent) {
      const nx = event.clientX / window.innerWidth - 0.5; // -0.5 .. 0.5
      const ny = event.clientY / window.innerHeight - 0.5;
      x.set(nx * 16); // ±8px
      y.set(ny * 8); // ±4px
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, [reduceMotion, x, y]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      <motion.div
        className="h-full w-full will-change-transform"
        style={parallax ? { x: springX, y: springY, scale: 1.02 } : undefined}
      >
        <video
          className="h-full w-full object-cover object-[70%_center] grayscale contrast-[1.05]"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controls={false}
        />
      </motion.div>
    </div>
  );
}
