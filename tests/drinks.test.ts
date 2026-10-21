import { describe, expect, it } from "vitest";
import { DRINKS, deriveDrinks } from "@/lib/drinks";
import type { BaseRecipe } from "@/lib/schema";

const base: BaseRecipe = {
  doseG: 18,
  yieldG: 38,
  tempC: 93,
  preinfusion: { pressureBar: 3, seconds: 6 },
  timeMin: 27,
  timeMax: 31,
  grind: { direction: "same", steps: 0, advice: "Start at your usual setting." },
};

const byId = (drinks: ReturnType<typeof deriveDrinks>, id: string) => {
  const d = drinks.find((x) => x.id === id);
  if (!d) throw new Error(`missing ${id}`);
  return d;
};

describe("deriveDrinks", () => {
  it("returns all 12 drinks in menu order", () => {
    const drinks = deriveDrinks(base, "medium");
    expect(drinks.map((d) => d.id)).toEqual(DRINKS.map((d) => d.id));
    expect(drinks).toHaveLength(12);
  });

  it("doppio uses the base recipe", () => {
    const d = byId(deriveDrinks(base, "medium"), "doppio");
    expect(d.doseG).toBe(18);
    expect(d.yieldG).toBe(38);
    expect(d.tempC).toBe(93);
  });

  it("ristretto ratio stays within 1:1 to 1:1.5 and runs shorter", () => {
    const d = byId(deriveDrinks(base, "medium"), "ristretto");
    const ratio = d.yieldG / d.doseG;
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThanOrEqual(1.5);
    expect(d.timeMax).toBeLessThan(base.timeMax);
    expect(d.timeMin).toBeGreaterThanOrEqual(15);
  });

  it("lungo caps at 1:3.5 and brews 1 °C cooler, never below 85", () => {
    const d = byId(deriveDrinks({ ...base, yieldG: 54 }, "medium"), "lungo");
    expect(d.yieldG / d.doseG).toBeLessThanOrEqual(3.5);
    expect(d.tempC).toBe(92);
    const cool = byId(deriveDrinks({ ...base, tempC: 85 }, "dark"), "lungo");
    expect(cool.tempC).toBe(85);
  });

  it("espresso shows one cup of the split double", () => {
    const d = byId(deriveDrinks(base, "medium"), "espresso");
    expect(d.yieldG).toBe(19);
    expect(d.doseG).toBe(9);
    expect(d.ratio).toBe("1:2.1");
  });

  it("adjusts milk temperature for roast level", () => {
    expect(byId(deriveDrinks(base, "light"), "flat-white").milk?.steamTempC).toBe(58);
    expect(byId(deriveDrinks(base, "medium"), "flat-white").milk?.steamTempC).toBe(60);
    expect(byId(deriveDrinks(base, "dark"), "flat-white").milk?.steamTempC).toBe(61);
  });

  it("steams at least 180 ml for the Meraki auto-steam probe", () => {
    for (const d of deriveDrinks(base, "medium")) {
      if (d.milk) {
        expect(d.milk.steamMl).toBeGreaterThanOrEqual(180);
        expect(d.milk.steamMl).toBeGreaterThanOrEqual(d.milk.ml);
      }
    }
  });

  it("long black puts water first, americano shot first", () => {
    const drinks = deriveDrinks(base, "medium");
    expect(byId(drinks, "long-black").water?.order).toBe("water-first");
    expect(byId(drinks, "americano").water?.order).toBe("shot-first");
  });

  it("rounds grams to 0.5 g", () => {
    for (const d of deriveDrinks({ ...base, doseG: 18.3, yieldG: 41.7 }, "medium-light")) {
      expect((d.doseG * 2) % 1).toBe(0);
      expect((d.yieldG * 2) % 1).toBe(0);
    }
  });

  it("attaches bean-specific notes", () => {
    const d = byId(
      deriveDrinks(base, "medium", [{ drink: "cortado", note: "Lovely with milk" }]),
      "cortado",
    );
    expect(d.note).toBe("Lovely with milk");
  });
});
