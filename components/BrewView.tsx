"use client";

import Link from "next/link";
import { useState } from "react";
import { clampPreinfusion, type BrewResult } from "@/lib/schema";
import { JourneyCard } from "./journey/JourneyCard";
import { useJourneyEnrichment } from "@/lib/journey/enrich";
import { favKey, toggleFavourite, useFavourites } from "@/lib/favourites";
import { useStoredCopy } from "@/lib/history";
import { safeSources } from "@/lib/sources";
import { BeanName } from "./BeanName";
import { DrinkPicker } from "./DrinkPicker";
import { FlavourRows } from "./FlavourExplainer";
import { FlavourRadar } from "./FlavourRadar";
import { RoastRamp } from "./RoastSwatch";
import { SearchBox } from "./SearchBox";
import { ShotTimeline } from "./ShotTimeline";
import { TastingNotes } from "./TastingNotes";

function Section({ id, title, className = "", children }: { id: string; title: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className={`mt-14 ${className}`}>
      <h2 id={id} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

const GRIND_LABEL = (g: BrewResult["recipe"]["grind"]) =>
  g.direction === "same" || g.steps === 0
    ? "Your usual setting"
    : `${g.steps} step${g.steps === 1 ? "" : "s"} ${g.direction}`;

const lookedUp = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** `onRefresh` offers to research the coffee again instead of using what's stored on the device. */
export function BrewView({
  result: shown,
  onRefresh,
  journeyHref,
}: {
  result: BrewResult;
  onRefresh?: () => void;
  journeyHref?: string;
}) {
  // Background research lands on the device's copy, not on the one this screen first read: show
  // (and research from) the stored copy, so arrived facts are kept and never fetched twice.
  const result = useStoredCopy(shown);
  useJourneyEnrichment(result);
  const journeyLink = journeyHref ?? `/journey?q=${encodeURIComponent(result.query)}`;
  const saved = useFavourites().some((r) => favKey(r) === favKey(result));
  const [stamps, setStamps] = useState(0); // bumps on each save so the bookmark stamps once
  const { bean, flavour, tips } = result;
  // Lookups saved before the Meraki's pre-infusion limits were corrected can hold settings it doesn't offer.
  const recipe = { ...result.recipe, preinfusion: clampPreinfusion(result.recipe.preinfusion) };
  const facts = [
    ["Origin", bean.origin],
    ["Region", bean.region],
    ["Process", bean.process],
    ["Variety", bean.variety],
    ["Altitude", bean.altitude],
  ].filter((f): f is [string, string] => Boolean(f[1]));
  const sources = safeSources(result.sources);

  return (
    <article>
      <div className="sticky top-0 z-30 -mx-5 flex items-center justify-between bg-paper/95 px-3 py-2 backdrop-blur-xl lg:-mx-12 lg:px-10 lg:py-3">
        <Link href="/" className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-muted hover:text-ink">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Search
        </Link>
        <button
          type="button"
          onClick={() => {
            if (toggleFavourite(result)) setStamps((n) => n + 1);
          }}
          aria-pressed={saved}
          className={`flex min-h-11 items-center gap-2 rounded-xl px-4 font-medium transition-colors ${
            saved ? "bg-cascara text-paper" : "bg-surface-2 text-ink"
          }`}
        >
          <svg
            key={stamps}
            viewBox="0 0 24 24"
            className={`size-5 ${saved && stamps > 0 ? "animate-stamp" : ""}`}
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden
          >
            <path d="M7 4h10v16l-5-3.5L7 20V4Z" strokeLinejoin="round" />
          </svg>
          {saved ? "Saved" : "Save"}
        </button>
      </div>

      <header className="mt-4 lg:mt-6 lg:max-w-4xl">
        <div className="lg:max-w-sm">
          <RoastRamp roast={bean.roastLevel} />
        </div>
        <h1 className="condensed mt-7 text-[2.75rem] leading-[0.98] font-bold tracking-tight text-balance lg:text-[4.75rem] lg:leading-[0.92]">
          <BeanName result={result} className="inline-block" />
        </h1>
        <p className="mt-2 text-lg lg:mt-4 lg:text-xl">
          {bean.roaster && <span className="text-cascara">{bean.roaster}, </span>}
          <span className="text-muted">
            {bean.origin}, {bean.process.toLowerCase()}
          </span>
        </p>
      </header>

      {/* Desktop: the recipe stays in view on the left while you read the rest; on short windows it scrolls on its own. */}
      <div className="lg:mt-12 lg:grid lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-14 xl:gap-20">
        <section
          aria-labelledby="recipe"
          className="-mx-5 mt-8 bg-surface px-5 pt-7 pb-8 lg:mx-0 lg:mt-0 lg:rounded-3xl lg:px-7 lg:pt-6 lg:pb-7 tall:sticky tall:top-20 tall:max-h-[calc(100dvh-6rem)] tall:overflow-y-auto tall:overscroll-contain"
        >
          <h2 id="recipe" className="text-lg font-medium text-muted">
            Your Meraki Gen 2 recipe
          </h2>
          <p className="numerals mt-4 flex items-baseline gap-3 font-bold leading-none">
            <span className="text-[4.5rem]">{recipe.doseG}</span>
            <span className="text-2xl text-muted">g in</span>
          </p>
          <p className="numerals mt-1 flex items-baseline gap-3 font-bold leading-none">
            <span className="text-[4.5rem] text-cascara">{recipe.yieldG}</span>
            <span className="text-2xl text-muted">g out</span>
            <span className="ml-auto text-2xl font-medium text-ink">
              1:{Number((recipe.yieldG / recipe.doseG).toFixed(1))}
            </span>
          </p>

          <ShotTimeline recipe={recipe} />

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line">
            {[
              ["Brew temperature", `${recipe.tempC} °C`],
              ["Shot time", `${recipe.timeMin}–${recipe.timeMax} s`],
              ["Pre-infusion", recipe.preinfusion.seconds > 0 ? `${recipe.preinfusion.pressureBar} bar, ${recipe.preinfusion.seconds} s` : "Off"],
              ["Grind", GRIND_LABEL(recipe.grind)],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface-2 p-4">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="numerals mt-1 text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 leading-relaxed text-muted">{recipe.grind.advice}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted/80">
            Grind steps are relative to the setting you use for a medium-roast espresso. Set the dose and yield
            targets on the Meraki and let it stop on weight.
          </p>
        </section>

        <div>
          <Section id="flavour" title="How it tastes" className="lg:mt-0">
            <p className="text-[1.05rem] leading-relaxed">{flavour.character}</p>
            <div className="mt-6">
              <TastingNotes notes={flavour.notes} />
            </div>
            <div className="mt-6">
              <FlavourRadar flavour={flavour} />
            </div>
            <div className="mt-6">
              <FlavourRows flavour={flavour} />
            </div>
          </Section>

          <JourneyCard result={result} href={journeyLink} />

          <Section id="drinks" title="Every drink, dialled in">
            <p className="-mt-2 mb-5 text-muted">
              Built from your base recipe. A ★ marks where this coffee shines.
            </p>
            <DrinkPicker drinks={result.drinks} best={result.bestDrinks} />
          </Section>

          <Section id="about" title="About this coffee">
            <p className="text-[1.05rem] leading-relaxed text-muted">{bean.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-6">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-sm text-muted">{label}</dt>
                  <dd className="mt-0.5 leading-snug">{value}</dd>
                </div>
              ))}
            </dl>
            <Link href={journeyLink} className="mt-6 inline-flex min-h-11 items-center font-medium text-cascara underline decoration-line underline-offset-4 hover:text-ink">
              Discover its journey
            </Link>
          </Section>

          <Section id="dial-in" title="If the shot tastes off">
            <dl className="divide-y divide-line border-y border-line">
              {result.dialIn.map((d) => (
                <div key={d.symptom} className="py-4">
                  <dt className="font-medium">{d.symptom}</dt>
                  <dd className="mt-1 leading-relaxed text-muted">{d.fix}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="tips" title="Before you brew">
            <dl className="space-y-5">
              <div>
                <dt className="font-medium">Rest after roasting</dt>
                <dd className="numerals mt-1 text-muted">
                  Best between {tips.restDays.min} and {tips.restDays.max} days after the roast date.
                </dd>
              </div>
              <div>
                <dt className="font-medium">Water</dt>
                <dd className="mt-1 leading-relaxed text-muted">{tips.water}</dd>
              </div>
              <div>
                <dt className="font-medium">Basket</dt>
                <dd className="mt-1 leading-relaxed text-muted">{tips.basket}</dd>
              </div>
              <div>
                <dt className="font-medium">With milk</dt>
                <dd className="mt-1 leading-relaxed text-muted">{tips.milk}</dd>
              </div>
            </dl>
            {tips.extras.length > 0 && (
              <ul className="mt-5 list-disc space-y-2 pl-5 leading-relaxed text-muted marker:text-cascara">
                {tips.extras.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </Section>

          <footer className="mt-14 border-t border-line pt-6 text-sm leading-relaxed text-muted">
            <p>
              {result.confidence === "high"
                ? "Based on the roaster's published details."
                : result.confidence === "medium"
                  ? "Based on partial roaster details and typical coffees of this type."
                  : "Few details were found, so this recipe follows coffees of the same origin and process."}{" "}
              Treat it as a starting point and taste.
            </p>
            {sources.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-4 hover:text-ink">
                      {s.host}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {result.createdAt && (
              <div className="mt-6 flex items-center justify-between gap-4">
                <p>Looked up {lookedUp(result.createdAt)} and kept on this device.</p>
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="min-h-11 shrink-0 rounded-xl bg-surface-2 px-4 font-medium text-ink transition-colors hover:bg-line"
                  >
                    Research again
                  </button>
                )}
              </div>
            )}
            <div className="mt-10">
              <p className="mb-3 text-base text-ink">Not quite the right coffee?</p>
              <SearchBox initial={result.query} />
            </div>
          </footer>
        </div>
      </div>
    </article>
  );
}
