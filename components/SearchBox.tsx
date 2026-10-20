"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = ["Onyx Geometry", "Kenya AA washed, light roast", "Brazil natural, dark roast", "Colombia sugarcane decaf"];

export function SearchBox({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initial);
  const trimmed = query.trim();

  const go = (q: string) => {
    if (q.trim().length >= 2) router.push(`/bean?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          go(query);
        }}
        className="flex items-center gap-2 rounded-2xl border border-line bg-surface p-2 pl-4 focus-within:border-cascara/70"
      >
        <label htmlFor="bean-search" className="sr-only">
          Coffee to look up
        </label>
        <input
          id="bean-search"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="words"
          maxLength={120}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Roaster and coffee"
          className="min-h-12 w-full min-w-0 bg-transparent text-lg text-milk placeholder:text-muted/70 focus:outline-none"
        />
        <button
          type="submit"
          disabled={trimmed.length < 2}
          className="min-h-12 shrink-0 rounded-xl bg-cascara px-5 text-base font-semibold text-ristretto transition-opacity disabled:opacity-40"
        >
          Dial in
        </button>
      </form>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 no-scrollbar" aria-label="Examples">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => go(ex)}
            className="min-h-10 shrink-0 rounded-full border border-line px-4 text-sm text-muted transition-colors hover:border-muted hover:text-milk"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
