import { describe, expect, it } from "vitest";
import { buildJourney, mergeUnvisited, shouldEnrich } from "@/lib/journey/build";
import { stageCopy } from "@/lib/journey/copy";
import type { Fact } from "@/lib/journey/types";
import { brew, withFacts } from "./journey-helpers";

const prov = (facts: Fact[], label: string) => facts.find((f) => f.label === label)?.provenance;

describe("buildJourney", () => {
  it("medium confidence: only country and process are this coffee's", () => {
    const j = buildJourney(brew()); // DEMO_PROFILE is medium
    expect(prov(j.place.facts, "Country")).toBe("own");
    expect(prov(j.processed.facts, "Process")).toBe("own");
    expect(prov(j.place.facts, "Region")).toBe("usual");
    expect(prov(j.grown.facts, "Altitude")).toBe("usual");
  });

  it("high confidence makes identity fields own; low makes everything usual", () => {
    const high = buildJourney({ ...brew(), confidence: "high" });
    expect(prov(high.place.facts, "Region")).toBe("own");
    expect(prov(high.grown.facts, "Altitude")).toBe("own");
    expect(prov(high.grown.facts, "Variety")).toBe("own");
    expect(prov(high.roasted.facts, "Roast")).toBe("own");

    const low = buildJourney({ ...brew(), confidence: "low" });
    expect(prov(low.place.facts, "Country")).toBe("usual");
    expect(prov(low.processed.facts, "Process")).toBe("usual");
    const all = [low.place, low.grown, low.picked, low.processed, low.milled, low.sorted, low.shipped, low.roasted].flatMap(
      (s) => s.facts,
    );
    expect(all.filter((f) => f.provenance === "own")).toEqual([]);
  });

  it("recipe and rest days are advice", () => {
    const j = buildJourney(brew());
    expect(j.rested.facts.every((f) => f.provenance === "advice")).toBe(true);
    expect(j.cup.facts.every((f) => f.provenance === "advice")).toBe(true);
  });

  it("uses country defaults when facts are missing", () =>
    expect(buildJourney(brew({ origin: "Brazil", process: "Natural" }))).toMatchObject({
      picked: { method: "machine" },
      processed: { drying: "patio" },
    }));

  it("researched facts override defaults and carry their source", () => {
    const j = buildJourney(withFacts({ picking: { value: "hand", source: "https://r.example/p" } }, { origin: "Brazil" }));
    expect(j.picked.method).toBe("hand");
    expect(j.picked.facts[0]).toMatchObject({ provenance: "own", sourceUrl: "https://r.example/p" });
  });

  it("drops researched facts without a real source link", () => {
    const j = buildJourney(withFacts({ grade: { value: "G1", source: "javascript:alert(1)" }, drying: { value: "patio", source: "roaster site" } }));
    expect(j.sorted.facts.find((f) => f.label === "Grade")).toBeUndefined();
    expect(j.processed.drying).toBe("raised-beds");
    expect(prov(j.processed.facts, "Drying")).toBe("usual");
  });

  it("the roaster's location is this coffee's only when research cites a source", () => {
    const sourced = buildJourney(
      withFacts({ roasterCity: "Kraków", roasterCountry: "Poland", sources: ["not a url", "https://roaster.example/about"] }),
    );
    expect(sourced.roasted.facts).toContainEqual({
      label: "Roasted in",
      value: "Kraków, Poland",
      provenance: "own",
      sourceUrl: "https://roaster.example/about",
    });
    const unsourced = buildJourney(withFacts({ roasterCity: "Kraków", roasterCountry: "Poland", sources: ["javascript:alert(1)"] }));
    expect(unsourced.roasted.facts).toContainEqual({ label: "Roasted in", value: "Kraków, Poland", provenance: "usual" });
  });

  it("never invents a producer", () => expect(buildJourney(brew()).place.producer).toBeNull());

  it("a researched producer keeps its kind", () => {
    const j = buildJourney(withFacts({ producer: { name: "Daye Bensa", kind: "washing station", source: "https://x.example" } }));
    expect(j.place.producer).toMatchObject({ label: "Producer", value: "Daye Bensa", provenance: "own", kind: "washing station" });
    expect(j.grown.producer).toEqual(j.place.producer);
  });

  it("a coffee with no process text claims none", () => {
    const j = buildJourney(brew({ process: "" }));
    expect(j.processed.process).toBe("other");
    expect(j.processed.facts.filter((f) => f.provenance === "own")).toEqual([]);
    expect(prov(j.processed.facts, "Process")).toBeUndefined();
  });

  it("skips shipping when roasted in the origin country", () =>
    expect(buildJourney(withFacts({ roasterCountry: "Ethiopia" })).stages).not.toContain("shipped"));

  it("arrives in Europe by default and names the roaster's city when known", () => {
    expect(buildJourney(brew()).shipped.arrival).toBe("Europe");
    expect(buildJourney(withFacts({ roasterCity: "Kraków" })).shipped.arrival).toBe("Kraków");
  });

  it("unknown altitude shows the country's typical range as usual", () => {
    const j = buildJourney(brew({ altitude: null }));
    expect(j.grown).toMatchObject({ altitudeM: null, peak: 0 });
    expect(prov(j.grown.facts, "Typical altitude")).toBe("usual");
  });

  it("accepts tasting notes saved as plain strings", () =>
    expect(buildJourney(brew({}, { notes: ["Cocoa", "Plum"] })).cup.notes).toEqual(["Cocoa", "Plum"]));

  it("blends list every country", () =>
    expect(buildJourney(brew({ origin: "Blend", region: "Brazil, Ethiopia" })).place.countryKeys).toEqual(["BRA", "ETH"]));

  it("semi-washed is wet-hulled only where wet-hulling is the norm", () => {
    const sumatra = buildJourney(brew({ origin: "Indonesia", region: "Sumatra", process: "Semi-washed" }));
    expect(sumatra.processed.process).toBe("wet-hulled");
    expect(sumatra.milled.wetHulled).toBe(true);
    const brazil = buildJourney(brew({ origin: "Brazil", process: "Semi-washed" }));
    expect(brazil.processed.process).toBe("honey");
    expect(brazil.milled.wetHulled).toBe(false);
  });

  it("blends written with dashes find every country", () =>
    expect(buildJourney(brew({ origin: "Brazil-Colombia", region: null })).place.countryKeys).toEqual(["BRA", "COL"]));

  it("altitude in metres and feet reads the metres", () =>
    expect(buildJourney(brew({ altitude: "1,800–2,000 masl (5,900–6,560 ft)" })).grown).toMatchObject({
      altitudeM: { min: 1800, max: 2000 },
      peak: 4,
    }));

  it("unknown country builds a generic journey", () => expect(buildJourney(brew({ origin: "Atlantis" })).shipped.port).toBeNull());
});

describe("shouldEnrich", () => {
  it("shouldEnrich", () => {
    expect(shouldEnrich(brew({ roaster: "Hard Beans" }))).toBe(true);
    expect(shouldEnrich(brew())).toBe(false);
    expect(shouldEnrich({ ...brew({ roaster: "Hard Beans" }), confidence: "low" })).toBe(false);
    expect(shouldEnrich(withFacts({}, { roaster: "Hard Beans" }))).toBe(false);
    expect(shouldEnrich({ ...brew({ roaster: "Hard Beans" }), identified: false })).toBe(false);
  });
});

describe("mergeUnvisited", () => {
  it("mergeUnvisited keeps what the reader has seen", () => {
    const prev = buildJourney(brew({ roaster: "R" })),
      next = buildJourney(
        withFacts({
          picking: { value: "machine", source: "https://x" },
          producer: { name: "Hambela smallholders", kind: "smallholders", source: "https://x" },
        }),
      );
    const m = mergeUnvisited(prev, next, new Set(["cover", "grown"]));
    expect(m.place).toEqual(prev.place);
    expect(m.picked).toEqual(next.picked);
    expect(m.stages).toEqual(prev.stages);
  });

  it("a producer found after the cover was read still reaches the unread Grown stage", () => {
    const prev = buildJourney(brew({ roaster: "R" }));
    const next = buildJourney(
      withFacts({ producer: { name: "Hambela smallholders", kind: "smallholders", source: "https://x.example" } }),
    );
    const m = mergeUnvisited(prev, next, new Set(["cover"]));
    expect(m.place.producer).toBeNull();
    expect(stageCopy(m, "grown").text).toContain("Hambela smallholders");
  });
});
