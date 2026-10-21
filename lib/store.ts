"use client";

import { useSyncExternalStore } from "react";

/** A JSON list in localStorage that React components can subscribe to. */
export function createListStore<T>(key: string) {
  const EMPTY: T[] = [];
  let cachedRaw: string | null = null;
  let cached: T[] = EMPTY;

  function get(): T[] {
    try {
      const raw = localStorage.getItem(key);
      if (raw === cachedRaw) return cached;
      cachedRaw = raw;
      cached = raw ? (JSON.parse(raw) as T[]) : EMPTY;
    } catch {
      cached = EMPTY;
    }
    return cached;
  }

  /** Returns false when the browser refused the write (private mode, quota). */
  function set(list: T[]): boolean {
    let ok = true;
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch {
      ok = false;
    }
    window.dispatchEvent(new Event(key));
    return ok;
  }

  function subscribe(onChange: () => void) {
    window.addEventListener(key, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(key, onChange);
      window.removeEventListener("storage", onChange);
    };
  }

  /** The list, live. Empty during server render. */
  const use = () => useSyncExternalStore(subscribe, get, () => EMPTY);

  return { get, set, use };
}
