"use client";

import { useState } from "react";
import { COMPARE_COPY, stageCopy } from "@/lib/journey/copy";
import type { Fact, Journey, ProcessKind, StageId } from "@/lib/journey/types";
import { Badge, FactBadge, PROVENANCE_MEANING } from "./Badge";
import { motionVars } from "./motion";

export const headingId = (id: StageId) => `journey-${id}`;

const PROCESS_NAME: Record<ProcessKind, string> = {
  natural: "Natural",
  washed: "Washed",
  honey: "Honey",
  anaerobic: "Anaerobic",
  "wet-hulled": "Wet-hulled",
  other: "Other",
};
const COMPARED: ProcessKind[] = ["natural", "washed", "honey"];

/** Copy strings mark emphasis with `<b>` and nothing else; split on it rather than parse HTML. */
function Rich({ text }: { text: string }) {
  return text.split(/(<b>.*?<\/b>)/g).map((part, i) =>
    part.startsWith("<b>") ? (
      <b key={i} className="font-semibold text-ink">
        {part.slice(3, -4)}
      </b>
    ) : (
      part
    ),
  );
}

function factsFor(j: Journey, id: StageId): Fact[] {
  if (id === "cover") return j.place.producer ? [...j.place.facts, j.place.producer] : j.place.facts;
  return j[id].facts;
}

/** A stage's words: step, title, its facts as badges, the paragraph, and the stage's extras. */
export function StageCopy({ j, id, onBack }: { j: Journey; id: StageId; onBack: () => void }) {
  const copy = stageCopy(j, id);
  const cover = id === "cover";
  const facts = factsFor(j, id);
  return (
    <div className="max-w-[26rem]">
      <div
        style={motionVars({ d: 0.2 })}
        className="j-rise text-[0.68rem] font-semibold tracking-[0.1em] text-muted uppercase lg:text-[0.72rem]"
      >
        {copy.step}
      </div>
      <h2
        id={headingId(id)}
        style={motionVars({ d: 0.3 })}
        className={`j-rise condensed mt-[0.4rem] mb-[0.65rem] leading-[0.98] font-bold tracking-[-0.02em] text-balance lg:mt-3 lg:mb-4 ${
          cover ? "text-[2.2rem] lg:text-[clamp(3.1rem,5.4vw,4.65rem)]" : "text-[1.85rem] lg:text-[clamp(2.45rem,4.2vw,3.55rem)]"
        }`}
      >
        {copy.title}
      </h2>
      {facts.length > 0 && (
        <div style={motionVars({ d: 0.45 })} className="j-rise mb-3 flex flex-wrap gap-1.5 lg:mb-4">
          {facts.map((f) => (
            <FactBadge key={`${f.label}:${f.value}`} fact={f} />
          ))}
        </div>
      )}
      {id === "processed" ? (
        <Compare j={j} text={copy.text} />
      ) : (
        <p style={motionVars({ d: 0.6 })} className="j-rise text-[0.85rem] leading-normal text-muted lg:text-base lg:leading-[1.6]">
          <Rich text={copy.text} />
        </p>
      )}
      {cover && j.place.special && (
        <p style={motionVars({ d: 0.7 })} className="j-rise mt-3 text-[0.85rem] leading-normal text-ink lg:text-base">
          {j.place.special}
        </p>
      )}
      {cover && (
        <div style={motionVars({ d: 0.8 })} data-legend="" className="j-rise mt-4 flex flex-wrap gap-1.5">
          {(["own", "usual", "advice"] as const).map((p) => (
            <Badge key={p} provenance={p}>
              {PROVENANCE_MEANING[p]}
            </Badge>
          ))}
        </div>
      )}
      {cover && (
        <p style={motionVars({ d: 1.2 })} className="j-rise mt-10 hidden items-center gap-2 text-[0.78rem] text-muted lg:flex">
          <span aria-hidden className="j-bob inline-block">
            ↓
          </span>
          Scroll, or press <Key>↓</Key>
        </p>
      )}
      {id === "cup" && (
        <>
          <button
            type="button"
            onClick={onBack}
            style={motionVars({ d: 0.8 })}
            className="j-rise mt-[1.1rem] min-h-[2.8rem] w-full rounded-2xl bg-cascara font-semibold text-white transition-opacity hover:opacity-90 lg:max-w-[18rem]"
          >
            Back to the recipe
          </button>
          {j.sources.length > 0 && (
            <p style={motionVars({ d: 0.9 })} className="j-rise mt-5 text-[0.72rem] leading-relaxed text-muted">
              Sources:{" "}
              {j.sources.map((s, i) => (
                <span key={s.url}>
                  {i > 0 && ", "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                    {s.host}
                  </a>
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded-md border border-line px-1.5 py-px font-sans text-[0.68rem] text-ink">{children}</kbd>
  );
}

/** The processing paragraph with chips to compare other processes. The art never changes. */
function Compare({ j, text }: { j: Journey; text: string }) {
  const own = j.processed.process;
  const [chosen, setChosen] = useState<ProcessKind>(own);
  const [changed, setChanged] = useState(false);
  const kinds = COMPARED.includes(own) ? COMPARED : [...COMPARED, own];
  const label = (k: ProcessKind) => (k === "other" ? j.processed.processLabel : PROCESS_NAME[k]);
  return (
    <>
      <p
        key={chosen}
        style={changed ? undefined : motionVars({ d: 0.6 })}
        aria-live="polite"
        className={`${changed ? "j-swap" : "j-rise"} text-[0.85rem] leading-normal text-muted lg:text-base lg:leading-[1.6]`}
      >
        <Rich text={chosen === own ? text : COMPARE_COPY[chosen]} />
      </p>
      <div role="group" aria-label="Compare processes" style={motionVars({ d: 0.75 })} className="j-rise mt-3.5 flex flex-wrap gap-1.5">
        {kinds.map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={chosen === k}
            onClick={() => {
              setChosen(k);
              setChanged(true);
            }}
            className="rounded-full border border-line bg-paper px-3 py-1.5 text-[0.72rem] font-semibold text-ink transition-colors aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper lg:px-3.5 lg:py-2 lg:text-[0.78rem]"
          >
            {label(k)}
            {k === own && <span className="font-normal opacity-70"> · yours</span>}
          </button>
        ))}
      </div>
    </>
  );
}
