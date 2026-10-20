# Crema — Meraki Gen 2 bean advisor

A mobile-first web app. Search any coffee (a roaster and bag, or an origin and process) and get:

- what the coffee is: origin, region, process, variety, altitude and roast level
- how it tastes: tasting notes, a flavour radar and a description of its character
- a starting recipe for the **Meraki Gen 2**: dose, yield, ratio, brew temperature, pre-infusion
  (pressure and seconds), target shot time and grind direction
- recipes for 12 drinks (ristretto, espresso, doppio, lungo, americano, long black, macchiato,
  cortado, piccolo, flat white, cappuccino, latte), including milk volume and the auto-steam temperature
- dial-in fixes for this specific coffee, rest days, water, basket and milk tips

Saved coffees live on the device and open offline. The Guide tab gives the classic ratios for every drink.

## How it works

`POST /api/brew` asks Claude (`claude-opus-5-5` by default) to research the coffee with web search. The
answer is validated against a zod schema (`lib/schema.ts`) and clamped to what the Meraki Gen 2 can
actually do (85–96 °C, 14–22 g, 1:1–1:3.5, pre-infusion 1–4 bar for 0–15 s). The drink recipes are then
derived in code from the base recipe (`lib/drinks.ts`), so ratios stay consistent.

Grind advice is relative ("2 steps finer than your usual medium-roast setting"). Meraki doesn't publish
the numbering of its 45 grinder steps, so the app never makes up an absolute number.

## Run locally

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY, or set DEMO_MODE=1
npm run dev                  # http://localhost:3000
```

To open it on your phone over Wi-Fi, run `npm run dev -- -H 0.0.0.0` and visit `http://<your-mac-ip>:3000`.

## Deploy to Vercel

1. Push this repository to GitHub and import it at vercel.com/new (framework: Next.js).
2. Under Settings → Environment Variables, add `ANTHROPIC_API_KEY` and `APP_ACCESS_CODE`.
   Optionally add `ANTHROPIC_MODEL`.
3. Deploy, open the URL on your phone and choose **Add to Home Screen**. Enter the access code once.

Lookups take about 20–40 s, and the route allows up to 120 s (`maxDuration`).

## Tests

```bash
npm test          # unit tests: drink derivation, schema clamping, Claude client, API handler
npm run e2e       # Playwright at iPhone size against a production build in demo mode
```
