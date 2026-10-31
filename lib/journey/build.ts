import type { BrewResult, RoastLevel } from "@/lib/schema";
import { safeSources } from "@/lib/sources";
import type { TastingNote } from "@/lib/tasting-notes";
import { DRYING_DAYS, EUROPE_PORTS, GENERIC, countriesIn, countryFor } from "./countries";
import type { JourneyFacts } from "./facts";
import { parseAltitude, peakStep, processKind } from "./parse";
import { STAGE_IDS } from "./types";
import type { Drying, Fact, Journey, PickMethod, Provenance, Range, Setting, StageId } from "./types";

// Provenance rule (spec, "Which badge a fact gets"):
// - profile identity fields are "own" only at high confidence; at medium only country and process are;
// - a researched JourneyFacts field is "own" (with the URL that states it);
// - country-table defaults and everything at low confidence are "usual";
// - rest days, dose, yield and temperature are "advice".

const PICKING: Record<PickMethod, string> = { hand: "By hand", machine: "By machine" };
const SETTING: Record<Setting, string> = { forest: "Forest shade", shade: "Shade trees", sun: "Full sun" };
const DRYING: Record<Drying, string> = { "raised-beds": "Raised beds", patio: "Patio", mechanical: "Mechanical dryer" };
const ROAST: Record<RoastLevel, string> = {
  light: "Light",
  "medium-light": "Medium-light",
  medium: "Medium",
  "medium-dark": "Medium-dark",
  dark: "Dark",
};

const range = (r: Range, unit: string) =>
  `${r.min === r.max ? r.min.toLocaleString("en-US") : `${r.min.toLocaleString("en-US")}–${r.max.toLocaleString("en-US")}`} ${unit}`;

const usual = (label: string, value: string): Fact => ({ label, value, provenance: "usual" });
const advice = (label: string, value: string): Fact => ({ label, value, provenance: "advice" });
const own = (label: string, value: string, sourceUrl?: string): Fact =>
  sourceUrl ? { label, value, provenance: "own", sourceUrl } : { label, value, provenance: "own" };

/** A researched field, kept only when its source is a real http(s) link, so nothing turns "own" unsourced. */
function sourced<T>(field: { value: T; source: string } | null): { value: T; url: string } | null {
  if (!field) return null;
  const url = safeSources([field.source])[0]?.url;
  return url ? { value: field.value, url } : null;
}

const isBlend = (origin: string) => /^\s*blend\s*$/i.test(origin);

export function buildJourney(result: BrewResult): Journey {
  const { bean, confidence } = result;
  const facts: JourneyFacts | null = result.journey?.facts ?? null;

  // Profile fields: identity is this coffee's only at high; country and process also at medium.
  const identity: Provenance = confidence === "high" ? "own" : "usual";
  const onBag: Provenance = confidence === "low" ? "usual" : "own";
  const profile = (p: Provenance, label: string, value: string): Fact => ({ label, value, provenance: p });

  const blend = isBlend(bean.origin);
  // The origin field is authoritative for a single origin: an unrecognised origin stays generic rather
  // than borrowing a country from the region text. Only blends list their countries in the region.
  const countries = countriesIn(bean.origin, blend ? bean.region : null);
  const first = countries[0] ?? null;
  const region = blend ? null : bean.region?.trim() || null;

  // Place (cover)
  const named = sourced(facts?.producer ? { value: facts.producer.name, source: facts.producer.source } : null);
  const producer = named ? own("Producer", named.value, named.url) : null;
  const countryValue = countries.length > 0 ? countries.map((c) => c.name).join(", ") : bean.origin;
  const placeFacts: Fact[] = [profile(onBag, "Country", countryValue)];
  if (region) placeFacts.push(profile(identity, "Region", region));

  // Grown
  const altitudeM = parseAltitude(bean.altitude);
  const grownFacts: Fact[] = altitudeM
    ? [profile(identity, "Altitude", range(altitudeM, "m"))]
    : [usual("Typical altitude", range(first?.altitude ?? GENERIC.altitude, "m"))];
  const settingFact = sourced(facts?.setting ?? null);
  const setting: Setting = settingFact?.value ?? first?.setting ?? GENERIC.setting;
  grownFacts.push(settingFact ? own("Setting", SETTING[setting], settingFact.url) : usual("Setting", SETTING[setting]));
  if (bean.variety?.trim()) grownFacts.push(profile(identity, "Variety", bean.variety.trim()));

  // Picked
  const pickingFact = sourced(facts?.picking ?? null);
  const method: PickMethod = pickingFact?.value ?? first?.picking ?? GENERIC.picking;
  const pickedFacts: Fact[] = [
    pickingFact ? own("Picking", PICKING[method], pickingFact.url) : usual("Picking", PICKING[method]),
  ];
  const harvest = sourced(facts?.harvestMonths ?? null);
  if (harvest) pickedFacts.push(own("Harvest", harvest.value, harvest.url));

  // Processed
  const process = processKind(bean.process);
  const processLabel = bean.process.trim() || "Other";
  const dryingFact = sourced(facts?.drying ?? null);
  const drying: Drying = dryingFact?.value ?? first?.drying ?? GENERIC.drying;
  const daysFact = sourced(facts?.dryingDays ?? null);
  const days: Range = daysFact?.value ?? DRYING_DAYS[process];
  const processedFacts: Fact[] = [
    profile(onBag, "Process", processLabel),
    dryingFact ? own("Drying", DRYING[drying], dryingFact.url) : usual("Drying", DRYING[drying]),
    daysFact ? own("Drying time", range(days, "days"), daysFact.url) : usual("Drying time", range(days, "days")),
  ];
  const fermentation = sourced(facts?.fermentation ?? null);
  if (fermentation) processedFacts.push(own("Fermentation", fermentation.value, fermentation.url));

  // Milled
  const wetHulled = process === "wet-hulled";
  const milledFacts: Fact[] = [usual("Milling", wetHulled ? "Hulled while still moist" : "Hulled once dry")];

  // Sorted
  const stamp = [
    (countries.length === 1 ? countries[0].name : bean.origin).toUpperCase(),
    ...(region ? [region.split(",")[0].trim().toUpperCase()] : []),
    processLabel.toUpperCase(),
  ].filter(Boolean);
  const grade = sourced(facts?.grade ?? null);
  const sortedFacts: Fact[] = [usual("Sorting", "By size, weight and eye")];
  if (grade) sortedFacts.unshift(own("Grade", grade.value, grade.url));

  // Shipped (assumes a European roaster unless research says otherwise)
  const roasterHome = countryFor(facts?.roasterCountry ?? null);
  const roastedAtOrigin = !!roasterHome && !!first && roasterHome.key === first.key;
  const stages: StageId[] = STAGE_IDS.filter((id) => !(id === "shipped" && roastedAtOrigin));
  const port = first?.port ?? null;
  const weeks = first?.seaWeeksToEurope ?? GENERIC.seaWeeksToEurope;
  const shippedFacts: Fact[] = [
    ...(port ? [usual("Export port", port)] : []),
    usual("Sea time", range(weeks, "weeks")),
    usual("Arrives in", EUROPE_PORTS),
  ];

  // Roasted
  const roastedFacts: Fact[] = [profile(identity, "Roast", ROAST[bean.roastLevel])];
  const roastedIn = [facts?.roasterCity, facts?.roasterCountry].filter((s): s is string => !!s?.trim()).join(", ");
  if (roastedIn) roastedFacts.push(own("Roasted in", roastedIn));

  // Rested and cup: Claude's advice for the Meraki, not facts about the lot.
  const restDays = result.tips.restDays;
  const { doseG, yieldG, tempC } = result.recipe;
  const notes = (result.flavour.notes as (TastingNote | string)[])
    .map((n) => (typeof n === "string" ? n : n?.name))
    .filter((n): n is string => typeof n === "string" && n.trim() !== "")
    .slice(0, 4);

  return {
    coffeeName: bean.name,
    stages,
    place: {
      countryKeys: countries.map((c) => c.key),
      countryNames: countries.map((c) => c.name),
      region,
      coords: facts?.regionCoords ?? null,
      producer,
      special: sourced(facts?.special ?? null)?.value ?? null,
      facts: placeFacts,
    },
    grown: { altitudeM, peak: peakStep(altitudeM?.max ?? null), setting, facts: grownFacts },
    picked: { method, facts: pickedFacts },
    processed: { process, processLabel, drying, days, facts: processedFacts },
    milled: { wetHulled, facts: milledFacts },
    sorted: { stamp, facts: sortedFacts },
    shipped: { port, arrival: facts?.roasterCity ?? facts?.roasterCountry ?? "Europe", weeks, facts: shippedFacts },
    roasted: { level: bean.roastLevel, facts: roastedFacts },
    rested: { days: restDays, facts: [advice("Rest", range(restDays, "days"))] },
    cup: {
      doseG,
      yieldG,
      tempC,
      notes,
      facts: [advice("Dose", `${doseG} g`), advice("Yield", `${yieldG} g`), advice("Temperature", `${tempC} °C`)],
    },
    sources: safeSources([...result.sources, ...(facts?.sources ?? [])]),
  };
}

/** Background research only for a specific, identified lot; a web search on a guess could pull in another lot. */
export function shouldEnrich(result: BrewResult): boolean {
  return result.identified && !result.journey && result.confidence !== "low" && result.bean.roaster !== null;
}

type SectionKey = Exclude<StageId, "cover"> | "place";
const sectionOf = (id: StageId): SectionKey => (id === "cover" ? "place" : id);

/** Late-arriving facts update only the stages the reader hasn't reached; the stage list never changes under them. */
export function mergeUnvisited(prev: Journey, next: Journey, visited: ReadonlySet<StageId>): Journey {
  const out: Journey = { ...next, stages: prev.stages };
  const keep = <K extends SectionKey>(k: K) => {
    out[k] = prev[k];
  };
  for (const id of visited) keep(sectionOf(id));
  return out;
}
