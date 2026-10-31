"use client";

import { stageCopy } from "@/lib/journey/copy";
import type { Journey, StageId } from "@/lib/journey/types";
import { ART } from "./art";

/**
 * One stage's illustration: the decorative SVG, remounted on every run so it replays, then its
 * one-sentence summary for screen readers.
 */
export function StageArt({
  j,
  id,
  active,
  run,
}: {
  j: Journey;
  id: StageId;
  active: boolean;
  run: number;
}) {
  const Art = ART[id];
  return (
    <>
      <svg
        viewBox="0 0 360 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        className="block size-full"
      >
        <Art key={run} j={j} active={active} />
      </svg>
      <p className="sr-only">{stageCopy(j, id).alt}</p>
    </>
  );
}
