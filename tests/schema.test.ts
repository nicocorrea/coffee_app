import { describe, expect, it } from "vitest";
import { BeanProfileSchema, clampProfile } from "@/lib/schema";
import { DEMO_PROFILE } from "@/lib/fixtures";

describe("BeanProfileSchema", () => {
  it("accepts the demo fixture", () => {
    expect(BeanProfileSchema.safeParse(DEMO_PROFILE).success).toBe(true);
  });

  it("accepts an unidentified result with nulls", () => {
    const r = BeanProfileSchema.safeParse({
      ...DEMO_PROFILE,
      identified: false,
      reason: "That looks like a pizza, not a coffee.",
    });
    expect(r.success).toBe(true);
  });

  it("rejects an unknown roast level", () => {
    const bad = { ...DEMO_PROFILE, bean: { ...DEMO_PROFILE.bean, roastLevel: "burnt" } };
    expect(BeanProfileSchema.safeParse(bad).success).toBe(false);
  });
});

describe("clampProfile", () => {
  const wild = {
    ...DEMO_PROFILE,
    flavour: { ...DEMO_PROFILE.flavour, acidity: 9, body: 0 },
    recipe: {
      ...DEMO_PROFILE.recipe,
      doseG: 30,
      yieldG: 200,
      tempC: 100,
      preinfusion: { pressureBar: 9, seconds: 40 },
      timeMin: 50,
      timeMax: 20,
      grind: { direction: "finer" as const, steps: 12, advice: "x" },
    },
  };

  it("clamps to Meraki Gen 2 limits", () => {
    const r = clampProfile(wild).recipe;
    expect(r.tempC).toBe(96);
    expect(r.doseG).toBe(22);
    expect(r.yieldG).toBe(77); // 22 × 3.5
    expect(r.preinfusion).toEqual({ pressureBar: 4, seconds: 15 });
    expect(r.grind.steps).toBe(6);
  });

  it("keeps pre-infusion to what the Meraki offers: 3 or 4 bar for 5–15 s, in whole steps", () => {
    const at = (pressureBar: number, seconds: number) =>
      clampProfile({ ...DEMO_PROFILE, recipe: { ...DEMO_PROFILE.recipe, preinfusion: { pressureBar, seconds } } }).recipe
        .preinfusion;
    expect(at(2, 5)).toEqual({ pressureBar: 3, seconds: 5 });
    expect(at(1, 0)).toEqual({ pressureBar: 3, seconds: 5 });
    expect(at(3.5, 7.4)).toEqual({ pressureBar: 4, seconds: 7 });
    expect(at(3.4, 12.6)).toEqual({ pressureBar: 3, seconds: 13 });
  });

  it("orders and bounds the shot time", () => {
    const r = clampProfile(wild).recipe;
    expect(r.timeMin).toBe(20);
    expect(r.timeMax).toBe(45);
  });

  it("keeps a ratio of at least 1:1 and the flavour scale within 1–5", () => {
    const low = clampProfile({ ...DEMO_PROFILE, recipe: { ...DEMO_PROFILE.recipe, doseG: 18, yieldG: 5, tempC: 70 } });
    expect(low.recipe.yieldG).toBe(18);
    expect(low.recipe.tempC).toBe(85);
    const f = clampProfile(wild).flavour;
    expect(f.acidity).toBe(5);
    expect(f.body).toBe(1);
  });
});
