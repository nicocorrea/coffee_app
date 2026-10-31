"use client";

import { useEffect } from "react";
import { requestJourney } from "@/lib/api";
import { favKey, getFavourites, refreshFavourite } from "@/lib/favourites";
import { getLookups, replaceLookup } from "@/lib/history";
import type { BrewResult } from "@/lib/schema";
import { shouldEnrich } from "./build";
import type { JourneyFacts } from "./facts";

/**
 * Store researched facts on the coffee, but only where the stored copy is still the one that was
 * researched: a newer "Research again" result isn't overwritten and a removed coffee isn't brought back.
 */
export function attachJourney(result: BrewResult, facts: JourneyFacts, now: Date = new Date()): BrewResult {
  const enriched: BrewResult = { ...result, journey: { facts, createdAt: now.toISOString() } };
  const key = favKey(result);
  const same = (r: BrewResult) => favKey(r) === key && r.createdAt === result.createdAt;
  if (getLookups().some((l) => same(l.result))) replaceLookup(enriched);
  if (getFavourites().some(same)) refreshFavourite(enriched);
  return enriched;
}

/** Research the lot once per mounted result, quietly; nothing is shown if it fails. */
export function useJourneyEnrichment(result: BrewResult) {
  const eligible = shouldEnrich(result);
  useEffect(() => {
    if (!eligible) return;
    const controller = new AbortController();
    requestJourney(result, controller.signal).then((facts) => {
      if (facts && !controller.signal.aborted) attachJourney(result, facts);
    });
    return () => controller.abort();
    // Once per coffee and lookup, not on every re-render of the same result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligible, favKey(result), result.createdAt]);
}
