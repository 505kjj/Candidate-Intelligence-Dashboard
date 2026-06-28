"use client";

import { useEffect, useRef } from "react";

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsHover) return;

    function handleMove(event: PointerEvent) {
      node!.style.setProperty("--glow-x", `${event.clientX}px`);
      node!.style.setProperty("--glow-y", `${event.clientY}px`);
      node!.classList.add("is-active");
    }

    function handleLeave() {
      node!.classList.remove("is-active");
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return <div ref={ref} className="hero-cursor-glow" aria-hidden="true" />;
}
