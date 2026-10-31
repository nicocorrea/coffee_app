import { statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COUNTRIES } from "@/lib/journey/countries";
import { pinFor, project, shapeFor } from "@/lib/journey/map";

const eth = shapeFor("ETH")!;

describe("journey map", () => {
  it("has a shape for every country and the world", () => {
    for (const c of COUNTRIES) expect(shapeFor(c.key)?.d).toMatch(/^M/);
    expect(shapeFor("WORLD")).not.toBeNull();
  });
  it("projects the centroid inside the drawing frame", () => {
    const [x, y] = project(eth, ...eth.centroid);
    expect(x).toBeGreaterThan(40);
    expect(x).toBeLessThan(320);
    expect(y).toBeGreaterThan(30);
    expect(y).toBeLessThan(250);
  });
  it("pins Guji south of Addis Ababa", () =>
    expect(pinFor(eth, { lat: 6.0, lon: 38.7 }).y).toBeGreaterThan(pinFor(eth, { lat: 9.0, lon: 38.7 }).y));
  it("falls back to the centroid for swapped or foreign coordinates", () => {
    const c = project(eth, ...eth.centroid);
    expect(pinFor(eth, { lat: 38.7, lon: 6.0 })).toMatchObject({ x: c[0], y: c[1], approximate: true });
    expect(pinFor(eth, null)).toMatchObject({ x: c[0], y: c[1] });
  });
  it("stays under 150 KB", () => expect(statSync("lib/journey/map-data.json").size).toBeLessThan(150_000));
});
