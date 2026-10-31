import { accessDenied, providerMissing, type Env } from "./access";
import { BrewError } from "./claude";
import { DEMO_JOURNEY_FACTS } from "./fixtures";
import type { JourneyFacts } from "./journey/facts";
import type { JourneyInput } from "./journey/research";

export type JourneyResponse = {
  status: number;
  body: { facts: JourneyFacts; model: string } | { code: string; message: string };
};
type Deps = { fetchFacts: (input: JourneyInput) => Promise<{ facts: JourneyFacts; model: string }> };

const error = (status: number, code: string, message: string): JourneyResponse => ({ status, body: { code, message } });

const isText = (v: unknown): v is string => typeof v === "string" && v.length >= 1 && v.length <= 120;
const isTextOrNull = (v: unknown): v is string | null => v === null || typeof v === "string";

function parseInput(body: unknown): JourneyInput | null {
  const raw = body && typeof body === "object" ? (body as { input?: unknown }).input : undefined;
  if (!raw || typeof raw !== "object") return null;
  const i = raw as Record<string, unknown>;
  const { sources } = i;
  if (!isText(i.name) || !isText(i.origin)) return null;
  if (!Array.isArray(sources) || sources.length > 20 || !sources.every((s) => typeof s === "string")) return null;
  const optional = [i.roaster ?? null, i.region ?? null, i.process ?? null, i.variety ?? null, i.altitude ?? null];
  if (!optional.every(isTextOrNull)) return null;
  const [roaster, region, process, variety, altitude] = optional as (string | null)[];
  // JourneyInput.process is a plain string; a missing process is an empty one.
  return { name: i.name, roaster, origin: i.origin, region, process: process ?? "", variety, altitude, sources };
}

export async function handleJourney(body: unknown, headers: Headers, env: Env, deps: Deps): Promise<JourneyResponse> {
  if (accessDenied(headers, env)) return error(401, "access_denied", "Enter your access code to brew.");

  const input = parseInput(body);
  if (!input) return error(400, "bad_input", "Send a coffee with a name, an origin and up to 20 sources.");

  if (providerMissing(env)) {
    return error(500, "not_configured", "Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY (or DEMO_MODE=1) on the server.");
  }

  try {
    if (env.DEMO_MODE === "1") return { status: 200, body: { facts: DEMO_JOURNEY_FACTS, model: "demo" } };
    return { status: 200, body: await deps.fetchFacts(input) };
  } catch (err) {
    if (err instanceof BrewError) return error(502, err.code, err.message);
    return error(502, "upstream", "The coffee oracle is unavailable. Try again.");
  }
}
