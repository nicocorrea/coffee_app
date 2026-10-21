"use client";

import { getFavourites, refreshFavourite } from "./favourites";
import { findLookup, normalizeQuery, rememberLookup } from "./history";
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
