import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { BrewError, extractJson, fetchBeanProfile as fetchWith, resolveProvider, type Provider } from "@/lib/claude";
import { DEMO_PROFILE } from "@/lib/fixtures";

const json = JSON.stringify(DEMO_PROFILE);

const msg = (text: string, stop_reason = "end_turn") => ({
  model: "claude-opus-5-5",
  stop_reason,
  content: [
    { type: "server_tool_use", id: "s1", name: "web_search", input: { query: "x" } },
    { type: "text", text },
  ],
});

const ANTHROPIC: Provider = { name: "anthropic", model: "claude-opus-5-5", baseURL: undefined, apiKey: "sk-test" };
const OPENROUTER: Provider = { name: "openrouter", model: "anthropic/claude-opus-5.5", baseURL: "https://openrouter.ai/api", apiKey: "sk-or-test" };
const fetchBeanProfile = (q: string, client: Anthropic, opts?: { signal?: AbortSignal }) => fetchWith(q, ANTHROPIC, client, opts);

function fakeClient(responses: unknown[], parsed?: unknown) {
  const create = vi.fn();
  for (const r of responses) create.mockResolvedValueOnce(r);
  const parse = vi.fn().mockResolvedValue({ model: "claude-opus-5-5", stop_reason: "end_turn", parsed_output: parsed ?? null });
  const client = { beta: { messages: { create, parse } } } as unknown as Anthropic;
  return { client, create, parse };
}

describe("extractJson", () => {
  it("parses a bare object", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });
  it("parses a fenced block", () => {
    expect(extractJson('Here you go:\n```json\n{"a":{"b":"}"}}\n```\nEnjoy')).toEqual({ a: { b: "}" } });
  });
  it("finds the object after prose with stray braces", () => {
    expect(extractJson('I searched {twice}. Result: {"ok":true} done')).toEqual({ ok: true });
  });
  it("throws when there is no object", () => {
    expect(() => extractJson("no json here")).toThrow("no_json");
  });
});

describe("resolveProvider", () => {
  it("prefers OpenRouter when its key is set", () => {
    expect(resolveProvider({ OPENROUTER_API_KEY: "sk-or-x", ANTHROPIC_API_KEY: "sk-ant" })).toEqual(OPENROUTER_WITH("sk-or-x"));
  });
  it("lets OPENROUTER_MODEL override the default", () => {
    expect(resolveProvider({ OPENROUTER_API_KEY: "k", OPENROUTER_MODEL: "anthropic/claude-sonnet-5.5" })?.model).toBe(
      "anthropic/claude-sonnet-5.5",
    );
  });
  it("uses Anthropic directly otherwise", () => {
    expect(resolveProvider({ ANTHROPIC_API_KEY: "sk-ant" })).toEqual({
      name: "anthropic",
      model: "claude-opus-5-5",
      baseURL: undefined,
      apiKey: "sk-ant",
    });
  });
  it("returns null with no key", () => {
    expect(resolveProvider({})).toBeNull();
  });
});

const OPENROUTER_WITH = (apiKey: string): Provider => ({ ...OPENROUTER, apiKey });

describe("fetchBeanProfile via OpenRouter", () => {
  it("uses OpenRouter's web search tool and an explicit fallback model", async () => {
    const { client, create } = fakeClient([msg(json)]);
    const { profile } = await fetchWith("Guji", OPENROUTER, client);
    expect(profile.identified).toBe(true);
    const params = create.mock.calls[0][0];
    expect(params.model).toBe("anthropic/claude-opus-5.5");
    expect(params.tools[0].type).toBe("openrouter:web_search");
    expect(params.fallbacks).toEqual([{ model: "anthropic/claude-opus-5" }]);
    expect(params.betas).toBeUndefined();
  });
});

describe("fetchBeanProfile", () => {
  it("returns a validated, clamped profile", async () => {
    const hot = JSON.stringify({ ...DEMO_PROFILE, recipe: { ...DEMO_PROFILE.recipe, tempC: 99 } });
    const { client, create } = fakeClient([msg(`Research done.\n${hot}`)]);
    const { profile, model } = await fetchBeanProfile("Guji natural", client);
    expect(profile.bean.name).toBe("Guji Hambela Natural");
    expect(profile.recipe.tempC).toBe(96);
    expect(model).toBe("claude-opus-5-5");
    const params = create.mock.calls[0][0];
    expect(params.tools[0].type).toBe("web_search_20260209");
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toContain("server-side-fallback-2026-07-01");
    expect(JSON.stringify(params.messages)).toContain("Guji natural");
  });

  it("resumes after pause_turn", async () => {
    const paused = msg("searching…", "pause_turn");
    const { client, create } = fakeClient([paused, msg(json)]);
    const { profile } = await fetchBeanProfile("Guji", client);
    expect(profile.identified).toBe(true);
    expect(create).toHaveBeenCalledTimes(2);
    const second = create.mock.calls[1][0];
    expect(second.messages.at(-1)).toEqual({ role: "assistant", content: paused.content });
  });

  it("throws refused on a refusal", async () => {
    const { client } = fakeClient([msg("", "refusal")]);
    await expect(fetchBeanProfile("x", client)).rejects.toMatchObject({ code: "refused" });
  });

  it("reformats with structured outputs when the JSON is unusable", async () => {
    const { client, parse } = fakeClient([msg("Lovely coffee, no JSON though.")], DEMO_PROFILE);
    const { profile } = await fetchBeanProfile("Guji", client);
    expect(parse).toHaveBeenCalledTimes(1);
    expect(profile.bean.origin).toBe("Ethiopia");
  });

  it("throws bad_model_output when the reformat also fails", async () => {
    const { client } = fakeClient([msg("nope")], { nonsense: true });
    const err = await fetchBeanProfile("Guji", client).catch((e) => e);
    expect(err).toBeInstanceOf(BrewError);
    expect(err.code).toBe("bad_model_output");
  });

  it("bounds every request with one overall deadline", async () => {
    const { client, create } = fakeClient([msg("…", "pause_turn"), msg(json)]);
    await fetchBeanProfile("Guji", client);
    const [first, second] = create.mock.calls.map((c) => c[1]?.signal);
    expect(first).toBeInstanceOf(AbortSignal);
    expect(second).toBe(first);
  });

  it("reports a timeout as a retryable upstream error", async () => {
    const err = Object.assign(new Error("Request was aborted."), { name: "APIUserAbortError" });
    const create = vi.fn().mockRejectedValue(err);
    const client = { beta: { messages: { create, parse: vi.fn() } } } as unknown as Anthropic;
    await expect(fetchBeanProfile("Guji", client, { signal: AbortSignal.abort() })).rejects.toMatchObject({
      code: "upstream",
      message: expect.stringContaining("too long"),
    });
  });

  it("wraps SDK failures as upstream errors", async () => {
    const create = vi.fn().mockRejectedValue(new Error("socket hang up"));
    const client = { beta: { messages: { create, parse: vi.fn() } } } as unknown as Anthropic;
    await expect(fetchBeanProfile("Guji", client)).rejects.toMatchObject({ code: "upstream" });
  });
});
