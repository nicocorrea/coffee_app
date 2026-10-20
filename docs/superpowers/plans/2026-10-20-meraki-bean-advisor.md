# Crema — Meraki Gen 2 Bean Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A mobile-first Next.js PWA that turns a coffee-bean search into Meraki Gen 2 settings, a flavour profile and recipes for 12 espresso drinks.

**Architecture:** The client pages call one server route (`POST /api/brew`). It asks Claude (with web search) for a bean profile and base recipe, validates and clamps the result with zod, and appends drink recipes computed by a pure function. Favourites live in localStorage. A demo mode serves a fixture so the UI works without an API key.

**Tech Stack:** Next.js 16 (App Router, TypeScript), React 19, Tailwind CSS v4, zod, `@anthropic-ai/sdk`, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-20-meraki-bean-advisor-design.md`

## Global Constraints

- Mobile first: design at a 390 px width; tap targets ≥ 44 px; no horizontal page scroll; respect safe-area insets.
- Units: g, ml, °C, s. Brew temperature 85–96 °C; dose 14–22 g; ratio 1:1–1:3.5; pre-infusion 1–4 bar, 0–15 s; shot time 15–45 s.
- Never recommend pressure or flow profiling (the Meraki runs a fixed ~9 bar).
- Grind advice is relative to the user's usual espresso setting, in steps (0–6). Never give an absolute grind number.
- Default model `claude-opus-5-5` (env `ANTHROPIC_MODEL`), web search tool `web_search_20260209`, `fallbacks: "default"` with beta `server-side-fallback-2026-07-01`.
- The secrets `ANTHROPIC_API_KEY` and `APP_ACCESS_CODE` are only read on the server.

## Review Focus

1. Query that is not coffee ("pizza") → `identified: false` card with refine prompt, not an error screen. Test in Task 3 (route returns 200 with identified false passthrough).
2. Model returns out-of-range numbers (e.g. 100 °C, 30 g dose) → clamped to machine limits, never shown raw. Test in Task 1.
3. Model wraps JSON in prose or code fences → extraction still succeeds. Test in Task 2.
4. Access code set but wrong or missing → 401 and the UI prompts for the code; correct code proceeds. Test in Task 3.
5. Saved favourite opened offline → renders from localStorage without calling the API. Covered by the Task 6 Playwright flow (open the saved item after a reload with the network route aborted).

---

### Task 1: Scaffold + domain core (schema, drinks)

**Files:**
- Create: Next.js scaffold (`create-next-app` with TS, Tailwind, App Router, no `src/`), `vitest.config.ts`
- Create: `lib/schema.ts`, `lib/drinks.ts`, `lib/fixtures.ts`
- Test: `tests/drinks.test.ts`, `tests/schema.test.ts`

**Interfaces (produced):**
- `RoastLevel = "light" | "medium-light" | "medium" | "medium-dark" | "dark"`
- `BeanProfileSchema` (zod) and `type BeanProfile`; fields: `identified`, `reason`, `bean{name, roaster, origin, region, process, variety, altitude, roastLevel, description}`, `flavour{notes[], acidity, sweetness, body, bitterness, finish (1–5), character}`, `recipe{doseG, yieldG, tempC, preinfusion{pressureBar, seconds}, timeMin, timeMax, grind{direction: "finer"|"same"|"coarser", steps, advice}}`, `dialIn[{symptom, fix}]`, `tips{restDays{min,max}, water, basket, milk, extras[]}`, `bestDrinks: DrinkId[]`, `drinkNotes[{drink: DrinkId, note}]`, `sources[]`, `confidence`.
- `clampProfile(p: BeanProfile): BeanProfile` enforces the machine limits.
- `type DrinkId` (12 ids), `DRINKS: DrinkDef[]`, `deriveDrinks(recipe, roastLevel, notes?) => DrinkRecipe[]`.
- `type BrewResult = BeanProfile & { query: string; drinks: DrinkRecipe[]; createdAt: string; model: string }`.
- `DEMO_PROFILE: BeanProfile` (fixture).

- [ ] Step 1: `npx create-next-app@latest . --ts --tailwind --app --eslint --no-src-dir --import-alias "@/*" --use-npm --yes`; `npm i zod @anthropic-ai/sdk`; `npm i -D vitest @playwright/test`; add the scripts `"test": "vitest run"` and `"e2e": "playwright test"`.
- [ ] Step 2: Write failing tests:
  - `deriveDrinks` returns all 12 ids in menu order.
  - doppio yield = base yield; ristretto ratio within 1.0–1.5; lungo ratio ≤ 3.5, temp = base − 1 (min 85).
  - Light-roast flat white steam temp = 58; dark = 61.
  - Every milk drink has `milk.steamMl >= 180`.
  - All grams are multiples of 0.5.
  - `clampProfile` maps 100 °C → 96, 30 g → 22, ratio 5 → 3.5, steps 12 → 6, timeMin > timeMax → swapped.
- [ ] Step 3: Run `npm test`. Expected: FAIL (modules missing).
- [ ] Step 4: Implement `lib/schema.ts` and `lib/drinks.ts` using the derivation table from the spec.
- [ ] Step 5: Run `npm test`. Expected: PASS. Commit `feat: domain schema and drink derivation`.

### Task 2: Claude client (`lib/claude.ts`)

**Interfaces:**
- Consumes: `BeanProfileSchema`, `clampProfile`.
- Produces: `extractJson(text: string): unknown` (first balanced `{…}` object, code fences tolerated; throws `Error("no_json")`); `buildSystemPrompt(): string`; `fetchBeanProfile(query: string, client?: Anthropic): Promise<{profile: BeanProfile; model: string}>` throws `BrewError(code: "refused" | "bad_model_output" | "upstream")`.

Behaviour:
- Call `client.beta.messages.create` with `model`, `max_tokens: 16000`, `output_config: {effort: "medium"}`, `tools: [{type: "web_search_20260209", name: "web_search", max_uses: 4}]`, `betas: ["server-side-fallback-2026-07-01"]` and `fallbacks: "default"`.
- On `pause_turn`, push the assistant content and resume (≤ 3).
- On `refusal`, throw `refused`.
- Join the text blocks, then `extractJson` → `BeanProfileSchema.safeParse`.
- On failure: one `client.messages.parse` call with `output_config.format: zodOutputFormat(BeanProfileSchema)`, given the research text. If that also fails, throw `bad_model_output`.
- Return the clamped profile.

- [ ] Step 1: Failing tests in `tests/claude.test.ts`:
  - `extractJson` handles plain JSON, a fenced block and prose before/after.
  - `fetchBeanProfile` with a fake client: the happy path parses; `pause_turn` resumes once and then parses; `refusal` throws `refused`; garbage text triggers the reformat path.
- [ ] Step 2: Run → FAIL. Step 3: implement. Step 4: run → PASS. Step 5: commit `feat: Claude bean research client`.

### Task 3: API route `app/api/brew/route.ts`

**Interfaces:** `POST {query}` → `200 BrewResult` | `400 {code:"bad_query"}` | `401 {code:"access_denied"}` | `500 {code:"not_configured"}` | `502 {code}`. `export const maxDuration = 60`. Logic lives in `lib/brew-handler.ts` as `handleBrew(body, headers, env, deps)` so it can be tested without Next.

- [ ] Step 1: Failing tests in `tests/brew-handler.test.ts`:
  - 400 for a query shorter than 2 or longer than 120 chars.
  - 401 when `APP_ACCESS_CODE` is set and the header is missing or wrong.
  - 200 when the code is correct.
  - Demo mode returns the fixture with 12 drinks.
  - No key and no demo → 500 `not_configured`.
  - `identified:false` passes through with `drinks: []`.
  - `BrewError` maps to 502 with its code.
- [ ] Step 2–4: implement, then pass. Step 5: commit `feat: brew API route`.

### Task 4: Design system + app shell

**Files:**
- `app/layout.tsx` (fonts: Fraunces display + Inter Tight UI via `next/font`, viewport/themeColor, manifest)
- `app/globals.css` (tokens: espresso #120D0A, crema #E8D5B5, copper #C8834A, surfaces)
- `components/TabBar.tsx` (Search/Saved/Guide, active state, safe-area)
- `app/manifest.ts`, `app/icon.svg`

- [ ] Build; check at 390 px that the tab bar sits fixed at the bottom with a safe-area pad. Commit `feat: app shell and design tokens`.

### Task 5: Screens

**Files:**
- `app/page.tsx` + `components/SearchBox.tsx`, `components/FavouritesStrip.tsx`
- `app/bean/page.tsx` + `components/BrewView.tsx` and its parts: `BeanHero`, `FlavourRadar` (pure SVG, 5 axes), `SettingsGrid`, `DrinkPicker`, `DialIn`, `Tips`, `LoadingStages`, `AccessGate`, `ErrorState`
- `app/saved/page.tsx`, `app/guide/page.tsx`
- `lib/favourites.ts`: `getFavourites(): BrewResult[]`, `isFavourite(key)`, `toggleFavourite(r)`, `favKey(r)` (by bean name + roaster, lowercased), wrapped in try/catch
- `lib/api.ts`: `requestBrew(query)` that adds the stored access code

Behaviour:
- `/bean?q=` fetches; `/bean?saved=<key>` renders from favourites with no fetch.
- A 401 shows `AccessGate`, then retries.
- The drink picker is a horizontal snap scroller of chips; the selected drink renders a recipe card.
- The Guide renders `deriveDrinks` on the classic base (18 g → 36 g, 93 °C, 25–30 s, medium).
- [ ] Commit `feat: search, bean, saved and guide screens`.

### Task 6: Verification

- [ ] `tests/e2e/flow.spec.ts` (Playwright, iPhone 13 viewport, `DEMO_MODE=1 npm run build && npm start` via webServer): search "Ethiopia Guji" → the bean name and "Meraki Gen 2" settings are visible → tap "Flat white" → shows steam temp → tap save → Saved lists it → abort `/api/brew` and open the saved item → it renders.
- [ ] `npm test`, `npm run lint`, `npm run build` all clean. Screenshot at 390 px and review visually.
- [ ] Add a README covering setup, env vars and the Vercel deploy steps. Commit `test: e2e flow; docs: README`.
