import Image from "next/image";
import { isDetailedNote, notePhotoSrc, photoFor, type TastingNote } from "@/lib/tasting-notes";

/** What to expect in the mouth, most noticeable first, each with a photo of the food it tastes like. */
export function TastingNotes({ notes }: { notes: (TastingNote | string)[] }) {
  // The schema doesn't require a minimum, so a lookup may come back with none.
  if (notes.length === 0) return null;
  if (!notes.every(isDetailedNote)) {
    return (
      <ul className="flex flex-wrap gap-2">
        {notes.map((n) => {
          const name = typeof n === "string" ? n : n.name;
          return (
            <li key={name} className="rounded-full bg-surface-2 px-3.5 py-1.5 text-[0.95rem]">
              {name}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ol className="divide-y divide-line border-y border-line">
      {notes.map((n, i) => {
        const photo = photoFor(n.name);
        return (
          <li key={n.name} className="flex gap-4 py-5">
            {photo ? (
              <Image
                src={notePhotoSrc(photo)}
                alt=""
                width={112}
                height={112}
                className="size-20 shrink-0 rounded-2xl bg-surface-2 object-cover sm:size-24"
              />
            ) : (
              <span
                aria-hidden
                className="condensed flex size-20 shrink-0 items-center justify-center rounded-2xl bg-surface-2 text-4xl font-bold text-muted sm:size-24"
              >
                {n.name.charAt(0)}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-lg leading-snug font-semibold">
                <span className="numerals text-muted">{i + 1}.</span> {n.name}
                <span className="font-normal text-muted">, {n.role}</span>
              </h3>
              <p className="mt-1.5 leading-relaxed text-muted">{n.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
