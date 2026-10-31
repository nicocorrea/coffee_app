import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_FACTS, brew } from "./journey-helpers";
import { attachJourney, startEnrichment } from "@/lib/journey/enrich";
import { getFavourites, toggleFavourite } from "@/lib/favourites";
import { rememberLookup, touchLookup } from "@/lib/history";
import { requestJourney } from "@/lib/api";
import type { JourneyFacts } from "@/lib/journey/facts";

vi.mock("@/lib/api", () => ({ requestJourney: vi.fn() }));
const research = vi.mocked(requestJourney);

let items: Map<string, string>;
let quota: number;
const lookups = () => JSON.parse(items.get("crema:lookups") ?? "[]") as { result: ReturnType<typeof brew> }[];
const A = (createdAt = "2026-10-21T08:00:00.000Z") => ({ ...brew({ name: "A", roaster: "R" }), createdAt });
const B = () => brew({ name: "B", roaster: "R" });

beforeEach(() => {
  research.mockReset();
  items = new Map();
  quota = Infinity;
  vi.stubGlobal("window", new EventTarget());
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (v.length > quota) throw new DOMException("full", "QuotaExceededError");
      items.set(k, v);
    },
  });
});

describe("attachJourney", () => {
  it("attaches facts to the matching lookup and favourite in place", () => {
    rememberLookup("b", B());
    rememberLookup("a", A());
    toggleFavourite(A());
    const out = attachJourney(A(), EMPTY_FACTS, new Date("2026-10-22T00:00:00.000Z"));
    expect(out.journey?.createdAt).toBe("2026-10-22T00:00:00.000Z");
    expect(lookups().map((l) => l.result.bean.name)).toEqual(["A", "B"]);
    expect(lookups()[0].result.journey).toBeTruthy();
    expect(lookups()[1].result.journey).toBeUndefined();
    expect(getFavourites()[0].journey).toBeTruthy();
  });

  it("ignores facts for a lookup that was researched again", () => {
    rememberLookup("a", A("2026-10-21T08:00:00.000Z"));
    rememberLookup("a", A("2026-10-25T08:00:00.000Z"));
    attachJourney(A("2026-10-21T08:00:00.000Z"), EMPTY_FACTS);
    expect(lookups()[0].result.journey).toBeUndefined();
  });

  it("does not resurrect a removed coffee", () => {
    rememberLookup("b", B());
    const before = items.get("crema:lookups");
    attachJourney(A(), EMPTY_FACTS);
    expect(items.get("crema:lookups")).toBe(before);
    expect(items.has("crema:favourites")).toBe(false);
  });

  it("survives a full store", () => {
    rememberLookup("a", A());
    quota = 0;
    expect(() => attachJourney(A(), EMPTY_FACTS)).not.toThrow();
  });
});

describe("startEnrichment", () => {
  const settle = () => new Promise((r) => setTimeout(r, 0));
  // Each test uses its own lookup time: the registry lives for the whole tab, like the app's.
  const C = (createdAt: string) => ({ ...brew({ name: "C", roaster: "R" }), createdAt });

  it("researches a lookup once, however many screens ask, and stores the facts", async () => {
    let answer!: (f: JourneyFacts | null) => void;
    research.mockReturnValue(new Promise((r) => (answer = r)));
    const c = C("2026-10-30T08:00:00.000Z");
    rememberLookup("c", c);
    startEnrichment(c); // the coffee page
    startEnrichment(c); // shown again after the journey
    startEnrichment(c); // the journey itself
    expect(research).toHaveBeenCalledTimes(1);
    answer(EMPTY_FACTS);
    await settle();
    expect(lookups()[0].result.journey?.facts).toEqual(EMPTY_FACTS);
    startEnrichment(c); // a stale copy without facts
    startEnrichment(lookups()[0].result);
    expect(research).toHaveBeenCalledTimes(1);
  });

  it("tries again after a failure", async () => {
    research.mockResolvedValue(null);
    const c = C("2026-10-30T09:00:00.000Z");
    rememberLookup("c", c);
    startEnrichment(c);
    await settle();
    startEnrichment(c);
    expect(research).toHaveBeenCalledTimes(2);
  });

  it("never researches a coffee with no roaster", () => {
    startEnrichment(brew({ name: "D" }));
    expect(research).not.toHaveBeenCalled();
  });
});

describe("touchLookup", () => {
  it("moves a coffee to the top of Recent and keeps its stored facts", () => {
    rememberLookup("a", A());
    attachJourney(A(), EMPTY_FACTS);
    rememberLookup("b", B());
    touchLookup("a again", A()); // the screen still holds the copy read before the facts arrived
    expect(lookups().map((l) => l.result.bean.name)).toEqual(["A", "B"]);
    expect(lookups()[0].result.journey).toBeTruthy();
  });

  it("stores a coffee that was only saved", () => {
    touchLookup("a", A());
    expect(lookups().map((l) => l.result.bean.name)).toEqual(["A"]);
  });
});
