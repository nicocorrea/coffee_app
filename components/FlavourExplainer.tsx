import { FLAVOUR_DIMENSIONS, TASTING_QUESTIONS, levelOf, scoreOf, type FlavourDimension, type FlavourLevel } from "@/lib/flavour";
import type { BeanProfile } from "@/lib/schema";

const LEVELS: FlavourLevel[] = ["low", "mid", "high"];

function Pips({ score }: { score: number }) {
  return (
    <span className="flex gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`h-1.5 w-4 rounded-full ${n <= score ? "bg-cascara" : "bg-line"}`} />
      ))}
    </span>
  );
}

/** What a quality is, its low-to-high scale in food terms, and what it means when it tastes wrong. */
function DimensionDetail({ dimension, current }: { dimension: FlavourDimension; current?: FlavourLevel }) {
  return (
    <div className="space-y-4 leading-relaxed">
      <p>{dimension.what}</p>
      <dl className="space-y-2">
        {LEVELS.map((level) => (
          <div
            key={level}
            className={`rounded-xl px-3 py-2 ${level === current ? "bg-surface-2" : ""}`}
            aria-current={level === current ? "true" : undefined}
          >
            <dt className="text-sm font-medium">
              {dimension.levels[level].label}
              {level === current && <span className="text-cascara"> (this coffee)</span>}
            </dt>
            <dd className="text-muted">{dimension.levels[level].example}</dd>
          </div>
        ))}
      </dl>
      {dimension.fault && <p className="rounded-xl border-l-2 border-cascara bg-surface px-3 py-2">{dimension.fault}</p>}
    </div>
  );
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** One row per quality with this coffee's score; tap a row for the full explanation. */
export function FlavourRows({ flavour }: { flavour: BeanProfile["flavour"] }) {
  return (
    <div>
      <p className="text-sm text-muted">Tap a quality to see what it means.</p>
      <div className="mt-2 divide-y divide-line border-y border-line">
        {FLAVOUR_DIMENSIONS.map((d) => {
          const score = scoreOf(flavour, d.key);
          const level = score === null ? undefined : levelOf(score);
          return (
            <details key={d.key} className="group">
              <summary className="flex cursor-pointer list-none gap-3 py-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-3">
                    <span className="w-24 font-medium">{d.label}</span>
                    <Pips score={score ?? 0} />
                    <span className="numerals ml-auto text-sm text-muted">
                      {level ? `${d.levels[level].label}, ${score}/5` : "–"}
                    </span>
                  </span>
                  <span className="mt-1 block text-[0.95rem] leading-relaxed text-muted">
                    {level ? d.levels[level].example : "Not rated for this saved coffee. Search for it again to get a score."}
                  </span>
                </span>
                <Chevron />
              </summary>
              <div className="pb-5">
                <DimensionDetail dimension={d} current={level} />
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}

/** The full reference for the Guide tab. */
export function FlavourReference() {
  return (
    <>
      <div className="space-y-3">
        {FLAVOUR_DIMENSIONS.map((d) => (
          <details key={d.key} className="group rounded-2xl bg-surface open:pb-5">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
              {d.label}
              <Chevron />
            </summary>
            <div className="px-5">
              <DimensionDetail dimension={d} />
            </div>
          </details>
        ))}
      </div>
      <div className="mt-10 lg:mt-0">
        <h3 className="text-xl font-semibold">Taste it in six questions</h3>
        <p className="mt-2 text-muted">Take a sip and ask these in order. After a couple of weeks you’ll do it without thinking.</p>
        <ol className="mt-4 space-y-3">
          {TASTING_QUESTIONS.map((q, i) => (
            <li key={q.answers} className="flex gap-4">
              <span className="numerals flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 font-semibold">
                {i + 1}
              </span>
              <span className="pt-1">
                {q.question}{" "}
                <span className="text-muted">That’s {FLAVOUR_DIMENSIONS.find((d) => d.key === q.answers)!.label.toLowerCase()}.</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
