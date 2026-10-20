import { describe, expect, it } from "vitest";
import { safeSources } from "@/lib/sources";

describe("safeSources", () => {
  it("keeps http(s) links and labels them by host", () => {
    expect(safeSources(["https://www.onyxcoffeelab.com/products/geometry", "http://example.org/a"])).toEqual([
      { url: "https://www.onyxcoffeelab.com/products/geometry", host: "onyxcoffeelab.com" },
      { url: "http://example.org/a", host: "example.org" },
    ]);
  });

  it("drops script URLs, junk and duplicates", () => {
    expect(
      safeSources(["javascript:alert(1)", "data:text/html,hi", "not a url", "https://a.com/x", "https://a.com/x"]),
    ).toEqual([{ url: "https://a.com/x", host: "a.com" }]);
  });
});
