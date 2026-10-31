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
    ["Semi-washed", "wet-hulled"],
    ["Carbonic maceration", "anaerobic"],
    ["Pulped natural", "honey"],
    ["Experimental", "other"],
  ])("processKind(%j)", (t, want) => expect(processKind(t)).toBe(want));

  it("peakStep", () => expect([null, 800, 1000, 1650, 2200].map(peakStep)).toEqual([0, 1, 2, 3, 4]));

  it("JourneyFactsSchema accepts all-null facts", () =>
    expect(JourneyFactsSchema.safeParse(EMPTY_FACTS).success).toBe(true));
});
