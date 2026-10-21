"use client";

import { favKey, useFavourites } from "@/lib/favourites";
import { useLookups } from "@/lib/history";
import { CoffeeRow } from "./SavedList";

/** Coffees researched on this device that aren't saved. Opening one doesn't run a new lookup. */
export function RecentList() {
  const lookups = useLookups();
  const saved = new Set(useFavourites().map(favKey));
  const recent = lookups.filter((l) => !saved.has(favKey(l.result)));
  if (recent.length === 0) return null;

  return (
    <section aria-labelledby="recent-heading" className="mt-12 lg:mt-0">
      <h2 id="recent-heading" className="text-lg font-semibold">
        Recent lookups
      </h2>
      <ul className="mt-1 divide-y divide-line">
        {recent.map(({ result, queries }) => (
          <li key={favKey(result)}>
            <CoffeeRow result={result} href={`/bean?q=${encodeURIComponent(queries[0])}`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
