import type { Journey, StageId } from "@/lib/journey/types";

export type StoryProps = {
  j: Journey;
  /** Back to the coffee page (✕, Esc, "Back to the recipe"). */
  onClose: () => void;
  /** A stage became the active one. */
  onEnter: (id: StageId) => void;
};

/** Stages drawn on the dark palette; on desktop the whole page fades to night for them. */
export const DARK_STAGES: ReadonlySet<StageId> = new Set(["cover", "roasted"]);

export function CloseButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label="Close"
      onClick={onClick}
      className={`grid shrink-0 place-items-center rounded-full text-ink backdrop-blur-[10px] ${className}`}
    >
      <span aria-hidden>✕</span>
    </button>
  );
}
