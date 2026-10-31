"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getCachedResult } from "@/lib/api";
import { findFavourite, useFavourites } from "@/lib/favourites";
import { useLookups } from "@/lib/history";
import { buildJourney, mergeUnvisited } from "@/lib/journey/build";
import { startEnrichment } from "@/lib/journey/enrich";
import type { Journey, StageId } from "@/lib/journey/types";
import type { BrewResult } from "@/lib/schema";
import { DesktopStory } from "./DesktopStory";
import { useIsDesktop } from "./motion";
import { PhoneStory } from "./PhoneStory";
import "./journey.css";

const noop = () => () => {};
/** False during the server render and hydration, so nothing reads the device stores too early. */
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

/** The coffee as stored on this device, live: background research updates arrive through these stores. */
function useStoredCoffee(q: string, saved: string | null): BrewResult | null {
  useLookups();
  useFavourites();
  if (saved) return findFavourite(saved) ?? null;
  return q ? getCachedResult(q) : null;
}

/** /journey?q=… or ?saved=…: the coffee's journey, full screen, from what is already on the device. */
export function JourneyScreen() {
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";
  const saved = params.get("saved");
  // Kept routes are hidden, not unmounted, so a different coffee must start from scratch.
  return <CoffeeJourney key={`${saved ?? ""}|${q}`} q={q} saved={saved} />;
}

function CoffeeJourney({ q, saved }: { q: string; saved: string | null }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const live = useStoredCoffee(q, saved);
  const desktop = useIsDesktop();
  const [visited, setVisited] = useState<ReadonlySet<StageId>>(() => new Set());
  const [shown, setShown] = useState<{ from: BrewResult; journey: Journey } | null>(null);

  // Research still missing (opened straight from a link, or it failed earlier) starts here too. It is
  // shared with the coffee page, so a request already running is joined rather than sent again.
  useEffect(() => {
    if (live) startEnrichment(live);
  }, [live]);

  // A newer copy of the coffee (researched facts arrived) updates only the stages not yet read.
  if (hydrated && live && live !== shown?.from) {
    const next = buildJourney(live);
    setShown({ from: live, journey: shown ? mergeUnvisited(shown.journey, next, visited) : next });
  }

  if (!hydrated) return <div className="fixed inset-0 z-50 bg-paper" />;
  if (!shown) return <NotOnDevice />;

  const close = () => router.push(saved ? `/bean?saved=${encodeURIComponent(saved)}` : `/bean?q=${encodeURIComponent(q)}`);
  const onEnter = (id: StageId) => setVisited((v) => (v.has(id) ? v : new Set(v).add(id)));
  const Story = desktop ? DesktopStory : PhoneStory;
  return <Story j={shown.journey} onClose={close} onEnter={onEnter} />;
}

function NotOnDevice() {
  return (
    <main className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-paper px-6 text-center">
      <h1 className="condensed text-[1.85rem] leading-tight font-bold text-balance">This coffee isn’t on this device</h1>
      <p className="mt-2 text-muted">Search for it again to see its journey.</p>
      <Link href="/" className="mt-6 rounded-2xl bg-cascara px-6 py-3 font-semibold text-white">
        Back to search
      </Link>
    </main>
  );
}
