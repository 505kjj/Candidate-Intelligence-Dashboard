"use client";

import { motion, useReducedMotion } from "framer-motion";

type CandidateHeadProps = {
  size?: number;
  className?: string;
  animated?: boolean;
  variant?: "default" | "ghost" | "compact";
  parallax?: { x: number; y: number };
};

const SIGNAL_NODES: Array<[number, number]> = [
  [30, 70],
  [170, 60],
  [22, 130],
  [178, 120],
  [60, 22],
  [140, 22]
];

/**
 * Abstract wireframe / line-art human head used as the visual motif across
 * the dashboard: hero, candidate cards, candidate detail, empty states, and
 * methodology. Pure monochrome SVG, no photographic imagery.
 */
export function CandidateHead({ size = 120, className = "", animated = true, variant = "default", parallax }: CandidateHeadProps) {
  const prefersReducedMotion = useReducedMotion();
  const live = animated && !prefersReducedMotion;
  const strokeOpacity = variant === "ghost" ? 0.35 : 0.85;
  const fillOpacity = variant === "ghost" ? 0.02 : 0.05;

  const px = parallax?.x ?? 0;
  const py = parallax?.y ?? 0;

  return (
    <svg
      viewBox="0 0 200 220"
      width={size}
      height={size * 1.1}
      className={className}
      style={{
        transform: `translate3d(${px * 6}px, ${py * 6}px, 0)`,
        transition: "transform 0.3s ease-out"
      }}
    >
      <defs>
        <linearGradient id="headFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={fillOpacity + 0.04} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id="headClip">
          <path
            d="M100 18
               C 142 18 168 52 168 96
               C 168 132 150 156 130 170
               L 130 196
               C 130 204 124 210 116 210
               L 84 210
               C 76 210 70 204 70 196
               L 70 170
               C 50 156 32 132 32 96
               C 32 52 58 18 100 18 Z"
          />
        </clipPath>
      </defs>

      <motion.g
        style={{ transformOrigin: "100px 110px" }}
        animate={live ? { scale: [1, 1.015, 1] } : undefined}
        transition={live ? { duration: 4.2, repeat: Infinity, ease: "easeInOut" } : undefined}
      >
        {/* head silhouette */}
        <path
          d="M100 18
             C 142 18 168 52 168 96
             C 168 132 150 156 130 170
             L 130 196
             C 130 204 124 210 116 210
             L 84 210
             C 76 210 70 204 70 196
             L 70 170
             C 50 156 32 132 32 96
             C 32 52 58 18 100 18 Z"
          fill="url(#headFade)"
          stroke="#ffffff"
          strokeOpacity={strokeOpacity}
          strokeWidth="1.4"
        />

        {/* facial contour lines (wireframe topology, not literal features) */}
        <g style={{ transform: `translate(${px * 3}px, ${py * 3}px)`, transition: "transform 0.3s ease-out" }}>
          <path d="M100 18 C 90 60 90 140 100 210" stroke="#ffffff" strokeOpacity={strokeOpacity * 0.5} strokeWidth="1" fill="none" />
          <path d="M52 60 C 70 50 130 50 148 60" stroke="#ffffff" strokeOpacity={strokeOpacity * 0.5} strokeWidth="1" fill="none" />
          <path d="M40 100 C 80 92 120 92 160 100" stroke="#ffffff" strokeOpacity={strokeOpacity * 0.5} strokeWidth="1" fill="none" />
          <path d="M46 140 C 80 152 120 152 154 140" stroke="#ffffff" strokeOpacity={strokeOpacity * 0.5} strokeWidth="1" fill="none" />

          {/* eyes as simple nodes */}
          <circle cx="78" cy="92" r="3" fill="#ffffff" fillOpacity={strokeOpacity} />
          <circle cx="122" cy="92" r="3" fill="#ffffff" fillOpacity={strokeOpacity} />
        </g>

        {/* scanning line sweeping across the head */}
        {live && (
          <motion.line
            x1={34}
            x2={166}
            y1={20}
            y2={20}
            clipPath="url(#headClip)"
            stroke="#ffffff"
            strokeWidth="2"
            strokeOpacity={0.55}
            animate={{ y1: [20, 208, 20], y2: [20, 208, 20] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {/* signal nodes radiating from head, representing data signals */}
        {SIGNAL_NODES.map(([cx, cy], i) => (
          <g key={`${cx}-${cy}`}>
            <line
              x1={100}
              y1={96}
              x2={cx}
              y2={cy}
              stroke="#ffffff"
              strokeOpacity={strokeOpacity * 0.18}
              strokeDasharray="2 4"
            />
            <circle cx={cx} cy={cy} r="2.2" fill="#ffffff" fillOpacity={strokeOpacity * 0.6}>
              {live && (
                <animate
                  attributeName="opacity"
                  values="0.3;1;0.3"
                  dur="3s"
                  begin={`${i * 0.4}s`}
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        ))}
      </motion.g>
    </svg>
  );
}
