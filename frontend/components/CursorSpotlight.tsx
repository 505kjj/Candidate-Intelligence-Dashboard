"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function CursorSpotlight() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === "/") return;
    const node = ref.current;
    if (!node) return;

    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsHover) return;

    function handleMove(event: PointerEvent) {
      node!.style.setProperty("--spot-x", `${event.clientX}px`);
      node!.style.setProperty("--spot-y", `${event.clientY}px`);
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
  }, [pathname]);

  if (pathname === "/") return null;

  return <div ref={ref} className="cursor-spotlight" aria-hidden="true" />;
}
