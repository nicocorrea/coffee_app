import { photoFor } from "@/lib/tasting-notes";
import type { RoastLevel } from "@/lib/schema";
import type { Drying, Fact, Journey, ProcessKind, Producer, Range, StageId } from "./types";

// Plain strings. `<b>` is the only markup; the UI splits on it and never uses dangerouslySetInnerHTML.
// Wording follows provenance: a sentence about a "usual" fact says "usually" or "typically".

export const STAGE_LABELS: Record<StageId, string> = {
  cover: "Origin",
  grown: "Grown",
  picked: "Picked",
  processed: "Processed",
  milled: "Milled",
  sorted: "Sorted",
  shipped: "Shipped",
  roasted: "Roasted",
  rested: "Rested",
  cup: "Your cup",
};

export const COMPARE_COPY: Record<ProcessKind, string> = {
  natural:
    "<b>If it were natural:</b> the whole cherry dries in the sun with the fruit still on, so the bean soaks up its sugars. That gives a fruity, jammy cup. Not this coffee, just to compare.",
  washed:
    "<b>If it were washed:</b> the fruit is stripped off on day one and the beans ferment in water tanks before drying. That gives a cleaner, brighter cup, with more lemon and tea than berries. Not this coffee, just to compare.",
  honey:
    "<b>If it were honey:</b> the skin comes off but the sticky fruit is left on while it dries. That sits between washed and natural, often rounder and softer. Not this coffee, just to compare.",
  anaerobic:
    "<b>If it were anaerobic:</b> the cherries are sealed in a tank with no air and left to ferment before drying. That gives a bold, winey cup with lots of sweet fruit. Not this coffee, just to compare.",
  "wet-hulled":
    "<b>If it were wet-hulled:</b> the papery skin around the bean is stripped off while the bean is still damp, which is common in Indonesia. That gives a heavy, earthy cup with little brightness. Not this coffee, just to compare.",
  other:
    "<b>If it were processed another way:</b> the cup would depend on how the fruit is taken off and dried, anywhere from clean and bright to fruity and heavy. Not this coffee, just to compare.",
};

const FRUIT_PHOTOS = new Set([
  "blueberry", "strawberry", "raspberry", "blackberry", "blackcurrant", // berries
  "orange", "lemon", "lime", "grapefruit", // citrus
  "peach", "apricot", "plum", // stone fruit
  "mango", "pineapple", "passion-fruit", "banana", "lychee", // tropical
  "grape", "cherry",
]);

const FRUIT_PROCESSES: ProcessKind[] = ["natural", "honey", "anaerobic"];

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const join = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const rangeText = (r: Range, unit: string) => `${r.min === r.max ? r.min : `${r.min}–${r.max}`} ${unit}`;
const fact = (facts: Fact[], label: string): Fact | undefined => facts.find((f) => f.label === label);
const isOwn = (f: Fact | undefined) => f?.provenance === "own";

function fruitNotes(j: Journey): string[] {
  return j.cup.notes.filter((n) => {
    const p = photoFor(n);
    return p !== null && FRUIT_PHOTOS.has(p);
  }).map(lower);
}

const DRYING_PHRASE: Record<Drying, string> = {
  "raised-beds": "on raised beds",
  patio: "on a patio",
  mechanical: "in a mechanical dryer",
};

function dryingSentence(j: Journey): string {
  const where = fact(j.processed.facts, "Drying");
  const time = fact(j.processed.facts, "Drying time");
  const phrase = DRYING_PHRASE[j.processed.drying];
  const days = rangeText(j.processed.days, "days");
  if (isOwn(where)) return isOwn(time) ? `It dries ${phrase} for ${days}.` : `It dries ${phrase}, which typically takes ${days}.`;
  return isOwn(time) ? `It usually dries ${phrase}, for ${days}.` : `It usually dries ${phrase}, typically for ${days}.`;
}

const PROCESS_TEXT: Record<ProcessKind, string> = {
  natural: "In a natural, the whole cherry dries with the fruit still on, so the bean soaks up the fruit's sugars.",
  honey: "In a honey process, the skin comes off but the sticky fruit is left on while the bean dries, so some of its sugars soak in.",
  anaerobic: "In an anaerobic process, the cherries ferment sealed away from air before drying, which pushes up the fruit and sweetness.",
  washed: "In a washed coffee, the fruit is stripped off right away and the beans ferment in water before drying, so the cup tastes clean.",
  "wet-hulled": "A wet-hulled coffee has its papery skin taken off while the bean is still damp, which gives it a heavy, earthy cup.",
  other: "How the fruit is taken off and dried shapes the cup, from clean and bright to fruity and heavy.",
};

const ROAST_TEXT: Record<RoastLevel, string> = {
  light: "the roaster stops soon after, so delicate flavours like fruit and flowers stay bright",
  "medium-light": "the roaster stops a little after, keeping the fruit while adding some sweetness",
  medium: "the roaster goes a good way past, for a balanced cup of sweetness and body",
  "medium-dark": "the roaster goes well past, for rich, bittersweet flavours",
  dark: "the roaster goes a long way past, for deep, smoky, bitter flavours",
};

const ROAST_NAME: Record<RoastLevel, string> = {
  light: "light",
  "medium-light": "medium-light",
  medium: "medium",
  "medium-dark": "medium-dark",
  dark: "dark",
};

function place(j: Journey): string {
  const country = j.place.countryNames.join(" and ");
  const region = j.place.region?.split(",").pop()?.trim();
  return [region && region !== country ? region : null, country].filter(Boolean).join(", ") || "far away";
}

function cover(j: Journey) {
  const where = place(j);
  // A coffee roasted where it grew skips the Shipped stage, so it never sails.
  const steps = j.stages.includes("shipped") ? "growing, drying, sailing and roasting" : "growing, drying and roasting";
  const n = j.place.countryKeys.length;
  return {
    step: "The journey of",
    title: j.coffeeName,
    text: `From ${where} to the cup in your hand: months of ${steps}, and dozens of hands along the way.`,
    alt:
      n > 1
        ? `A world map with a pin on each country in the blend: ${join(j.place.countryNames)}.`
        : n === 1
          ? `A map of ${j.place.countryNames[0]} with a pin near ${where}.`
          : `A pin marking where the coffee grows${where === "far away" ? "" : `, ${where}`}.`,
  };
}

// Generic words that open a smallholders' name ("Smallholder farmers of …") read lower-case mid-sentence.
const COMMON_START = /^(smallholders?|small-scale|small|local|family|families|farmers?|growers?|producers?)\b/i;

/** Who or what the researched producer is, worded for how it was involved. */
function producerSentence(p: Producer): string {
  const name = p.value.trim();
  switch (p.kind) {
    case "farm":
      return `It is grown at ${name}.`;
    case "washing station":
      return /washing station/i.test(name)
        ? `Its cherries were processed at ${name}.`
        : `Its cherries were processed at the ${name} washing station.`;
    case "cooperative":
      return /co-?op|cooperativ|union/i.test(name) ? `It comes from ${name}.` : `It comes from the ${name} cooperative.`;
    case "smallholders":
      return `It is grown by ${COMMON_START.test(name) ? lower(name) : name}.`;
  }
}

// What the far range is drawn as, by altitude step (see GrownArt's ridgeFor).
const LAND: Record<Journey["grown"]["peak"], string> = {
  0: "on a hillside",
  1: "among low rolling hills",
  2: "below a range of mountains",
  3: "below a range of mountains",
  4: "below tall mountains",
};

const SETTING_ALT: Record<Journey["grown"]["setting"], string> = {
  forest: "in the shade of tall forest trees",
  shade: "under shade trees",
  sun: "in open sun",
};

function grown(j: Journey) {
  const { setting } = j.grown;
  const setFact = fact(j.grown.facts, "Setting");
  const own = isOwn(setFact);
  const sentences: string[] = [];
  if (j.grown.producer) sentences.push(producerSentence(j.grown.producer));
  const where =
    setting === "forest"
      ? "in the shade of tall forest trees"
      : setting === "shade"
        ? "under shade trees planted among the coffee"
        : "out in the open sun";
  sentences.push(own ? `This coffee grows ${where}.` : `Coffee from here usually grows ${where}.`);
  const alt = j.grown.facts.find((f) => f.label === "Altitude" || f.label === "Typical altitude");
  if (alt) {
    sentences.push(
      alt.provenance === "usual"
        ? `It typically grows at ${alt.value}, where cool nights make the cherries ripen slowly and build up <b>more sugar</b>.`
        : `It grows at ${alt.value}, where cool nights make the cherries ripen slowly and build up <b>more sugar</b>.`,
    );
  }
  return {
    step: "",
    title: "Where the cherries ripen",
    text: sentences.join(" "),
    alt: `Coffee trees growing ${SETTING_ALT[setting]}, ${LAND[j.grown.peak]}.`,
  };
}

function picked(j: Journey) {
  const own = isOwn(fact(j.picked.facts, "Picking"));
  const harvest = fact(j.picked.facts, "Harvest");
  const s: string[] = [];
  if (j.picked.method === "hand") {
    s.push(
      own
        ? "Here the cherries are picked by hand."
        : "Cherries here are usually picked by hand.",
    );
    s.push("They ripen at different times, so pickers come back again and again for the deep red ones.");
  } else {
    s.push(
      own
        ? "Here the cherries are harvested by machine."
        : "Cherries here are usually harvested by machine.",
    );
    s.push("It shakes the branches so the ripe cherries drop off, which lets a big farm bring in a lot of coffee quickly.");
  }
  if (harvest) s.push(`The harvest runs ${harvest.value}.`);
  s.push("It takes roughly <b>6 kg of cherries</b> to make 1 kg of roasted coffee.");
  return {
    step: "",
    title: j.picked.method === "hand" ? "Only the ripe ones" : "Shaken from the branch",
    text: s.join(" "),
    alt:
      j.picked.method === "hand"
        ? "Ripe red cherries on a branch, dropping one by one into a basket."
        : "A harvesting machine passing over a row of coffee trees.",
  };
}

// What ProcessedArt draws: its step before drying (if any), then what dries, and where.
const PROCESSED_ALT: Record<ProcessKind, (where: string) => string> = {
  natural: (w) => `Whole red cherries drying ${w}, darkening day by day.`,
  anaerobic: (w) => `A sealed steel tank where the cherries ferment, then the whole cherries drying ${w}.`,
  washed: (w) => `A pulper stripping off the fruit into a water tank, then the beans drying ${w}.`,
  honey: (w) => `Beans in a sticky amber coat of fruit, drying ${w}.`,
  "wet-hulled": (w) => `A huller stripping the damp papery skin, then dark green beans drying ${w}.`,
  other: (w) => `Coffee beans drying ${w}.`,
};

function processed(j: Journey) {
  const kind = j.processed.process;
  const processOwn = isOwn(fact(j.processed.facts, "Process"));
  const s: string[] = [PROCESS_TEXT[kind]];
  s.push(dryingSentence(j));
  const f = fact(j.processed.facts, "Fermentation");
  if (f) s.push(`Fermentation: ${f.value}.`);
  const notes = FRUIT_PROCESSES.includes(kind) ? fruitNotes(j) : [];
  if (notes.length > 0) {
    s.push(
      processOwn
        ? `That is where the ${join(notes.slice(0, 3))} in your cup comes from.`
        : `That is usually where fruit like ${join(notes.slice(0, 3))} comes from.`,
    );
  }
  const titles: Record<ProcessKind, string> = {
    natural: "Dried whole, inside the fruit",
    honey: "Dried with the sticky fruit on",
    anaerobic: "Fermented away from air",
    washed: "Washed clean, then dried",
    "wet-hulled": "Skinned while still damp",
    other: "From cherry to dry bean",
  };
  return {
    step: "",
    title: titles[kind],
    text: s.join(" "),
    alt: PROCESSED_ALT[kind](DRYING_PHRASE[j.processed.drying]),
  };
}

const SEEDS = "Inside are two green seeds facing each other. They smell like grass and peas, and none of the coffee flavour exists yet.";

function milled(j: Journey) {
  const kind = j.processed.process;
  const processOwn = isOwn(fact(j.processed.facts, "Process"));
  // Matches MilledArt: washed and honey coffees reach the mill as parchment (their fruit came off
  // before drying); naturals and anaerobics as a dried husk. Unhedged only when the process is own.
  const parchment = kind === "washed" || kind === "honey";
  let first: string;
  if (j.milled.wetHulled) {
    first = `${processOwn ? "This coffee is wet-hulled" : "Coffee from here is often wet-hulled"}, which means the parchment, the thin papery skin around each bean, is usually stripped off while the bean is still damp, before it is fully dry.`;
  } else if (parchment) {
    // Washed: the fruit is all gone before drying. Honey: the skin is, and the sticky fruit dries onto the parchment.
    const off = kind === "washed" ? "fruit" : "outer skin";
    first = processOwn
      ? `Its ${off} came off before drying, so this coffee reaches the dry mill in its parchment, a thin papery skin around each bean, which is usually cracked off there.`
      : `If its ${off} came off before drying, as in a ${kind} coffee, it usually reaches the dry mill in its parchment, a thin papery skin around each bean, which is cracked off there.`;
  } else if (kind === "natural" || kind === "anaerobic") {
    first = processOwn
      ? "Once dry, the hard husk of dried fruit and the parchment, a thin papery skin around each bean, are usually cracked off at a dry mill."
      : "If it dried inside its fruit, as in a natural, the hard husk and the parchment, a thin papery skin around each bean, are usually cracked off together at a dry mill.";
  } else {
    first = "Once dry, the outer layers around each bean, down to the parchment (a thin papery skin), are usually cracked off at a dry mill.";
  }
  const shell = j.milled.wetHulled
    ? "its damp parchment, the papery skin,"
    : parchment
      ? "its parchment, the pale papery skin,"
      : "its dried husk";
  return {
    step: "",
    title: "Out of its shell",
    text: `${first} ${SEEDS}`,
    alt: `A bean splitting out of ${shell} to show two green seeds.`,
  };
}

function sorted(j: Journey) {
  const grade = fact(j.sorted.facts, "Grade");
  const s = ["Beans are usually graded by size and weight, and broken or faulty ones are picked out, often by hand."];
  if (grade) s.push(`This lot is graded ${grade.value}.`);
  s.push("The best are bagged in sacks stamped with where they came from.");
  return {
    step: "",
    title: "Picked over, bean by bean",
    text: s.join(" "),
    alt: `A sack stamped ${j.sorted.stamp.join(", ")}, beside beans being sorted.`,
  };
}

function shipped(j: Journey) {
  const { port, weeks } = j.shipped;
  const leave = port ? ` from ${port}` : "";
  return {
    step: "",
    title: "Weeks at sea",
    text: `Green coffee keeps well, so it usually travels slowly by container ship${leave}, typically ${rangeText(weeks, "weeks")} at sea. A sealed liner inside the sack typically keeps out moisture until it reaches the roaster.`,
    alt: "A container ship crossing the sea with sacks of coffee on board.",
  };
}

function roasted(j: Journey) {
  const level = j.roasted.level;
  const levelFact = fact(j.roasted.facts, "Roast");
  const where = fact(j.roasted.facts, "Roasted in");
  const s: string[] = [];
  s.push("Heat turns the grassy bean golden, then brown, as its sugars caramelise.");
  s.push("At around 200 °C the beans start to pop like popcorn: that's the <b>first crack</b>.");
  s.push(
    isOwn(levelFact)
      ? `This coffee is a ${ROAST_NAME[level]} roast, so ${ROAST_TEXT[level]}.`
      : `It is listed as a ${ROAST_NAME[level]} roast, which usually means ${ROAST_TEXT[level]}.`,
  );
  if (isOwn(where)) s.push(`It was roasted in ${where?.value}.`);
  return {
    step: "",
    title: "Where it starts tasting like coffee",
    text: s.join(" "),
    alt: "Green beans turning brown in a spinning roasting drum.",
  };
}

function rested(j: Journey) {
  const { min, max } = j.rested.days;
  const window = min === max ? `around day ${min}` : `between day ${min} and day ${max}`;
  return {
    step: "",
    title: "Letting it breathe",
    text: `Fresh beans are full of gas, which makes espresso spurt and taste sharp. After a week or two the flavours settle, and for your Meraki this coffee should be at its best <b>${window}</b> after roasting.`,
    alt: "A bag of roasted beans resting on a shelf beside a calendar.",
  };
}

function cup(j: Journey) {
  const { doseG, yieldG, tempC, notes } = j.cup;
  const taste = notes.length > 0 ? ` Take a sip and look for ${join(notes.slice(0, 3).map(lower))}.` : " Take a sip.";
  return {
    step: "",
    title: "And now, it's yours",
    text: `It all ends with ${doseG} g of ground coffee, water at ${tempC} °C, and ${yieldG} g in your Meraki.${taste}`,
    alt: "A steaming cup of coffee on a table, ready to drink.",
  };
}

const BUILDERS: Record<StageId, (j: Journey) => { step: string; title: string; text: string; alt: string }> = {
  cover,
  grown,
  picked,
  processed,
  milled,
  sorted,
  shipped,
  roasted,
  rested,
  cup,
};

export function stageCopy(j: Journey, id: StageId): { step: string; title: string; text: string; alt: string } {
  const copy = BUILDERS[id](j);
  if (id === "cover") return copy;
  const total = j.stages.length - 1;
  const n = j.stages.indexOf(id);
  const label = id === "cup" ? "In your cup" : STAGE_LABELS[id];
  return { ...copy, step: `${n} of ${total} · ${label}` };
}
