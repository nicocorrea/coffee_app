import { describe, expect, it } from "vitest";
import { FLAVOUR_DIMENSIONS, TASTING_QUESTIONS, describeScore, levelOf } from "@/lib/flavour";

describe("levelOf", () => {
  it("maps 1–2 to low, 3 to mid and 4–5 to high", () => {
    expect([1, 2, 3, 4, 5].map(levelOf)).toEqual(["low", "low", "mid", "high", "high"]);
  });
});

describe("FLAVOUR_DIMENSIONS", () => {
  it("covers the five radar axes in chart order", () => {
    expect(FLAVOUR_DIMENSIONS.map((d) => d.key)).toEqual(["acidity", "sweetness", "body", "bitterness", "finish"]);
  });

  it("gives every level a food comparison", () => {
    for (const d of FLAVOUR_DIMENSIONS) {
      for (const level of ["low", "mid", "high"] as const) {
        expect(d.levels[level].label.length).toBeGreaterThan(0);
        expect(d.levels[level].example.length).toBeGreaterThan(10);
      }
    }
  });

  it("explains the extraction faults behind sour and harsh shots", () => {
    const fault = (k: string) => FLAVOUR_DIMENSIONS.find((d) => d.key === k)?.fault ?? "";
    expect(fault("acidity")).toMatch(/finer/);
    expect(fault("bitterness")).toMatch(/coarser/);
  });
});

describe("describeScore", () => {
  it("uses the dimension's own words for the level", () => {
    expect(describeScore("body", 5)).toMatchObject({ label: "Heavy" });
    expect(describeScore("finish", 1)).toMatchObject({ label: "Short" });
    expect(describeScore("acidity", 4).example).toMatch(/orange/);
  });
});

describe("TASTING_QUESTIONS", () => {
  it("asks one question per dimension, in chart order", () => {
    expect(TASTING_QUESTIONS.map((q) => q.answers)).toEqual(["acidity", "sweetness", "body", "bitterness", "finish"]);
  });
});
