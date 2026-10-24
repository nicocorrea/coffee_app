import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DEMO_PROFILE } from "@/lib/fixtures";
import { BeanProfileSchema } from "@/lib/schema";
import { NOTE_PHOTO_IDS, isDetailedNote, notePhotoSrc, photoFor } from "@/lib/tasting-notes";

// What Claude returned for "Santo Domingo Dominican Republic coffee" (24 Oct 2026). These have no photo
// field, and requiring one rejected the whole lookup.
const SANTO_DOMINGO_NOTES = [
  { name: "Caramel", role: "the main impression", description: "Like the slightly burnt edge of a caramel candy." },
  { name: "Cocoa / dark chocolate", role: "the backbone", description: "Like unsweetened cocoa powder or 60–70% chocolate." },
  { name: "Toasted almond", role: "a nutty background", description: "Like roasted almonds, dry and mild." },
  { name: "Vanilla", role: "a soft sweetness", description: "A faint vanilla-cream sweetness, like a plain cookie." },
];

describe("tasting notes", () => {
  it("accepts notes as Claude writes them, without a photo", () => {
    const profile = { ...DEMO_PROFILE, flavour: { ...DEMO_PROFILE.flavour, notes: SANTO_DOMINGO_NOTES } };
    expect(BeanProfileSchema.safeParse(profile).success).toBe(true);
  });

  it("tells notes saved as plain words from described notes", () => {
    expect(isDetailedNote("Blueberry")).toBe(false);
    expect(isDetailedNote(DEMO_PROFILE.flavour.notes[0])).toBe(true);
  });

  it("has a photo file for every note in the library", () => {
    const missing = NOTE_PHOTO_IDS.filter((id) => !existsSync(join(process.cwd(), "public", notePhotoSrc(id))));
    expect(missing).toEqual([]);
  });
});

describe("photoFor", () => {
  it("finds the photo from the note's name", () => {
    expect(SANTO_DOMINGO_NOTES.map((n) => photoFor(n.name))).toEqual(["caramel", "dark-chocolate", "almond", "vanilla"]);
  });

  it("prefers the more specific food", () => {
    expect(photoFor("Milk chocolate")).toBe("milk-chocolate");
    expect(photoFor("Toasted hazelnut")).toBe("hazelnut");
    expect(photoFor("Green apple")).toBe("green-apple");
    expect(photoFor("Butterscotch")).toBe("caramel");
    expect(photoFor("Peanut butter")).toBe("peanut");
    expect(photoFor("Jasmine tea")).toBe("jasmine");
  });

  it("maps notes the library lacks to their nearest family", () => {
    expect(photoFor("Bergamot")).toBe("orange");
    expect(photoFor("Molasses")).toBe("brown-sugar");
    expect(photoFor("Panela")).toBe("brown-sugar");
    expect(photoFor("Dates")).toBe("fig");
    expect(photoFor("Stone fruit")).toBe("peach");
    expect(photoFor("Cranberry")).toBe("raspberry");
    expect(photoFor("Prune")).toBe("plum");
    expect(photoFor("Rum")).toBe("red-wine");
    expect(photoFor("Baking spice")).toBe("cinnamon");
    expect(photoFor("Floral")).toBe("jasmine");
  });

  it("ignores case and matches whole words only", () => {
    expect(photoFor("DARK CHOCOLATE")).toBe("dark-chocolate");
    expect(photoFor("Pineapple")).toBe("pineapple"); // not "apple"
    expect(photoFor("Cashew")).toBe("almond"); // not "ash", so not smoke
    expect(photoFor("Something unheard of")).toBe(null);
  });
});
