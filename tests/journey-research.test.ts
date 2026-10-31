import { describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import type { Provider } from "@/lib/claude";
import { DEMO_JOURNEY_FACTS } from "@/lib/fixtures";
import { buildJourneyPrompt, fetchJourneyFacts, type JourneyInput } from "@/lib/journey/research";

const msg = (text: string, stop_reason = "end_turn") => ({
  model: "claude-opus-5-5",
  stop_reason,
  content: [
    { type: "server_tool_use", id: "s1", name: "web_search", input: { query: "x" } },
    { type: "text", text },
  ],
});
const ANTHROPIC: Provider = { name: "anthropic", model: "claude-opus-5-5", baseURL: undefined, apiKey: "sk-test" };
const INPUT: JourneyInput = {
  name: "Guji Hambela",
  roaster: "Coffee Lab",
  origin: "Ethiopia",
  region: "Guji",
  process: "Natural",
  variety: null,
  altitude: null,
  sources: ["https://example.com/guji-hambela"],
};

function fakeClient(responses: unknown[]) {
  const create = vi.fn();
  for (const r of responses) create.mockResolvedValueOnce(r);
  const client = { beta: { messages: { create } } } as unknown as Anthropic;
  return { client, create };
}

describe("fetchJourneyFacts", () => {
  it("returns validated facts", async () => {
    const { client } = fakeClient([msg(JSON.stringify(DEMO_JOURNEY_FACTS))]);
    expect((await fetchJourneyFacts(INPUT, ANTHROPIC, client)).facts).toEqual(DEMO_JOURNEY_FACTS);
  });
  it("drops facts without a real source", async () => {
    const bad = { ...DEMO_JOURNEY_FACTS, picking: { value: "hand", source: "roaster site" }, producer: { ...DEMO_JOURNEY_FACTS.producer, source: "n/a" } };
    const { client } = fakeClient([msg(JSON.stringify(bad))]);
    const { facts } = await fetchJourneyFacts(INPUT, ANTHROPIC, client);
    expect(facts.picking).toBeNull();
    expect(facts.producer).toBeNull();
    expect(facts.setting).toEqual(DEMO_JOURNEY_FACTS.setting);
  });
  it("repairs an invalid answer once", async () => {
    const { client, create } = fakeClient([msg("{}"), msg(JSON.stringify(DEMO_JOURNEY_FACTS))]);
    await fetchJourneyFacts(INPUT, ANTHROPIC, client);
    expect(create).toHaveBeenCalledTimes(2);
  });
  it("uses at most 3 searches at low effort", async () => {
    const { client, create } = fakeClient([msg(JSON.stringify(DEMO_JOURNEY_FACTS))]);
    await fetchJourneyFacts(INPUT, ANTHROPIC, client);
    expect(create.mock.calls[0][0]).toMatchObject({ output_config: { effort: "low" }, tools: [{ max_uses: 3 }] });
    expect(create.mock.calls[0][0].messages[0].content).toBe(`Coffee: ${JSON.stringify(INPUT)}`);
  });
  it("prompt forbids inference and invented producers", () => expect(buildJourneyPrompt()).toMatch(/only facts .* state/i));
});
