"use client";

import { useEffect, useState, useSyncExternalStore, type CSSProperties } from "react";

function useMedia(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** The user asked for less motion: every stage shows its finished state, with no loops and no parallax. */
export function useReducedMotion(): boolean {
  return useMedia("(prefers-reduced-motion: reduce)");
}

/** The app's `lg` breakpoint: the pinned desktop layout instead of the phone storybook. */
export function useIsDesktop(): boolean {
  return useMedia("(min-width: 64rem)");
}

/**
 * Linear progress 0 → 1 over `durationMs`, starting `delayMs` after `active` turns true, for counters
 * and colour ramps drawn in JS (ease it yourself, e.g. `easeOut(t)`). 0 while inactive; 1 at once with
 * reduced motion. Arts are remounted on every entry, so the tween restarts with each replay.
 */
export function useTween(active: boolean, durationMs: number, delayMs = 0): number {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active || reduced) return;
    let frame = 0;
    const start = performance.now() + delayMs;
    const step = (now: number) => {
      const v = Math.max(0, Math.min(1, (now - start) / durationMs));
      setT(v);
      if (v < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [active, reduced, durationMs, delayMs]);
  if (reduced) return 1;
  return active ? t : 0;
}

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * The CSS variables the j- classes read: `d` (delay, s), `dur` (j-draw duration, s), `len` (j-draw
 * path length). `style={motionVars({ d: 0.4, len: 134, dur: 1.2 })}`.
 */
export function motionVars(v: { d?: number; dur?: number; len?: number }): CSSProperties {
  const out: Record<string, string | number> = {};
  if (v.d !== undefined) out["--d"] = `${v.d}s`;
  if (v.dur !== undefined) out["--dur"] = `${v.dur}s`;
  if (v.len !== undefined) out["--len"] = v.len;
  return out as CSSProperties;
}
