import type { BeanProfile } from "./schema";

/**
 * The tasting-note photos in public/notes, keyed by file name, with what each one shows.
 * Claude picks the closest photo for every note, so a rare note lands on its nearest family.
 */
export const NOTE_PHOTOS = {
  "dark-chocolate": "Dark chocolate",
  "milk-chocolate": "Milk chocolate",
  cocoa: "Cocoa powder",
  hazelnut: "Hazelnuts",
  almond: "Almonds",
  peanut: "Peanuts",
  walnut: "Walnuts",
  caramel: "Caramel",
  "brown-sugar": "Brown sugar",
  honey: "Honey",
  "maple-syrup": "Maple syrup",
  vanilla: "Vanilla pods",
  orange: "Oranges",
  lemon: "Lemons",
  lime: "Limes",
  grapefruit: "Grapefruit",
  blueberry: "Blueberries",
  strawberry: "Strawberries",
  raspberry: "Raspberries",
  blackberry: "Blackberries",
  blackcurrant: "Blackcurrants",
  cherry: "Cherries",
  grape: "Red grapes",
  peach: "Peaches",
  apricot: "Apricots",
  plum: "Plums",
  "green-apple": "Green apples",
  "red-apple": "Red apples",
  pear: "Pears",
  mango: "Mango",
  pineapple: "Pineapple",
  "passion-fruit": "Passion fruit",
  banana: "Bananas",
  coconut: "Coconut",
  lychee: "Lychees",
  raisin: "Raisins",
  fig: "Figs",
  jasmine: "Jasmine flowers",
  rose: "Roses",
  hibiscus: "Hibiscus",
  lavender: "Lavender",
  "black-tea": "Black tea",
  "green-tea": "Green tea",
  cinnamon: "Cinnamon sticks",
  clove: "Cloves",
  cardamom: "Cardamom pods",
  nutmeg: "Nutmeg",
  "black-pepper": "Black peppercorns",
  ginger: "Ginger root",
  toast: "Toasted bread",
  biscuit: "Biscuits",
  tobacco: "Tobacco leaves",
  cedar: "Cedar wood",
  smoke: "Smoke",
  "red-wine": "Red wine",
  butter: "Butter",
  cream: "Cream",
  herbs: "Fresh herbs",
} as const;

export type NotePhoto = keyof typeof NOTE_PHOTOS;
export const NOTE_PHOTO_IDS = Object.keys(NOTE_PHOTOS) as [NotePhoto, ...NotePhoto[]];

export const notePhotoSrc = (photo: NotePhoto) => `/notes/${photo}.jpg`;

/**
 * Words that pick a note's photo, matched at the start of a word in the note's name. The first entry
 * that matches wins, so specific foods come before the general ones they contain ("milk chocolate"
 * before "chocolate", "butterscotch" before "butter", "rosemary" before "rose").
 */
const PHOTO_WORDS: [NotePhoto, string[]][] = [
  ["milk-chocolate", ["milk chocolate"]],
  ["dark-chocolate", ["dark chocolate", "bittersweet", "chocolate"]],
  ["cocoa", ["cocoa", "cacao", "nib"]],
  ["peanut", ["peanut"]],
  ["hazelnut", ["hazelnut", "praline", "gianduja"]],
  ["almond", ["almond", "marzipan", "amaretto", "cashew"]],
  ["walnut", ["walnut", "pecan"]],
  ["caramel", ["caramel", "butterscotch", "toffee", "dulce de leche", "burnt sugar", "fudge"]],
  ["maple-syrup", ["maple"]],
  ["jasmine", ["jasmine", "orange blossom", "honeysuckle", "elderflower", "white flower", "floral", "flower"]],
  ["honey", ["honey"]],
  ["brown-sugar", ["brown sugar", "molasses", "panela", "muscovado", "rapadura", "demerara", "treacle", "cane sugar", "sugar cane", "raw sugar"]],
  ["vanilla", ["vanilla"]],
  ["herbs", ["rosemary", "lemongrass", "peppermint", "spearmint", "mint", "basil", "thyme", "sage", "herb", "grass"]],
  ["rose", ["rose"]],
  ["hibiscus", ["hibiscus"]],
  ["lavender", ["lavender", "violet"]],
  ["green-tea", ["green tea", "matcha"]],
  ["black-tea", ["black tea", "earl grey", "tea"]],
  ["green-apple", ["green apple", "granny smith"]],
  ["red-apple", ["apple", "cider"]],
  ["grapefruit", ["grapefruit", "pomelo"]],
  ["orange", ["orange", "mandarin", "tangerine", "clementine", "satsuma", "bergamot", "marmalade", "citrus"]],
  ["lemon", ["lemon"]],
  ["lime", ["lime"]],
  ["blackcurrant", ["blackcurrant", "black currant", "cassis"]],
  ["blueberry", ["blueberr"]],
  ["strawberry", ["strawberr"]],
  ["raspberry", ["raspberr", "cranberr", "redcurrant", "red currant", "red fruit", "red berr", "pomegranate"]],
  ["blackberry", ["blackberr", "boysenberr", "mulberr", "berry", "berries"]],
  ["cherry", ["cherr", "kirsch", "maraschino"]],
  ["grape", ["grape", "concord", "muscat"]],
  ["peach", ["peach", "nectarine", "stone fruit"]],
  ["apricot", ["apricot"]],
  ["plum", ["plum", "prune"]],
  ["pear", ["pear"]],
  ["mango", ["mango", "tropical"]],
  ["pineapple", ["pineapple"]],
  ["passion-fruit", ["passion fruit", "passionfruit", "maracuy"]],
  ["banana", ["banana", "plantain"]],
  ["coconut", ["coconut"]],
  ["lychee", ["lychee", "litchi", "rambutan"]],
  ["raisin", ["raisin", "sultana", "dried fruit", "currant"]],
  ["fig", ["fig", "date", "tamarind"]],
  ["clove", ["clove"]],
  ["cardamom", ["cardamom"]],
  ["nutmeg", ["nutmeg", "mace", "allspice"]],
  ["black-pepper", ["pepper"]],
  ["ginger", ["ginger"]],
  ["cinnamon", ["cinnamon", "anise", "spice"]],
  ["smoke", ["smok", "ash", "charred", "campfire"]],
  ["tobacco", ["tobacco", "leather", "pipe"]],
  ["cedar", ["cedar", "wood", "oak", "earth"]],
  ["red-wine", ["wine", "port", "rum", "brandy", "whisk", "liqueur", "boozy", "sherry"]],
  ["butter", ["butter"]],
  ["cream", ["cream", "milk", "custard", "yogurt", "yoghurt"]],
  ["toast", ["toast", "bread", "roast"]],
  ["biscuit", ["biscuit", "cookie", "shortbread", "graham", "cracker", "pastry", "cereal", "malt", "grain", "oat", "wafer"]],
  ["hazelnut", ["nut"]],
  ["brown-sugar", ["sugar"]],
];

const PHOTO_PATTERNS = PHOTO_WORDS.map(([photo, words]) => [photo, new RegExp(`\\b(?:${words.join("|")})`, "i")] as const);

/** The library photo for a tasting note, or null when nothing in its name matches. */
export function photoFor(name: string): NotePhoto | null {
  return PHOTO_PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? null;
}

export type TastingNote = BeanProfile["flavour"]["notes"][number];

/** Results saved before notes were described hold plain words; those still show as a simple list. */
export const isDetailedNote = (note: TastingNote | string): note is TastingNote =>
  typeof note === "object" && note !== null && typeof note.description === "string";
