"use client";

import { useEffect, useRef } from "react";

/**
 * Lightweight cursor aura. Position is applied via a GPU transform (translate3d)
 * batched through a single requestAnimationFrame per frame — no React state and no
 * layout-triggering left/top updates on pointermove.
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    let active = false;

    function apply() {
      frame = 0;
      // offset by half the element size (120px) so the glow centers on the cursor
      node!.style.transform = `translate3d(${x - 60}px, ${y - 60}px, 0)`;
      if (active) node!.classList.add("is-active");
    }

    function handleMove(event: PointerEvent) {
      x = event.clientX;
      y = event.clientY;
      active = true;
      if (!frame) frame = requestAnimationFrame(apply);
    }

    function handleLeave() {
      active = false;
      node!.classList.remove("is-active");
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="hero-cursor-glow" aria-hidden="true" />;
}
