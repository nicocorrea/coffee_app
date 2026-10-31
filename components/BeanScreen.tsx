"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getAccessCode, getCachedResult, requestBrew, type BrewOutcome } from "@/lib/api";
import { favKey, useFavourites } from "@/lib/favourites";
import { touchLookup } from "@/lib/history";
import type { BrewResult } from "@/lib/schema";
import { AccessGate, ErrorState, LoadingStages, NotIdentified } from "./BrewStates";
import { BrewView } from "./BrewView";

type Failure = Extract<BrewOutcome, { ok: false }>;
type State = { kind: "loading" } | { kind: "done"; result: BrewResult } | ({ kind: "error" } & Failure);

const ERROR_TITLE: Record<string, string> = {
  offline: "You’re offline",
  refused: "This one couldn’t be researched",
  not_configured: "Crema isn’t set up yet",
  bad_query: "Check your search",
};

export function BeanScreen() {
  const params = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const saved = params.get("saved");
  const [attempt, setAttempt] = useState(0);
  // The query the user asked to research again, skipping what's stored on the device.
  const [freshFor, setFreshFor] = useState<string | null>(null);

  if (saved) return <SavedBean id={saved} />;
  if (!query) {
    return <ErrorState title="Search for a coffee" message="Type a roaster and coffee name, or an origin and process." />;
  }
  return (
    <Lookup
      key={`${query}#${attempt}`}
      query={query}
      fresh={freshFor === query}
      onRetry={() => setAttempt((a) => a + 1)}
      onRefresh={() => {
        setFreshFor(query);
        setAttempt((a) => a + 1);
      }}
    />
  );
}

function SavedBean({ id }: { id: string }) {
  const result = useFavourites().find((r) => favKey(r) === id);
  if (!result) {
    return <ErrorState title="Not saved on this device" message="This coffee isn’t in your saved list any more. Search for it again." />;
  }
  return <BrewView result={result} journeyHref={`/journey?saved=${encodeURIComponent(favKey(result))}`} />;
}

type LookupProps = { query: string; fresh: boolean; onRetry: () => void; onRefresh: () => void };

function Lookup({ query, fresh, onRetry, onRefresh }: LookupProps) {
  const [state, setState] = useState<State>(() => {
    const cached = fresh ? null : getCachedResult(query);
    return cached ? { kind: "done", result: cached } : { kind: "loading" };
  });
  const [hadCode] = useState(() => getAccessCode() !== "");
  // Next keeps this page alive but hidden while another route shows (the journey, Saved…), and its
  // effects run again each time it is shown. Refs survive that, so the paid research runs once.
  const settled = useRef(false);
  const pending = useRef<Promise<BrewOutcome> | null>(null);

  useEffect(() => {
    if (settled.current) return;
    if (state.kind === "done") {
      settled.current = true;
      touchLookup(query, state.result); // move it to the top of Recent, keeping what's stored
      return;
    }
    // Not aborted when hidden: the research is paid for either way, and its result is kept on the device.
    pending.current ??= requestBrew(query);
    let shown = true;
    pending.current.then((o) => {
      if (!shown) return;
      settled.current = true;
      setState(o.ok ? { kind: "done", result: o.result } : { kind: "error", ...o });
    });
    return () => {
      shown = false;
    };
  }, [query, state]);

  if (state.kind === "loading") return <LoadingStages query={query} />;
  if (state.kind === "error") {
    if (state.status === 401) return <AccessGate wrong={hadCode} onSubmit={onRetry} />;
    return (
      <ErrorState
        title={ERROR_TITLE[state.code] ?? "The research didn’t finish"}
        message={state.message}
        onRetry={state.code === "not_configured" || state.code === "bad_query" ? undefined : onRetry}
      />
    );
  }
  if (!state.result.identified) return <NotIdentified query={query} reason={state.result.reason} />;
  return <BrewView result={state.result} onRefresh={onRefresh} journeyHref={`/journey?q=${encodeURIComponent(query)}`} />;
}
