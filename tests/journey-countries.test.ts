import { describe, expect, it } from "vitest";
import { COUNTRIES, countriesIn, countryFor } from "@/lib/journey/countries";

describe("journey countries", () => {
  it.each([
    ["Ethiopia", "ETH"],
    ["colombia", "COL"],
    ["Sumatra", "IDN"],
    ["Indonesia (Sumatra)", "IDN"],
    ["Tarrazu", "CRI"],
    ["Kona", null],
    ["", null],
  ])("countryFor(%j)", (t, key) => expect(countryFor(t)?.key ?? null).toBe(key));

  it("splits blends", () => {
    expect(countriesIn("Blend", "Brazil, Colombia & Ethiopia").map((c) => c.key)).toEqual(["BRA", "COL", "ETH"]);
    expect(countriesIn("Colombia & Brazil", null).map((c) => c.key)).toEqual(["COL", "BRA"]);
    expect(countriesIn("Ethiopia", "Guji").map((c) => c.key)).toEqual(["ETH"]);
  });

  it.each([
    ["Brazil-Colombia", null, ["BRA", "COL"]],
    ["Blend", "Brazil-Ethiopia", ["BRA", "ETH"]],
    ["Blend", "Brazil · Ethiopia", ["BRA", "ETH"]],
    ["Blend", "Brazil; Colombia; Ethiopia", ["BRA", "COL", "ETH"]],
    ["Blend", "Brazil with Ethiopia", ["BRA", "ETH"]],
    ["Blend", "Colombia (Huila), Brazil (Cerrado)", ["COL", "BRA"]],
    ["Blend", "Papua New Guinea & Ethiopia", ["PNG", "ETH"]],
    ["Indonesia (Sumatra)", null, ["IDN"]],
  ])("finds every country in %j / %j, in order", (origin, region, keys) =>
    expect(countriesIn(origin, region).map((c) => c.key)).toEqual(keys),
  );

  it("covers the spec's 27 producers, each complete", () => {
    expect(COUNTRIES).toHaveLength(27);
    for (const c of COUNTRIES) {
      expect(c.mapId).toMatch(/^\d{3}$/);
      expect(c.altitude.min).toBeLessThan(c.altitude.max);
      expect(c.port).not.toBe("");
    }
  });

  it("Brazil defaults to machine harvest and patio drying", () =>
    expect(countryFor("Brazil")).toMatchObject({ picking: "machine", drying: "patio" }));

  it("Ethiopia defaults to forest, raised beds, hand picking", () =>
    expect(countryFor("Ethiopia")).toMatchObject({ setting: "forest", drying: "raised-beds", picking: "hand" }));

  it("countries sharing a port share the same sea time", () => {
    const byPort = new Map<string, string>();
    for (const c of COUNTRIES) {
      const range = `${c.seaWeeksToEurope.min}-${c.seaWeeksToEurope.max}`;
      expect(byPort.get(c.port) ?? range, c.port).toBe(range);
      byPort.set(c.port, range);
    }
  });

  it("Colombia ships from Cartagena in 2-4 weeks", () =>
    expect(countryFor("Colombia")).toMatchObject({ port: "Cartagena", seaWeeksToEurope: { min: 2, max: 4 } }));
});
