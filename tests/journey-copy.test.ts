import { describe, expect, it } from "vitest";
import { buildJourney } from "@/lib/journey/build";
import { COMPARE_COPY, stageCopy } from "@/lib/journey/copy";
import { STAGE_IDS } from "@/lib/journey/types";
import { brew, withFacts } from "./journey-helpers";

const j = buildJourney(brew());

describe("stage copy", () => {
  it("numbers stages without the cover", () => {
    expect(stageCopy(j, "cover").step).toBe("The journey of");
    expect(stageCopy(j, "grown").step).toBe("1 of 9 · Grown");
    expect(stageCopy(j, "cup").step).toBe("9 of 9 · In your cup");
  });
  it("renumbers when shipping is skipped", () =>
    expect(stageCopy(buildJourney(withFacts({ roasterCountry: "Ethiopia" })), "cup").step).toBe("8 of 8 · In your cup"));
  it("grey facts are worded as usual practice", () => expect(stageCopy(j, "picked").text).toMatch(/usually|typically/i));
  it("a natural names its fruit notes", () => expect(stageCopy(j, "processed").text).toMatch(/blueberry/i));
  it("a washed coffee doesn't claim fruit from drying", () =>
    expect(stageCopy(buildJourney(brew({ process: "Washed" })), "processed").text).not.toMatch(/blueberry/i));
  it("machine harvest never mentions hand-picking", () =>
    expect(stageCopy(buildJourney(brew({ origin: "Brazil" })), "picked").text).not.toMatch(/by hand/i));
  it("explains jargon in place", () => {
    expect(stageCopy(j, "milled").text).toMatch(/parchment[^.]*(skin|shell)/i);
    expect(stageCopy(j, "roasted").text).toMatch(/first crack/i);
  });
  it("comparison copy ends the same way", () => {
    for (const t of Object.values(COMPARE_COPY)) expect(t.endsWith("Not this coffee, just to compare.")).toBe(true);
  });
  it("names no producer unless researched", () => expect(stageCopy(j, "grown").text).not.toMatch(/farm of|estate|cooperative/i));

  it("names a producer when researched with a source", () => {
    const r = buildJourney(withFacts({ producer: { name: "Daye Bensa", kind: "washing station", source: "https://example.com/a" } }));
    expect(stageCopy(r, "grown").text).toContain("Daye Bensa");
  });
  it("explains wet-hulled in place", () => {
    const w = buildJourney(brew({ process: "Wet-hulled", origin: "Indonesia", region: "Sumatra" }));
    expect(stageCopy(w, "milled").text).toMatch(/wet-hulled[^.]*(damp|moist)/i);
  });
  it("uses only <b> markup and fills every stage", () => {
    for (const id of j.stages) {
      const c = stageCopy(j, id);
      expect(c.title && c.text && c.alt).toBeTruthy();
      expect(c.text.replace(/<\/?b>/g, "")).not.toMatch(/[<>]/);
    }
    expect(STAGE_IDS.length).toBe(10);
  });
});
