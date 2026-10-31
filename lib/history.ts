"use client";

import { favKey } from "./favourites";
import type { BrewResult } from "./schema";
import { createListStore } from "./store";

/** One researched coffee and every search that led to it. */
export interface PastLookup {
  result: BrewResult;
  queries: string[];
}

export const MAX_LOOKUPS = 20;

const store = createListStore<PastLookup>("crema:lookups");

export const normalizeQuery = (q: string) => q.trim().replace(/\s+/g, " ").toLowerCase();

export function findLookup(query: string): BrewResult | null {
  const q = normalizeQuery(query);
  return store.get().find((l) => l.queries.includes(q))?.result ?? null;
}

/**
 * Keep a researched coffee on this device, newest first, so searching for it again
 * (or opening it from Recent) costs nothing. One entry per bean; the oldest drop off.
 */
export function rememberLookup(query: string, result: BrewResult) {
  if (!result.identified) return;
  const q = normalizeQuery(query);
  const key = favKey(result);
  const list = store.get();
  const prev = list.find((l) => favKey(l.result) === key);
  const queries = [q, ...(prev?.queries.filter((x) => x !== q) ?? [])];
  let next = [{ result, queries }, ...list.filter((l) => l !== prev)].slice(0, MAX_LOOKUPS);
  // If the browser is out of space, keep the newest half until it fits.
  while (!store.set(next) && next.length > 1) next = next.slice(0, Math.ceil(next.length / 2));
}

export const getLookups = store.get;

/** Swap a stored lookup for an updated copy of the same bean in place (order and searches kept). No-op if absent. */
export function replaceLookup(result: BrewResult) {
  const key = favKey(result);
  const list = store.get();
  if (list.some((l) => favKey(l.result) === key)) {
    store.set(list.map((l) => (favKey(l.result) === key ? { ...l, result } : l)));
  }
}

/** Past lookups, newest first. Empty during server render. */
export const useLookups = store.use;
