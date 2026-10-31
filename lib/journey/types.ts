import type { RoastLevel } from "@/lib/schema";

export type Provenance = "own" | "usual" | "advice";
export type Fact = { label: string; value: string; provenance: Provenance; sourceUrl?: string };
export type Range = { min: number; max: number };
export type ProcessKind = "natural" | "washed" | "honey" | "anaerobic" | "wet-hulled" | "other";
export type Setting = "forest" | "shade" | "sun";
export type PickMethod = "hand" | "machine";
export type Drying = "raised-beds" | "patio" | "mechanical";

export const STAGE_IDS = [
  "cover",
  "grown",
  "picked",
  "processed",
  "milled",
  "sorted",
  "shipped",
  "roasted",
  "rested",
  "cup",
] as const;
export type StageId = (typeof STAGE_IDS)[number];

export type Journey = {
  coffeeName: string;
  stages: StageId[]; // "shipped" may be absent
  place: {
    countryKeys: string[];
    countryNames: string[];
    region: string | null;
    coords: { lat: number; lon: number } | null;
    producer: Fact | null;
    special: string | null;
    facts: Fact[];
  };
  grown: { altitudeM: Range | null; peak: 0 | 1 | 2 | 3 | 4; setting: Setting; facts: Fact[] };
  picked: { method: PickMethod; facts: Fact[] };
  processed: { process: ProcessKind; processLabel: string; drying: Drying; days: Range; facts: Fact[] };
  milled: { wetHulled: boolean; facts: Fact[] };
  sorted: { stamp: string[]; facts: Fact[] };
  shipped: { port: string | null; arrival: string; weeks: Range; facts: Fact[] };
  roasted: { level: RoastLevel; facts: Fact[] };
  rested: { days: Range; facts: Fact[] };
  cup: { doseG: number; yieldG: number; tempC: number; notes: string[]; facts: Fact[] };
  sources: { url: string; host: string }[];
};
