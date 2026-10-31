"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { STAGE_LABELS } from "@/lib/journey/copy";
import { useReducedMotion } from "./motion";
import { StageArt } from "./StageArt";
import { headingId, Key, StageCopy } from "./StageCopy";
import { CloseButton, DARK_STAGES, type StoryProps } from "./story";
import { useActiveStage } from "./useActiveStage";

const PARALLAX_PX = 120; // per unit of data-depth

/** `lg` and up: the art pinned on the left in a 6:5 card, the chapters scrolling on the right. */
export function DesktopStory({ j, onClose, onEnter }: StoryProps) {
  const root = useRef<HTMLDivElement>(null);
  const navs = useRef<(HTMLButtonElement | null)[]>([]);
  // Where a stage-bar click or key press is heading, so a second press moves on from there, not
  // from whatever the smooth scroll is passing through.
  const target = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const { active, playing, runs } = useActiveStage(root, j.stages.length, "desktop", (i) => {
    if (target.current === i) target.current = null;
    onEnter(j.stages[i]);
  });
  const shown = Math.max(active, 0);
  const night = DARK_STAGES.has(j.stages[shown]);

  const chapters = () => [...(root.current?.querySelectorAll<HTMLElement>("section[data-stage-index]") ?? [])];

  const go = (i: number) => {
    const el = root.current;
    const list = chapters();
    const c = list[Math.max(0, Math.min(list.length - 1, i))];
    if (!el || !c) return;
    target.current = list.indexOf(c);
    const r = c.getBoundingClientRect();
    const top = el.scrollTop + r.top - el.getBoundingClientRect().top + r.height / 2 - el.clientHeight / 2 + 1;
    el.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  };

  // The stage bar fills as each chapter is read.
  const fill = () => {
    const el = root.current;
    if (!el) return;
    const mid = el.getBoundingClientRect().top + el.clientHeight / 2;
    chapters().forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
      navs.current[i]?.style.setProperty("--p", `${p * 100}%`);
    });
  };
  const refill = useEffectEvent(fill);
  useEffect(() => refill(), [active]);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const from = target.current ?? shown;
    if (e.key === "Escape") onClose();
    else if (e.key === "ArrowDown" || e.key === "PageDown") go(from + 1);
    else if (e.key === "ArrowUp" || e.key === "PageUp") go(from - 1);
    else return;
    e.preventDefault();
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const parallax = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    e.currentTarget.querySelectorAll<SVGElement>("[data-depth]").forEach((l) => {
      const d = (Number(l.dataset.depth) || 0) * PARALLAX_PX;
      l.style.transform = `translate(${-x * d}px, ${-y * d * 0.5}px)`;
    });
  };
  const settle = (e: React.MouseEvent<HTMLDivElement>) =>
    e.currentTarget.querySelectorAll<SVGElement>("[data-depth]").forEach((l) => (l.style.transform = ""));

  return (
    // The night fade sits on a wrapper: Chrome can leave a scroller's own background-color transition unpainted.
    <div className={`fixed inset-0 z-50 transition-colors duration-[800ms] ${night ? "bg-[#21160f]" : "bg-paper"}`}>
      <div ref={root} data-journey onScroll={fill} onScrollEnd={() => (target.current = null)} className="h-full overflow-y-auto">
        <header
          className={`sticky top-0 z-20 grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-8 backdrop-blur-[14px] transition-colors duration-[800ms] ${
            night ? "j-dark bg-[#21160f]/85" : "bg-paper/90"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="flex max-w-full min-w-0 items-center gap-2 justify-self-start rounded-xl px-2.5 py-2 text-[0.9rem] hover:bg-muted/12"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden className="shrink-0">
              <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <b className="font-semibold">Recipe</b>
            <span className="truncate text-muted">· {j.coffeeName}</span>
          </button>
          <nav aria-label="Journey stages" className="flex gap-1">
            {j.stages.map((id, i) => (
              <button
                key={id}
                type="button"
                ref={(el) => {
                  navs.current[i] = el;
                }}
                aria-current={i === shown ? "step" : undefined}
                onClick={() => go(i)}
                className={`flex w-[3.6rem] flex-col items-stretch gap-[0.4rem] pt-1.5 text-[0.64rem] font-semibold tracking-[0.02em] xl:w-[4.1rem] ${
                  i === shown ? "text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <i aria-hidden className="relative block h-[3px] overflow-hidden rounded-full bg-muted/25">
                  <i className="absolute inset-y-0 left-0 block w-[var(--p,0%)] bg-cascara" />
                </i>
                {STAGE_LABELS[id]}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2.5 justify-self-end text-[0.72rem] whitespace-nowrap text-muted">
            <span className="hidden items-center gap-1 xl:flex">
              <Key>↑</Key>
              <Key>↓</Key> to move · <Key>Esc</Key>
            </span>
            <CloseButton onClick={onClose} className="size-[2.2rem] bg-muted/14 text-[0.9rem]" />
          </div>
        </header>

        <main className="mx-auto grid max-w-[105rem] grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-[clamp(2.2rem,5vw,5.3rem)] px-[clamp(1.3rem,3vw,2.7rem)]">
          <div className="sticky top-16 flex h-[calc(100dvh-4rem)] items-center">
            <div
              data-stage-card
              onMouseMove={parallax}
              onMouseLeave={settle}
              className={`relative mx-auto aspect-[6/5] w-full max-w-[calc((100dvh-120px)*1.2)] overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-40px_rgba(42,28,21,0.45)] transition-colors duration-[800ms] ${night ? "bg-[#2a1c15]" : "bg-surface"}`}
            >
              {j.stages.map((id, i) => (
                <div
                  key={id}
                  data-art-frame
                  className={`j-stage j-frame absolute inset-0 ${i === shown ? "is-on" : ""} ${reduced || playing[i] ? "is-active" : ""}`}
                >
                  <StageArt j={j} id={id} active={reduced || !!playing[i]} run={runs[i] ?? 0} />
                </div>
              ))}
            </div>
          </div>
          <div className={night ? "j-dark" : ""}>
            {j.stages.map((id, i) => (
              <section
                key={id}
                data-stage-index={i}
                aria-labelledby={headingId(id)}
                className={`j-stage flex flex-col items-start justify-center ${i === 0 ? "min-h-[calc(100dvh-4rem)]" : "min-h-dvh"} ${
                  reduced || i === shown ? "is-active" : ""
                }`}
              >
                <StageCopy j={j} id={id} onBack={onClose} />
              </section>
            ))}
            <div className="h-[24dvh]" />
          </div>
        </main>
      </div>
    </div>
  );
}
