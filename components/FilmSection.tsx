"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./journey/motion";

const POSTER = "/film/poster.jpg";

type SaveDataNavigator = Navigator & { connection?: { saveData?: boolean } };

/**
 * The Crema film on the home page. A silent loop plays while it is on screen; tapping it plays the full
 * narrated film, with sound, controls and captions. The loop stays still on reduced motion or Save-Data.
 */
export function FilmSection() {
  const loop = useRef<HTMLVideoElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const v = loop.current;
    if (!v || started || reduced || (navigator as SaveDataNavigator).connection?.saveData) return;
    v.muted = true; // React sets `muted` as a property only; autoplay policies need it before play().
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { threshold: 0.25 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      v.pause();
    };
  }, [started, reduced]);

  // Once the film is showing, keyboard and screen-reader users land on its controls.
  useEffect(() => {
    if (started) film.current?.focus();
  }, [started]);

  function start() {
    loop.current?.pause();
    // Played inside the tap, so browsers allow sound.
    film.current?.play().catch(() => {});
    setStarted(true);
  }

  return (
    <section aria-labelledby="film-heading" className="mt-14 lg:col-span-2 lg:row-start-2 lg:mt-24">
      <h2 id="film-heading" className="condensed text-[2.25rem] leading-none font-bold tracking-tight lg:text-[3.5rem]">
        From cherry to cup
      </h2>
      <p className="mt-3 max-w-xl leading-relaxed text-muted lg:text-lg">
        Where your coffee grew, how it was processed, and why that changes what you taste. A three-minute film.
      </p>
      <div className="relative mt-6 aspect-video overflow-hidden rounded-2xl bg-roast-dark lg:mt-8 lg:rounded-3xl">
        <video
          ref={loop}
          aria-hidden
          muted
          loop
          playsInline
          preload="none"
          poster={POSTER}
          hidden={started}
          className="absolute inset-0 size-full object-cover"
        >
          <source src="/film/loop.webm" type="video/webm" />
          <source src="/film/loop.mp4" type="video/mp4" />
        </video>
        {!started && (
          <button
            type="button"
            onClick={start}
            className="group absolute inset-0 flex items-end justify-end p-3 focus-visible:outline-offset-[-6px] lg:p-6"
          >
            {/* The loop's own labels sit bottom left, so the button takes the clear bottom-right corner. */}
            <span aria-hidden className="absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-black/40 to-transparent" />
            <span className="relative inline-flex min-h-11 items-center gap-2.5 rounded-full bg-paper py-1.5 pr-4 pl-1.5 text-sm font-medium text-ink shadow-lg shadow-black/25 transition-transform group-hover:scale-[1.03] group-active:scale-[0.98] lg:min-h-12 lg:gap-3 lg:pr-5 lg:text-base">
              <span className="grid size-8 place-items-center rounded-full bg-cascara text-paper lg:size-9">
                <svg viewBox="0 0 16 16" aria-hidden className="ml-0.5 size-3.5 fill-current">
                  <path d="M4 2.5v11a.6.6 0 0 0 .9.5l9-5.5a.6.6 0 0 0 0-1l-9-5.5a.6.6 0 0 0-.9.5Z" />
                </svg>
              </span>
              Watch the film
              <span className="numerals text-muted-strong">3:19</span>
              <span className="sr-only">, with sound</span>
            </span>
          </button>
        )}
        <video
          ref={film}
          controls
          playsInline
          preload="none"
          poster={POSTER}
          hidden={!started}
          aria-label="From cherry to cup, the Crema film"
          className="absolute inset-0 size-full"
        >
          <source src="/film/crema-film.mp4" type="video/mp4" />
          <track kind="captions" src="/film/crema-film.en.vtt" srcLang="en" label="English" />
          <a href="/film/crema-film.mp4">Download the film (MP4, 33 MB)</a>
        </video>
      </div>
    </section>
  );
}
