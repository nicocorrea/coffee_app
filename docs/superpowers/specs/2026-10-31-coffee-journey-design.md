# Crema: The Coffee's Journey (Design)

Date: 2026-10-31
Builds on: `2026-10-20-meraki-bean-advisor-design.md`
Reference prototypes (throwaway, for look and feel only):
`2026-10-31-coffee-journey/prototype-phone.html` and `prototype-desktop.html`. Open them in a browser.

## Intent

Crema already tells you how to brew a coffee and what it will taste like. The owner wants every
coffee to feel like **an experience from the very beginning**: from the plant on a hillside to the
bag they bought, to the shot they just pulled on their Meraki.

The moment it serves: **the coffee is made and they're tasting it.** That's when they want to know its
story: where it was grown, how it was picked and processed, how it travelled and was roasted, and
how that history shows up in the cup they're holding.

It must be told visually, with illustrations and motion, not as a wall of text. The owner doesn't
know agronomy terms, so everything is explained in plain, everyday language.

## Goals

1. From any researched coffee, the user can tap into a **full-screen, illustrated, animated journey**
   in nine stages, from origin to cup.
2. The journey **adapts to each coffee**: the country map and region pin, mountain height from
   altitude, the processing scene (washed, natural, …), how it was picked and dried, the export port,
   the roast level, the rest window, the recipe and the tasting notes.
3. Every fact is **honestly labelled** as either *this coffee's own fact* (red badge, from the roaster
   or other sources) or *how it's usually done* (grey badge, a typical default for that country or
   process).
4. It **ties the story back to the taste**: the processing stage explains which tasting notes come
   from it, and the last stage lands on the tasting notes in your cup.
5. It feels **crafted on both a phone and desktop**, with a layout designed for each.

## Non-goals (v1)

- Video files, narration, sound or music.
- Real photographs of farms or producers.
- Letting the user edit or correct the story.
- Sharing or exporting the journey.
- Non-espresso brew methods (the cup stage is the Meraki recipe, as in the rest of the app).

## Anti-goals (a failure even if it "works")

- **Invented specifics.** Never name a farm, producer, washing station, person, fermentation time or
  harvest date that wasn't found in a source. Gaps are filled with what's *usual*, clearly marked.
  Never fill them with something that sounds specific.
- **Slowing down the recipe.** The recipe is used at the machine, so the journey must never delay it.
- **Jargon.** Terms like *parchment*, *first crack* or *wet-hulled* only appear with a plain
  explanation right next to them.
- **Inaccurate drawings.** For example, no snow caps on mountains (coffee doesn't grow near snow;
  the prototype's snow cap is a mistake), and no hand-picking scene for a coffee known to be
  machine-harvested.
- **Making the user wait while reading.** Content must not jump, reset scroll or replay the stage
  they're reading because data arrived.

## The experience

### Entry point

On the coffee page (`BrewView`), add a **"Discover its journey"** card directly after the
"How it tastes" section, where the user is reading while sipping. It has a small illustrated
thumbnail (the country shape with a pin), a title like *"From Guji to your cup"*, and a line like
*"9 stages · about 2 minutes"*. The "About this coffee" section gets a text link to the same place.
*(Placement is my call.)*

Opening it goes to a **full-screen route**, `/journey`, which finds the coffee the same way the bean
page does: `?q=` uses the on-device lookup cache, and `?saved=` uses favourites. It **never triggers
a new brew lookup**. If the coffee isn't on the device, it shows a short message and a link back.
Closing (✕, Esc, "Back to the recipe", or browser back) returns to the coffee page. The bottom tab
bar is hidden on this route.

### The nine stages (plus a cover)

| # | Stage | Drawing and motion (see prototype) | What changes per coffee |
|---|---|---|---|
| 0 | **Cover** | Country outline draws itself, region fills, pin drops with a ripple. Dark background. | Country shape, region pin, coffee name. Blends: a cropped world map with a pin per country. |
| 1 | **Grown** | Sun rises, layered landscape, trees grow, altitude line draws and counts up. | Mountain height from altitude. Setting: forest shade / shade trees / full sun. Variety badge. |
| 2 | **Picked** | Cherries ripen green → yellow → red, the ripe ones drop into a basket. | Hand-picked vs machine-harvested (a harvester scene for e.g. much of Brazil). |
| 3 | **Processed** | The process scene runs over a day counter, with the sun crossing the sky repeatedly. | Process scene: natural, washed, honey, anaerobic, wet-hulled, or a generic "other". Drying surface: raised beds, patio or mechanical dryer. Number of days. Compare chips. |
| 4 | **Milled** | Dried husk shakes and cracks open, flecks fly, two green beans are revealed. | Mostly universal. Wet-hulled coffees show the darker, still-moist bean. |
| 5 | **Sorted & bagged** | Beans fall into a jute sack, faulty ones go into a "set aside" bowl, a stamp lands. | Stamp text (country · region · process). Grade badge if known. |
| 6 | **Shipped** | Ship rocks on looping waves, a dot travels the route arc. | Export port (from a table in the app) → Europe. See "Shipping assumes Europe" below. |
| 7 | **Roasted** | Drum spins, bean colour runs from green along a roast ramp, temperature climbs, "crack!" pops. | Where the ramp stops (the existing `roastLevel`). Dark roasts also show a second crack. |
| 8 | **Rested** | Gas puffs from the bag's valve, a calendar fills, the best window lights up. | `tips.restDays` (existing). Bag label shows name, process and roast. |
| 9 | **In your cup** | Espresso pours, cup fills, grams count up, steam rises, tasting notes pop up around the cup. | Recipe dose/yield/temperature and the top 3–4 tasting notes (existing). |

Each stage has: a step label ("3 of 9 · Processed"), a short title, badges (red = this coffee,
grey = usually), and one paragraph of 2–3 plain sentences. The processing paragraph names the tasting
notes it's responsible for, when that link is sound (for example, natural → fruity notes).

**Compare chips (stage 3):** chips for Natural, Washed and Honey, plus this coffee's process if it's
none of those. This coffee's chip is marked "yours" and selected by default. Choosing another swaps the
paragraph to a short "If it were …" explanation, marked "Not this coffee, just to compare." The
illustration does not change. These three comparison texts are fixed copy in the app.

### Shipping assumes Europe

The owner lives in Poland and buys from roasters in Poland or elsewhere in Europe. Buying where the
coffee was grown is rare (holidays only). So:

- The route runs from the country's **export port** to **Europe**. The arrival label is the roaster's
  city or country when `JourneyFacts` found it, otherwise "Europe". A grey line names the usual
  European arrival ports for green coffee (for example Hamburg, Antwerp or Trieste, to verify).
- Sea time comes from the country table as a typical range to Europe (grey).
- **Rare case:** if `JourneyFacts` shows the roaster is in the coffee's own country, the Shipped stage
  is **left out** (the journey becomes 8 stages, renumbered). That keeps it true without new art.
  *(My call.)*

### Layouts

- **Phone and tablet portrait** (below the app's `lg` breakpoint): a vertical storybook. Each stage is
  one screen tall, with the illustration on top (~47% of the height) and the text below. Soft scroll
  snapping, a thin progress bar and a ✕ at the top. See `prototype-phone.html`.
- **Desktop** (`lg` and up): the illustration is a large card **pinned on the left**, keeping its drawn
  proportions (6:5). Stage text scrolls on the right. The stage whose text crosses the middle of
  the window is active, and its illustration cross-fades in and plays. A top bar holds
  "← Recipe · coffee name", a clickable stage bar (Origin … Your cup) that fills as you read, and ✕.
  ↑/↓ and PageUp/PageDown move one stage, Esc closes. A slight mouse-parallax on layered scenes. See
  `prototype-desktop.html`.
- Cover and Roasted use a dark palette (on desktop the whole page fades dark for those stages).

### Motion rules

- A stage's animation plays when it becomes active and **replays** when you come back to it.
- Only the active stage animates. Looping motion (waves, steam, swaying trees) pauses off-screen.
- `prefers-reduced-motion`: show every stage in its finished state, with no looping motion and no
  parallax. All content stays readable.
- Use plain CSS keyframes, inline SVG and small `requestAnimationFrame` tweens (counters, colour
  ramps), as in the prototypes. **No new animation library** *(my call: the prototypes prove it isn't
  needed)*.

### Visual style

The app's existing palette and type (paper, surface, ink, cascara, sage, the roast colour ramp,
Bricolage Grotesque with the condensed width for headings). Flat, warm, hand-made illustrations as in
the prototypes, but more crafted. The prototype drawings are placeholders for composition and
motion. The final art is the builder's to draw, within that style.

## Where the story comes from

### Which badge a fact gets (provenance rule)

The existing brew lookup sometimes guesses. Generic searches reason "from typical coffees of that
type", and a `low` confidence result follows similar coffees. So a fact being in the profile doesn't
make it this coffee's own. *(My call, following the owner's "fill the gaps with what's usual" rule.)*

- **Red ("this coffee"):**
  - `confidence: "high"`: every identity field in the profile (country, region, producer, process,
    variety, altitude, roast level).
  - `confidence: "medium"`: only country and process, which are almost always on the bag.
  - Any non-null `JourneyFacts` field that has a source URL.
- **Grey ("usually"):** everything else, including all profile fields at `confidence: "low"` and
  every country-table default.
- **Outlined neutral ("for your Meraki"):** Claude's advice rather than facts about the lot: rest
  days, dose, yield, temperature. The prototype's red badges on these are wrong.
- **No background enrichment** (`/api/journey`) for `low` confidence results or generic searches with
  no roaster. With no specific lot behind them, a web search could pull in details about some other
  lot. Those coffees get the local journey only.

### 1. A local journey, always available (no network)

`buildJourney(result: BrewResult, extra?: JourneyFacts): Journey` is a pure function that builds the
whole journey from data the app already has, plus a **country table** of typical practices:

- From the existing profile: country (`bean.origin`), region, altitude (parse the free text such as
  "1,950–2,200 masl" into min/max metres), process (map the free text to one of the process scenes),
  variety, roast level, rest days, recipe, tasting notes, roaster.
- From the country table: typical picking method, setting (shade/sun), drying surface, drying days
  per process, typical altitude range, export port, a map shape key. Everything taken from here is a
  grey "usually" fact.
- Unknown country, or a blend: generic defaults (and the world map for blends).

This means **every coffee already researched, including saved ones from before this feature, gets a
journey instantly and offline.** It also covers demo mode.

**Country table** (`lib/journey/countries.ts`), starting with the main producers: Ethiopia, Kenya,
Rwanda, Burundi, Uganda, Tanzania, Yemen, Colombia, Brazil, Peru, Bolivia, Ecuador, Guatemala, Honduras,
El Salvador, Nicaragua, Costa Rica, Panama, Mexico, Jamaica, Indonesia, Papua New Guinea, India,
Vietnam, China (Yunnan), Myanmar and Thailand. Example entries to verify while building: Ethiopia →
Djibouti; Kenya → Mombasa; Brazil → Santos; Colombia → Buenaventura or Cartagena; Indonesia →
wet-hulled is common in Sumatra; Brazil → machine harvest and patio drying are common.
Values must be checked against reputable sources while building. Where practice varies widely within a
country, use the most common practice and keep it grey.

### 2. Extra facts researched in the background

After the coffee page shows a fresh lookup (identified, no journey facts stored yet), the client quietly
calls a new endpoint, **`POST /api/journey`**, so the recipe is never slower. *(Background fetch is my
call, so the recipe stays fast.)*

- Same plumbing as `/api/brew`: access code, provider resolution (Anthropic or OpenRouter), demo mode
  (returns a fixture), error codes, `maxDuration = 120`.
- Input: the stored bean facts (name, roaster, origin, region, process, variety, altitude) and its
  `sources`, so Claude can start from the roaster page it already found.
- Claude (same model and fallbacks as brew, lower effort, web search with fewer uses) returns
  zod-validated **`JourneyFacts`**: only facts it found, each with the source URL it came from, plus
  the region's approximate latitude and longitude. Same JSON extraction and repair loop as
  `lib/claude.ts`.
- Facts it looks for: the roaster's city and country, producer (farm / washing station / cooperative / smallholders, **only if
  named in a source**), picking method, shade or sun, drying surface and days, fermentation details,
  grade, harvest months, a short "what makes this lot special" line, and region coordinates.
- Every `JourneyFacts` field is nullable. Anything null falls back to the country table (grey).
  Anything present is red and its source shows in the journey's footer.
- The result is stored on the `BrewResult` (`journey?: { facts: JourneyFacts; createdAt }`) in both the
  lookup cache and favourites (via `rememberLookup` / `refreshFavourite`), so it's fetched **once per
  coffee** and works offline afterwards. "Research again" on the coffee page also refreshes it.
- If it fails, nothing breaks: the local journey stands. Retry silently the next time the coffee page
  opens. No error UI.
- If the user is already inside the journey when the facts arrive, update stages they **haven't
  reached yet**, and never reset scroll or replay the current stage.

**Stage paragraphs** are written in the app, not by Claude. They are templates per stage and variant
(for example, Processed × natural / washed / …) that slot in the facts. This keeps the tone consistent
and the honesty rules enforceable ("usually" wording for grey facts, specific wording only for red).
The one Claude-written line is the optional "what makes this lot special", shown on the cover only
when found. *(My call: templates over generated prose, to keep invented detail out.)*

### Map

- Bundle simplified country outlines for the producing countries in the table, from **Natural Earth**
  (public domain). Pre-convert them to SVG path data with a small committed script, and store them as
  a static JSON module (target under ~150 KB). No map library or tiles at runtime.
- The pin uses the Claude-provided coordinates when present and inside the country's bounds. Otherwise
  it uses a per-country centroid with the region name as a label only. The pin is approximate and
  the drawing says nothing more precise than "region".
- Blends: a cropped world view with a pin per listed country.
- "Region fills" on the cover means a **soft, approximate glow around the pin**, not a real region
  boundary. No sub-national map data is bundled. *(My call.)*

## Data shapes (indicative; final names are the builder's)

```ts
type Provenance = "own" | "usual";           // red vs grey badge
type Fact = { label: string; value: string; provenance: Provenance; sourceUrl?: string };

type Journey = {
  place: { countries: string[]; region: string | null; lat: number | null; lon: number | null;
           producer: Fact | null; special: string | null };
  grown:     { altitudeM: { min: number; max: number } | null; setting: "forest" | "shade" | "sun"; facts: Fact[] };
  picked:    { method: "hand" | "machine"; facts: Fact[] };
  processed: { process: "natural" | "washed" | "honey" | "anaerobic" | "wet-hulled" | "other";
               drying: "raised-beds" | "patio" | "mechanical"; days: { min: number; max: number }; facts: Fact[] };
  milled:    { facts: Fact[] };
  sorted:    { stamp: string[]; facts: Fact[] };
  shipped:   { port: string | null; weeks: { min: number; max: number }; facts: Fact[] };
  roasted:   { level: RoastLevel; facts: Fact[] };
  rested:    { days: { min: number; max: number }; facts: Fact[] };
  cup:       { doseG: number; yieldG: number; tempC: number; notes: string[] };
  sources:   { url: string; host: string }[];
};
```

Mountain height: map the top of the altitude range to the peak height in steps. Below ~1,000 m:
low rolling hills. 1,000–1,500 m: hills. 1,500–2,000 m: mountains. Above 2,000 m: tall mountains.
Unknown: neutral hills with the country's typical range as a grey badge and no counter.

## Accessibility

- All stage text is real HTML. Each illustration is `aria-hidden` with a one-sentence visually hidden
  summary per stage ("A drying bed of cherries darkening over 21 days").
- Keyboard: Tab reaches ✕, the stage bar, the chips and the CTA. Arrow keys and Esc as above.
- Contrast meets WCAG AA in both palettes. Reduced motion as above.

## Error and edge cases

- `identified: false` results have no journey entry point.
- Missing altitude, region, variety or process → that stage uses grey defaults. A stage is never empty.
- Unrecognised process text → the "other" scene with a generic explanation that names the roaster's
  term.
- Unknown country → generic map silhouette (no outline) and generic defaults.
- Older saved coffees without `journey` → local journey. Background enrichment runs when they're next
  opened online.

## Testing

- Unit (Vitest): altitude text parsing, process mapping, country table lookups and fallbacks,
  `buildJourney` provenance (red only when the fact came from the profile or `JourneyFacts`), mountain
  step mapping, `JourneyFacts` schema validation, the `/api/journey` handler (access code, demo, bad
  input, upstream errors with mocked Claude).
- Playwright (`DEMO_MODE=1`), at a 390×844 viewport and at 1440×900: open a coffee → open the journey →
  reach the last stage → "Back to the recipe" returns to the coffee page. On desktop, the stage bar
  jumps to a stage. With reduced motion emulated, every stage shows its final state.
- Snapshot or visual check of each process scene variant in demo data.

## Left to the builder

- Final illustrations and exact choreography, within the style and motion rules above.
- Component and file structure, and the exact schema field names.
- The exact country-table values (verified against sources) and copy templates, following the tone
  and honesty rules.
- Pill colours for tasting notes in the cup stage.
- Whether the desktop stage bar shows labels at every width or collapses to dots on narrower `lg`
  screens.

## Cost note

One extra Claude call (with a few web searches) per newly researched coffee, made once and stored on
the device. Saved and cached coffees don't repeat it.
