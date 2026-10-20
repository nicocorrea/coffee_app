import type { BaseRecipe } from "@/lib/schema";

/** The shot drawn to scale: pre-infusion, ramp-up, then the target window. */
export function ShotTimeline({ recipe }: { recipe: BaseRecipe }) {
  const { seconds: pre, pressureBar } = recipe.preinfusion;
  const end = Math.max(40, recipe.timeMax + 5);
  const pct = (s: number) => `${(Math.min(s, end) / end) * 100}%`;

  return (
    <figure className="mt-8">
      <div
        className="relative h-12 rounded-xl bg-surface-2"
        role="img"
        aria-label={`Pre-infusion for ${pre} seconds, then stop between ${recipe.timeMin} and ${recipe.timeMax} seconds`}
      >
        {pre > 0 && <span className="absolute inset-y-0 left-0 rounded-l-xl bg-sage/80" style={{ width: pct(pre) }} />}
        <span
          className="absolute inset-y-0 bg-roast-light/45"
          style={{ left: pct(pre), width: `calc(${pct(recipe.timeMin)} - ${pct(pre)})` }}
        />
        <span
          className="absolute inset-y-0 rounded-r-md bg-cascara"
          style={{ left: pct(recipe.timeMin), width: `calc(${pct(recipe.timeMax)} - ${pct(recipe.timeMin)})` }}
        />
        <span className="absolute inset-y-0 w-px bg-ink/60" style={{ left: pct(recipe.timeMax) }} />
      </div>
      <div className="numerals relative mt-2 h-5 text-sm text-muted">
        <span className="absolute left-0">0 s</span>
        <span className="absolute -translate-x-1/2 text-ink" style={{ left: pct(recipe.timeMin) }}>
          {recipe.timeMin}
        </span>
        <span className="absolute -translate-x-1/2 text-ink" style={{ left: pct(recipe.timeMax) }}>
          {recipe.timeMax} s
        </span>
      </div>
      <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
        {pre > 0 && (
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-sage" /> Pre-infuse at {pressureBar} bar
          </span>
        )}
        <span className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-cascara" /> Stop on weight in this window
        </span>
      </figcaption>
    </figure>
  );
}
