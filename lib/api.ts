"use client";

import { getFavourites, refreshFavourite } from "./favourites";
import { findLookup, normalizeQuery, rememberLookup } from "./history";
import type { JourneyFacts } from "./journey/facts";
import type { JourneyInput } from "./journey/research";
import type { BrewResult } from "./schema";

const ACCESS_KEY = "crema:access";

export type BrewOutcome =
  | { ok: true; result: BrewResult }
  | { ok: false; status: number; code: string; message: string };

export function getAccessCode(): string {
  try {
    return localStorage.getItem(ACCESS_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setAccessCode(code: string) {
  try {
    localStorage.setItem(ACCESS_KEY, code);
  } catch {}
}

/** A coffee already researched on this device for this search, so it doesn't cost another lookup. */
export function getCachedResult(query: string): BrewResult | null {
  const q = normalizeQuery(query);
  return findLookup(q) ?? getFavourites().find((r) => normalizeQuery(r.query) === q) ?? null;
}

export async function requestBrew(query: string, signal?: AbortSignal): Promise<BrewOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/brew", {
      method: "POST",
      headers: { "content-type": "application/json", "x-access-code": getAccessCode() },
      body: JSON.stringify({ query }),
      signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    return { ok: false, status: 0, code: "offline", message: "You're offline. Check your connection and try again." };
  }

  const body = await res.json().catch(() => null);
  if (!res.ok || !body) {
    return {
      ok: false,
      status: res.status,
      code: body?.code ?? "upstream",
      message: body?.message ?? "Something went wrong. Try again.",
    };
  }
  const result = body as BrewResult;
  if (result.identified) {
    rememberLookup(query, result);
    refreshFavourite(result);
  }
  return { ok: true, result };
}

const brewing = new Map<string, Promise<BrewOutcome>>();

/** requestBrew, but a search already being researched in this tab is joined instead of paid for again. */
export function requestBrewOnce(query: string): Promise<BrewOutcome> {
  const q = normalizeQuery(query);
  let pending = brewing.get(q);
  if (!pending) {
    pending = requestBrew(query).finally(() => brewing.delete(q));
    brewing.set(q, pending);
  }
  return pending;
}

/** Background research on one lot. Null on any failure: the journey just stays on what the profile says. */
export async function requestJourney(result: BrewResult, signal?: AbortSignal): Promise<JourneyFacts | null> {
  const { bean } = result;
  const input: JourneyInput = {
    name: bean.name,
    roaster: bean.roaster,
    origin: bean.origin,
    region: bean.region,
    process: bean.process,
    variety: bean.variety,
    altitude: bean.altitude,
    sources: result.sources.slice(0, 20),
  };
  try {
    const res = await fetch("/api/journey", {
      method: "POST",
      headers: { "content-type": "application/json", "x-access-code": getAccessCode() },
      body: JSON.stringify({ input }),
      signal,
    });
    if (!res.ok) return null;
    const body = await res.json().catch(() => null);
    return body && typeof body === "object" && body.facts ? (body.facts as JourneyFacts) : null;
  } catch {
    return null;
  }
}
