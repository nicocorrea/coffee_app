"use client";

import { pinFor, project, shapeFor, type CountryShape } from "@/lib/journey/map";
import { motionVars } from "../motion";
import type { ArtProps } from "./index";

// The map sits in this box, leaving a band below it for the labels (all inside the phone's safe area).
const BOX = { x0: 48, y0: 46, x1: 312, y1: 222 };
const LABEL_Y = 243;
const PIN_AT = 1.6; // s: when the (first) pin drops

type Pin = {
  x: number;
  y: number;
  label: { name: string; sub: string | null } | null;
};

/** "Hambela Wamena, Guji" → "Guji", over "Hambela Wamena". */
function splitRegion(region: string): { name: string; sub: string | null } {
  const parts = region
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const name = parts.pop() ?? region.trim();
  return {
    name: clip(name, 18),
    sub: parts.length > 0 ? clip(parts.join(", "), 24) : null,
  };
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** The country line under the map, sized to stay inside the safe area. */
function countryLine(names: string[]): {
  text: string;
  size: number;
  spacing: number;
} {
  const text = names.join(" · ").toUpperCase();
  if (text.length <= 22) return { text, size: 12, spacing: 4 };
  if (text.length <= 30) return { text, size: 10.5, spacing: 2 };
  return { text: `A BLEND OF ${names.length} ORIGINS`, size: 12, spacing: 4 };
}

/** Scale (never up) and centre a shape's fitted outline into BOX. */
function fit(s: CountryShape) {
  const [w, south, e, n] = s.bbox;
  const [x0, y0] = project(s, w, n);
  const [x1, y1] = project(s, e, south);
  const k = Math.min(1, (BOX.x1 - BOX.x0) / (x1 - x0), (BOX.y1 - BOX.y0) / (y1 - y0));
  const cx = (BOX.x0 + BOX.x1) / 2;
  const cy = (BOX.y0 + BOX.y1) / 2;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  return {
    k,
    transform: `translate(${cx - mx * k} ${cy - my * k}) scale(${k})`,
    at: (x: number, y: number) => ({
      x: cx + (x - mx) * k,
      y: cy + (y - my) * k,
    }),
  };
}

function PinMark({ x, y, delay, label }: { x: number; y: number; delay: number; label: Pin["label"] }) {
  const right = x < 214;
  const tx = right ? 16 : -16;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={48} fill="url(#j-cover-glow)" className="j-fade" style={motionVars({ d: delay - 0.2 })} />
      <g className="j-cover-pin" style={motionVars({ d: delay })}>
        <circle className="j-cover-ripple" r={9} fill="none" stroke="#f0b49b" strokeWidth={2} />
        <path d="M0 -4 C -12 -20 -12 -32 0 -36 C 12 -32 12 -20 0 -4 Z" fill="#fbf8f5" />
        <circle cy={-24} r={4.2} fill="#a84f3a" />
        <circle r={2.2} fill="#fbf8f5" />
        {label && (
          <g
            textAnchor={right ? "start" : "end"}
            stroke="#2a1c15"
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            <text x={tx} y={label.sub ? 2 : 8} fill="#fbf8f5" fontSize={14} fontWeight={700}>
              {label.name}
            </text>
            {label.sub && (
              <text x={tx} y={17} fill="#cbb9a8" fontSize={10.5}>
                {label.sub}
              </text>
            )}
          </g>
        )}
      </g>
    </g>
  );
}

/**
 * The cover: a night map. The country's outline draws, its land fades in, a soft glow gathers where
 * the coffee grows and a pin drops there with a ripple. A blend gets the world with a pin per
 * country; an origin we have no outline for gets just a centred pin and its name.
 */
export function CoverArt({ j }: ArtProps) {
  const keys = j.place.countryKeys;
  const blend = keys.length > 1;
  const own = keys.length === 1 ? shapeFor(keys[0]) : null;
  const world = blend ? shapeFor("WORLD") : null;
  const variant = world ? "world" : own ? "country" : "unknown";

  const fallback = j.place.facts.find((f) => f.label === "Country")?.value.trim();
  const names = j.place.countryNames.length > 0 ? j.place.countryNames : fallback ? [clip(fallback, 22)] : [];
  const country = names.length > 0 ? countryLine(names) : null;
  const region = j.place.region ? splitRegion(j.place.region) : null;

  let outline: { d: string; transform?: string; stroke: number } | null = null;
  let pins: Pin[] = [];
  let caption: string | null = null; // second label line, when the pin can't carry the region

  if (own) {
    const f = fit(own);
    const p = pinFor(own, j.place.coords);
    outline = { d: own.d, transform: f.transform, stroke: 2 / f.k };
    // An approximate pin (the country's middle) must not claim the region's spot: the region goes below.
    pins = [{ ...f.at(p.x, p.y), label: p.approximate ? null : region }];
    caption = p.approximate && region ? [region.sub, region.name].filter(Boolean).join(", ") : null;
  } else if (world) {
    outline = { d: world.d, stroke: 0.8 };
    pins = keys
      .map((k) => shapeFor(k))
      .filter((s): s is CountryShape => s !== null)
      .map((s) => {
        const [x, y] = project(world, ...s.centroid);
        return { x, y, label: null };
      });
  } else {
    pins = [{ x: 180, y: 138, label: null }];
    caption = region ? [region.sub, region.name].filter(Boolean).join(", ") : null;
  }

  return (
    <g data-art="cover" data-variant={variant}>
      <defs>
        <radialGradient id="j-cover-bg" cx="50%" cy="56%" r="62%">
          <stop offset="0" stopColor="#5a3626" />
          <stop offset="1" stopColor="#2a1c15" />
        </radialGradient>
        <radialGradient id="j-cover-glow">
          <stop offset="0" stopColor="#f0b49b" stopOpacity={0.42} />
          <stop offset="0.55" stopColor="#d99a7f" stopOpacity={0.14} />
          <stop offset="1" stopColor="#d99a7f" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="j-cover-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.02" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.16" stopColor="#fff" />
          <stop offset="0.6" stopColor="#fff" />
          <stop offset="0.74" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="j-cover-belt" maskUnits="userSpaceOnUse" x={0} y={0} width={360} height={300}>
          <rect width={360} height={300} fill="url(#j-cover-fade)" />
        </mask>
        {outline && <path id="j-cover-land" d={outline.d} pathLength={1000} />}
      </defs>

      <rect width={360} height={300} fill="url(#j-cover-bg)" />
      <g data-depth="0.05" stroke="#4a3328" strokeWidth={1} opacity={0.7}>
        {[60, 120, 180, 240].map((y) => (
          <line key={y} x1={-20} y1={y} x2={380} y2={y} />
        ))}
        {[60, 120, 180, 240, 300].map((x) => (
          <line key={x} x1={x} y1={-20} x2={x} y2={320} />
        ))}
      </g>

      {outline && (
        <g mask={world ? "url(#j-cover-belt)" : undefined}>
          <g transform={outline.transform}>
            <use href="#j-cover-land" className="j-cover-land" fill="#4a3328" />
            <use
              href="#j-cover-land"
              className="j-draw"
              style={motionVars({ d: 0.2, dur: 1.8, len: 1000 })}
              fill="none"
              stroke="#d99a7f"
              strokeWidth={outline.stroke}
              strokeLinejoin="round"
            />
          </g>
        </g>
      )}

      {pins.map((p, i) => (
        <PinMark key={i} x={p.x} y={p.y} label={p.label} delay={PIN_AT + i * 0.18} />
      ))}

      {(country || caption) && (
        <g className="j-fade" style={motionVars({ d: 1.3 })} textAnchor="middle">
          {country && (
            <text
              x={180}
              y={LABEL_Y}
              fill="#cbb9a8"
              fontSize={country.size}
              fontWeight={600}
              letterSpacing={country.spacing}
            >
              {country.text}
            </text>
          )}
          {caption && (
            <text x={180} y={country ? LABEL_Y + 16 : LABEL_Y} fill="#fbf8f5" fontSize={12.5} fontWeight={600}>
              {clip(caption, 40)}
            </text>
          )}
        </g>
      )}
    </g>
  );
}
