"use client";

import { useEffect, useRef, useState } from "react";

const primaryVideo = "/hero-mainframe-style.mp4";
const SENSITIVITY = 0.8;

export function MouseScrubVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prevXRef = useRef<number | null>(null);
  const seekingRef = useRef(false);
  const queuedTimeRef = useRef<number | null>(null);
  const metadataReadyRef = useRef(false);
  const [mounted, setMounted] = useState(false);
  const [scrubEnabled, setScrubEnabled] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    const supportsPointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setScrubEnabled(supportsPointer);
    setMounted(true);
    if (!supportsPointer) return;

    function seekTo(target: number) {
      const video = videoRef.current;
      if (!video) return;
      if (seekingRef.current) {
        queuedTimeRef.current = target;
        return;
      }
      seekingRef.current = true;
      video.currentTime = target;
    }

    function handlePointerMove(event: PointerEvent) {
      const video = videoRef.current;
      if (prevXRef.current === null) {
        prevXRef.current = event.clientX;
        return;
      }
      if (!video || !metadataReadyRef.current || !Number.isFinite(video.duration) || video.duration <= 0) {
        prevXRef.current = event.clientX;
        return;
      }

      const delta = event.clientX - prevXRef.current;
      prevXRef.current = event.clientX;

      const timeOffset = (delta / window.innerWidth) * SENSITIVITY * video.duration;
      const targetTime = Math.min(video.duration, Math.max(0, video.currentTime + timeOffset));
      seekTo(targetTime);
    }

    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  function handleSeeked() {
    seekingRef.current = false;
    const queued = queuedTimeRef.current;
    if (queued !== null) {
      queuedTimeRef.current = null;
      const video = videoRef.current;
      if (video) {
        seekingRef.current = true;
        video.currentTime = queued;
      }
    }
  }

  function handleLoadedMetadata() {
    metadataReadyRef.current = true;
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black">
      {mounted && !videoFailed && (
        <video
          ref={videoRef}
          className="h-full w-full object-cover object-[70%_center] grayscale contrast-[1.08]"
          src={primaryVideo}
          autoPlay={!scrubEnabled}
          loop={!scrubEnabled}
          muted
          playsInline
          preload="auto"
          controls={false}
          onLoadedMetadata={handleLoadedMetadata}
          onSeeked={handleSeeked}
          onError={() => setVideoFailed(true)}
        />
      )}

      {videoFailed && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08),transparent_55%),linear-gradient(135deg,#050505_0%,#0c0c0c_50%,#020202_100%)]" />
      )}
    </div>
  );
}
