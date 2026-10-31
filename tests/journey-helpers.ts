import { DEMO_PROFILE } from "@/lib/fixtures";
import type { JourneyFacts } from "@/lib/journey/facts";
import type { BeanProfile, BrewResult } from "@/lib/schema";

export const EMPTY_FACTS: JourneyFacts = {
  roasterCity: null,
  roasterCountry: null,
  producer: null,
  picking: null,
  setting: null,
  drying: null,
  dryingDays: null,
  fermentation: null,
  grade: null,
  harvestMonths: null,
  special: null,
  regionCoords: null,
  sources: [],
};

/** A stored lookup built on DEMO_PROFILE (medium confidence, no roaster), with bean or flavour overrides. */
export const brew = (
  bean: Partial<BeanProfile["bean"]> = {},
  flavour: Partial<Omit<BeanProfile["flavour"], "notes">> & { notes?: (BeanProfile["flavour"]["notes"][number] | string)[] } = {},
): BrewResult =>
  ({
    ...DEMO_PROFILE,
    bean: { ...DEMO_PROFILE.bean, ...bean },
    flavour: { ...DEMO_PROFILE.flavour, ...flavour },
    query: DEMO_PROFILE.bean.name,
    drinks: [],
    createdAt: "2026-10-21T08:00:00.000Z",
    model: "demo",
  }) as BrewResult;

/** brew() with researched journey facts attached. */
export const withFacts = (facts: Partial<JourneyFacts>, bean: Partial<BeanProfile["bean"]> = {}): BrewResult => ({
  ...brew(bean),
  journey: { facts: { ...EMPTY_FACTS, ...facts }, createdAt: "2026-10-21T08:05:00.000Z" },
});
