"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 72;
const MIDDLE = Math.floor(FRAME_COUNT / 2);
const VIDEO_FALLBACK = "/hero-agent-loop.mp4";

const framePath = (index: number) => `/hero-frames/frame_${String(index).padStart(3, "0")}.webp`;

/**
 * Cursor-driven head turn. Cursor X maps to a frame in the head-turn sequence
 * (left = first frame, right = last); the agent's monitor-head follows the cursor.
 *
 * Smoothness: frames are preloaded once and painted to a <canvas> via drawImage on
 * a requestAnimationFrame lerp. Unlike swapping a full-screen <img> src on every
 * move (which forces layout/decode and caused the earlier lag), canvas drawImage of
 * an already-loaded image is a cheap GPU paint — no DOM reflow, no React state on
 * pointermove. Falls back to the autoplay loop video if frames fail; a static middle
 * frame on touch / reduced-motion.
 */
export function HeroHeadScrub() {
  const [failed, setFailed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  const targetRef = useRef(MIDDLE);
  const currentRef = useRef(MIDDLE);
  const shownRef = useRef(-1);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function drawCover(img: HTMLImageElement) {
      const W = canvas!.width;
      const H = canvas!.height;
      const iw = img.naturalWidth;
      const ih = img.naturalHeight;
      if (!iw || !ih) return;
      const scale = Math.max(W / iw, H / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const ox = (W - dw) * 0.7; // object-position: 70% center
      const oy = (H - dh) * 0.5;
      ctx!.drawImage(img, ox, oy, dw, dh);
    }

    function drawFrame(index: number, force = false) {
      const clamped = Math.max(0, Math.min(FRAME_COUNT - 1, index));
      if (!force && clamped === shownRef.current) return;
      const img = framesRef.current[clamped];
      if (!img || !loadedRef.current[clamped]) return;
      shownRef.current = clamped;
      drawCover(img);
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(window.innerWidth * dpr);
      canvas!.height = Math.round(window.innerHeight * dpr);
      drawFrame(Math.round(currentRef.current), true); // canvas clears on resize
    }

    // Preload every frame (tiny webp). drawImage decodes on first paint and the
    // browser caches it; no decoded bitmaps are force-retained.
    let loadedCount = 0;
    let failures = 0;
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      loadedRef.current[i] = false;
      img.onload = () => {
        loadedRef.current[i] = true;
        loadedCount += 1;
        if (i === MIDDLE || shownRef.current === -1) drawFrame(MIDDLE, true);
      };
      img.onerror = () => {
        failures += 1;
        if (failures >= 3) setFailed(true);
      };
      img.src = framePath(i);
      framesRef.current[i] = img;
    }

    resize();
    window.addEventListener("resize", resize);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(any-pointer: fine)").matches;

    let onMove: ((event: PointerEvent) => void) | null = null;
    if (fine && !reduce) {
      const tick = () => {
        const cur = currentRef.current;
        const tgt = targetRef.current;
        const diff = tgt - cur;
        if (Math.abs(diff) < 0.4) {
          currentRef.current = tgt;
          drawFrame(Math.round(tgt));
          rafRef.current = 0;
          return;
        }
        currentRef.current = cur + diff * 0.18; // ease toward target
        drawFrame(Math.round(currentRef.current));
        rafRef.current = requestAnimationFrame(tick);
      };
      const kick = () => {
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
      };
      onMove = (event: PointerEvent) => {
        targetRef.current = (event.clientX / window.innerWidth) * (FRAME_COUNT - 1);
        kick();
      };
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (onMove) window.removeEventListener("pointermove", onMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {!failed && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="block h-full w-full grayscale contrast-[1.05]"
        />
      )}
      {failed && (
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
