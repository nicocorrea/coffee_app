import { createHash, timingSafeEqual } from "node:crypto";
import { BrewError } from "./claude";
import { deriveDrinks } from "./drinks";
import { DEMO_PROFILE } from "./fixtures";
import type { BeanProfile, BrewResult } from "./schema";

export type BrewErrorBody = { code: string; message: string };
export type BrewResponse = { status: number; body: BrewResult | BrewErrorBody };
type Env = Record<string, string | undefined>;
type Deps = { fetchProfile: (query: string) => Promise<{ profile: BeanProfile; model: string }> };

const error = (status: number, code: string, message: string): BrewResponse => ({ status, body: { code, message } });

const digest = (s: string) => createHash("sha256").update(s).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export async function handleBrew(body: unknown, headers: Headers, env: Env, deps: Deps): Promise<BrewResponse> {
  if (env.APP_ACCESS_CODE && !sameSecret(headers.get("x-access-code") ?? "", env.APP_ACCESS_CODE)) {
    return error(401, "access_denied", "Enter your access code to brew.");
  }

  const raw = body && typeof body === "object" ? (body as { query?: unknown }).query : undefined;
  const query = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (query.length < 2 || query.length > 120) {
    return error(400, "bad_query", "Search for a coffee using 2–120 characters.");
  }

  const demo = env.DEMO_MODE === "1";
  if (!demo && !env.OPENROUTER_API_KEY && !env.ANTHROPIC_API_KEY) {
    return error(500, "not_configured", "Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY (or DEMO_MODE=1) on the server.");
  }

  try {
    const { profile, model } = demo
      ? { profile: DEMO_PROFILE, model: "demo" }
      : await deps.fetchProfile(query);
    const drinks = profile.identified
      ? deriveDrinks(profile.recipe, profile.bean.roastLevel, profile.drinkNotes)
      : [];
    return { status: 200, body: { ...profile, query, drinks, model, createdAt: new Date().toISOString() } };
  } catch (err) {
    if (err instanceof BrewError) return error(502, err.code, err.message);
    return error(502, "upstream", "The coffee oracle is unavailable. Try again.");
  }
}
