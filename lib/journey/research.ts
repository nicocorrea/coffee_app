import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { checkWith, researchJson, type Provider } from "../claude";
import { JourneyFactsSchema, type JourneyFacts } from "./facts";

export type JourneyInput = {
  name: string;
  roaster: string | null;
  origin: string;
  region: string | null;
  process: string;
  variety: string | null;
  altitude: string | null;
  sources: string[];
};

/** A cheaper lookup than the brew research: facts about one lot, nothing else. */
const DEADLINE_MS = 110_000;

export function buildJourneyPrompt(): string {
  return `You research where one specific coffee comes from, so an app can tell its story.

## How to work
- Start from the listed source URLs (the roaster page), then search for the lot, farm or washing station if needed.
- Report only facts a source states about this exact coffee or lot. Never infer from the country or from usual process norms. Leave a field null when it isn't stated.
- Name a producer only when a source names it.
- Each fact's "source" is the URL that states it.
- "regionCoords" are approximate coordinates of the named region, or null when the region is unclear.
- Find "roasterCity" and "roasterCountry" from the roaster's own site.
- "sources" lists the URLs you relied on.

## Output
End with ONE JSON object matching this JSON Schema, with no other text after it:
${JSON.stringify(z.toJSONSchema(JourneyFactsSchema))}`;
}

const isHttp = (url: string) => /^https?:\/\//i.test(url) && URL.canParse(url);

/** A sourced fact without a real link can't be checked, so it is dropped rather than shown. */
function dropUnsourced(f: JourneyFacts): JourneyFacts {
  const out: Record<string, unknown> = { ...f };
  for (const [key, v] of Object.entries(f)) {
    if (v && typeof v === "object" && "source" in v && !isHttp(String(v.source))) out[key] = null;
  }
  return out as JourneyFacts;
}

export async function fetchJourneyFacts(
  input: JourneyInput,
  provider: Provider,
  client: Anthropic = new Anthropic({ apiKey: provider.apiKey, baseURL: provider.baseURL, maxRetries: 1 }),
  { signal = AbortSignal.timeout(DEADLINE_MS) }: { signal?: AbortSignal } = {},
): Promise<{ facts: JourneyFacts; model: string }> {
  const { value, model } = await researchJson({
    provider,
    client,
    signal,
    system: buildJourneyPrompt(),
    user: `Coffee: ${JSON.stringify(input)}`,
    check: checkWith(JourneyFactsSchema, dropUnsourced),
    effort: "low",
    maxSearches: 3,
  });
  return { facts: value, model };
}
