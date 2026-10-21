import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_PROFILE } from "@/lib/fixtures";
import { MAX_LOOKUPS, findLookup, rememberLookup } from "@/lib/history";
import type { BrewResult } from "@/lib/schema";

const brew = (name: string, query = name): BrewResult => ({
  ...DEMO_PROFILE,
  bean: { ...DEMO_PROFILE.bean, name },
  query,
  drinks: [],
  createdAt: "2026-10-21T08:00:00.000Z",
  model: "demo",
});

let items: Map<string, string>;
let quota: number;

const stored = () => JSON.parse(items.get("crema:lookups") ?? "[]") as { result: BrewResult; queries: string[] }[];

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

describe("lookup history", () => {
  it("finds a coffee again by the same search, ignoring case and spacing", () => {
    rememberLookup("Onyx Geometry", brew("Geometry"));
    expect(findLookup("  onyx   geometry ")?.bean.name).toBe("Geometry");
    expect(findLookup("onyx")).toBeNull();
  });

  it("keeps one entry per bean and every search that found it", () => {
    rememberLookup("Onyx Geometry", brew("Geometry"));
    rememberLookup("Kenya AA", brew("Kenya AA"));
    rememberLookup("geometry blend", brew("Geometry"));

    expect(stored().map((l) => l.result.bean.name)).toEqual(["Geometry", "Kenya AA"]);
    expect(stored()[0].queries).toEqual(["geometry blend", "onyx geometry"]);
    expect(findLookup("Onyx Geometry")?.bean.name).toBe("Geometry");
  });

  it("replaces a bean's recipe with the newest research", () => {
    rememberLookup("Geometry", brew("Geometry"));
    rememberLookup("Geometry", { ...brew("Geometry"), createdAt: "2026-11-01T08:00:00.000Z" });
    expect(stored()).toHaveLength(1);
    expect(findLookup("geometry")?.createdAt).toBe("2026-11-01T08:00:00.000Z");
  });

  it("skips searches that weren't identified as a coffee", () => {
    rememberLookup("pizza", { ...brew("pizza"), identified: false });
    expect(findLookup("pizza")).toBeNull();
  });

  it(`keeps the newest ${MAX_LOOKUPS} coffees`, () => {
    for (let i = 0; i < MAX_LOOKUPS + 5; i++) rememberLookup(`coffee ${i}`, brew(`Coffee ${i}`));
    expect(stored()).toHaveLength(MAX_LOOKUPS);
    expect(stored()[0].result.bean.name).toBe(`Coffee ${MAX_LOOKUPS + 4}`);
    expect(findLookup("coffee 0")).toBeNull();
  });

  it("drops older coffees when the browser runs out of space", () => {
    for (let i = 0; i < 8; i++) rememberLookup(`coffee ${i}`, brew(`Coffee ${i}`));
    quota = items.get("crema:lookups")!.length / 3;
    rememberLookup("coffee 8", brew("Coffee 8"));
    expect(stored().length).toBeGreaterThan(0);
    expect(stored().length).toBeLessThan(9);
    expect(stored()[0].result.bean.name).toBe("Coffee 8");
  });
});
