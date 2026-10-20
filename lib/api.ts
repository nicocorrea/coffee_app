"use client";

import type { BrewResult } from "./schema";

const ACCESS_KEY = "crema:access";
const resultKey = (q: string) => `crema:result:${q.trim().toLowerCase()}`;

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

/** Results from this session, so going back and forth doesn't re-run the research. */
export function getCachedResult(query: string): BrewResult | null {
  try {
    const raw = sessionStorage.getItem(resultKey(query));
    return raw ? (JSON.parse(raw) as BrewResult) : null;
  } catch {
    return null;
  }
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
  try {
    sessionStorage.setItem(resultKey(query), JSON.stringify(body));
  } catch {}
  return { ok: true, result: body as BrewResult };
}
