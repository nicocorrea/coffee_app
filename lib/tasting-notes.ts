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

export type TastingNote = BeanProfile["flavour"]["notes"][number];

/** Results saved before notes had photos hold plain words; those still show as a simple list. */
export const isDetailedNote = (note: TastingNote | string): note is TastingNote =>
  typeof note === "object" && note !== null && note.photo in NOTE_PHOTOS;
