"use client";

import { lerp, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// A pill colour for a tasting note, by what it names (else the next of a few house colours).
const FLAVOURS: [RegExp, string][] = [
  [/jasmin|flor|flower|blossom|bergamot|tea|honeysuckle|elder|lavender|rose|hibiscus/i, "#fbf8f5"],
  [/blue|blackberr|blackcurrant|cassis|grape|plum|violet|fig/i, "#5b4a8a"],
  [/straw|raspberr|cherr|red|cranberr|pomegranate|watermelon|currant/i, "#c0392b"],
  [/choc|cocoa|cacao|molasses|tobacco/i, "#3a2015"],
  [/lemon|lime|citrus|grapefruit|yuzu|lemongrass/i, "#e9cf5a"],
  [/orange|mandarin|tangerine|apricot|peach|nectarine|mango|passion|tropical|papaya|pineapple/i, "#e08a3c"],
  [/caramel|toffee|honey|sugar|maple|butterscotch|syrup|vanilla|brown/i, "#c08e57"],
  [/nut|almond|hazel|pecan|walnut|praline|marzipan/i, "#a8835a"],
  [/apple|pear|green|grass|herb|melon|kiwi/i, "#8c9873"],
  [/wine|rum|whisk|boozy|liqueur/i, "#7a2a3a"],
  [/spice|cinnamon|clove|pepper|cardamom|nutmeg|ginger/i, "#9a5a32"],
];
const HOUSE = ["#a84f3a", "#8c9873", "#c08e57", "#6e4128"];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function pillLook(note: string, i: number) {
  const fill = FLAVOURS.find(([re]) => re.test(note))?.[1] ?? HOUSE[i % HOUSE.length];
  const light = luminance(fill) > 0.6;
  return { fill, text: light ? "#2a1c15" : "#fff", stroke: light ? "#ded2c6" : "none" };
}

// Where the notes float, around the steam: [centre x, y, left edge, right edge]. The left pills keep
// clear of the streams and the steam; the right ones of the portafilter's handle above them.
type Slot = [number, number, number, number];
const A: Slot = [98, 102, 42, 160];
const B: Slot = [262, 94, 202, 318];
const C: Slot = [92, 146, 42, 152];
const D: Slot = [268, 140, 210, 318];
const SLOTS: Record<number, Slot[]> = { 1: [A], 2: [A, D], 3: [A, B, C], 4: [A, B, C, D] };

function pill(note: string, [cx, y, lo, hi]: Slot) {
  const text = clip(note, 20);
  const room = hi - lo;
  const size = Math.max(9, Math.min(12, (room - 22) / (text.length * 0.6)));
  const w = Math.min(room, text.length * size * 0.6 + 24);
  const x = Math.min(hi - w / 2, Math.max(lo + w / 2, cx));
  return { text, size: +size.toFixed(1), w: +w.toFixed(1), x: +x.toFixed(1), y };
}

// The cup, and its inside for the coffee to fill.
const CUP = "M128 160 L232 160 L222 228 Q180 242 138 228 Z";
const INSIDE = "M132 164 L228 164 L219 225 Q180 238 141 225 Z";
const FILL_MS = 3600;
const FILL_DELAY = 900;

/**
 * The cup: the portafilter pours two streams, the cup fills on the scale while it counts the grams
 * out, the steam rises, and the tasting notes pop up around it.
 */
export function CupArt({ j, active }: ArtProps) {
  const { doseG, yieldG } = j.cup;
  const notes = j.cup.notes.slice(0, 4);
  const slots = SLOTS[notes.length] ?? [];
  const t = useTween(active, FILL_MS, FILL_DELAY);
  const out = Math.round(lerp(0, yieldG, t * t * (3 - 2 * t)));

  return (
    <g data-art="cup">
      <defs>
        <linearGradient id="j-cup-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efe5da" />
          <stop offset="1" stopColor="#fbf8f5" />
        </linearGradient>
        <clipPath id="j-cup-inside">
          <path d={INSIDE} />
        </clipPath>
      </defs>
      <rect width={360} height={300} fill="url(#j-cup-bg)" />

      {/* the machine's group head and the portafilter */}
      <g className="j-rise" style={motionVars({ d: 0.1 })}>
        <rect x={0} y={0} width={360} height={22} fill="#2a1c15" />
        <rect x={140} y={22} width={80} height={12} fill="#3a2a22" />
        <path d="M146 34 L214 34 L206 60 L154 60 Z" fill="#4a3a32" />
        <rect x={146} y={38} width={68} height={3} fill="#6e5a4c" />
        <path d="M212 40 L330 50 Q336 51 335 57 L333 60 L208 54 Z" fill="#2a1c15" />
        <rect x={170} y={60} width={7} height={8} fill="#3a2a22" />
        <rect x={183} y={60} width={7} height={8} fill="#3a2a22" />
      </g>
      <rect className="j-cup-stream" x={172} y={68} width={3} height={108} rx={1.5} fill="#6e4128" />
      <rect className="j-cup-stream" x={185} y={68} width={3} height={108} rx={1.5} fill="#6e4128" />

      {/* the scale, counting the grams out */}
      <g className="j-rise" style={motionVars({ d: 0.2 })}>
        <rect x={84} y={234} width={192} height={24} rx={6} fill="#3a2a22" />
        <rect x={92} y={230} width={176} height={6} rx={3} fill="#4e3a30" />
        <text x={180} y={251} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#cbb9a8">
          {doseG} g in ·{" "}
          <tspan className="numerals" fill="#f2c88f">
            {out}
          </tspan>
          <tspan fill="#f2c88f"> g out</tspan>
        </text>
      </g>

      {/* the cup */}
      <g className="j-rise" style={motionVars({ d: 0.3 })}>
        <path d="M228 174 Q258 176 254 200 Q250 222 222 218" fill="none" stroke="#fbf8f5" strokeWidth={9} />
        <path d="M228 174 Q258 176 254 200 Q250 222 222 218" fill="none" stroke="#ded2c6" strokeWidth={2} opacity={0.6} />
        <path d={CUP} fill="#fbf8f5" stroke="#ded2c6" strokeWidth={2.5} />
        <g clipPath="url(#j-cup-inside)">
          <g className="j-cup-fill">
            <rect x={120} y={178} width={120} height={70} fill="#6e4128" />
            <rect x={120} y={174} width={120} height={8} fill="#c08e57" />
            <ellipse cx={170} cy={177} rx={14} ry={1.6} fill="#e0b583" opacity={0.7} />
          </g>
        </g>
        <path d="M141 172 L137 205" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      </g>

      <g stroke="#b8a491" strokeWidth={3} fill="none" strokeLinecap="round">
        {[
          [168, 154, -8, 4.4],
          [182, 150, 8, 5],
          [196, 154, -8, 5.6],
        ].map(([x, y, s, d]) => (
          <path key={x} className="j-cup-steam" style={motionVars({ d })} d={`M${x} ${y} q${s} -12 0 -24 t0 -24`} />
        ))}
      </g>

      {/* the tasting notes */}
      <g data-depth="0.08">
        {notes.map((note, i) => {
          const p = pill(note, slots[i]);
          const look = pillLook(note, i);
          return (
            <g key={`${note}-${i}`} transform={`translate(${p.x} ${p.y})`}>
              <g className="j-pop" style={motionVars({ d: 4.4 + i * 0.5 })}>
                <g className="j-bob" style={{ animationDelay: `${-i * 0.8}s` }} data-note={note}>
                  <rect
                    x={-p.w / 2}
                    y={-14}
                    width={p.w}
                    height={28}
                    rx={14}
                    fill={look.fill}
                    stroke={look.stroke}
                    strokeWidth={1.5}
                  />
                  <text y={4.5} textAnchor="middle" fontSize={p.size} fontWeight={700} fill={look.text}>
                    {p.text}
                  </text>
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
}
