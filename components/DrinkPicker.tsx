"use client";

import { useState } from "react";
import type { DrinkId, DrinkRecipe } from "@/lib/schema";
import { DrinkCard } from "./DrinkCard";

export function DrinkPicker({ drinks, best = [] }: { drinks: DrinkRecipe[]; best?: DrinkId[] }) {
  const [selected, setSelected] = useState<DrinkId>(best[0] ?? "doppio");
  const drink = drinks.find((d) => d.id === selected) ?? drinks[0];

  return (
    <div>
      <div role="tablist" aria-label="Drinks" className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 pb-1 no-scrollbar lg:mx-0 lg:flex-wrap lg:px-0">
        {drinks.map((d) => {
          const active = d.id === drink.id;
          return (
            <button
              key={d.id}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="drink-panel"
              onClick={() => setSelected(d.id)}
              className={`min-h-11 shrink-0 snap-start rounded-full px-4 text-[0.95rem] font-medium transition-colors ${
                active ? "bg-ink text-paper" : "border border-line text-muted hover:text-ink"
              }`}
            >
              {d.name}
              {best.includes(d.id) && (
                <span className={`ml-1.5 ${active ? "text-cascara" : "text-cascara/90"}`} aria-label="recommended">
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div id="drink-panel" role="tabpanel" aria-label={drink.name} className="mt-6 rounded-2xl bg-surface p-5">
        <DrinkCard drink={drink} />
      </div>
    </div>
  );
}
