import type { ComponentType } from "react";
import type { Journey, StageId } from "@/lib/journey/types";
import { CoverArt } from "./CoverArt";
import { GrownArt } from "./GrownArt";
import { PickedArt } from "./PickedArt";
import { placeholderArt } from "./Placeholder";

/**
 * The art contract (Tasks 10–12 replace the placeholders, one stage at a time):
 *
 * - An art renders only its root `<g data-art="{stageId}" data-variant="…">`. The layout supplies the
 *   `<svg viewBox="0 0 360 300" aria-hidden>` around it and the visually hidden `stageCopy(…).alt`
 *   after it. Put `<defs>` inside the `<g>`, with ids prefixed `j-{stageId}-` (one art per page).
 * - Draw the full 360 × 300 frame, including the background. Desktop shows it whole (a 6:5 card); the
 *   phone fills its art area with `slice`, so keep what matters within about x 40–320 and y 40–260.
 * - `active` is true while the stage plays. The art is remounted (key = run counter) on every entry,
 *   so CSS entrances and `useTween` restart on their own.
 * - Motion: the `j-` classes in journey.css (entrances `j-fade j-rise j-grow j-pop j-draw` timed with
 *   `motionVars`, loops `j-sway j-drift j-bob`), plus the art's own keyframes in journey.css gated by
 *   `.is-active` and ending with `forwards`/`both`, plus `useTween` for counters and colour ramps.
 *   Never put a j- class on an element that has a `transform` attribute; wrap it instead.
 *   A `transform` attribute keeps its plain SVG meaning (rotate/scale about the user-space origin).
 * - Parallax layers are `<g data-depth="0.1">` (0–0.2). The desktop layout owns their `transform`.
 * - Use literal colours or the app's palette values; the dark re-theme does not reach the art.
 */
export type ArtProps = { j: Journey; active: boolean };

export const ART: Record<StageId, ComponentType<ArtProps>> = {
  cover: CoverArt,
  grown: GrownArt,
  picked: PickedArt,
  processed: placeholderArt("processed"),
  milled: placeholderArt("milled"),
  sorted: placeholderArt("sorted"),
  shipped: placeholderArt("shipped"),
  roasted: placeholderArt("roasted"),
  rested: placeholderArt("rested"),
  cup: placeholderArt("cup"),
};
