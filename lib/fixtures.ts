import type { BeanProfile } from "./schema";

/** Served by /api/brew when DEMO_MODE=1, so the UI works without an API key. */
export const DEMO_PROFILE: BeanProfile = {
  identified: true,
  reason: null,
  confidence: "medium",
  bean: {
    name: "Guji Hambela Natural",
    roaster: null,
    origin: "Ethiopia",
    region: "Hambela Wamena, Guji",
    process: "Natural",
    variety: "Ethiopian Heirloom (74110, 74112)",
    altitude: "1,950–2,200 masl",
    roastLevel: "light",
    description:
      "Grown by smallholders in the high forests of Guji and dried whole-cherry on raised beds. Naturals from Hambela are prized for their exuberant fruit and perfumed florals.",
  },
  flavour: {
    notes: ["Blueberry", "Strawberry jam", "Jasmine", "Dark chocolate", "Bergamot"],
    acidity: 4,
    sweetness: 5,
    body: 3,
    bitterness: 2,
    finish: 4,
    character:
      "As espresso it's a fruit bomb — jammy berries up front, florals on the nose and a cocoa finish once it's extracted fully.",
  },
  recipe: {
    doseG: 18,
    yieldG: 40,
    tempC: 94,
    preinfusion: { pressureBar: 2, seconds: 8 },
    timeMin: 28,
    timeMax: 33,
    grind: {
      direction: "finer",
      steps: 2,
      advice:
        "Light, dense beans resist extraction — start about 2 steps finer than your usual medium-roast setting.",
    },
  },
  dialIn: [
    { symptom: "Sour, thin, sharp", fix: "Go 1 step finer or raise the temperature by 1 °C (up to 96 °C)." },
    { symptom: "Fruity but hollow", fix: "Lengthen the yield to 42–44 g to pull out more sweetness." },
    { symptom: "Bitter, drying finish", fix: "Go 1 step coarser or drop the temperature to 93 °C." },
    { symptom: "Channeling / spurts", fix: "Extend pre-infusion to 10 s and check your distribution (WDT)." },
  ],
  tips: {
    restDays: { min: 10, max: 21 },
    water: "Soft water around 80–120 ppm total hardness keeps the florals bright.",
    basket: "Use the 18 g double basket; a precision basket helps with light roasts.",
    milk: "Berry notes turn to strawberry milkshake in small milk drinks; they fade in large lattes.",
    extras: ["Pre-heat cups — light roasts lose sweetness quickly as they cool.", "Taste after 2 minutes; naturals open up as they cool slightly."],
  },
  bestDrinks: ["espresso", "piccolo", "cortado"],
  drinkNotes: [
    { drink: "piccolo", note: "The ristretto base keeps the berry jam front and centre." },
    { drink: "latte", note: "The fruit fades under 220 ml of milk — try a flat white instead." },
  ],
  sources: [],
};
