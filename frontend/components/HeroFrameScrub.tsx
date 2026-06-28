"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 300;
const MIDDLE = Math.floor(FRAME_COUNT / 2);
const VIDEO_FALLBACK = "/hero-mainframe-style.mp4";

const framePath = (index: number) => `/hero-frames/frame_${String(index).padStart(3, "0")}.webp`;

type Mode = "pending" | "scrub" | "static" | "video";

/**
 * Cursor-scrubbed image sequence hero. Cursor X maps to a frame (left = first,
 * right = last); a requestAnimationFrame loop eases the displayed frame toward the
 * target so motion is smooth. The single <img>'s src is mutated through a ref —
 * no React state on pointermove, no video.currentTime scrubbing. Falls back to the
 * autoplay video if frames fail to load, and to a static middle frame on touch.
 */
export function HeroFrameScrub() {
  const [mode, setMode] = useState<Mode>("pending");
  const imgRef = useRef<HTMLImageElement>(null);
  const preloadRef = useRef<HTMLImageElement[]>([]);
  const targetRef = useRef(MIDDLE);
  const currentRef = useRef(MIDDLE);
  const shownRef = useRef(MIDDLE);
  const rafRef = useRef(0);

  useEffect(() => {
    const touchOnly =
      window.matchMedia("(any-pointer: coarse)").matches &&
      !window.matchMedia("(any-pointer: fine)").matches;

    // Preload every frame so src swaps are instant (warms the browser cache).
    let failures = 0;
    const imgs: HTMLImageElement[] = [];
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onerror = () => {
        failures += 1;
        if (failures >= 3) setMode("video"); // frames genuinely missing -> video
      };
      img.src = framePath(i);
      imgs.push(img);
    }
    preloadRef.current = imgs;

    if (touchOnly) {
      setMode("static");
      return; // no scrubbing; the static middle frame stays shown
    }
    setMode("scrub");

    function show(index: number) {
      const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      if (clamped === shownRef.current) return;
      shownRef.current = clamped;
      if (imgRef.current) imgRef.current.src = framePath(clamped);
    }

    function tick() {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      const diff = tgt - cur;
      if (Math.abs(diff) < 0.5) {
        currentRef.current = tgt;
        show(Math.round(tgt));
        rafRef.current = 0;
        return; // settled — stop the loop until the next move
      }
      currentRef.current = cur + diff * 0.2; // ease toward target
      show(Math.round(currentRef.current));
      rafRef.current = requestAnimationFrame(tick);
    }

    function kick() {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }

    function handleMove(event: PointerEvent) {
      const progress = event.clientX / window.innerWidth; // 0..1
      targetRef.current = progress * (FRAME_COUNT - 1);
      kick();
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {mode !== "video" && (
        <img
          ref={imgRef}
          src={framePath(MIDDLE)}
          alt=""
          aria-hidden="true"
          draggable={false}
          decoding="async"
          className="h-full w-full select-none object-cover object-[70%_center] grayscale contrast-[1.05]"
        />
      )}

      {mode === "video" && (
        <video
          className="h-full w-full object-cover object-[70%_center] grayscale contrast-[1.05]"
          src={VIDEO_FALLBACK}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          controls={false}
        />
      )}
    </div>
  );
}
