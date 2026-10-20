import { clamp, LIMITS, roundTo, type BaseRecipe, type DrinkId, type DrinkRecipe, type RoastLevel } from "./schema";

type Shot = "ristretto" | "split" | "double" | "lungo";

export interface DrinkDef {
  id: DrinkId;
  name: string;
  kind: "black" | "milk";
  shot: Shot;
  description: string;
  cup: string;
  water?: { ml: number; tempC: number; order: "water-first" | "shot-first" };
  milk?: { ml: number; baseTempC: number; texture: string };
  method: string;
}

export const DRINKS: DrinkDef[] = [
  {
    id: "ristretto",
    name: "Ristretto",
    kind: "black",
    shot: "ristretto",
    description: "A short, syrupy shot — the sweetest, most concentrated expression of the bean.",
    cup: "Pre-warmed demitasse (60–90 ml)",
    method: "Same dose, stop early. Expect a thick, honeyed body with muted bitterness.",
  },
  {
    id: "espresso",
    name: "Espresso",
    kind: "black",
    shot: "split",
    description: "The classic single: a balanced shot with crema, body and clarity.",
    cup: "Pre-warmed demitasse (60–90 ml)",
    method: "Pull the double through a spouted portafilter and split it between two cups.",
  },
  {
    id: "doppio",
    name: "Doppio",
    kind: "black",
    shot: "double",
    description: "The double shot — your reference recipe and the base of every milk drink.",
    cup: "Pre-warmed espresso cup (90–120 ml)",
    method: "Your dialled-in base recipe. Taste this first before changing anything.",
  },
  {
    id: "lungo",
    name: "Lungo",
    kind: "black",
    shot: "lungo",
    description: "A long pull — lighter body, more clarity, more of the bean's top notes.",
    cup: "Pre-warmed cup (120–150 ml)",
    method: "Grind a little coarser so the longer pull doesn't turn harsh and astringent.",
  },
  {
    id: "americano",
    name: "Americano",
    kind: "black",
    shot: "double",
    description: "Espresso lengthened with hot water — gentle, clean and easy to drink.",
    cup: "Mug (250–300 ml)",
    water: { ml: 150, tempC: 90, order: "shot-first" },
    method: "Pull the shot, then top up with hot water.",
  },
  {
    id: "long-black",
    name: "Long black",
    kind: "black",
    shot: "double",
    description: "Water first, shot on top — keeps the crema intact and the cup more aromatic.",
    cup: "Cup (200–250 ml)",
    water: { ml: 120, tempC: 90, order: "water-first" },
    method: "Add hot water to the cup first, then pull the shot directly on top.",
  },
  {
    id: "macchiato",
    name: "Macchiato",
    kind: "milk",
    shot: "double",
    description: "Espresso 'stained' with a spoonful of foam — coffee-forward with a soft edge.",
    cup: "Espresso cup (90–120 ml)",
    milk: { ml: 15, baseTempC: 60, texture: "A spoonful of dense, glossy foam" },
    method: "Pull the shot, then spoon a small dollop of foam on top.",
  },
  {
    id: "cortado",
    name: "Cortado",
    kind: "milk",
    shot: "double",
    description: "Equal-ish parts espresso and warm milk — round, sweet and punchy.",
    cup: "Gibraltar glass (130–150 ml)",
    milk: { ml: 60, baseTempC: 58, texture: "Thin and glossy, barely any foam" },
    method: "Pull the shot into the glass and pour the milk in gently, with almost no foam.",
  },
  {
    id: "piccolo",
    name: "Piccolo",
    kind: "milk",
    shot: "ristretto",
    description: "A ristretto topped with silky milk in a small glass — intense yet smooth.",
    cup: "Small glass (90–120 ml)",
    milk: { ml: 80, baseTempC: 58, texture: "Silky microfoam, about 0.5 cm" },
    method: "Pull a ristretto and pour the milk in a fine stream to finish.",
  },
  {
    id: "flat-white",
    name: "Flat white",
    kind: "milk",
    shot: "double",
    description: "A double with a thin layer of velvety microfoam — the coffee still leads.",
    cup: "Cup (160–180 ml)",
    milk: { ml: 120, baseTempC: 60, texture: "Thin, velvety microfoam (~0.5 cm)" },
    method: "Pour low and steady so the microfoam folds into the crema.",
  },
  {
    id: "cappuccino",
    name: "Cappuccino",
    kind: "milk",
    shot: "double",
    description: "Espresso, steamed milk and a generous cap of airy-but-silky foam.",
    cup: "Cup (180–200 ml)",
    milk: { ml: 150, baseTempC: 62, texture: "Airy but silky foam (~1–1.5 cm)" },
    method: "Stretch the milk a little longer, then pour with a higher start to build the cap.",
  },
  {
    id: "latte",
    name: "Latte",
    kind: "milk",
    shot: "double",
    description: "A milky, mellow cup — the coffee becomes a sweet backdrop.",
    cup: "Glass or cup (260–300 ml)",
    milk: { ml: 220, baseTempC: 60, texture: "Silky microfoam (~1 cm)" },
    method: "Pour steadily for a smooth, integrated cup; finish with latte art.",
  },
];

/** The Meraki auto-steam probe needs at least ~180 ml in the jug to read accurately. */
export const MIN_STEAM_ML = 180;

const MILK_TEMP_OFFSET: Record<RoastLevel, number> = {
  light: -2,
  "medium-light": -2,
  medium: 0,
  "medium-dark": 1,
  dark: 1,
};

const g = (v: number) => roundTo(v, 0.5);
const ratioLabel = (dose: number, out: number) => `1:${Number((out / dose).toFixed(1))}`;

export function deriveDrinks(
  base: BaseRecipe,
  roast: RoastLevel,
  notes: { drink: DrinkId; note: string }[] = [],
): DrinkRecipe[] {
  const dose = g(base.doseG);
  const ratio = base.yieldG / base.doseG;
  const tMin = (offset: number) => Math.round(clamp(base.timeMin + offset, LIMITS.timeS));
  const tMax = (offset: number) => Math.round(clamp(base.timeMax + offset, LIMITS.timeS));

  const shots: Record<Shot, Pick<DrinkRecipe, "doseG" | "yieldG" | "timeMin" | "timeMax" | "tempC" | "grind" | "ratio">> = {
    double: {
      doseG: dose,
      yieldG: g(dose * ratio),
      ratio: ratioLabel(dose, g(dose * ratio)),
      timeMin: tMin(0),
      timeMax: tMax(0),
      tempC: base.tempC,
      grind: "Your dialled-in setting",
    },
    split: {
      doseG: g(dose / 2),
      yieldG: g((dose * ratio) / 2),
      ratio: ratioLabel(g(dose / 2), g((dose * ratio) / 2)),
      timeMin: tMin(0),
      timeMax: tMax(0),
      tempC: base.tempC,
      grind: "Your dialled-in setting",
    },
    ristretto: (() => {
      const out = g(dose * clamp(ratio - 1, [1, 1.5]));
      return {
        doseG: dose,
        yieldG: out,
        ratio: ratioLabel(dose, out),
        timeMin: tMin(-8),
        timeMax: tMax(-8),
        tempC: base.tempC,
        grind: "Same setting — or 1 step finer if it runs fast",
      };
    })(),
    lungo: (() => {
      const out = g(dose * Math.min(ratio + 1, LIMITS.ratio[1]));
      return {
        doseG: dose,
        yieldG: out,
        ratio: ratioLabel(dose, out),
        timeMin: tMin(10),
        timeMax: tMax(10),
        tempC: Math.round(clamp(base.tempC - 1, LIMITS.tempC)),
        grind: "1–2 steps coarser",
      };
    })(),
  };

  return DRINKS.map((d) => {
    const shot = shots[d.shot];
    const recipe: DrinkRecipe = {
      id: d.id,
      name: d.name,
      kind: d.kind,
      description: d.description,
      ...shot,
      cup: d.cup,
      method: d.method,
    };
    if (d.water) recipe.water = { ...d.water };
    if (d.milk) {
      recipe.milk = {
        ml: d.milk.ml,
        steamMl: Math.max(MIN_STEAM_ML, d.milk.ml + 20),
        steamTempC: d.milk.baseTempC + MILK_TEMP_OFFSET[roast],
        texture: d.milk.texture,
      };
    }
    const note = notes.find((n) => n.drink === d.id)?.note;
    if (note) recipe.note = note;
    return recipe;
  });
}

/** The classic reference recipe used by the Guide page. */
export const CLASSIC_BASE: BaseRecipe = {
  doseG: 18,
  yieldG: 36,
  tempC: 93,
  preinfusion: { pressureBar: 2, seconds: 5 },
  timeMin: 25,
  timeMax: 30,
  grind: { direction: "same", steps: 0, advice: "Your usual espresso setting." },
};
