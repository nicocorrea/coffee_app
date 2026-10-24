import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_PROFILE } from "@/lib/fixtures";
import { BeanProfileSchema } from "@/lib/schema";
import { NOTE_PHOTO_IDS, isDetailedNote, notePhotoSrc } from "@/lib/tasting-notes";

describe("tasting notes", () => {
  it("rejects a photo that isn't in the library", () => {
    const [first, ...rest] = DEMO_PROFILE.flavour.notes;
    const bad = { ...DEMO_PROFILE, flavour: { ...DEMO_PROFILE.flavour, notes: [{ ...first, photo: "tamarind" }, ...rest] } };
    expect(BeanProfileSchema.safeParse(bad).success).toBe(false);
  });

  it("tells notes saved as plain words from notes with a photo", () => {
    expect(isDetailedNote("Blueberry")).toBe(false);
    expect(isDetailedNote(DEMO_PROFILE.flavour.notes[0])).toBe(true);
  });

  it("has a photo file for every note in the library", () => {
    const missing = NOTE_PHOTO_IDS.filter((id) => !existsSync(join(process.cwd(), "public", notePhotoSrc(id))));
    expect(missing).toEqual([]);
  });
});
