import { describe, expect, it, vi } from "vitest";
import { BrewError } from "@/lib/claude";
import { DEMO_JOURNEY_FACTS } from "@/lib/fixtures";
import { handleJourney } from "@/lib/journey-handler";

type Fetch = Parameters<typeof handleJourney>[3]["fetchFacts"];
const ok = () => vi.fn<Fetch>().mockResolvedValue({ facts: DEMO_JOURNEY_FACTS, model: "claude-opus-5-5" });
const env = { ANTHROPIC_API_KEY: "sk-test" };
const input = {
  name: "Guji Natural",
  roaster: null,
  origin: "Ethiopia",
  region: "Guji",
  process: "natural",
  variety: null,
  altitude: "2000 m",
  sources: ["https://example.com/a"],
};
const call = (body: unknown, opts: { env?: Record<string, string | undefined>; code?: string; fetchFacts?: Fetch } = {}) =>
  handleJourney(body, new Headers(opts.code ? { "x-access-code": opts.code } : {}), opts.env ?? env, {
    fetchFacts: opts.fetchFacts ?? ok(),
  });

describe("handleJourney", () => {
  it("rejects malformed input with bad_input", async () => {
    const bad = [
      null,
      {},
      { input: null },
      { input: { ...input, name: "" } },
      { input: { ...input, name: "x".repeat(121) } },
      { input: { ...input, origin: 5 } },
      { input: { ...input, origin: "" } },
      { input: { ...input, sources: "nope" } },
      { input: { ...input, sources: [1] } },
      { input: { ...input, sources: Array(21).fill("u") } },
      { input: { ...input, region: 3 } },
    ];
    for (const b of bad) {
      const res = await call(b);
      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ code: "bad_input" });
    }
  });

  it("requires the access code when configured", async () => {
    const e = { ...env, APP_ACCESS_CODE: "crema" };
    expect((await call({ input }, { env: e })).status).toBe(401);
    expect((await call({ input }, { env: e, code: "nope" })).body).toMatchObject({ code: "access_denied" });
    expect((await call({ input }, { env: e, code: "crema" })).status).toBe(200);
  });

  it("passes the input through and returns facts", async () => {
    const fetchFacts = ok();
    const res = await call({ input }, { fetchFacts });
    expect(res.status).toBe(200);
    expect(fetchFacts).toHaveBeenCalledWith(input);
    expect(res.body).toEqual({ facts: DEMO_JOURNEY_FACTS, model: "claude-opus-5-5" });
  });

  it("serves the fixture in demo mode without fetching", async () => {
    const fetchFacts = ok();
    const res = await call({ input }, { env: { DEMO_MODE: "1" }, fetchFacts });
    expect(res.status).toBe(200);
    expect(fetchFacts).not.toHaveBeenCalled();
    expect(res.body).toEqual({ facts: DEMO_JOURNEY_FACTS, model: "demo" });
  });

  it("reports not_configured without a key", async () => {
    const res = await call({ input }, { env: {} });
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ code: "not_configured" });
  });

  it("maps BrewError to 502 with its code", async () => {
    const fetchFacts = vi.fn<Fetch>().mockRejectedValue(new BrewError("refused", "declined"));
    const res = await call({ input }, { fetchFacts });
    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({ code: "refused" });
  });

  it("maps unknown errors to 502 upstream", async () => {
    const fetchFacts = vi.fn<Fetch>().mockRejectedValue(new Error("boom"));
    expect((await call({ input }, { fetchFacts })).body).toMatchObject({ code: "upstream" });
  });
});
