import type { BeanProfile } from "./schema";

export type FlavourKey = keyof Pick<BeanProfile["flavour"], "acidity" | "sweetness" | "body" | "creaminess" | "bitterness" | "finish">;
export type FlavourLevel = "low" | "mid" | "high";

export interface FlavourDimension {
  key: FlavourKey;
  label: string;
  what: string;
  levels: Record<FlavourLevel, { label: string; example: string }>;
  /** What it means when this quality tastes wrong, and the Meraki fix. */
  fault?: string;
}

/** Plain-language explanations of the flavour chart, in chart order. */
export const FLAVOUR_DIMENSIONS: FlavourDimension[] = [
  {
    key: "acidity",
    label: "Acidity",
    what: "The bright, lively feeling on the sides of your tongue that makes your mouth water. Good acidity is juicy, like fresh fruit. It isn’t the same as sour.",
    levels: {
      low: { label: "Low", example: "Soft and round, like a ripe banana or sweet bread." },
      mid: { label: "Medium", example: "A gentle brightness, like a red apple." },
      high: {
        label: "High",
        example: "Bright and juicy, like an orange, a strawberry or a green apple. Typical of Ethiopian and Kenyan coffees.",
      },
    },
    fault: "Sour like vinegar or unsweetened lemon? That’s under-extraction, not acidity. Grind finer or raise the temperature.",
  },
  {
    key: "sweetness",
    label: "Sweetness",
    what: "The coffee’s natural sugars: a round, pleasant taste that balances acidity and bitterness.",
    levels: {
      low: { label: "Low", example: "Plain, like dry toast." },
      mid: { label: "Medium", example: "Lightly sweet, like a ripe pear." },
      high: {
        label: "High",
        example: "Like caramel, honey, dulce de leche or very ripe fruit. A sweet espresso needs no sugar.",
      },
    },
  },
  {
    key: "body",
    label: "Body",
    what: "The weight in your mouth, not the flavour: how thin or thick the coffee feels. A heavy coffee isn’t always smooth; that’s creaminess.",
    levels: {
      low: { label: "Light", example: "Thin, like water, tea or apple juice." },
      mid: { label: "Medium", example: "Like skimmed milk." },
      high: {
        label: "Heavy",
        example: "Full and weighty, like tomato juice or peach nectar. Common in Brazilian coffees and darker roasts.",
      },
    },
  },
  {
    key: "creaminess",
    label: "Creaminess",
    what: "How smooth and silky the coffee feels as it coats your mouth. Body is how heavy it is; creaminess is how soft. A coffee can be heavy but rough, or light but silky.",
    levels: {
      low: { label: "Rough", example: "Dry or a little gritty, like strong black tea or unripe fruit skin." },
      mid: { label: "Smooth", example: "Soft and even, like a cup of cocoa made with water." },
      high: {
        label: "Creamy",
        example: "Silky and velvety, like melted chocolate or heavy cream. Typical of Italian-style blends with Brazilian coffee.",
      },
    },
  },
  {
    key: "bitterness",
    label: "Bitterness",
    what: "The bitterness you feel at the back of your tongue. A little gives the coffee structure; too much is unpleasant.",
    levels: {
      low: { label: "Low", example: "Gentle, like milk chocolate." },
      mid: { label: "Medium", example: "Noticeable, like 70% dark chocolate." },
      high: {
        label: "High",
        example: "Strong, like 90% chocolate, an IPA or rocket (arugula). Darker roasts are more bitter.",
      },
    },
    fault: "Harsh and drying, like tea left to steep too long? That’s over-extraction. Grind coarser or lower the temperature.",
  },
  {
    key: "finish",
    label: "Finish",
    what: "How long the flavour stays after you swallow, and whether what stays is pleasant. Also called aftertaste.",
    levels: {
      low: { label: "Short", example: "Gone almost at once, like sparkling water." },
      mid: { label: "Medium", example: "Lingers for a few seconds." },
      high: {
        label: "Long",
        example: "Stays for 30 seconds or more, like good dark chocolate or red wine. A great espresso leaves a long, sweet finish.",
      },
    },
  },
];

export const levelOf = (score: number): FlavourLevel => (score <= 2 ? "low" : score === 3 ? "mid" : "high");

/** A coffee's score for one quality, or null for results saved before that quality existed. */
export const scoreOf = (flavour: BeanProfile["flavour"], key: FlavourKey): number | null =>
  typeof flavour[key] === "number" ? flavour[key] : null;

export function describeScore(key: FlavourKey, score: number) {
  const dimension = FLAVOUR_DIMENSIONS.find((d) => d.key === key)!;
  return dimension.levels[levelOf(score)];
}

/** Ask these in order while tasting a shot. */
export const TASTING_QUESTIONS: { question: string; answers: FlavourKey }[] = [
  { question: "Does it make your mouth water?", answers: "acidity" },
  { question: "Does it taste round and pleasant?", answers: "sweetness" },
  { question: "Does it feel thin or heavy?", answers: "body" },
  { question: "Does it feel silky or rough?", answers: "creaminess" },
  { question: "Does it catch at the back of your tongue?", answers: "bitterness" },
  { question: "How long does the taste last?", answers: "finish" },
];
