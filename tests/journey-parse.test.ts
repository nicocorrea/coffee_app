import { describe, expect, it } from "vitest";
import { parseAltitude, peakStep, processKind } from "@/lib/journey/parse";
import { JourneyFactsSchema } from "@/lib/journey/facts";
import { EMPTY_FACTS } from "./journey-helpers";

describe("journey parsers", () => {
  it.each([
    ["1,950–2,200 masl", { min: 1950, max: 2200 }],
    ["1800m", { min: 1800, max: 1800 }],
    ["1.900 m", { min: 1900, max: 1900 }],
    ["1,200 - 1,500 masl", { min: 1200, max: 1500 }],
    ["5,000–6,000 ft", { min: 1520, max: 1830 }],
    // Both units given: the metres win, and the feet are never converted on top of them.
    ["1,800–2,000 masl (5,900–6,560 ft)", { min: 1800, max: 2000 }],
    ["6,000 ft (1,830 m)", { min: 1830, max: 1830 }],
    // Thousands grouped with a space or a no-break space.
    ["1 850 masl", { min: 1850, max: 1850 }],
    ["1\u00a0850 masl", { min: 1850, max: 1850 }],
    ["1\u202f800–2\u202f000 m", { min: 1800, max: 2000 }],
    // A small number nearby is not an altitude.
    ["1,850m (Lot 23)", { min: 1850, max: 1850 }],
    ["Lot 7: 1,900 masl", { min: 1900, max: 1900 }],
    // A second number counts only when it is joined to the first as a range.
    ["1200,1500 m", { min: 1200, max: 1500 }],
    ["1,700 to 1,900 metres", { min: 1700, max: 1900 }],
    ["between 1,700 and 1,900 m", { min: 1700, max: 1900 }],
    ["1,700 m – 1,900 m", { min: 1700, max: 1900 }],
    ["1,850 masl, harvested 2023", { min: 1850, max: 1850 }],
    ["1800", { min: 1800, max: 1800 }],
    ["High altitude", null],
    ["", null],
    [null, null],
  ])("parseAltitude(%j)", (t, want) => expect(parseAltitude(t)).toEqual(want));

  it.each([
    ["Natural", "natural"],
    ["Washed", "washed"],
    ["Fully washed", "washed"],
    ["Red Honey", "honey"],
    ["Anaerobic natural", "anaerobic"],
    ["Wet-hulled (Giling Basah)", "wet-hulled"],
    ["Semi-washed", "honey"],
    ["Carbonic maceration", "anaerobic"],
    ["Pulped natural", "honey"],
    ["Experimental", "other"],
  ])("processKind(%j)", (t, want) => expect(processKind(t)).toBe(want));

  // Ruling R10: "semi-washed" means wet-hulled only where wet-hulling is the norm.
  it.each([
    ["Semi-washed", "IDN", "wet-hulled"],
    ["Semi washed", "PNG", "wet-hulled"],
    ["Semi-washed", "BRA", "honey"],
    ["Semi-washed", undefined, "honey"],
    ["Wet-hulled", "BRA", "wet-hulled"],
    ["Giling basah", undefined, "wet-hulled"],
  ])("processKind(%j, %j)", (t, country, want) => expect(processKind(t, country)).toBe(want));

  it("peakStep", () => expect([null, 800, 1000, 1650, 2200].map(peakStep)).toEqual([0, 1, 2, 3, 4]));

  it("JourneyFactsSchema accepts all-null facts", () =>
    expect(JourneyFactsSchema.safeParse(EMPTY_FACTS).success).toBe(true));
});
