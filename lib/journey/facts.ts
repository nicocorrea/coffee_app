import { z } from "zod";

const sourced = <T extends z.ZodType>(v: T) =>
  z.object({ value: v, source: z.string().describe("URL that states it") }).nullable();

export const JourneyFactsSchema = z.object({
  roasterCity: z.string().nullable(),
  roasterCountry: z.string().nullable(),
  producer: z
    .object({
      name: z.string(),
      kind: z.enum(["farm", "washing station", "cooperative", "smallholders"]),
      source: z.string(),
    })
    .nullable(),
  picking: sourced(z.enum(["hand", "machine"])),
  setting: sourced(z.enum(["forest", "shade", "sun"])),
  drying: sourced(z.enum(["raised-beds", "patio", "mechanical"])),
  dryingDays: sourced(z.object({ min: z.number(), max: z.number() })),
  fermentation: sourced(z.string()),
  grade: sourced(z.string()),
  harvestMonths: sourced(z.string()),
  special: sourced(z.string()),
  regionCoords: z.object({ lat: z.number(), lon: z.number() }).nullable(),
  sources: z.array(z.string()),
});
export type JourneyFacts = z.infer<typeof JourneyFactsSchema>;
export type StoredJourney = { facts: JourneyFacts; createdAt: string };
