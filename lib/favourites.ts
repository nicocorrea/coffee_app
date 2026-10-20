"use client";

import { useSyncExternalStore } from "react";
import type { BrewResult } from "./schema";

const KEY = "crema:favourites";
const EVENT = "crema:favourites";
const EMPTY: BrewResult[] = [];

let cachedRaw: string | null = null;
let cached: BrewResult[] = EMPTY;

export const favKey = (r: Pick<BrewResult, "bean">) =>
  `${r.bean.roaster ?? ""}|${r.bean.name}`.trim().toLowerCase();

export function getFavourites(): BrewResult[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    cached = raw ? (JSON.parse(raw) as BrewResult[]) : EMPTY;
  } catch {
    cached = EMPTY;
  }
  return cached;
}

function write(list: BrewResult[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

export function toggleFavourite(result: BrewResult): boolean {
  const key = favKey(result);
  const list = getFavourites();
  const exists = list.some((r) => favKey(r) === key);
  write(exists ? list.filter((r) => favKey(r) !== key) : [result, ...list]);
  return !exists;
}

export const findFavourite = (key: string) => getFavourites().find((r) => favKey(r) === key);

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Favourites, newest first. Empty during server render. */
export const useFavourites = () => useSyncExternalStore(subscribe, getFavourites, () => EMPTY);
