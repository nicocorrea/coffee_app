"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";

export type StagePlayback = {
  /** The stage the reader is on, or -1 before the first one registers. */
  active: number;
  /** Whether each stage is playing (gets `.is-active` and `ArtProps.active`). */
  playing: boolean[];
  /** How many times each stage has started; used as the art's key so every entry replays it. */
  runs: number[];
};

const DESKTOP_FADE_MS = 800; // the leaving art keeps playing while it cross-fades out

/**
 * Which stage is active inside a scroll container. Stages are its descendants with `data-stage-index`.
 *
 * - phone: a stage becomes active once ≥ 55% of it (or of the screen) is visible. It keeps playing
 *   until it is fully out of view, and replays (its run counter goes up) only if it was fully out in between.
 * - desktop: the active stage is the chapter crossing the container's middle. Every activation is a
 *   new run; the previous stage keeps playing for the 0.8 s it takes to fade out.
 */
export function useActiveStage(
  rootRef: RefObject<HTMLElement | null>,
  count: number,
  mode: "phone" | "desktop",
  onEnter: (index: number) => void,
): StagePlayback {
  const [snap, setSnap] = useState<StagePlayback>(() => ({
    active: -1,
    playing: Array<boolean>(count).fill(false),
    runs: Array<number>(count).fill(0),
  }));
  // Survives the effect re-running (the route hidden and shown again), so keys only ever go up.
  const runs = useRef<number[]>([]);
  const entered = useEffectEvent(onEnter);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = [...root.querySelectorAll<HTMLElement>("[data-stage-index]")];
    const inView = els.map(() => false);
    const leaving = new Map<number, ReturnType<typeof setTimeout>>();
    let active = -1;

    const publish = () =>
      setSnap({
        active,
        runs: els.map((_, i) => runs.current[i] ?? 0),
        playing: els.map((_, i) => (mode === "phone" ? inView[i] : i === active || leaving.has(i))),
      });
    const start = (i: number) => {
      runs.current[i] = (runs.current[i] ?? 0) + 1;
    };
    const makeActive = (i: number) => {
      if (i === active) return;
      if (mode === "desktop") {
        clearTimeout(leaving.get(i));
        leaving.delete(i);
        const prev = active;
        if (prev >= 0) {
          leaving.set(
            prev,
            setTimeout(() => {
              leaving.delete(prev);
              publish();
            }, DESKTOP_FADE_MS),
          );
        }
        start(i);
      }
      active = i;
      entered(i);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = els.indexOf(e.target as HTMLElement);
          if (i < 0) continue;
          if (mode === "desktop") {
            if (e.isIntersecting) makeActive(i);
            continue;
          }
          const covers = e.rootBounds ? e.intersectionRect.height / e.rootBounds.height : 0;
          if (e.intersectionRatio >= 0.55 || covers >= 0.55) {
            if (!inView[i]) {
              inView[i] = true;
              start(i);
            }
            makeActive(i);
          } else if (!e.isIntersecting || e.intersectionRatio === 0 || e.intersectionRect.height === 0) {
            // A neighbour sitting exactly at the edge "intersects" with zero area: that is out of view too.
            inView[i] = false;
          }
        }
        publish();
      },
      mode === "desktop"
        ? { root, rootMargin: "-50% 0px -50% 0px" }
        : // 0.001 makes the last visible sliver → edge-adjacent (ratio 0) step fire a callback;
          // with only 0 as the lowest threshold, the spec treats both as the same band.
          { root, threshold: [0, 0.001, 0.3, 0.55, 0.8, 1] },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      leaving.forEach((t) => clearTimeout(t));
      // Hidden (navigated away) or torn down: nothing plays, so coming back replays the stage.
      setSnap((s) => ({ ...s, active: -1, playing: s.playing.map(() => false) }));
    };
  }, [rootRef, count, mode]);

  return snap;
}
