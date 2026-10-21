"use client";

import type { BrewResult } from "./schema";
import { createListStore } from "./store";

const store = createListStore<BrewResult>("crema:favourites");

export const favKey = (r: Pick<BrewResult, "bean">) =>
  `${r.bean.roaster ?? ""}|${r.bean.name}`.trim().toLowerCase();

export const getFavourites = store.get;

export function toggleFavourite(result: BrewResult): boolean {
  const key = favKey(result);
  const list = getFavourites();
  const exists = list.some((r) => favKey(r) === key);
  store.set(exists ? list.filter((r) => favKey(r) !== key) : [result, ...list]);
  return !exists;
}

/** Swap a saved coffee for a fresher lookup of the same bean, keeping its place in the list. */
export function refreshFavourite(result: BrewResult) {
  const key = favKey(result);
  const list = getFavourites();
  if (list.some((r) => favKey(r) === key)) store.set(list.map((r) => (favKey(r) === key ? result : r)));
}

export const findFavourite = (key: string) => getFavourites().find((r) => favKey(r) === key);

/** Favourites, newest first. Empty during server render. */
export const useFavourites = store.use;
