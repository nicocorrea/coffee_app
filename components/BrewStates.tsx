"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setAccessCode } from "@/lib/api";
import { SearchBox } from "./SearchBox";

const STAGES = [
  "Finding the roaster",
  "Reading the tasting notes",
  "Checking origin and process",
  "Dialling in your Meraki",
  "Working out every drink",
];

export function LoadingStages({ query }: { query: string }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[70dvh] flex-col justify-center" role="status" aria-live="polite">
      <div className="relative mx-auto h-36 w-28" aria-hidden>
        {/* A cup filling, the one piece of ambient motion in the app. */}
        <div className="absolute inset-x-0 bottom-0 h-28 overflow-hidden rounded-b-[2.5rem] rounded-t-md border-2 border-milk/80">
          <div className="absolute inset-0 origin-bottom animate-pour bg-gradient-to-t from-roast-dark via-roast-medium to-[#d9b48c]" />
        </div>
        <div className="absolute -right-5 bottom-10 h-10 w-6 rounded-r-full border-2 border-l-0 border-milk/80" />
        <div className="absolute left-1/2 top-0 h-8 w-1 -translate-x-1/2 animate-pulse rounded-full bg-roast-medium" />
      </div>
      <p className="mt-10 text-center text-muted">Looking up</p>
      <p className="mt-1 text-center text-2xl font-semibold text-balance">{query}</p>
      <ol className="mx-auto mt-8 space-y-2 text-[0.95rem]">
        {STAGES.map((s, i) => (
          <li key={s} className={`flex items-center gap-3 transition-colors ${i < stage ? "text-muted" : i === stage ? "text-milk" : "text-muted/40"}`}>
            <span className={`size-2 rounded-full ${i < stage ? "bg-sage" : i === stage ? "animate-pulse bg-cascara" : "bg-line"}`} />
            {s}
          </li>
        ))}
      </ol>
      <p className="mt-8 text-center text-sm text-muted">Live research usually takes 20–40 seconds.</p>
    </div>
  );
}

export function AccessGate({ onSubmit, wrong }: { onSubmit: () => void; wrong: boolean }) {
  const [code, setCode] = useState("");
  return (
    <form
      className="flex min-h-[60dvh] flex-col justify-center"
      onSubmit={(e) => {
        e.preventDefault();
        setAccessCode(code.trim());
        onSubmit();
      }}
    >
      <h1 className="condensed text-4xl font-bold">Enter your access code</h1>
      <p className="mt-3 leading-relaxed text-muted">
        This app is private. Enter the code set as APP_ACCESS_CODE on the server. You only need to do this once on
        this device.
      </p>
      <label htmlFor="access" className="mt-8 text-sm text-muted">
        Access code
      </label>
      <input
        id="access"
        type="password"
        autoComplete="current-password"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="mt-2 min-h-12 rounded-xl border border-line bg-surface px-4 text-lg focus:border-cascara/70 focus:outline-none"
      />
      {wrong && <p className="mt-3 text-cascara">That code didn’t match. Check it and try again.</p>}
      <button type="submit" disabled={!code.trim()} className="mt-6 min-h-12 rounded-xl bg-cascara font-semibold text-ristretto disabled:opacity-40">
        Unlock
      </button>
    </form>
  );
}

export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col justify-center">
      <h1 className="condensed text-4xl font-bold">{title}</h1>
      <p className="mt-3 leading-relaxed text-muted">{message}</p>
      <div className="mt-8 flex gap-3">
        {onRetry && (
          <button type="button" onClick={onRetry} className="min-h-12 flex-1 rounded-xl bg-cascara font-semibold text-ristretto">
            Try again
          </button>
        )}
        <Link href="/" className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-surface-2 font-medium">
          New search
        </Link>
      </div>
    </div>
  );
}

export function NotIdentified({ query, reason }: { query: string; reason: string | null }) {
  return (
    <div className="flex min-h-[60dvh] flex-col justify-center">
      <h1 className="condensed text-4xl font-bold">We couldn’t place that coffee</h1>
      <p className="mt-3 leading-relaxed text-muted">
        {reason ?? "Try the roaster and the name on the bag, or describe it by origin, process and roast."}
      </p>
      <div className="mt-8">
        <SearchBox initial={query} />
      </div>
    </div>
  );
}
