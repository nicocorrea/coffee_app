import type { ProcessKind, Range } from "./types";

const toNumber = (raw: string): number => {
  const s = raw.replace(/[.,]+$/, "");
  // "1,950" and "1.900" are thousands separators; anything else is a plain decimal.
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
  return Number(s.replace(",", "."));
};

export function parseAltitude(text: string | null): Range | null {
  if (!text) return null;
  const nums = (text.match(/\d[\d.,]*/g) ?? []).map(toNumber).filter((n) => Number.isFinite(n));
  if (nums.length === 0) return null;
  const feet = /\b(ft|feet|foot)\b/i.test(text);
  const conv = (n: number) => (feet ? Math.round((n * 0.3048) / 10) * 10 : n);
  const a = conv(nums[0]);
  const b = conv(nums[1] ?? nums[0]);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

export function processKind(text: string): ProcessKind {
  const t = text.toLowerCase();
  if (/anaerobic|carbonic/.test(t)) return "anaerobic";
  if (/pulped natural|honey/.test(t)) return "honey";
  if (/semi-?\s?washed|wet-?\s?hulled|giling/.test(t)) return "wet-hulled";
  if (/natural|dry process|unwashed/.test(t)) return "natural";
  if (/washed|wet process/.test(t)) return "washed";
  return "other";
}

export function peakStep(maxM: number | null): 0 | 1 | 2 | 3 | 4 {
  if (maxM == null) return 0;
  if (maxM < 1000) return 1;
  if (maxM < 1500) return 2;
  if (maxM < 2000) return 3;
  return 4;
}
