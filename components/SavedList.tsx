"use client";

import Link from "next/link";
import { favKey, useFavourites } from "@/lib/favourites";
import type { BrewResult } from "@/lib/schema";
import { RoastDot } from "./RoastSwatch";

/** One coffee in a list: name, where it's from, and the numbers you set on the machine. */
export function CoffeeRow({ result: r, href }: { result: BrewResult; href: string }) {
  return (
    <Link href={href} className="flex min-h-20 items-center gap-4 py-4">
      <RoastDot roast={r.bean.roastLevel} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-medium">{r.bean.name}</span>
        <span className="block truncate text-sm text-muted">
          {[r.bean.roaster, r.bean.origin, r.bean.process].filter(Boolean).join(", ")}
        </span>
      </span>
      <span className="numerals shrink-0 text-right text-sm text-muted">
        <span className="block text-base text-ink">{r.recipe.tempC} °C</span>
        {r.recipe.doseG}→{r.recipe.yieldG} g
      </span>
    </Link>
  );
}

/** Saved coffees as a horizontal strip (home) or a full list (Saved tab). */
export function SavedList({ variant }: { variant: "strip" | "list" }) {
  const favourites = useFavourites();

  if (favourites.length === 0) {
    return variant === "list" ? (
      <div className="rounded-2xl border border-dashed border-line p-6 text-muted">
        <p className="text-ink">No saved coffees yet.</p>
        <p className="mt-1">Look up a bag and tap Save to keep its recipe here. Saved recipes open instantly, even offline.</p>
        <Link href="/" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-surface-2 px-4 font-medium text-ink">
          Search coffees
        </Link>
      </div>
    ) : null;
  }

  if (variant === "strip") {
    return (
      <section aria-labelledby="saved-heading" className="mt-12 lg:mt-0">
        <h2 id="saved-heading" className="text-lg font-semibold">
          Your coffees
        </h2>
        <ul className="-mx-5 mt-3 flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          {favourites.map((r) => (
            <li key={favKey(r)} className="w-40 shrink-0 lg:w-auto">
              <Link
                href={`/bean?saved=${encodeURIComponent(favKey(r))}`}
                className="flex h-full flex-col gap-3 rounded-2xl bg-surface p-4 transition-colors hover:bg-surface-2"
              >
                <RoastDot roast={r.bean.roastLevel} className="size-8" />
                <span className="line-clamp-2 font-medium leading-snug">{r.bean.name}</span>
                <span className="numerals mt-auto text-sm text-muted">
                  {r.recipe.doseG} g in, {r.recipe.yieldG} g out
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {favourites.map((r) => (
        <li key={favKey(r)}>
          <CoffeeRow result={r} href={`/bean?saved=${encodeURIComponent(favKey(r))}`} />
        </li>
      ))}
    </ul>
  );
}
