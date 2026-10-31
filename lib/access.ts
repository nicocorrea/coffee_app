import { createHash, timingSafeEqual } from "node:crypto";

export type Env = Record<string, string | undefined>;

const digest = (s: string) => createHash("sha256").update(s).digest();
const sameSecret = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

/** True when an access code is configured and the request does not present it. */
export function accessDenied(headers: Headers, env: Env): boolean {
  return Boolean(env.APP_ACCESS_CODE) && !sameSecret(headers.get("x-access-code") ?? "", env.APP_ACCESS_CODE!);
}

/** True when there is no provider key and demo mode is off. */
export function providerMissing(env: Env): boolean {
  return env.DEMO_MODE !== "1" && !env.OPENROUTER_API_KEY && !env.ANTHROPIC_API_KEY;
}
