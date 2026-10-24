import { z } from "zod";
import { NOTE_PHOTO_IDS } from "./tasting-notes";

// The schema doubles as a structured-output format for Claude, so it avoids numeric
// min/max constraints and optional fields. Machine limits are enforced by clampProfile.

export const ROAST_LEVELS = ["light", "medium-light", "medium", "medium-dark", "dark"] as const;
export type RoastLevel = (typeof ROAST_LEVELS)[number];

export const DRINK_IDS = [
  "ristretto",
  "espresso",
  "doppio",
  "lungo",
  "americano",
  "long-black",
  "macchiato",
  "cortado",
  "piccolo",
  "flat-white",
  "cappuccino",
  "latte",
] as const;
export type DrinkId = (typeof DRINK_IDS)[number];

export const BaseRecipeSchema = z.object({
  doseG: z.number().describe("Dose in grams for the 58 mm double basket"),
  yieldG: z.number().describe("Espresso yield (beverage weight) in grams"),
  tempC: z.number().describe("Brew boiler temperature in °C (Meraki range 85–96)"),
  preinfusion: z.object({
    pressureBar: z.number().describe("Pre-infusion pressure in whole bar: 3 or 4"),
    seconds: z.number().describe("Pre-infusion duration in whole seconds (5–15), or 0 to switch it off"),
  }),
  timeMin: z.number().describe("Target shot time lower bound in seconds, from pump start"),
  timeMax: z.number().describe("Target shot time upper bound in seconds"),
  grind: z.object({
    direction: z.enum(["finer", "same", "coarser"]),
    steps: z.number().describe("Grinder steps relative to the user's usual medium-roast espresso setting (0–6)"),
    advice: z.string(),
  }),
});
export type BaseRecipe = z.infer<typeof BaseRecipeSchema>;

export const BeanProfileSchema = z.object({
  identified: z.boolean().describe("false when the query is not a coffee or cannot be identified"),
  reason: z.string().nullable().describe("When identified is false: why, and how to refine the search"),
  confidence: z.enum(["high", "medium", "low"]),
  bean: z.object({
    name: z.string(),
    roaster: z.string().nullable(),
    origin: z.string().describe("Country, or 'Blend'"),
    region: z.string().nullable(),
    process: z.string().describe("e.g. Washed, Natural, Honey, Anaerobic"),
    variety: z.string().nullable(),
    altitude: z.string().nullable().describe("e.g. '1,900–2,200 masl'"),
    roastLevel: z.enum(ROAST_LEVELS),
    description: z.string().describe("Two or three sentences on the coffee's story and character"),
  }),
  flavour: z.object({
    notes: z
      .array(
        z.object({
          name: z.string().describe("The note as the drinker would say it, e.g. 'Toasted hazelnut'"),
          role: z.string().describe("Its part in the cup in a few words, e.g. 'the main impression', 'a gentle sweetness', 'mostly in the aroma'"),
          description: z
            .string()
            .describe("Two short sentences in everyday food terms: what it is like, how strong, and when you notice it"),
          photo: z.enum(NOTE_PHOTO_IDS).describe("The closest photo in the library; for a rare note pick its nearest family"),
        }),
      )
      .describe("3–5 tasting notes, the most noticeable first"),
    acidity: z.number().describe("1–5"),
    sweetness: z.number().describe("1–5"),
    body: z.number().describe("1–5"),
    creaminess: z.number().describe("Smooth, silky texture 1–5, judged separately from body (weight)"),
    bitterness: z.number().describe("1–5"),
    finish: z.number().describe("Aftertaste length 1–5"),
    character: z.string().describe("How it tastes as espresso, one or two sentences"),
  }),
  recipe: BaseRecipeSchema,
  dialIn: z
    .array(z.object({ symptom: z.string(), fix: z.string() }))
    .describe("3–5 bean-specific symptom → fix pairs using only Meraki controls"),
  tips: z.object({
    restDays: z.object({ min: z.number(), max: z.number() }).describe("Days to rest after roast date"),
    water: z.string(),
    basket: z.string(),
    milk: z.string().describe("How this coffee behaves with milk"),
    extras: z.array(z.string()),
  }),
  bestDrinks: z.array(z.enum(DRINK_IDS)).describe("1–3 drinks where this coffee shines"),
  drinkNotes: z.array(z.object({ drink: z.enum(DRINK_IDS), note: z.string() })),
  sources: z.array(z.string()).describe("URLs consulted"),
});
export type BeanProfile = z.infer<typeof BeanProfileSchema>;

export interface DrinkRecipe {
  id: DrinkId;
  name: string;
  kind: "black" | "milk";
  description: string;
  doseG: number;
  yieldG: number;
  ratio: string;
  timeMin: number;
  timeMax: number;
  tempC: number;
  grind: string;
  cup: string;
  water?: { ml: number; tempC: number; order: "water-first" | "shot-first" };
  milk?: { ml: number; steamMl: number; steamTempC: number; texture: string };
  method: string;
  note?: string;
}

export type BrewResult = BeanProfile & {
  query: string;
  drinks: DrinkRecipe[];
  createdAt: string;
  model: string;
};

export const LIMITS = {
  tempC: [85, 96],
  doseG: [14, 22],
  ratio: [1, 3.5],
  // The Meraki Gen 2 offers 3 or 4 bar for 5–15 s, in whole steps, or pre-infusion off (0 s).
  pressureBar: [3, 4],
  preinfusionS: [5, 15],
  timeS: [15, 45],
  grindSteps: [0, 6],
  scale: [1, 5],
} as const;

export const clamp = (v: number, [lo, hi]: readonly [number, number]) =>
  Math.min(hi, Math.max(lo, Number.isFinite(v) ? v : lo));
export const roundTo = (v: number, step: number) => Math.round(v / step) * step;

/**
 * Pre-infusion the Meraki can actually be set to: 0 s means off, any other time snaps into 5–15 s.
 * Also applied to results saved before the limits changed.
 */
export const clampPreinfusion = (p: BaseRecipe["preinfusion"]): BaseRecipe["preinfusion"] => ({
  pressureBar: Math.round(clamp(p.pressureBar, LIMITS.pressureBar)),
  seconds: p.seconds <= 0 ? 0 : Math.round(clamp(p.seconds, LIMITS.preinfusionS)),
});

export function clampProfile(p: BeanProfile): BeanProfile {
  const r = p.recipe;
  const doseG = roundTo(clamp(r.doseG, LIMITS.doseG), 0.5);
  const ratio = clamp(r.yieldG / (r.doseG || doseG), LIMITS.ratio);
  const [t1, t2] = [r.timeMin, r.timeMax].map((t) => Math.round(clamp(t, LIMITS.timeS)));
  const scale = (v: number) => Math.round(clamp(v, LIMITS.scale));
  return {
    ...p,
    flavour: {
      ...p.flavour,
      acidity: scale(p.flavour.acidity),
      sweetness: scale(p.flavour.sweetness),
      body: scale(p.flavour.body),
      creaminess: scale(p.flavour.creaminess),
      bitterness: scale(p.flavour.bitterness),
      finish: scale(p.flavour.finish),
    },
    recipe: {
      ...r,
      doseG,
      yieldG: roundTo(doseG * ratio, 0.5),
      tempC: Math.round(clamp(r.tempC, LIMITS.tempC)),
      preinfusion: clampPreinfusion(r.preinfusion),
      timeMin: Math.min(t1, t2),
      timeMax: Math.max(t1, t2),
      grind: { ...r.grind, steps: Math.round(clamp(r.grind.steps, LIMITS.grindSteps)) },
    },
  };
}
