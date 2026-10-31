import type { ProcessKind, Range } from "./types";

// A number: thousands grouped by a comma, dot, space or no-break space ("1,950", "1.900", "1 850"),
// or plain digits. Decimals don't occur in altitudes, so "1200,1500" reads as two numbers.
const NUMBER = /\d{1,3}(?:[.,\u0020\u00a0\u202f]\d{3})+(?!\d)|\d+/g;
const METRES = "masl|msnm|m\\.?a\\.?s\\.?l|met(?:er|re)s?|mts?|m";
const FEET = "ft|feet|foot|'";
const UNIT = new RegExp(`^[\\s.]*(?:(${METRES})|(${FEET}))(?![a-z])`, "i");
// What may sit between the two ends of a range: an optional unit, then a dash, "to", "and", a comma or a slash.
const BETWEEN = new RegExp(`^\\s*(?:(?:${METRES}|${FEET})(?![a-z])\\.?)?\\s*(?:-|–|—|~|to|and|,|/)\\s*$`, "i");

type Unit = "m" | "ft" | null;
const unitAt = (text: string): Unit => {
  const m = text.match(UNIT);
  return m ? (m[1] ? "m" : "ft") : null;
};

/**
 * Free-text altitude ("1,950–2,200 masl", "6,000 ft (1,830 m)") as metres. Metres win when both
 * units are given; feet are converted only when they are the only unit. Numbers under 100 (lot
 * numbers, years' tails) are ignored, and a second number counts only as the far end of a range.
 */
export function parseAltitude(text: string | null): Range | null {
  if (!text) return null;
  const tokens = [...text.matchAll(NUMBER)]
    .map((m) => ({ n: Number(m[0].replace(/[^\d]/g, "")), start: m.index, end: m.index + m[0].length }))
    .filter((t) => t.n >= 100);
  const runs: { nums: number[]; unit: Unit }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    const b = tokens[i + 1];
    const between = b ? text.slice(a.end, b.start) : "";
    if (b && BETWEEN.test(between)) {
      const inner = unitAt(between);
      const after = unitAt(text.slice(b.end));
      // "1,850 m, 2,000 ft" is two altitudes, not a range.
      if (!inner || !after || inner === after) {
        runs.push({ nums: [a.n, b.n], unit: after ?? inner });
        i++;
        continue;
      }
    }
    runs.push({ nums: [a.n], unit: unitAt(text.slice(a.end)) });
  }
  const run = runs.find((r) => r.unit === "m") ?? runs.find((r) => r.unit === "ft") ?? runs[0];
  if (!run) return null;
  const conv = (n: number) => (run.unit === "ft" ? Math.round((n * 0.3048) / 10) * 10 : n);
  const [a, b = a] = run.nums.map(conv);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

// Where "semi-washed" names wet-hulling (giling basah) rather than a pulped-natural / honey process.
const WET_HULLED_COUNTRIES = new Set(["IDN", "PNG", "TLS"]);

/** The process scene for free-text process. `countryKey` (ISO alpha-3) decides what "semi-washed" means. */
export function processKind(text: string, countryKey?: string | null): ProcessKind {
  const t = text.toLowerCase();
  if (/anaerobic|carbonic/.test(t)) return "anaerobic";
  if (/pulped natural|honey/.test(t)) return "honey";
  if (/wet-?\s?hulled|giling/.test(t)) return "wet-hulled";
  if (/semi-?\s?washed/.test(t)) return countryKey && WET_HULLED_COUNTRIES.has(countryKey) ? "wet-hulled" : "honey";
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
