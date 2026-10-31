// A pill colour for a tasting note, by what it names (else the next of a few house colours).
const FLAVOURS: [RegExp, string][] = [
  [/jasmin|flor|flower|blossom|bergamot|tea|honeysuckle|elder|lavender|rose|hibiscus/i, "#fbf8f5"],
  [/blue|blackberr|blackcurrant|cassis|grape|plum|violet|fig/i, "#5b4a8a"],
  [/straw|raspberr|cherr|red|cranberr|pomegranate|watermelon|currant/i, "#c0392b"],
  [/choc|cocoa|cacao|molasses|tobacco/i, "#3a2015"],
  [/lemon|lime|citrus|grapefruit|yuzu|lemongrass/i, "#e9cf5a"],
  [/orange|mandarin|tangerine|apricot|peach|nectarine|mango|passion|tropical|papaya|pineapple/i, "#e08a3c"],
  [/caramel|toffee|honey|sugar|maple|butterscotch|syrup|vanilla|brown/i, "#c08e57"],
  [/nut|almond|hazel|pecan|walnut|praline|marzipan/i, "#a8835a"],
  [/apple|pear|green|grass|herb|melon|kiwi/i, "#8c9873"],
  [/wine|rum|whisk|boozy|liqueur/i, "#7a2a3a"],
  [/spice|cinnamon|clove|pepper|cardamom|nutmeg|ginger/i, "#9a5a32"],
];
const HOUSE = ["#a84f3a", "#8c9873", "#c08e57", "#6e4128"];

const INK = "#2a1c15";
const WHITE = "#ffffff";

/** A note's pill: its fill, the more legible of dark ink or white for its text, and an outline when it is pale. */
export function pillLook(note: string, i: number) {
  const fill = FLAVOURS.find(([re]) => re.test(note))?.[1] ?? HOUSE[i % HOUSE.length];
  const text = contrast(fill, INK) >= contrast(fill, WHITE) ? INK : WHITE;
  return { fill, text, stroke: contrast(fill, WHITE) < 1.6 ? "#ded2c6" : "none" };
}

/** Every colour a pill can have. */
export const PILL_FILLS = [...new Set([...FLAVOURS.map(([, f]) => f), ...HOUSE])];

// WCAG 2 relative luminance and contrast ratio, on linearised sRGB.
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const relLum = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export function contrast(a: string, b: string): number {
  const [x, y] = [relLum(a), relLum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
