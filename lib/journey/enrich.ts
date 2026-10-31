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

// Lookups being researched (or already researched) in this tab, by bean and lookup. Module-level, so
// a screen being hidden or unmounted (Next keeps /bean alive, hidden, while the journey is open) never
// cancels the request or starts it again: the facts land in the store whichever screen is showing.
const researching = new Set<string>();

/** Research the lot in the background, once per lookup; nothing is shown if it fails. */
export function startEnrichment(result: BrewResult): void {
  if (!shouldEnrich(result)) return;
  const id = `${favKey(result)}|${result.createdAt}`;
  if (researching.has(id)) return;
  researching.add(id);
  void requestJourney(result).then((facts) => {
    if (facts) attachJourney(result, facts);
    else researching.delete(id); // failed: try again the next time the coffee is opened
  });
}

/** Start the background research for the coffee on screen. Pass the stored copy, so arrived facts stop it. */
export function useJourneyEnrichment(result: BrewResult) {
  useEffect(() => startEnrichment(result), [result]);
}
