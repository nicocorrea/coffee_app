import type { Fact, Provenance } from "@/lib/journey/types";

export const PROVENANCE_MEANING: Record<Provenance, string> = {
  own: "This coffee",
  usual: "How it's usually done",
  advice: "For your Meraki",
};

const STYLE: Record<Provenance, string> = {
  own: "bg-cascara text-white",
  usual: "bg-surface-2 text-muted",
  advice: "border border-line text-ink",
};

/** A fact as a pill: cascara for this coffee's own facts, grey for the usual way, outlined for Meraki advice. */
export function Badge({ provenance, children, title }: { provenance: Provenance; children: React.ReactNode; title?: string }) {
  return (
    <span
      data-provenance={provenance}
      title={title ?? PROVENANCE_MEANING[provenance]}
      className={`inline-flex items-center gap-1.5 rounded-full py-[0.22rem] pr-[0.6rem] pl-[0.48rem] text-[0.68rem] font-semibold lg:text-[0.72rem] ${STYLE[provenance]}`}
    >
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function FactBadge({ fact }: { fact: Fact }) {
  return (
    <Badge provenance={fact.provenance} title={`${fact.label} · ${PROVENANCE_MEANING[fact.provenance]}`}>
      <span className="sr-only">{fact.label}, {PROVENANCE_MEANING[fact.provenance].toLowerCase()}: </span>
      {fact.value}
    </Badge>
  );
}
