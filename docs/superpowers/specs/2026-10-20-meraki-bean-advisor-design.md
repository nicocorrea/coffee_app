# Crema — Meraki Gen 2 Bean Advisor (Design)

Date: 2026-10-20

## Intent

A premium, mobile-first webapp. The user searches for any coffee bean (roaster + name, or a
description like "Kenya AA washed light roast") and gets:

1. What the bean is: roaster, origin, region, process, variety, altitude, roast level.
2. How it tastes: tasting notes, a flavour radar (acidity, sweetness, body, bitterness, finish),
   and a short character description.
3. The best starting settings on a **Meraki Gen 2**: dose, yield, ratio, brew temperature,
   pre-infusion (pressure + seconds), target shot time, grind direction.
4. Recipes for every espresso drink: ristretto, espresso, doppio, lungo, americano, long black,
   macchiato, cortado, piccolo, flat white, cappuccino, latte. Milk drinks include milk volume
   and Meraki auto-steam target temperature.
5. Bean-specific dial-in guidance plus other important tips (rest days, water, basket).

Success: from a phone, the user types a bean and within ~25 s sees a polished recipe card they
can follow at the machine, and can save it to favourites.

## Machine constraints (Meraki Gen 2)

Settings must stay inside what the machine actually controls:

- Grind-by-weight dose target and stop-by-weight yield target (0.1 g display).
- PID brew temperature, adjustable 85–96 °C.
- Low-pressure pre-infusion, tunable by pressure and time.
- Pump pressure fixed at ~9 bar; no flow profiling. The app never recommends pressure profiling.
- 38 mm Timemore conical grinder, 45 discrete steps. The numbering of the steps is not published,
  so grind advice is **relative** ("2–3 steps finer than your usual medium-roast espresso setting"),
  never an invented absolute number.
- 58 mm E61-compatible portafilter. Default basket: 18 g double.
- Hands-free milk steaming to a target temperature (wand probe).

## Decisions

| Topic | Decision |
|---|---|
| Bean knowledge | Claude (default `claude-opus-5-5`, effort `medium`, env `ANTHROPIC_MODEL` overrides) with the server-side `web_search_20260209` tool and server-side refusal fallbacks (`fallbacks: "default"`). The research turn ends with a JSON object, which is parsed and zod-validated. If that fails, a second call with structured outputs (`output_config.format`) and no tools reformats the research into the schema. |
| Hosting | Next.js (App Router, TypeScript) deployed to Vercel. API key is a server secret. |
| Access control | Optional `APP_ACCESS_CODE` env var. When set, `/api/brew` requires header `x-access-code`; the UI asks for the code once and keeps it in localStorage. |
| Drink recipes | Derived deterministically in code by `deriveDrinks(base)` from the bean's base recipe; Claude adds only bean-specific notes. The Guide page uses the same table. |
| Persistence | Favourites only, in localStorage, storing the full result (opens instantly, works offline). |
| Demo mode | `DEMO_MODE=1` returns a bundled fixture from `/api/brew` so the UI can be developed and tested without an API key. |
| Units | Grams, millilitres, °C, seconds. |
| PWA | Web manifest + icons so the app can be added to the home screen. |

## Screens

Bottom tab bar: **Search · Saved · Guide**.

- **Search (`/`)**: brand header, large search field near the thumb zone, example chips,
  horizontal favourites strip.
- **Bean (`/bean?q=…`)**: staged loading screen ("Finding the roaster… Reading tasting notes…
  Dialling in your Meraki…"), then:
  - Hero: bean name, roaster, roast-level pill, origin/process/variety/altitude facts.
  - Flavour: notes as chips, SVG radar chart, character paragraph.
  - Meraki Gen 2 base recipe: settings grid (dose, yield, ratio, temp, pre-infusion, time, grind).
  - Drinks: horizontally scrollable selector; selected drink shows dose, yield/ratio, time, temp,
    water/milk volumes, steam temperature, and a note.
  - Dial-in: symptom → fix list tailored to the bean.
  - Tips: rest days after roast, water, basket, any extra notes.
  - Save (★) and confidence/source note ("Based on roaster info from …").
  - Unidentified bean: friendly message with a refine prompt.
- **Saved (`/saved`)**: list of favourite cards; tap opens the stored result without calling the API.
- **Guide (`/guide`)**: static reference of every drink's ratio, volumes and character, plus
  general espresso dial-in rules.

## Architecture

```
app/
  page.tsx            Search
  bean/page.tsx       Bean result (client: fetch + render)
  saved/page.tsx      Favourites
  guide/page.tsx      Static drink guide
  api/brew/route.ts   POST { query } -> BrewResult JSON
lib/
  schema.ts           zod schemas + types (BeanProfile, BaseRecipe, BrewResult)
  drinks.ts           DRINKS table + deriveDrinks(base) — pure
  claude.ts           buildPrompt + callClaude (web search, JSON extraction, one retry)
  favourites.ts       localStorage helpers
  fixtures.ts         demo result
components/           UI pieces (SettingsGrid, FlavourRadar, DrinkPicker, ...)
```

Data flow: Search submits → `/bean?q=` → client POSTs `/api/brew` → route checks access code,
validates the query (2–120 chars) → Claude (web search, then a final JSON answer) → extract the
JSON → zod-validate and clamp the values to the machine's limits (temp 85–96, dose 14–22, etc.)
→ the response includes `drinks = deriveDrinks(base)` → render.

## Drink derivation rules

Base = the bean's espresso recipe (dose D, ratio R, temp T, time t). The single-basket drinks
(ristretto, espresso) use the same double dose to keep the grinder dialled; "espresso" splits
the double.

| Drink | Dose | Yield | Time | Extra |
|---|---|---|---|---|
| Ristretto | D | D × clamp(R − 1, 1, 1.5) | ~t − 8 s | same grind or 1–2 finer |
| Espresso (single) | D | D × R, split into two cups | t | half to each cup |
| Doppio | D | D × R | t | — |
| Lungo | D | D × min(R + 1, 3.5) (≈1:3) | t + 10 s | 1–2 steps coarser, temp −1 °C |
| Americano | D | D × R | t | shot first, then top with 150 ml hot water (~90 °C) |
| Long black | D | D × R | t | 120 ml hot water first, shot on top |
| Macchiato | D | D × R | t | 15 ml microfoam, 60 °C |
| Cortado | D | D × R | t | 60 ml milk, 58 °C, thin texture |
| Piccolo | D | ristretto yield | ristretto time | 80 ml milk, 58 °C |
| Flat white | D | D × R | t | 120 ml milk, 60 °C, thin microfoam |
| Cappuccino | D | D × R | t | 150 ml milk, 62 °C, thick foam |
| Latte | D | D × R | t | 220 ml milk, 60 °C, silky |

Milk drinks steam at least 180 ml in the Meraki jug (the auto-steam probe needs that volume) and pour only what the recipe needs. Every number is rounded to 0.5 g / 1 s / 1 °C. The milk temperature drops 2 °C for light roasts
(to keep sweetness) and rises 1 °C for dark roasts.

## Error handling

- Missing API key (and not demo mode) → 500 with `code: "not_configured"`; the UI explains the setup.
- Wrong or missing access code → 401; the UI shows the access-code prompt.
- Query invalid → 400 with a message.
- Claude says the input isn't a coffee or can't be identified → 200 with `identified: false` + reason;
  the UI shows the refine state.
- JSON parse or validation failure → one structured-output reformat call, then 502 `bad_model_output`.
- `pause_turn` from the server tool → append the assistant turn and resume (max 3 continuations).
- `stop_reason: refusal` after fallbacks → 502 `refused`.
- Upstream timeout/error → 502; the UI shows a retry button. Route `maxDuration = 60`.

## Testing

- Vitest unit tests: `deriveDrinks` (ratios, rounding, roast adjustments, all 12 drinks present),
  schema validation and clamping, JSON extraction from model text, the API route (access code,
  validation, demo mode, mocked Claude path).
- Playwright smoke test at a 390×844 viewport with `DEMO_MODE=1`: search → result renders →
  pick a drink → save → appears in Saved.

## Out of scope (v1)

Shot logging, grind calibration, recent searches, accounts/cloud sync, non-espresso brew methods.
