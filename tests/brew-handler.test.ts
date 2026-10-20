import { describe, expect, it, vi } from "vitest";
import { handleBrew } from "@/lib/brew-handler";
import { BrewError } from "@/lib/claude";
import { DEMO_PROFILE } from "@/lib/fixtures";

type Fetch = Parameters<typeof handleBrew>[3]["fetchProfile"];
const ok = () => vi.fn<Fetch>().mockResolvedValue({ profile: DEMO_PROFILE, model: "claude-opus-5-5" });
const env = { ANTHROPIC_API_KEY: "sk-test" };
const call = (body: unknown, opts: { env?: Record<string, string | undefined>; code?: string; fetchProfile?: Fetch } = {}) =>
  handleBrew(body, new Headers(opts.code ? { "x-access-code": opts.code } : {}), opts.env ?? env, {
    fetchProfile: opts.fetchProfile ?? ok(),
  });

describe("handleBrew", () => {
  it("rejects missing, short and long queries", async () => {
    expect((await call({})).status).toBe(400);
    expect((await call({ query: " a " })).status).toBe(400);
    expect((await call({ query: "x".repeat(121) })).status).toBe(400);
    expect((await call(null)).status).toBe(400);
  });

  it("requires the access code when configured", async () => {
    const e = { ...env, APP_ACCESS_CODE: "crema" };
    expect((await call({ query: "Guji" }, { env: e })).status).toBe(401);
    expect((await call({ query: "Guji" }, { env: e, code: "nope" })).body).toMatchObject({ code: "access_denied" });
    expect((await call({ query: "Guji" }, { env: e, code: "crema" })).status).toBe(200);
  });

  it("returns the profile with 12 derived drinks", async () => {
    const fetchProfile = ok();
    const res = await call({ query: "  Guji natural " }, { fetchProfile });
    expect(res.status).toBe(200);
    expect(fetchProfile).toHaveBeenCalledWith("Guji natural");
    const body = res.body as { drinks: unknown[]; query: string; model: string };
    expect(body.drinks).toHaveLength(12);
    expect(body.query).toBe("Guji natural");
    expect(body.model).toBe("claude-opus-5-5");
  });

  it("serves the fixture in demo mode without a key", async () => {
    const fetchProfile = ok();
    const res = await call({ query: "anything" }, { env: { DEMO_MODE: "1" }, fetchProfile });
    expect(res.status).toBe(200);
    expect(fetchProfile).not.toHaveBeenCalled();
    expect((res.body as { model: string }).model).toBe("demo");
  });

  it("reports not_configured without a key", async () => {
    const res = await call({ query: "Guji" }, { env: {} });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ code: "not_configured" });
  });

  it("passes through unidentified results without drinks", async () => {
    const fetchProfile = vi.fn<Fetch>().mockResolvedValue({
      profile: { ...DEMO_PROFILE, identified: false, reason: "That's a pizza." },
      model: "m",
    });
    const res = await call({ query: "pizza" }, { fetchProfile });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ identified: false, reason: "That's a pizza.", drinks: [] });
  });

  it("maps model errors to 502 with their code", async () => {
    const fetchProfile = vi.fn<Fetch>().mockRejectedValue(new BrewError("refused", "no"));
    const res = await call({ query: "Guji" }, { fetchProfile });
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ code: "refused" });
  });
});
