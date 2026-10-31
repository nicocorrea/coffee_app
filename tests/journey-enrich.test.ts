import { beforeEach, describe, expect, it, vi } from "vitest";
import { EMPTY_FACTS, brew } from "./journey-helpers";
import { attachJourney } from "@/lib/journey/enrich";
import { getFavourites, toggleFavourite } from "@/lib/favourites";
import { rememberLookup } from "@/lib/history";

let items: Map<string, string>;
let quota: number;
const lookups = () => JSON.parse(items.get("crema:lookups") ?? "[]") as { result: ReturnType<typeof brew> }[];
const A = (createdAt = "2026-10-21T08:00:00.000Z") => ({ ...brew({ name: "A", roaster: "R" }), createdAt });
const B = () => brew({ name: "B", roaster: "R" });

beforeEach(() => {
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
