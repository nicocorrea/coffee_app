import { ROAST_LEVELS, type RoastLevel } from "@/lib/schema";

export const ROAST_LABEL: Record<RoastLevel, string> = {
  light: "Light",
  "medium-light": "Medium-light",
  medium: "Medium",
  "medium-dark": "Medium-dark",
  dark: "Dark",
};

const ROAST_BG: Record<RoastLevel, string> = {
  light: "bg-roast-light",
  "medium-light": "bg-roast-medium-light",
  medium: "bg-roast-medium",
  "medium-dark": "bg-roast-medium-dark",
  dark: "bg-roast-dark",
};

/** A small bean-coloured disc for lists. */
export function RoastDot({ roast, className = "size-10" }: { roast: RoastLevel; className?: string }) {
  return (
    <span
      aria-hidden
      className={`${ROAST_BG[roast]} ${className} inline-block shrink-0 rounded-[45%_55%_50%_50%/55%_50%_50%_45%] ring-1 ring-white/10`}
    />
  );
}

/** The five roast colours as a scale, with this coffee's level marked. */
export function RoastRamp({ roast }: { roast: RoastLevel }) {
  const index = ROAST_LEVELS.indexOf(roast);
  return (
    <figure>
      <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={`Roast level: ${ROAST_LABEL[roast]}`}>
        {ROAST_LEVELS.map((level, i) => (
          <span key={level} className={`${ROAST_BG[level]} flex-1 ${i === index ? "ring-2 ring-milk ring-inset" : "opacity-70"}`} />
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-xs text-muted">
        <span>Light</span>
        <span className="text-milk">{ROAST_LABEL[roast]} roast</span>
        <span>Dark</span>
      </figcaption>
    </figure>
  );
}
