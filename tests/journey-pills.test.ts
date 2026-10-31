import { describe, expect, it } from "vitest";
import { PILL_FILLS, contrast, pillLook } from "@/components/journey/art/pills";

describe("tasting-note pills", () => {
  it("measures contrast the WCAG way", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 1);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });

  it.each(PILL_FILLS)("text on %s reaches 4.5:1", (fill) => {
    const note = pillLookFor(fill);
    expect(note.fill).toBe(fill);
    expect(contrast(note.fill, note.text)).toBeGreaterThanOrEqual(4.5);
  });

  it("gives common notes readable text", () => {
    ["Honey", "Caramel", "Peach", "Orange", "Hazelnut", "Green apple", "Something new"].forEach((n, i) => {
      const look = pillLook(n, i);
      expect(contrast(look.fill, look.text), n).toBeGreaterThanOrEqual(4.5);
    });
  });
});

// Every fill is reachable: a flavour by its keyword, or a house colour by its index.
function pillLookFor(fill: string) {
  const byName: Record<string, string> = {
    "#fbf8f5": "Jasmine",
    "#5b4a8a": "Blueberry",
    "#c0392b": "Strawberry",
    "#3a2015": "Dark chocolate",
    "#e9cf5a": "Lemon",
    "#e08a3c": "Peach",
    "#c08e57": "Caramel",
    "#a8835a": "Hazelnut",
    "#8c9873": "Green apple",
    "#7a2a3a": "Wine",
    "#9a5a32": "Cinnamon",
  };
  if (byName[fill]) return pillLook(byName[fill], 0);
  for (let i = 0; i < 8; i++) {
    const look = pillLook("Unnamed", i);
    if (look.fill === fill) return look;
  }
  throw new Error(`no note reaches ${fill}`);
}
