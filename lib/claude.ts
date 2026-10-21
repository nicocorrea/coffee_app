import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { BeanProfileSchema, clampProfile, type BeanProfile } from "./schema";

export const DEFAULT_MODEL = "claude-opus-5-5";
export const OPENROUTER_DEFAULT_MODEL = "anthropic/claude-opus-5.5";
const OPENROUTER_FALLBACK_MODEL = "anthropic/claude-opus-5";
const MAX_CONTINUATIONS = 3;
/** One budget for the whole lookup, inside the route's 120 s maxDuration. */
const DEADLINE_MS = 110_000;
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export type BrewErrorCode = "refused" | "bad_model_output" | "upstream";

export class BrewError extends Error {
  constructor(
    public code: BrewErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BrewError";
  }
}

/** Where requests go. OpenRouter exposes an Anthropic-compatible Messages API, so one SDK serves both. */
export type Provider = {
  name: "anthropic" | "openrouter";
  model: string;
  baseURL: string | undefined;
  apiKey: string;
};

export function resolveProvider(env: Record<string, string | undefined>): Provider | null {
  if (env.OPENROUTER_API_KEY) {
    return {
      name: "openrouter",
      model: env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL,
      baseURL: "https://openrouter.ai/api",
      apiKey: env.OPENROUTER_API_KEY,
    };
  }
  if (env.ANTHROPIC_API_KEY) {
    return { name: "anthropic", model: env.ANTHROPIC_MODEL || DEFAULT_MODEL, baseURL: undefined, apiKey: env.ANTHROPIC_API_KEY };
  }
  return null;
}

type Routing = Pick<Anthropic.Beta.MessageCreateParamsNonStreaming, "betas" | "fallbacks">;

// OpenRouter takes an explicit fallback list (no "default" mode, no beta header) and has its own search tool.
const routingFor = (p: Provider): Routing =>
  p.name === "openrouter"
    ? { fallbacks: [{ model: OPENROUTER_FALLBACK_MODEL }] }
    : { betas: [FALLBACK_BETA], fallbacks: "default" };

const searchToolFor = (p: Provider) =>
  (p.name === "openrouter"
    ? { type: "openrouter:web_search", parameters: { max_results: 5 } }
    : { type: "web_search_20260209", name: "web_search", max_uses: 4 }) as unknown as Anthropic.Beta.BetaToolUnion;

const JSON_SCHEMA = JSON.stringify(z.toJSONSchema(BeanProfileSchema));

export function buildSystemPrompt(): string {
  return `You are a world-class espresso consultant and green-coffee expert. You help one person brew
the best possible coffee on a Meraki Gen 2 espresso machine.

## The machine (Meraki Gen 2)
- Dual boiler, PID brew temperature adjustable 85–96 °C.
- Built-in 38 mm Timemore conical grinder with 45 discrete steps. It grinds to a dose weight and stops
  the shot on yield weight (0.1 g).
- Low-pressure pre-infusion at 3 or 4 bar (whole bar only) for 5–15 s (whole seconds). It cannot go
  below 3 bar or 5 s, so never suggest other values.
- Fixed ~9 bar extraction. There is NO flow or pressure profiling — never suggest it.
- 58 mm E61-compatible portafilter with an 18 g double basket by default.
- Automatic milk steaming to a target temperature via a probe; it needs about 180 ml or more in the jug.
- The grind-step numbering differs between units, so give grind advice ONLY relative to the user's
  usual medium-roast espresso setting (direction + 0–6 steps). Never invent an absolute grind number.

## Your task
The user gives a coffee: a roaster + product name, or a description (origin, process, roast).
1. Use web search (at most a few searches) to find the actual coffee: roaster page, origin, region,
   process, variety, altitude, roast level, the roaster's tasting notes and any brew recommendations.
   If it is a generic description, reason from typical coffees of that type.
2. Recommend a starting recipe for the Meraki Gen 2 tuned to this coffee. Use sound espresso
   principles: light/dense/high-altitude/washed coffees usually want a finer grind, hotter water
   (93–96 °C), longer ratios (1:2.2–1:2.8) and gentle longer pre-infusion; darker roasts want cooler
   water (88–92 °C), shorter ratios (1:1.8–1:2.2) and a coarser grind. Naturals and anaerobics are
   prone to channeling and over-extraction of ferment notes, so adjust accordingly. Dose is normally
   18 g in the standard basket (16–20 g for others). Shot time counts from pump start, including pre-infusion.
3. Describe flavour honestly: the notes the roaster lists, plus how it really tastes as espresso. Rate
   acidity, sweetness, body, bitterness and finish from 1 to 5.
4. Give 3–5 dial-in symptom → fix pairs specific to this coffee, using only Meraki controls
   (grind steps, dose, yield, temperature, pre-infusion).
5. Give practical tips: rest days after the roast date, water, basket, behaviour with milk.
6. Pick the 1–3 drinks (from the allowed ids) where this coffee shines, and optional short notes for
   specific drinks.
If the input is not a coffee or you cannot identify anything coffee-like, set "identified": false,
put one or two sentences in "reason" telling the user how to search instead (the app shows only this
message), and fill the other fields with generic medium-roast defaults.

## Style
The fields appear on a phone screen. Keep origin, region, process, variety and altitude short, like
a label on a coffee bag (under about 40 characters each, no parentheses or caveats). For blends, set
origin to "Blend" and list the component countries in region. Write the other text plainly and briefly.

## Output
Write your final answer as ONE JSON object matching this JSON Schema, with no other text after it:
${JSON_SCHEMA}`;
}

/** Extracts the last parseable top-level JSON object in model text (fences and prose tolerated). */
export function extractJson(text: string): unknown {
  const fence = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  for (const block of fence.reverse()) {
    try {
      const v = JSON.parse(block);
      if (v && typeof v === "object") return v;
    } catch {}
  }

  let found: unknown;
  for (let start = text.indexOf("{"); start !== -1; start = text.indexOf("{", start + 1)) {
    const end = matchBrace(text, start);
    if (end === -1) continue;
    try {
      const v = JSON.parse(text.slice(start, end + 1));
      if (v && typeof v === "object") {
        found = v;
        start = end;
      }
    } catch {}
  }
  if (found === undefined) throw new Error("no_json");
  return found;
}

function matchBrace(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i;
  }
  return -1;
}

const textOf = (content: Anthropic.Beta.BetaContentBlock[]) =>
  content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

export async function fetchBeanProfile(
  query: string,
  provider: Provider,
  client: Anthropic = new Anthropic({ apiKey: provider.apiKey, baseURL: provider.baseURL, maxRetries: 1 }),
  { signal = AbortSignal.timeout(DEADLINE_MS) }: { signal?: AbortSignal } = {},
): Promise<{ profile: BeanProfile; model: string }> {
  const { model } = provider;
  const routing = routingFor(provider);
  const system = buildSystemPrompt();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Coffee to research: ${query}` },
  ];

  try {
    let response: Anthropic.Beta.BetaMessage | undefined;
    for (let i = 0; i <= MAX_CONTINUATIONS; i++) {
      response = await client.beta.messages.create({
        model,
        max_tokens: 16000,
        system,
        messages,
        output_config: { effort: "medium" },
        tools: [searchToolFor(provider)],
        ...routing,
      }, { signal });
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content });
    }
    if (!response) throw new BrewError("upstream", "No response");
    if (response.stop_reason === "refusal") throw new BrewError("refused", "The model declined this request");

    const text = textOf(response.content);
    try {
      const parsed = BeanProfileSchema.safeParse(extractJson(text));
      if (parsed.success) return { profile: clampProfile(parsed.data), model: response.model };
    } catch {}

    return { profile: await reformat(client, model, routing, query, text, signal), model: response.model };
  } catch (err) {
    if (err instanceof BrewError) throw err;
    if (signal.aborted) throw new BrewError("upstream", "The research took too long. Try again, or add the roaster's name.");
    throw new BrewError("upstream", err instanceof Error ? err.message : String(err));
  }
}

/** Second chance: structured outputs guarantee schema-shaped JSON from the research notes. */
async function reformat(
  client: Anthropic,
  model: string,
  routing: Routing,
  query: string,
  research: string,
  signal: AbortSignal,
): Promise<BeanProfile> {
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    system: buildSystemPrompt(),
    messages: [
      {
        role: "user",
        content: `Coffee: ${query}\n\nResearch notes from a previous step:\n${research || "(none)"}\n\nProduce the final JSON object.`,
      },
    ],
    output_config: { effort: "low", format: betaZodOutputFormat(BeanProfileSchema) },
    ...routing,
  }, { signal });
  if (response.stop_reason === "refusal") throw new BrewError("refused", "The model declined this request");
  const parsed = BeanProfileSchema.safeParse(response.parsed_output);
  if (!parsed.success) throw new BrewError("bad_model_output", "The model returned an unexpected format");
  return clampProfile(parsed.data);
}
