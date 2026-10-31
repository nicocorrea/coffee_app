# The Coffee's Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A full-screen, illustrated and animated nine-stage story of each coffee, from farm to cup. It adapts to each coffee and labels every fact honestly, and it opens from the coffee page.

**Architecture:** A pure `buildJourney(result)` turns an existing `BrewResult` plus a per-country table of typical practices into a `Journey` (stage data + provenance-tagged facts). It works offline for every coffee. A new `/api/journey` endpoint quietly researches extra lot facts after the recipe shows and stores them on the result. A client-only `/journey` route renders the journey as SVG scenes with CSS keyframes and small rAF tweens. It uses a stacked storybook on phones and a pinned-illustration layout on desktop.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, TypeScript, Tailwind v4, zod 4, `@anthropic-ai/sdk`, Vitest, Playwright. Dev-only for the map script: `world-atlas`, `topojson-client`, `d3-geo`.

**Spec:** `docs/superpowers/specs/2026-10-31-coffee-journey-design.md`. Reference prototypes: `docs/superpowers/specs/2026-10-31-coffee-journey/prototype-phone.html` and `prototype-desktop.html`. Open both in a browser before any UI task, because they are the source for composition, choreography and copy tone.

## Global Constraints

- Work on branch `feat/coffee-journey` (already created). Merge via PR.
- This Next.js has breaking changes. Before writing a route handler, page or `useSearchParams` code, read the matching guide in `node_modules/next/dist/docs/` (e.g. `01-app/02-guides/use-search-params.md`) and heed deprecation notices.
- No new runtime dependencies and no animation library. Dev-only dependencies are allowed for the map script: `world-atlas@2.0.2`, `topojson-client@3.1.0`, `d3-geo@3.1.1`.
- Bundled map data `lib/journey/map-data.json` stays under 150 KB.
- Use the app's tokens (`--color-paper`, `surface`, `surface-2`, `line`, `ink`, `muted`, `cascara`, `sage`, `roast-*`) and the `condensed` / `numerals` helpers. Every illustration uses `viewBox="0 0 360 300"`.
- Badges:
  - `own`: cascara background, white text. Label meaning: "This coffee".
  - `usual`: `surface-2` background, `muted` text. Meaning: "How it's usually done".
  - `advice`: transparent background, 1px `line` border, `ink` text. Meaning: "For your Meraki".
  - Every badge element carries `data-provenance="own|usual|advice"`.
- Provenance rule (spec, "Which badge a fact gets"):
  - `own` for profile identity fields (country, region, process, variety, altitude, roast level) only at `confidence: "high"`. At `"medium"`, only country and process are `own`.
  - `own` for every non-null `JourneyFacts` field.
  - `usual` for country-table defaults and for everything at `"low"` confidence.
  - `advice` for rest days, dose, yield and temperature.
- Copy rules:
  - Plain, everyday language.
  - A `usual` fact's sentence uses "usually" or "typically".
  - Never name a farm, producer, person, fermentation time or harvest date unless it came from `JourneyFacts`.
  - "Parchment", "first crack" and "wet-hulled" are always explained in the same sentence.
  - Comparison text ends with exactly "Not this coffee, just to compare."
- Drawings: no snow caps. Machine-harvested coffees never get the hand-picking scene.
- Motion rules:
  - Only the active stage animates, and it replays on every re-entry.
  - Looping motion pauses off-screen.
  - With `prefers-reduced-motion: reduce`, every stage renders in its finished state with no looping motion and no parallax.
- Layout: phone and tablet portrait below `lg` (64rem) get a storybook, with each stage one screen tall and the art 47% of the height. `lg` and up get a pinned 6:5 illustration on the left and the text on the right.
- The `/journey` route never calls `/api/brew`.
- Verification commands: `npm test`, `npm run lint`, `npm run e2e`. They all pass at the end of every task that touches their scope.

## Review Focus

1. **Origin text in unusual shapes**, such as "Sumatra", "Indonesia (Sumatra)", "colombia", "Colombia & Brazil", "Blend" with countries in `region`, or a country missing from the table. The expected result is the right country or countries, or the generic journey, never a crash. Pinned in Task 2.
2. **Altitude text in other formats**, such as "1800m", "1.900 m" (European thousands dot), "1,200 - 1,500 masl", "5,000–6,000 ft", "High altitude" or "". The expected result is a metre range, or null for vague text. Pinned in Task 1.
3. **Coordinates from Claude that are wrong**: swapped lat/lon, or outside the country. The pin must fall back to the country's centroid and be flagged approximate. Pinned in Task 3.
4. **Older stored results**: tasting notes saved as plain strings, no `journey` field, `roaster: null`, `identified: false`. The journey must still build, and unidentified results have no entry point. Pinned in Tasks 4 and 8.
5. **Research arriving late or failing**, for example after the user tapped "Research again" or deleted the coffee, or when storage is full. Stale facts must not resurrect or overwrite a different lookup, and a failure must leave the local journey intact. Pinned in Task 8.

---

## File Structure

```
lib/journey/
  types.ts          Journey, Fact, Provenance, StageId and the scene enums; no logic
  facts.ts          JourneyFactsSchema (zod), JourneyFacts, StoredJourney
  parse.ts          parseAltitude, processKind, peakStep
  countries.ts      COUNTRIES table, countryFor, countriesIn, GENERIC, DRYING_DAYS, EUROPE_PORTS
  map.ts            shapeFor, project, pinFor (reads map-data.json)
  map-data.json     generated by scripts/build-map-data.ts
  build.ts          buildJourney, shouldEnrich, mergeUnvisited
  copy.ts           stageCopy, COMPARE_COPY, STAGE_LABELS
  research.ts       buildJourneyPrompt, fetchJourneyFacts (server)
  enrich.ts         "use client": attachJourney, useJourneyEnrichment
lib/access.ts       accessDenied, providerMissing (shared by both handlers)
lib/journey-handler.ts  handleJourney
app/api/journey/route.ts
app/journey/page.tsx
components/journey/
  journey.css       motion primitives and keyframes (j- prefixed)
  JourneyScreen.tsx finds the coffee, builds and merges the journey, picks the layout
  PhoneStory.tsx    storybook layout
  DesktopStory.tsx  pinned layout, stage bar, keyboard
  useActiveStage.ts IntersectionObserver logic for both layouts, run counters
  motion.ts         useReducedMotion, useTween, useIsDesktop
  StageCopy.tsx     step, title, badges, paragraph, compare chips, CTA
  Badge.tsx
  JourneyCard.tsx   entry card on the coffee page
  art/              CoverArt, GrownArt, PickedArt, ProcessedArt, MilledArt,
                    SortedArt, ShippedArt, RoastedArt, RestedArt, CupArt, index.ts
scripts/build-map-data.ts
tests/journey-parse.test.ts, journey-countries.test.ts, journey-map.test.ts,
tests/journey-build.test.ts, journey-copy.test.ts, journey-research.test.ts,
tests/journey-handler.test.ts, journey-enrich.test.ts
tests/e2e/journey.spec.ts
```

Modified: `lib/schema.ts` (optional `journey` on `BrewResult`), `lib/claude.ts` (generic research loop), `lib/brew-handler.ts` (uses `lib/access.ts`), `lib/history.ts` (`replaceLookup`), `lib/api.ts` (`requestJourney`), `lib/fixtures.ts` (`DEMO_JOURNEY_FACTS`), `components/BrewView.tsx` (card, link, enrichment), `components/TabBar.tsx` (hidden on `/journey`), `package.json` (dev deps + `map` script).

---

### Task 1: Journey types, facts schema and text parsers

**Files:**
- Create: `lib/journey/types.ts`, `lib/journey/facts.ts`, `lib/journey/parse.ts`
- Modify: `lib/schema.ts` (add `journey?: StoredJourney` to `BrewResult`)
- Test: `tests/journey-parse.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type Provenance = "own" | "usual" | "advice";
  export type Fact = { label: string; value: string; provenance: Provenance; sourceUrl?: string };
  export type Range = { min: number; max: number };
  export type ProcessKind = "natural" | "washed" | "honey" | "anaerobic" | "wet-hulled" | "other";
  export type Setting = "forest" | "shade" | "sun";
  export type PickMethod = "hand" | "machine";
  export type Drying = "raised-beds" | "patio" | "mechanical";
  export const STAGE_IDS = ["cover","grown","picked","processed","milled","sorted","shipped","roasted","rested","cup"] as const;
  export type StageId = (typeof STAGE_IDS)[number];
  export type Journey = {
    coffeeName: string;
    stages: StageId[];                       // "shipped" may be absent
    place: { countryKeys: string[]; countryNames: string[]; region: string | null;
             coords: { lat: number; lon: number } | null; producer: Fact | null; special: string | null; facts: Fact[] };
    grown: { altitudeM: Range | null; peak: 0 | 1 | 2 | 3 | 4; setting: Setting; facts: Fact[] };
    picked: { method: PickMethod; facts: Fact[] };
    processed: { process: ProcessKind; processLabel: string; drying: Drying; days: Range; facts: Fact[] };
    milled: { wetHulled: boolean; facts: Fact[] };
    sorted: { stamp: string[]; facts: Fact[] };
    shipped: { port: string | null; arrival: string; weeks: Range; facts: Fact[] };
    roasted: { level: RoastLevel; facts: Fact[] };
    rested: { days: Range; facts: Fact[] };
    cup: { doseG: number; yieldG: number; tempC: number; notes: string[]; facts: Fact[] };
    sources: { url: string; host: string }[];
  };
  ```
- Produces (`facts.ts`): `JourneyFactsSchema`, `type JourneyFacts = z.infer<…>`, `type StoredJourney = { facts: JourneyFacts; createdAt: string }`. Schema (every field nullable, no numeric bounds, same style as `lib/schema.ts`):
  ```ts
  const sourced = <T extends z.ZodType>(v: T) => z.object({ value: v, source: z.string().describe("URL that states it") }).nullable();
  roasterCity: z.string().nullable(), roasterCountry: z.string().nullable(),
  producer: z.object({ name: z.string(), kind: z.enum(["farm","washing station","cooperative","smallholders"]), source: z.string() }).nullable(),
  picking: sourced(z.enum(["hand","machine"])), setting: sourced(z.enum(["forest","shade","sun"])),
  drying: sourced(z.enum(["raised-beds","patio","mechanical"])), dryingDays: sourced(z.object({ min: z.number(), max: z.number() })),
  fermentation: sourced(z.string()), grade: sourced(z.string()), harvestMonths: sourced(z.string()), special: sourced(z.string()),
  regionCoords: z.object({ lat: z.number(), lon: z.number() }).nullable(),
  sources: z.array(z.string()),
  ```
- Produces (`parse.ts`):
  - `parseAltitude(text: string | null): Range | null`. Converts feet to metres (× 0.3048, rounded to 10 m). A single number gives min = max.
  - `processKind(text: string): ProcessKind`
  - `peakStep(maxM: number | null): 0 | 1 | 2 | 3 | 4`. Returns 0 for unknown, 1 for < 1000, 2 for 1000–1499, 3 for 1500–1999 and 4 for ≥ 2000.

- [ ] **Step 1: Write the failing tests** in `tests/journey-parse.test.ts`
  ```ts
  it.each([
    ["1,950–2,200 masl", { min: 1950, max: 2200 }], ["1800m", { min: 1800, max: 1800 }],
    ["1.900 m", { min: 1900, max: 1900 }], ["1,200 - 1,500 masl", { min: 1200, max: 1500 }],
    ["5,000–6,000 ft", { min: 1520, max: 1830 }], ["High altitude", null], ["", null], [null, null],
  ])("parseAltitude(%j)", (t, want) => expect(parseAltitude(t)).toEqual(want));
  it.each([
    ["Natural", "natural"], ["Washed", "washed"], ["Fully washed", "washed"], ["Red Honey", "honey"],
    ["Anaerobic natural", "anaerobic"], ["Wet-hulled (Giling Basah)", "wet-hulled"], ["Semi-washed", "wet-hulled"],
    ["Carbonic maceration", "anaerobic"], ["Pulped natural", "honey"], ["Experimental", "other"],
  ])("processKind(%j)", (t, want) => expect(processKind(t)).toBe(want));
  it("peakStep", () => expect([null, 800, 1000, 1650, 2200].map(peakStep)).toEqual([0, 1, 2, 3, 4]));
  it("JourneyFactsSchema accepts all-null facts", () => expect(JourneyFactsSchema.safeParse(EMPTY_FACTS).success).toBe(true));
  ```
  `EMPTY_FACTS` is a local constant with every field null and `sources: []`.
- [ ] **Step 2: Run** `npx vitest run tests/journey-parse.test.ts`. Expected: FAIL (modules not found).
- [ ] **Step 3: Implement** `types.ts`, `facts.ts` and `parse.ts` with the interfaces above. Add `journey?: StoredJourney` to `BrewResult` in `lib/schema.ts` with `import type`. The existing schemas don't change, so `/api/brew` output is unaffected. In `processKind`, check "anaerobic"/"carbonic" before "natural", "pulped natural"/"honey" before "natural", and "semi-washed"/"wet-hulled"/"giling" before "washed".
- [ ] **Step 4: Run** `npx vitest run tests/journey-parse.test.ts && npm test`. Expected: PASS, and the existing suites are still green.
- [ ] **Step 5: Commit** `git add lib/journey tests/journey-parse.test.ts lib/schema.ts && git commit -m "feat(journey): types, facts schema and text parsers"`

### Task 2: Country table

**Files:**
- Create: `lib/journey/countries.ts` (relative imports only, so the Node map script can import it)
- Test: `tests/journey-countries.test.ts`

**Interfaces:**
- Consumes: `PickMethod`, `Setting`, `Drying`, `ProcessKind`, `Range` (Task 1).
- Produces:
  ```ts
  export type CountryInfo = { key: string /* ISO 3166-1 alpha-3 */; mapId: string /* ISO numeric, as in world-atlas */;
    name: string; aliases: string[]; picking: PickMethod; setting: Setting; drying: Drying;
    altitude: Range; port: string; seaWeeksToEurope: Range };
  export const COUNTRIES: CountryInfo[];
  export const GENERIC: { picking: PickMethod; setting: Setting; drying: Drying; altitude: Range; seaWeeksToEurope: Range };
  export const DRYING_DAYS: Record<ProcessKind, Range>;
  export const EUROPE_PORTS = "Hamburg, Antwerp or Trieste";
  export function countryFor(text: string | null): CountryInfo | null;
  export function countriesIn(origin: string, region: string | null): CountryInfo[];   // blends
  ```
- Covers these 27 countries from the spec: Ethiopia, Kenya, Rwanda, Burundi, Uganda, Tanzania, Yemen, Colombia, Brazil, Peru, Bolivia, Ecuador, Guatemala, Honduras, El Salvador, Nicaragua, Costa Rica, Panama, Mexico, Jamaica, Indonesia, Papua New Guinea, India, Vietnam, China, Myanmar, Thailand.
- Aliases cover common regions that appear alone, for example "Sumatra", "Java", "Sulawesi", "Bali" → Indonesia, "Yunnan" → China, "Yirgacheffe", "Sidamo", "Guji" → Ethiopia, "Huila", "Nariño" → Colombia, "Antigua", "Huehuetenango" → Guatemala, "Tarrazú" → Costa Rica, "Boquete" → Panama, "Kona" → no match (US). Matching ignores case and accents.
- Every value must be checked against a reputable source (for example, origin pages from importers such as Cafe Imports, Sweet Maria's or Royal Coffee). Where practice varies within a country, use the most common one. Values to start from, then verify:
  - Ethiopia: Djibouti, hand, forest.
  - Kenya: Mombasa, hand, shade, raised beds.
  - Brazil: Santos, machine, sun, patio.
  - Colombia: Buenaventura, hand, shade.
  - Indonesia: Belawan (Sumatra), hand.
  - Vietnam: Ho Chi Minh City, sun, patio.
  - `DRYING_DAYS`: natural 18–30, honey 10–20, washed 8–15, anaerobic 15–30, wet-hulled 3–7, other 10–25.

- [ ] **Step 1: Write the failing tests**
  ```ts
  it.each([["Ethiopia","ETH"],["colombia","COL"],["Sumatra","IDN"],["Indonesia (Sumatra)","IDN"],["Tarrazu","CRI"],["Kona",null],["",null]])(
    "countryFor(%j)", (t, key) => expect(countryFor(t)?.key ?? null).toBe(key));
  it("splits blends", () => {
    expect(countriesIn("Blend", "Brazil, Colombia & Ethiopia").map((c) => c.key)).toEqual(["BRA","COL","ETH"]);
    expect(countriesIn("Colombia & Brazil", null).map((c) => c.key)).toEqual(["COL","BRA"]);
    expect(countriesIn("Ethiopia", "Guji").map((c) => c.key)).toEqual(["ETH"]);
  });
  it("covers the spec's 27 producers, each complete", () => {
    expect(COUNTRIES).toHaveLength(27);
    for (const c of COUNTRIES) { expect(c.mapId).toMatch(/^\d{3}$/); expect(c.altitude.min).toBeLessThan(c.altitude.max); expect(c.port).not.toBe(""); }
  });
  it("Brazil defaults to machine harvest and patio drying", () => expect(countryFor("Brazil")).toMatchObject({ picking: "machine", drying: "patio" }));
  ```
- [ ] **Step 2: Run** `npx vitest run tests/journey-countries.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/journey/countries.ts`. `countriesIn` splits on `,`, `&`, `/`, `+` and " and ". When `origin` is "Blend" it reads `region`, and it keeps the first-seen order without duplicates.
- [ ] **Step 4: Run** `npx vitest run tests/journey-countries.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): country table of typical practices"`

### Task 3: Map data and projection

**Files:**
- Create: `scripts/build-map-data.ts`, `lib/journey/map-data.json` (generated, committed), `lib/journey/map.ts`
- Modify: `package.json`: devDependencies `world-atlas@2.0.2`, `topojson-client@3.1.0`, `d3-geo@3.1.1`, plus the script `"map": "node scripts/build-map-data.ts"` (Node 24 strips types natively)
- Test: `tests/journey-map.test.ts`

**Interfaces:**
- Consumes: `COUNTRIES` (Task 2).
- Produces:
  ```ts
  export type CountryShape = { d: string; k: number; tx: number; ty: number;
    bbox: [lonMin: number, latMin: number, lonMax: number, latMax: number]; centroid: [lon: number, lat: number] };
  export function shapeFor(key: string): CountryShape | null;        // ISO alpha-3, or "WORLD"
  export function project(s: CountryShape, lon: number, lat: number): [x: number, y: number];
  export function pinFor(s: CountryShape, coords: { lat: number; lon: number } | null): { x: number; y: number; approximate: boolean };
  ```
- The script uses `countries-50m.json` from world-atlas. For each `COUNTRIES` entry it finds the feature by `mapId`. It fits `d3.geoMercator()` into the extent `[[40, 30], [320, 250]]` and writes `d` with `geoPath(projection).digits(1)`, plus `k = projection.scale()`, `[tx, ty] = projection.translate()`, `geoBounds` and `geoCentroid`. `"WORLD"` is the 110m land outline fitted to longitudes −110…160 and latitudes −30…35 (the coffee belt), for blends. If the JSON exceeds 150 KB, use `countries-110m` for every country whose 110m shape still renders.
- `project` is the raw Mercator: `x = tx + k·λ`, `y = ty − k·ln(tan(π/4 + φ/2))`, in radians. `pinFor` uses the coordinates (`approximate: false`) only when they fall inside `bbox` (with a 0.5° margin). Otherwise it uses `centroid` with `approximate: true`, and the cover then labels the region by name only.

- [ ] **Step 1: Write the failing tests**
  ```ts
  const eth = shapeFor("ETH")!;
  it("has a shape for every country and the world", () => { for (const c of COUNTRIES) expect(shapeFor(c.key)?.d).toMatch(/^M/); expect(shapeFor("WORLD")).not.toBeNull(); });
  it("projects the centroid inside the drawing frame", () => { const [x, y] = project(eth, ...eth.centroid); expect(x).toBeGreaterThan(40); expect(x).toBeLessThan(320); expect(y).toBeGreaterThan(30); expect(y).toBeLessThan(250); });
  it("pins Guji south of Addis Ababa", () => expect(pinFor(eth, { lat: 6.0, lon: 38.7 }).y).toBeGreaterThan(pinFor(eth, { lat: 9.0, lon: 38.7 }).y));
  it("falls back to the centroid for swapped or foreign coordinates", () => {
    const c = project(eth, ...eth.centroid);
    expect(pinFor(eth, { lat: 38.7, lon: 6.0 })).toMatchObject({ x: c[0], y: c[1], approximate: true });
    expect(pinFor(eth, null)).toMatchObject({ x: c[0], y: c[1] });
  });
  it("stays under 150 KB", () => expect(statSync("lib/journey/map-data.json").size).toBeLessThan(150_000));
  ```
- [ ] **Step 2: Run** `npx vitest run tests/journey-map.test.ts`. Expected: FAIL.
- [ ] **Step 3: Install the dev deps, write the script and run** `npm run map`. Expected: it writes `lib/journey/map-data.json`.
- [ ] **Step 4: Implement** `lib/journey/map.ts` (imports the JSON).
- [ ] **Step 5: Run** `npx vitest run tests/journey-map.test.ts`. Expected: PASS.
- [ ] **Step 6: Commit** `git commit -m "feat(journey): bundled country outlines and pin projection"` (include the script, the JSON and package files).

### Task 4: buildJourney, enrichment gate and merge

**Files:**
- Create: `lib/journey/build.ts`
- Test: `tests/journey-build.test.ts`

**Interfaces:**
- Consumes: Tasks 1–3, `safeSources` (`lib/sources.ts`), `BrewResult`.
- Produces:
  ```ts
  export function buildJourney(result: BrewResult): Journey;
  export function shouldEnrich(result: BrewResult): boolean;
  export function mergeUnvisited(prev: Journey, next: Journey, visited: ReadonlySet<StageId>): Journey;
  ```
- Rules, all from the spec:
  - **Provenance.** Follow Global Constraints. A `JourneyFacts` field fills its stage with an `own` fact (`sourceUrl` = its `source`) and overrides the country default.
  - **Scene choices.** Picking, setting and drying come from facts, else the country, else `GENERIC`. `days` comes from `facts.dryingDays`, else `DRYING_DAYS[process]`.
  - **Grown.** `altitudeM` comes from `parseAltitude(bean.altitude)` (`own`/`usual` per confidence). When that's null, `altitudeM` stays null and a `usual` fact shows the country's typical range. `peak = peakStep(altitudeM?.max ?? null)`.
  - **Place.** `coords = facts.regionCoords`. `producer` comes only from `facts.producer`.
  - **Stages.** `stages` is every `STAGE_IDS` entry, minus `"shipped"` when `countryFor(facts.roasterCountry)?.key` equals the first origin country's key.
  - **Shipped.** `arrival = facts.roasterCity ?? facts.roasterCountry ?? "Europe"`. The facts are `usual` and include "Arrives in {EUROPE_PORTS}". The port is the first origin country's, or null for unknown.
  - **Sorted.** `stamp` = [country name upper-cased, region's first segment upper-cased (if present), process label upper-cased].
  - **Rested and cup.** `rested.days = tips.restDays` (`advice`). The cup's dose, yield and temperature are `advice`. `notes` holds the first 4 names, accepting `string | TastingNote`.
  - **Sources.** `safeSources([...result.sources, ...(facts?.sources ?? [])])`.
- `shouldEnrich`: `identified && !result.journey && confidence !== "low" && bean.roaster !== null`.
- `mergeUnvisited`:
  - It keeps `prev.stages`.
  - For each visited id it keeps `prev`'s section. `cover` maps to `place`. Every other id maps to the section of the same name.
  - Unvisited sections and `sources` come from `next`.

- [ ] **Step 1: Write the failing tests.** Use the `brew()` helper pattern from `tests/history.test.ts`, starting from `DEMO_PROFILE`.
  ```ts
  const prov = (facts: Fact[], label: string) => facts.find((f) => f.label === label)?.provenance;
  it("medium confidence: only country and process are this coffee's", () => {
    const j = buildJourney(brew());                 // DEMO_PROFILE is medium
    expect(prov(j.place.facts, "Country")).toBe("own"); expect(prov(j.processed.facts, "Process")).toBe("own");
    expect(prov(j.place.facts, "Region")).toBe("usual"); expect(prov(j.grown.facts, "Altitude")).toBe("usual");
  });
  it("high confidence makes identity fields own; low makes everything usual", () => { /* Region own at high; Country usual at low */ });
  it("recipe and rest days are advice", () => { const j = buildJourney(brew()); expect(j.rested.facts.every((f) => f.provenance === "advice")).toBe(true); expect(j.cup.facts.every((f) => f.provenance === "advice")).toBe(true); });
  it("uses country defaults when facts are missing", () => expect(buildJourney(brew({ origin: "Brazil", process: "Natural" }))).toMatchObject({ picked: { method: "machine" }, processed: { drying: "patio" } }));
  it("researched facts override defaults and carry their source", () => {
    const j = buildJourney(withFacts({ picking: { value: "hand", source: "https://r.example/p" } }, { origin: "Brazil" }));
    expect(j.picked.method).toBe("hand"); expect(j.picked.facts[0]).toMatchObject({ provenance: "own", sourceUrl: "https://r.example/p" });
  });
  it("never invents a producer", () => expect(buildJourney(brew()).place.producer).toBeNull());
  it("skips shipping when roasted in the origin country", () => expect(buildJourney(withFacts({ roasterCountry: "Ethiopia" })).stages).not.toContain("shipped"));
  it("arrives in Europe by default and names the roaster's city when known", () => { expect(buildJourney(brew()).shipped.arrival).toBe("Europe"); expect(buildJourney(withFacts({ roasterCity: "Kraków" })).shipped.arrival).toBe("Kraków"); });
  it("unknown altitude shows the country's typical range as usual", () => { const j = buildJourney(brew({ altitude: null })); expect(j.grown).toMatchObject({ altitudeM: null, peak: 0 }); expect(prov(j.grown.facts, "Typical altitude")).toBe("usual"); });
  it("accepts tasting notes saved as plain strings", () => expect(buildJourney(brew({}, { notes: ["Cocoa", "Plum"] })).cup.notes).toEqual(["Cocoa", "Plum"]));
  it("blends list every country", () => expect(buildJourney(brew({ origin: "Blend", region: "Brazil, Ethiopia" })).place.countryKeys).toEqual(["BRA", "ETH"]));
  it("unknown country builds a generic journey", () => expect(buildJourney(brew({ origin: "Atlantis" })).shipped.port).toBeNull());
  it("shouldEnrich", () => { expect(shouldEnrich(brew({ roaster: "Hard Beans" }))).toBe(true); expect(shouldEnrich(brew())).toBe(false); /* also low confidence, has journey, unidentified → false */ });
  it("mergeUnvisited keeps what the reader has seen", () => {
    const prev = buildJourney(brew({ roaster: "R" })), next = buildJourney(withFacts({ picking: { value: "machine", source: "https://x" }, producer: { name: "Hambela smallholders", kind: "smallholders", source: "https://x" } }));
    const m = mergeUnvisited(prev, next, new Set(["cover", "grown"]));
    expect(m.place).toEqual(prev.place); expect(m.picked).toEqual(next.picked); expect(m.stages).toEqual(prev.stages);
  });
  ```
  `brew(bean?, flavour?)` overrides bean or flavour fields. `withFacts(partialFacts, bean?)` attaches `journey: { facts: { ...EMPTY_FACTS, ...partialFacts }, createdAt }`. Fill in the two commented bodies with the stated expectations.
- [ ] **Step 2: Run** `npx vitest run tests/journey-build.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/journey/build.ts`. Fact labels used by the tests: "Country", "Region", "Altitude", "Typical altitude", "Variety", "Process", "Picking", "Drying", "Roast", "Rest", "Dose", "Yield", "Temperature". The remaining labels are the builder's choice.
- [ ] **Step 4: Run** `npx vitest run tests/journey-build.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): build a journey from a coffee with honest provenance"`

### Task 5: Stage copy

**Files:**
- Create: `lib/journey/copy.ts`
- Test: `tests/journey-copy.test.ts`

**Interfaces:**
- Consumes: `Journey`, `StageId`, `ProcessKind`.
- Produces:
  ```ts
  export const STAGE_LABELS: Record<StageId, string>;   // "Origin","Grown","Picked","Processed","Milled","Sorted","Shipped","Roasted","Rested","Your cup"
  export function stageCopy(j: Journey, id: StageId): { step: string; title: string; text: string; alt: string };
  export const COMPARE_COPY: Record<ProcessKind, string>;
  ```
- `step` for the cover is "The journey of". Every other stage gets "{n} of {total} · {label}", where `total` counts stages other than the cover. For the cup stage the label is "In your cup".
- `text` is 2–3 plain sentences built from templates per stage and variant. For processed, the variant is `process`. For picked, it's the method. For grown, it's the setting. Use the prototype's paragraphs as the tone reference.
- `alt` is the one-sentence hidden description of the illustration.
- The processed text names the coffee's tasting notes only for natural, honey and anaerobic, and only notes in a fruit family. Reuse the families behind `NOTE_PHOTOS` in `lib/tasting-notes.ts` (berries, citrus, stone fruit, tropical, grape, cherry).
- Use exactly these `COMPARE_COPY` texts from the prototype for natural, washed and honey. Write anaerobic, wet-hulled and other in the same "If it were …" shape, each ending "Not this coffee, just to compare.":
  - natural: "<b>If it were natural:</b> the whole cherry dries in the sun with the fruit still on, so the bean soaks up its sugars. That gives a fruity, jammy cup. Not this coffee, just to compare." (Only shown when the coffee itself isn't natural.)
  - washed: "<b>If it were washed:</b> the fruit is stripped off on day one and the beans ferment in water tanks before drying. That gives a cleaner, brighter cup, with more lemon and tea than berries. Not this coffee, just to compare."
  - honey: "<b>If it were honey:</b> the skin comes off but the sticky fruit is left on while it dries. That sits between washed and natural, often rounder and softer. Not this coffee, just to compare."
- Text is plain strings. `<b>` is the only markup allowed, and the UI renders it by splitting the text, never with `dangerouslySetInnerHTML`.

- [ ] **Step 1: Write the failing tests**
  ```ts
  const j = buildJourney(brew());
  it("numbers stages without the cover", () => { expect(stageCopy(j, "grown").step).toBe("1 of 9 · Grown"); expect(stageCopy(j, "cup").step).toBe("9 of 9 · In your cup"); });
  it("renumbers when shipping is skipped", () => expect(stageCopy(buildJourney(withFacts({ roasterCountry: "Ethiopia" })), "cup").step).toBe("8 of 8 · In your cup"));
  it("grey facts are worded as usual practice", () => expect(stageCopy(j, "picked").text).toMatch(/usually|typically/i));
  it("a natural names its fruit notes", () => expect(stageCopy(j, "processed").text).toMatch(/blueberry/i));
  it("a washed coffee doesn't claim fruit from drying", () => expect(stageCopy(buildJourney(brew({ process: "Washed" })), "processed").text).not.toMatch(/blueberry/i));
  it("machine harvest never mentions hand-picking", () => expect(stageCopy(buildJourney(brew({ origin: "Brazil" })), "picked").text).not.toMatch(/by hand/i));
  it("explains jargon in place", () => { expect(stageCopy(j, "milled").text).toMatch(/parchment[^.]*(skin|shell)/i); expect(stageCopy(j, "roasted").text).toMatch(/first crack/i); });
  it("comparison copy ends the same way", () => { for (const t of Object.values(COMPARE_COPY)) expect(t.endsWith("Not this coffee, just to compare.")).toBe(true); });
  it("names no producer unless researched", () => expect(stageCopy(j, "grown").text).not.toMatch(/farm of|estate|cooperative/i));
  ```
- [ ] **Step 2: Run** `npx vitest run tests/journey-copy.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/journey/copy.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/journey-copy.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): stage copy templates"`

### Task 6: Shared research loop and fetchJourneyFacts

**Files:**
- Modify: `lib/claude.ts`. Extract the research loop. `fetchBeanProfile` keeps its signature and behaviour.
- Create: `lib/journey/research.ts`
- Test: `tests/journey-research.test.ts`. `tests/claude.test.ts` must pass unchanged.

**Interfaces:**
- Produces (`lib/claude.ts`):
  ```ts
  export async function researchJson<T>(opts: {
    provider: Provider; client: Anthropic; signal: AbortSignal; system: string; user: string;
    check: (json: unknown) => { value: T } | { problems: string }; effort: "low" | "medium"; maxSearches: number;
  }): Promise<{ value: T; model: string }>;
  export function checkWith<T>(schema: z.ZodType<T>, post?: (v: T) => T): (json: unknown) => { value: T } | { problems: string };
  ```
  These are the current loop (pause_turn continuations, refusal, repair up to `MAX_REPAIRS`, deadline and error mapping), parameterised. `searchToolFor(provider, maxSearches)` replaces the fixed 4 (Anthropic `max_uses`) and 5 (OpenRouter `max_results`, leave at 5). `fetchBeanProfile` calls it with `maxSearches: 4, effort: "medium", user: \`Coffee to research: ${query}\``.
- Produces (`lib/journey/research.ts`):
  ```ts
  export type JourneyInput = { name: string; roaster: string | null; origin: string; region: string | null;
    process: string; variety: string | null; altitude: string | null; sources: string[] };
  export function buildJourneyPrompt(): string;
  export async function fetchJourneyFacts(input: JourneyInput, provider: Provider, client?: Anthropic,
    opts?: { signal?: AbortSignal }): Promise<{ facts: JourneyFacts; model: string }>;
  ```
  It runs with `effort: "low"` and `maxSearches: 3`. The user message is `Coffee: ${JSON.stringify(input)}`.
- The prompt must say:
  - Start from the listed source URLs (the roaster page).
  - Report only facts a source states about this exact coffee or lot. Never infer from country or process norms, and leave a field null when it isn't stated.
  - Name a producer only when a source names it.
  - Each fact's `source` is the URL that states it.
  - `regionCoords` are approximate coordinates of the named region, or null when the region is unclear.
  - Find `roasterCity` and `roasterCountry` from the roaster's own site.
  - End with one JSON object matching the schema (embed `z.toJSONSchema(JourneyFactsSchema)`).
- `post` drops any sourced field whose `source` isn't an http(s) URL. That way a fact can't turn red without a source.

- [ ] **Step 1: Write the failing tests**, reusing `fakeClient` / `msg` from `tests/claude.test.ts` (copy the helpers):
  ```ts
  it("returns validated facts", async () => { const { client } = fakeClient([msg(JSON.stringify(DEMO_JOURNEY_FACTS))]); expect((await fetchJourneyFacts(INPUT, ANTHROPIC, client)).facts).toEqual(DEMO_JOURNEY_FACTS); });
  it("drops facts without a real source", async () => { /* picking.source "roaster site" → picking null */ });
  it("repairs an invalid answer once", async () => { const { client, create } = fakeClient([msg("{}"), msg(JSON.stringify(DEMO_JOURNEY_FACTS))]); await fetchJourneyFacts(INPUT, ANTHROPIC, client); expect(create).toHaveBeenCalledTimes(2); });
  it("uses at most 3 searches at low effort", async () => { const { client, create } = fakeClient([msg(JSON.stringify(DEMO_JOURNEY_FACTS))]); await fetchJourneyFacts(INPUT, ANTHROPIC, client);
    expect(create.mock.calls[0][0]).toMatchObject({ output_config: { effort: "low" }, tools: [{ max_uses: 3 }] }); });
  it("prompt forbids inference and invented producers", () => expect(buildJourneyPrompt()).toMatch(/only facts .* state/i));
  ```
  `DEMO_JOURNEY_FACTS` is added to `lib/fixtures.ts` in this task:
  - `roasterCity: "Kraków"`, `roasterCountry: "Poland"`
  - `producer: { name: "Smallholder farmers of Hambela Wamena", kind: "smallholders", source: "https://example.com/guji-hambela" }`
  - picking `hand`, setting `forest`, drying `raised-beds`, dryingDays 18–24, all with the same source
  - `special: { value: "Grown in forest gardens above 2,000 m.", source: … }`
  - `regionCoords: { lat: 6.0, lon: 38.7 }`
  - `sources: ["https://example.com/guji-hambela"]`
  - every other field null
- [ ] **Step 2: Run** `npx vitest run tests/journey-research.test.ts`. Expected: FAIL.
- [ ] **Step 3: Refactor `lib/claude.ts`**, then run `npx vitest run tests/claude.test.ts`. Expected: PASS with no test edits.
- [ ] **Step 4: Implement** `lib/journey/research.ts`, then run `npx vitest run tests/journey-research.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): research lot facts with the shared Claude loop"`

### Task 7: /api/journey

**Files:**
- Create: `lib/access.ts`, `lib/journey-handler.ts`, `app/api/journey/route.ts`
- Modify: `lib/brew-handler.ts` (use `lib/access.ts`; behaviour unchanged)
- Test: `tests/journey-handler.test.ts`. `tests/brew-handler.test.ts` must pass unchanged.

**Interfaces:**
- Produces:
  ```ts
  // lib/access.ts
  export function accessDenied(headers: Headers, env: Env): boolean;   // timing-safe, as today
  export function providerMissing(env: Env): boolean;                  // no key and not DEMO_MODE
  // lib/journey-handler.ts
  export type JourneyResponse = { status: number; body: { facts: JourneyFacts; model: string } | { code: string; message: string } };
  export async function handleJourney(body: unknown, headers: Headers, env: Env,
    deps: { fetchFacts: (input: JourneyInput) => Promise<{ facts: JourneyFacts; model: string }> }): Promise<JourneyResponse>;
  ```
- The body is `{ input: JourneyInput }`. It's 400 `bad_input` unless `name` and `origin` are 1–120 char strings and `sources` is an array of ≤ 20 strings. The 401, 500 and 502 codes and messages match `handleBrew`. Demo mode returns `{ facts: DEMO_JOURNEY_FACTS, model: "demo" }` without calling `fetchFacts`.
- The route has `maxDuration = 120` and `cache-control: no-store`, mirroring `app/api/brew/route.ts`.

- [ ] **Step 1: Write the failing tests**, mirroring `tests/brew-handler.test.ts`: bad input → 400; the access code is required when set; demo serves the fixture without fetching; no key → 500 `not_configured`; `BrewError("refused")` → 502 `refused`; success passes `input` through to `fetchFacts`.
- [ ] **Step 2: Run** `npx vitest run tests/journey-handler.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `lib/access.ts`, refactor `handleBrew` onto it, then implement the handler and the route.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, including the brew handler tests unchanged.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): /api/journey endpoint"`

### Task 8: Background enrichment and the coffee-page entry point

**Files:**
- Create: `lib/journey/enrich.ts`, `components/journey/JourneyCard.tsx`
- Modify: `lib/history.ts` (add `replaceLookup`), `lib/api.ts` (add `requestJourney`), `components/BrewView.tsx`, `components/TabBar.tsx`
- Test: `tests/journey-enrich.test.ts` (stubbing `localStorage` as `tests/history.test.ts` does), `tests/e2e/journey.spec.ts` (new)

**Interfaces:**
- Consumes: `shouldEnrich`, `buildJourney` (Task 4), `stageCopy` (Task 5), `JourneyInput` (Task 6), `refreshFavourite`/`favKey`.
- Produces:
  ```ts
  // lib/history.ts
  export function replaceLookup(result: BrewResult): void;   // swaps the entry with the same favKey in place; no-op if absent
  // lib/api.ts
  export async function requestJourney(result: BrewResult, signal?: AbortSignal): Promise<JourneyFacts | null>;  // null on any failure
  // lib/journey/enrich.ts ("use client")
  export function attachJourney(result: BrewResult, facts: JourneyFacts, now?: Date): BrewResult;  // replaceLookup + refreshFavourite
  export function useJourneyEnrichment(result: BrewResult): void;
  ```
- `attachJourney` stores the facts only on entries whose `favKey` matches *and* whose `createdAt` equals `result.createdAt`. A newer "Research again" result therefore isn't overwritten by stale facts, and a removed coffee isn't brought back.
- `useJourneyEnrichment` fires once per mounted result when `shouldEnrich(result)` is true and aborts on unmount. It shows no UI on failure.
- `BrewView`:
  - It calls `useJourneyEnrichment(result)`.
  - It renders `<JourneyCard result={result} href={…} />` right after the "How it tastes" `Section`.
  - It adds a "Discover its journey" text link at the end of "About this coffee".
  - The link targets are `/journey?q=<query>`, or `/journey?saved=<favKey>` when `BrewView` was opened from Saved. Pass a new optional `journeyHref` prop from `BeanScreen`'s `SavedBean` and `Lookup`.
  - Unidentified results never render `BrewView`, so they have no entry point.
- `JourneyCard`: a link with the accessible name "Discover its journey". It shows the country outline (`shapeFor`) with a pin, the title "From {first region segment or country} to your cup", and "{n} stages · about 2 minutes".
- `TabBar` returns `null` when `pathname.startsWith("/journey")`.

- [ ] **Step 1: Write the failing unit tests**
  ```ts
  it("attaches facts to the matching lookup and favourite in place", () => { /* remember A and B, favourite A; attachJourney(A) → A has journey, order unchanged */ });
  it("ignores facts for a lookup that was researched again", () => { /* remember A(createdAt t1), then A(createdAt t2); attachJourney(A t1) → stored A has no journey */ });
  it("does not resurrect a removed coffee", () => { /* attachJourney on an absent key leaves both stores unchanged */ });
  it("survives a full store", () => { /* quota 0 → no throw */ });
  ```
- [ ] **Step 2: Write the failing e2e tests** in `tests/e2e/journey.spec.ts`:
  ```ts
  test("the coffee page offers the journey", async ({ page }) => {
    await page.goto("/bean?q=Guji");
    await page.getByRole("link", { name: "Discover its journey" }).first().click();
    await expect(page).toHaveURL(/\/journey\?q=Guji/);
  });
  test("researches the journey once in the background for a roaster's coffee", async ({ page }) => {
    let calls = 0; await page.route("**/api/journey", (r) => { calls++; return r.continue(); });
    await page.goto("/bean?q=Guji"); await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(calls).toBe(0);                                   // demo coffee has no roaster
    await page.evaluate(() => { const l = JSON.parse(localStorage.getItem("crema:lookups")!); l[0].result.bean.roaster = "Demo Roasters"; localStorage.setItem("crema:lookups", JSON.stringify(l)); });
    await page.reload(); await expect.poll(() => calls).toBe(1);
    await expect.poll(() => page.evaluate(() => !!JSON.parse(localStorage.getItem("crema:lookups")!)[0].result.journey)).toBe(true);
    await page.reload(); await page.waitForTimeout(500); expect(calls).toBe(1);
  });
  ```
- [ ] **Step 3: Run** `npx vitest run tests/journey-enrich.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement** everything listed above. The `/journey` page doesn't exist yet, so the first e2e test only checks the URL.
- [ ] **Step 5: Run** `npm test && npm run lint && npm run e2e`. Expected: PASS, and existing e2e tests are unaffected.
- [ ] **Step 6: Commit** `git commit -m "feat(journey): background research and the coffee-page entry point"`

### Task 9: The /journey route, layouts and motion system

At this point every stage renders a placeholder art (`<rect>` with the stage label). Tasks 10–12 replace the placeholders.

**Files:**
- Create: `app/journey/page.tsx`, `components/journey/{journey.css, JourneyScreen.tsx, PhoneStory.tsx, DesktopStory.tsx, useActiveStage.ts, motion.ts, StageCopy.tsx, Badge.tsx}`, `components/journey/art/index.ts`
- Test: `tests/e2e/journey.spec.ts`

**Interfaces:**
- Consumes: `buildJourney`, `mergeUnvisited`, `stageCopy`, `COMPARE_COPY`, `STAGE_LABELS`, `getCachedResult`, `findFavourite`, `useLookups`, `useFavourites`.
- Produces, for Tasks 10–12:
  ```ts
  // components/journey/art/index.ts
  export type ArtProps = { j: Journey; active: boolean };   // remounted (key = run counter) on every entry, so CSS animations replay
  export const ART: Record<StageId, React.ComponentType<ArtProps>>;
  // components/journey/motion.ts
  export function useReducedMotion(): boolean;
  export function useIsDesktop(): boolean;                  // matchMedia("(min-width: 64rem)")
  export function useTween(active: boolean, durationMs: number, delayMs?: number): number;  // 0→1 eased by caller; 1 at once when reduced
  ```
  `journey.css` classes, ported from the prototypes with a `j-` prefix:
  - Entrance: `j-fade`, `j-rise`, `j-grow`, `j-pop`, `j-draw` (uses `--len`, `--dur`), each delayed by `--d`. They animate only under an ancestor `.is-active`.
  - Loops: `j-sway`, `j-drift`, `j-bob`.
  - `.j-stage:not(.is-active) *` sets `animation-play-state: paused`.
  - A reduced-motion media block forces every animation to its end state.
  - Every SVG child gets `transform-box: fill-box`.
- `JourneyScreen`:
  - It reads `q` or `saved` via `useSearchParams` (wrapped in `Suspense` in the page) and finds the result in the live stores.
  - Not found → heading "This coffee isn’t on this device", text "Search for it again to see its journey.", and a link "Back to search" to `/`.
  - `journey = mergeUnvisited(first, buildJourney(live), visited)`. `visited` holds every stage that has been active.
  - It renders `PhoneStory` or `DesktopStory` per `useIsDesktop()`.
  - Close (✕, Esc, "Back to the recipe") goes to `/bean?q=…` or `/bean?saved=…`.
- Overlay: `fixed inset-0 z-50` with the paper background. The page `title` is "Journey".
- `PhoneStory`:
  - A scroll container with `scroll-snap-type: y proximity`.
  - Each stage is a `section` (`aria-labelledby` its h2) with the art at 47% height and `StageCopy` below.
  - A progress bar and ✕ at the top.
  - The active stage is the one ≥ 55% visible. Its run counter increments when it was fully out of view in between.
- `DesktopStory`:
  - The top bar has "← Recipe · {coffee name}", a `nav` labelled "Journey stages" with one button per stage (`STAGE_LABELS`, each with a fill bar), the hint "↑ ↓ to move · Esc", and ✕.
  - Below it: a sticky column centring a 6:5 art card (`max-width: calc((100dvh - 120px) * 1.2)`) with every stage's art stacked. The active one cross-fades in (opacity 0.8 s, scale 1.04 → 1, 1.2 s). Chapters scroll on the right.
  - The active chapter is the one crossing the viewport's middle (`rootMargin: "-50% 0px -50% 0px"`).
  - ↑ / ↓ / PageUp / PageDown move one stage. Esc closes.
  - The body background fades to `#21160f` for the cover and roasted stages.
  - Mouse parallax applies to `[data-depth]` groups, at most 120 × depth px, and never with reduced motion.
- `StageCopy` renders `step`, an h2 `title`, `Badge`s for that stage's facts, the `text` and, on the processed stage, the compare chips. Chips are buttons with `aria-pressed`. This coffee's chip shows "· yours". Chips for natural, washed and honey always show, plus this coffee's process if it's another one. The art stays the same when a chip changes. The cup stage adds the "Back to the recipe" button. The cover adds the producer and the "special" line when present, and lists the sources as host links after the cup stage's text.
- Each art is wrapped in `aria-hidden` SVG, followed by a visually hidden `<p>` with `stageCopy(...).alt`.

- [ ] **Step 1: Write the failing e2e tests** (phone project default; add a `test.describe("desktop", …)` block with the 1440×900 settings used in `flow.spec.ts`):
  ```ts
  test("walks the journey and returns to the recipe", async ({ page }) => {
    await page.goto("/journey?q=Guji");
    await expect(page.getByRole("heading", { name: "Guji Hambela Natural" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
    await page.getByRole("heading", { name: /yours/ }).scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Back to the recipe" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Guji Hambela Natural" })).toBeVisible();
  });
  test("labels facts honestly", async ({ page }) => {
    await page.goto("/journey?q=Guji");
    const processed = page.getByRole("region", { name: /Dried whole|processed/i });
    await expect(processed.locator('[data-provenance="own"]', { hasText: "Natural" })).toBeVisible();
    await expect(page.locator('[data-provenance="advice"]', { hasText: "10–21" })).toHaveCount(1);
  });
  test("compares processes without changing the coffee", async ({ page }) => {
    await page.goto("/journey?q=Guji");
    await page.getByRole("button", { name: "Washed" }).click();
    await expect(page.getByText("Not this coffee, just to compare.")).toBeVisible();
  });
  test("says when the coffee isn't on the device and never researches it", async ({ page }) => {
    let brews = 0; await page.route("**/api/brew", (r) => { brews++; return r.abort(); });
    await page.goto("/journey?q=Something%20else");
    await expect(page.getByRole("heading", { name: "This coffee isn’t on this device" })).toBeVisible();
    expect(brews).toBe(0);
  });
  test("with reduced motion every stage is already finished", async ({ page }) => { /* emulate reduce; the flow.spec `settled()` helper holds on load and after scrolling to each section */ });
  // desktop
  test("jumps between stages from the stage bar and the keyboard", async ({ page }) => {
    await page.goto("/journey?q=Guji");
    const nav = page.getByRole("navigation", { name: "Journey stages" });
    await expect(nav.getByRole("button")).toHaveCount(10);
    await nav.getByRole("button", { name: "Roasted" }).click();
    await expect(page.getByRole("heading", { name: /tasting like coffee/ })).toBeInViewport();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("heading", { name: /breathe/ })).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/bean\?q=Guji/);
    // and no sideways scroll on /journey (reuse the flow.spec overflow check)
  });
  ```
  Headings follow `stageCopy` titles. Adjust the regexes to the titles written in Task 5, but keep the meaning.
- [ ] **Step 2: Run** `npx playwright test tests/e2e/journey.spec.ts`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the files above with placeholder arts.
- [ ] **Step 4: Run** `npm run lint && npm run e2e`. Expected: PASS.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): full-screen route with phone and desktop layouts"`

### Task 10: Art: Cover, Grown, Picked

**Files:**
- Create: `components/journey/art/{CoverArt,GrownArt,PickedArt}.tsx`, then register them in `art/index.ts`
- Test: `tests/e2e/journey.spec.ts` (art assertions)

**Interfaces:**
- Consumes: `ArtProps`, `useTween`, `shapeFor`, `pinFor`, `project`, `journey.css`.
- **Cover** (prototype cover):
  - The country path draws (`j-draw`), the fill fades in, a soft glow sits around the pin (not a boundary), the pin drops with a ripple, and country and region labels appear. Dark palette.
  - Blends use `shapeFor("WORLD")` with one pin per country centroid.
  - An unknown country gets no outline, just a centred pin and the name.
- **Grown:**
  - The sun rises and the clouds drift.
  - Two back layers carry `data-depth` (0.14 and 0.07).
  - The peak height follows `j.grown.peak`, from 0 (neutral hills) through 1 (low rolling hills) to 4 (tall mountains), with **no snow cap**.
  - The altitude line draws and counts up to `altitudeM.max` only when `altitudeM` isn't null.
  - The setting changes the scene: `forest` gets tall canopy trees over the shrubs, `shade` gets a few scattered shade trees, and `sun` gets open rows of shrubs with no shade trees.
- **Picked:**
  - `hand` (prototype): the branch draws, the leaves pop, the cherries ripen green → yellow → red, and three fall into the basket.
  - `machine`: a simple straddle harvester rolls along a row while cherries shake into its hopper, with no hands and no basket.

- [ ] **Step 1: Write the failing e2e assertions**: in each art, check `data-variant` attributes that the arts expose on their root `<g>`:
  ```ts
  test("art adapts to the coffee", async ({ page }) => {
    await page.goto("/journey?q=Guji");
    await expect(page.locator('[data-art="grown"]')).toHaveAttribute("data-variant", "peak-4 forest");
    await expect(page.locator('[data-art="picked"]')).toHaveAttribute("data-variant", "hand");
    await page.evaluate(() => { const l = JSON.parse(localStorage.getItem("crema:lookups")!); Object.assign(l[0].result.bean, { origin: "Brazil", altitude: "900 m", process: "Natural" }); localStorage.setItem("crema:lookups", JSON.stringify(l)); });
    await page.reload();
    await expect(page.locator('[data-art="grown"]')).toHaveAttribute("data-variant", "peak-1 sun");
    await expect(page.locator('[data-art="picked"]')).toHaveAttribute("data-variant", "machine");
  });
  ```
- [ ] **Step 2: Run** `npx playwright test tests/e2e/journey.spec.ts -g "art adapts"`. Expected: FAIL.
- [ ] **Step 3: Implement** the three arts.
- [ ] **Step 4: Run** `npm run e2e`. Expected: PASS. Open `/journey?q=Guji` at 390×844 and at 1440×900 (`npm run dev` with `DEMO_MODE=1`) and check the scenes and motion by eye against the prototype.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): cover, grown and picked scenes"`

### Task 11: Art: Processed, Milled, Sorted

**Files:**
- Create: `components/journey/art/{ProcessedArt,MilledArt,SortedArt}.tsx`, then register them
- Test: `tests/e2e/journey.spec.ts`

**Interfaces:**
- **Processed:**
  - Day counter 1 → `days.max` over 7 s. The sun crosses 4.5 times over that span. The sky fades between night and day.
  - Variants by `process`:
    - `natural`: whole cherries on beds, darkening red → plum and shrinking (prototype).
    - `washed`: a pulper drops beans into a water tank with bubbles, then pale beans dry on the surface.
    - `honey`: sticky amber-coated beans on beds.
    - `anaerobic`: a sealed tank with a valve releasing bubbles, then drying.
    - `wet-hulled`: beans hulled while still moist, then dark green beans dry briefly on a patio.
    - `other`: a neutral drying scene.
  - `drying` swaps the surface: raised beds on legs, a flat patio, or a drum dryer.
- **Milled** (prototype): the husk shakes and splits, flecks fly, the parchment fades and two green beans part. `wetHulled` uses darker, glossier beans.
- **Sorted** (prototype): beans drop into the sack, two faulty beans go into the "set aside" bowl, and the stamp lands with `j.sorted.stamp` lines (at most 3, each truncated to 16 characters).
- Root `data-variant`: processed `"{process} {drying}"`, milled `"wet-hulled"` or `"dry"`, sorted with no variant.

- [ ] **Step 1: Write the failing e2e test**: Guji gives processed `"natural raised-beds"`. Patch the stored lookup to `process: "Washed"` and expect `"washed raised-beds"`. Patch it to `origin: "Brazil"` and expect `"natural patio"`. Patch it to `origin: "Indonesia"`, `process: "Wet-hulled"` and expect milled `"wet-hulled"`.
- [ ] **Step 2: Run it.** Expected: FAIL.
- [ ] **Step 3: Implement** the three arts.
- [ ] **Step 4: Run** `npm run e2e`. Expected: PASS. Check by eye as in Task 10.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): processed, milled and sorted scenes"`

### Task 12: Art: Shipped, Roasted, Rested, Cup

**Files:**
- Create: `components/journey/art/{ShippedArt,RoastedArt,RestedArt,CupArt}.tsx`, then register them (no placeholders left)
- Test: `tests/e2e/journey.spec.ts`

**Interfaces:**
- **Shipped** (prototype): looping waves, a bobbing ship, and a route arc from `port` (or the country name) to `arrival`. The dot travels on activation (`useTween`, 5 s). The grey `weeks` badge comes from the copy.
- **Roasted** (prototype): the drum spins. The bean colour ramps along `--color-roast-*` from green and stops at `level`. The temperature counts up to the end temperature: light 205, medium-light 210, medium 215, medium-dark 222, dark 228 °C. "crack!" pops at 84% of the tween. `medium-dark` and `dark` add a second, smaller "crack!" at 96%. The ramp marker stops on the level's segment.
- **Rested** (prototype): valve puffs. A 21-cell calendar fills up to `max(days.max, 21)` cells, highlighting `days.min…days.max`. The bag label shows name, process and roast.
- **Cup** (prototype): the portafilter streams, the cup fills, "{doseG} g in · {yieldG} g out" counts up, the steam loops, and `notes` pop around the cup as pills. Pill colours are the builder's call, and each note's text must stay readable.
- Root `data-variant`: roasted `level`, shipped `"sea"`.

- [ ] **Step 1: Write the failing e2e tests**:
  - Roasted has `data-variant="light"` for Guji.
  - The cup shows the 4 note pills ("Blueberry", "Strawberry jam", "Jasmine", "Dark chocolate") and "18 g in".
  - With `journey.facts.roasterCountry = "Ethiopia"` patched into the lookup there is no shipped art, and the cup step reads "8 of 8 · In your cup".
  - No element in `/journey` has the placeholder marker `data-placeholder`.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement** the four arts and remove the placeholder component.
- [ ] **Step 4: Run** `npm test && npm run lint && npm run e2e`. Expected: all PASS. Check every stage by eye at 390×844 and 1440×900, with reduced motion on and off.
- [ ] **Step 5: Commit** `git commit -m "feat(journey): shipped, roasted, rested and cup scenes"`
- [ ] **Step 6: Open the PR** from `feat/coffee-journey` to `main`, with a summary and the test results. End the body with the attribution line from the session.
