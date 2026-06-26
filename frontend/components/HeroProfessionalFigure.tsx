"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const primaryVideo = "/hero-candidates-pingpong.mp4";
const fallbackVideo = "/hero-candidates.mp4";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HeroProfessionalFigure() {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(0);
  const targetTimeRef = useRef<number | null>(null);
  const [videoSrc, setVideoSrc] = useState(primaryVideo);
  const [mounted, setMounted] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [metadataReady, setMetadataReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const progressX = useMotionValue(0.58);
  const progressY = useMotionValue(0.48);
  const smoothX = useSpring(progressX, { stiffness: 90, damping: 24, mass: 0.45 });
  const smoothY = useSpring(progressY, { stiffness: 90, damping: 24, mass: 0.45 });
  const translateX = useTransform(smoothX, [0, 1], [-22, 34]);
  const translateY = useTransform(smoothY, [0, 1], [-12, 16]);
  const rotateY = useTransform(smoothX, [0, 1], [-4, 5]);
  const rotateX = useTransform(smoothY, [0, 1], [3, -3]);

  useEffect(() => {
    setMounted(true);
    const supportsPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setInteractive(supportsPointer);
    if (!supportsPointer) return;

    function animateVideoTime() {
      const video = videoRef.current;
      if (video && targetTimeRef.current !== null && Number.isFinite(video.duration)) {
        const next = video.currentTime + (targetTimeRef.current - video.currentTime) * 0.18;
        video.currentTime = clamp(next, 0, video.duration || 0);
        if (Math.abs(video.currentTime - targetTimeRef.current) > 0.01) {
          animationRef.current = window.requestAnimationFrame(animateVideoTime);
          return;
        }
      }
      animationRef.current = 0;
    }

    function handlePointerMove(event: PointerEvent) {
      const frame = frameRef.current;
      const video = videoRef.current;
      if (!frame) return;

      const rect = frame.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
      progressX.set(x);
      progressY.set(y);

      if (video && metadataReady && Number.isFinite(video.duration) && video.duration > 0) {
        targetTimeRef.current = x * video.duration;
        if (!animationRef.current) {
          animationRef.current = window.requestAnimationFrame(animateVideoTime);
        }
      }
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
    };
  }, [metadataReady, progressX, progressY]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !interactive || !metadataReady) return;
    video.pause();
    video.currentTime = video.duration * progressX.get();
  }, [interactive, metadataReady, progressX]);

  return (
    <motion.div
      ref={frameRef}
      className="relative mx-auto h-[52vh] min-h-[430px] w-full max-w-[720px] overflow-visible sm:h-[60vh] lg:h-[78vh] lg:max-w-none"
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.9, ease: "easeOut" }}
    >
      <div className="absolute inset-4 rounded-[2.25rem] border border-white/10 bg-white/[0.035] shadow-[0_40px_120px_rgba(0,0,0,0.55)] backdrop-blur-sm" />
      <div className="absolute -inset-6 rounded-[3rem] bg-[radial-gradient(circle_at_52%_40%,rgba(255,255,255,0.13),transparent_38%),radial-gradient(circle_at_80%_85%,rgba(255,255,255,0.08),transparent_42%)]" />

      <motion.div
        className="absolute inset-0 overflow-hidden rounded-[2.4rem] border border-white/15 bg-black"
        style={{ x: translateX, y: translateY, rotateY, rotateX, transformPerspective: 1100 }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_36%),linear-gradient(180deg,#111,#050505)]" />
        {mounted && (
          <video
            ref={videoRef}
            className="relative z-10 h-full w-full object-cover object-[58%_center] grayscale contrast-[1.16] brightness-[0.86] saturate-0 md:object-[56%_center]"
            src={videoSrc}
            autoPlay={!interactive}
            loop
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={() => {
              setMetadataReady(true);
              if (interactive && videoRef.current) {
                videoRef.current.pause();
                videoRef.current.currentTime = (videoRef.current.duration || 0) * progressX.get();
              }
            }}
            onError={() => {
              if (videoSrc !== fallbackVideo) setVideoSrc(fallbackVideo);
            }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent_28%,rgba(0,0,0,0.18))]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-28 bg-gradient-to-t from-black/70 to-transparent" />
      </motion.div>

      <div className="pointer-events-none absolute -bottom-7 left-1/2 h-12 w-4/5 -translate-x-1/2 rounded-full bg-black/70 blur-2xl" />
    </motion.div>
  );
}
