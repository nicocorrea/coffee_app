"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getAccessCode, getCachedResult, requestBrew, type BrewOutcome } from "@/lib/api";
import { favKey, useFavourites } from "@/lib/favourites";
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

  if (saved) return <SavedBean id={saved} />;
  if (!query) {
    return <ErrorState title="Search for a coffee" message="Type a roaster and coffee name, or an origin and process." />;
  }
  return <Lookup key={`${query}#${attempt}`} query={query} onRetry={() => setAttempt((a) => a + 1)} />;
}

function SavedBean({ id }: { id: string }) {
  const result = useFavourites().find((r) => favKey(r) === id);
  if (!result) {
    return <ErrorState title="Not saved on this device" message="This coffee isn’t in your saved list any more. Search for it again." />;
  }
  return <BrewView result={result} />;
}

function Lookup({ query, onRetry }: { query: string; onRetry: () => void }) {
  const [cached] = useState(() => getCachedResult(query));
  const [state, setState] = useState<State>(cached ? { kind: "done", result: cached } : { kind: "loading" });
  const [hadCode] = useState(() => getAccessCode() !== "");

  useEffect(() => {
    if (cached) return;
    const controller = new AbortController();
    requestBrew(query, controller.signal)
      .then((o) => setState(o.ok ? { kind: "done", result: o.result } : { kind: "error", ...o }))
      .catch(() => {});
    return () => controller.abort();
  }, [query, cached]);

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
  return <BrewView result={state.result} />;
}
