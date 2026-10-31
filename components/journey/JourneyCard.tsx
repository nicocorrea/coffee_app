import Link from "next/link";
import { buildJourney } from "@/lib/journey/build";
import { pinFor, shapeFor } from "@/lib/journey/map";
import type { BrewResult } from "@/lib/schema";

/** The coffee page's invitation to the journey: the country outline with a pin, and how long it takes. */
export function JourneyCard({ result, href }: { result: BrewResult; href: string }) {
  const journey = buildJourney(result);
  const { bean } = result;
  const place = bean.region?.split(",")[0].trim() || bean.origin;
  const stages = journey.stages.length - 1; // the cover isn't a stage of the coffee's life
  const shape = journey.place.countryKeys[0] ? shapeFor(journey.place.countryKeys[0]) : null;
  const pin = shape ? pinFor(shape, journey.place.coords) : null;

  return (
    <Link
      href={href}
      aria-label="Discover its journey"
      className="mt-14 flex items-center gap-5 rounded-3xl bg-surface p-4 transition-colors hover:bg-surface-2 lg:mt-12"
    >
      <svg viewBox="0 0 360 300" className="h-24 w-28 shrink-0 rounded-2xl bg-surface-2" aria-hidden>
        {shape && pin && (
          <>
            <path d={shape.d} className="fill-line stroke-muted" strokeWidth={2} vectorEffect="non-scaling-stroke" />
            <circle cx={pin.x} cy={pin.y} r={14} className="fill-cascara" />
            <circle cx={pin.x} cy={pin.y} r={5} className="fill-paper" />
          </>
        )}
      </svg>
      <span className="min-w-0">
        <span className="block text-lg leading-snug font-semibold text-balance">From {place} to your cup</span>
        <span className="mt-1 block text-sm text-muted">{stages} stages · about 2 minutes</span>
        <span className="mt-2 block font-medium text-cascara">Discover its journey</span>
      </span>
    </Link>
  );
}
