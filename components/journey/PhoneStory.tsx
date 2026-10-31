"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { motionVars, useReducedMotion } from "./motion";
import { StageArt } from "./StageArt";
import { headingId, StageCopy } from "./StageCopy";
import { CloseButton, DARK_STAGES, type StoryProps } from "./story";
import { useActiveStage } from "./useActiveStage";

/** Below `lg`: a vertical storybook, one screen per stage, art on top and words below. */
export function PhoneStory({ j, onClose, onEnter }: StoryProps) {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { playing, runs } = useActiveStage(root, j.stages.length, "phone", (i) => onEnter(j.stages[i]));

  const onScroll = () => {
    const el = root.current;
    if (!el || !bar.current) return;
    const max = el.scrollHeight - el.clientHeight;
    bar.current.style.width = `${max > 0 ? (el.scrollTop / max) * 100 : 0}%`;
  };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-paper">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-3.5 px-[1.1rem] pt-[calc(0.8rem+env(safe-area-inset-top))]">
        <div aria-hidden className="h-[3px] flex-1 overflow-hidden rounded-full bg-muted/25">
          <i ref={bar} className="block h-full w-0 rounded-full bg-cascara" />
        </div>
        <CloseButton onClick={onClose} className="pointer-events-auto size-[1.9rem] bg-paper/75 text-[0.85rem]" />
      </div>
      <main ref={root} data-journey onScroll={onScroll} className="j-story h-full overflow-y-auto overscroll-contain">
        {j.stages.map((id, i) => {
          const on = reduced || playing[i];
          const dark = DARK_STAGES.has(id);
          return (
            <section
              key={id}
              data-stage-index={i}
              aria-labelledby={headingId(id)}
              className={`j-stage relative flex min-h-full snap-start flex-col ${on ? "is-active" : ""} ${dark ? "bg-[#2a1c15]" : ""}`}
            >
              <div className="relative h-[47dvh] min-h-[16rem] shrink-0 overflow-hidden">
                <StageArt j={j} id={id} active={on} run={runs[i] ?? 0} />
              </div>
              <div className={`flex-1 px-[1.45rem] pt-[1.1rem] pb-[1.4rem] ${dark ? "j-dark" : ""}`}>
                <StageCopy j={j} id={id} onBack={onClose} />
              </div>
              {i === 0 && (
                <p
                  aria-hidden
                  className={`j-fade pb-5 text-center text-[0.72rem] text-muted ${dark ? "j-dark" : ""}`}
                  style={motionVars({ d: 2.2 })}
                >
                  <span className="j-bob inline-block">Scroll to begin ↓</span>
                </p>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
