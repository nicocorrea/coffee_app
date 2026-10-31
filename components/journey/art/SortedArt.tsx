"use client";

import type { CSSProperties } from "react";
import { motionVars } from "../motion";
import type { ArtProps } from "./index";

const vars = (v: Record<string, string>) => v as CSSProperties;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

const SPOUT_Y = 100; // where the beans leave the hopper
const MOUTH_Y = 152; // the sack's open top
const BOWL = { x: 290, y: 228 };

// [x, delay]: good beans dropping into the sack.
const DROPS: [number, number][] = [
  [170, 0],
  [182, 0.25],
  [176, 0.5],
  [186, 0.75],
  [172, 1],
  [180, 0.12],
  [188, 0.6],
];
// [x, delay]: the two faulty beans, flicked into the bowl.
const REJECTS: [number, number][] = [
  [180, 0.9],
  [174, 2.1],
];

// The stamp's lines: country, region, process. At most 3, each at most 16 characters, sized to fit.
const BASE = [
  { size: 15, spacing: 2, weight: 800 },
  { size: 11, spacing: 1.5, weight: 700 },
  { size: 10, spacing: 1.5, weight: 600 },
];
const TEXT_W = 118; // the widest a line may be
const CHAR = 0.68; // a bold capital's width, in ems

function stampLines(stamp: string[]) {
  const lines = stamp
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((s, i) => {
      const text = clip(s, 16);
      const b = BASE[i];
      const spacing = text.length > 10 ? Math.min(b.spacing, 0.6) : b.spacing;
      const size = Math.min(b.size, (TEXT_W / text.length - spacing) / CHAR);
      return { text, size: +size.toFixed(1), spacing, weight: b.weight };
    });
  const widest = Math.max(80, ...lines.map((l) => l.text.length * (l.size * CHAR + l.spacing)));
  const heights = lines.map((l) => l.size * 1.45);
  const h = heights.reduce((a, b) => a + b, 0) + 16;
  let y = 222 - h / 2 + 8;
  const placed = lines.map((l, i) => {
    y += heights[i];
    return { ...l, y: +(y - heights[i] * 0.3).toFixed(1) };
  });
  return { lines: placed, w: Math.min(144, widest + 26), h };
}

/**
 * Sorted: beans pour from the hopper into a jute sack. Two faulty ones are flicked into the
 * "set aside" bowl, and the sack is stamped with where the coffee came from.
 */
export function SortedArt({ j }: ArtProps) {
  const stamp = stampLines(j.sorted.stamp);
  return (
    <g data-art="sorted">
      <rect width={360} height={300} fill="#f3ece5" />
      <circle cx={70} cy={70} r={86} fill="#f7f1ea" />
      <rect x={0} y={272} width={360} height={28} fill="#e3d6c8" />

      {/* a full sack waiting behind */}
      <g data-depth="0.06">
        <g className="j-rise" style={motionVars({ d: 0.1 })}>
          <path d="M10 204 Q4 240 12 274 L92 274 Q100 240 94 204 Q74 196 52 200 Q30 196 10 204 Z" fill="#dcc6a6" />
          <path d="M14 204 Q52 192 92 204" stroke="#c9ae88" strokeWidth={3} fill="none" strokeLinecap="round" />
          <g stroke="#ccb08a" strokeWidth={1.4} opacity={0.8}>
            <line x1={10} y1={222} x2={96} y2={222} />
            <line x1={8} y1={240} x2={98} y2={240} />
            <line x1={9} y1={258} x2={97} y2={258} />
          </g>
        </g>
      </g>

      {/* the hopper the sorted beans pour from */}
      <g className="j-rise" style={motionVars({ d: 0.3 })}>
        <path d="M144 58 Q180 40 216 58 Z" fill="#93a463" />
        <g fill="#7f8f50">
          <ellipse cx={164} cy={52} rx={4} ry={5.5} />
          <ellipse cx={180} cy={48} rx={4} ry={5.5} />
          <ellipse cx={196} cy={52} rx={4} ry={5.5} />
        </g>
        <path d="M138 56 L222 56 L196 88 L164 88 Z" fill="#a84f3a" />
        <rect x={138} y={64} width={84} height={3} fill="#f0b49b" opacity={0.6} />
        <rect x={170} y={86} width={20} height={10} rx={2} fill="#7a3426" />
      </g>

      <g>
        {DROPS.map(([x, d]) => (
          <g
            key={`${x}-${d}`}
            className="j-sorted-drop"
            style={vars({ "--d": `${d}s`, "--dy": `${MOUTH_Y - SPOUT_Y}px` })}
          >
            <ellipse cx={x} cy={SPOUT_Y} rx={5.5} ry={7.5} fill="#8a9a5b" />
          </g>
        ))}
        {REJECTS.map(([x, d]) => (
          <g
            key={`${x}-${d}`}
            className="j-sorted-reject"
            style={vars({ "--d": `${d}s`, "--tx": `${BOWL.x - x}px`, "--ty": `${BOWL.y - 2 - SPOUT_Y}px` })}
          >
            <ellipse cx={x} cy={SPOUT_Y} rx={5.5} ry={7.5} fill="#5a4030" />
          </g>
        ))}
      </g>

      {/* the bowl of faulty beans */}
      <g className="j-rise" style={motionVars({ d: 0.4 })}>
        <path d={`M${BOWL.x - 30} ${BOWL.y} Q${BOWL.x} ${BOWL.y + 32} ${BOWL.x + 30} ${BOWL.y} Z`} fill="#b8a491" />
        <ellipse cx={BOWL.x} cy={BOWL.y} rx={30} ry={4} fill="#a8927f" />
        <text x={BOWL.x} y={258} fontSize={11} fill="#7a675b" textAnchor="middle" fontWeight={600}>
          set aside
        </text>
      </g>
      <g className="j-fade" style={motionVars({ d: 2.7 })} fill="#5a4030">
        <ellipse cx={BOWL.x - 8} cy={BOWL.y + 1} rx={6} ry={3.6} transform={`rotate(-12 ${BOWL.x - 8} ${BOWL.y + 1})`} />
        <ellipse cx={BOWL.x + 7} cy={BOWL.y + 2} rx={6} ry={3.6} fill="#4a3328" />
      </g>

      {/* the sack */}
      <g className="j-rise" style={motionVars({ d: 0.2 })}>
        <path
          d="M104 152 Q94 222 108 286 L252 286 Q266 222 256 152 Q218 140 180 148 Q142 140 104 152 Z"
          fill="#c9a272"
        />
        <g stroke="#b28a5c" strokeWidth={1.6} opacity={0.8}>
          <line x1={104} y1={174} x2={256} y2={174} />
          <line x1={100} y1={198} x2={260} y2={198} />
          <line x1={100} y1={222} x2={260} y2={222} />
          <line x1={102} y1={246} x2={258} y2={246} />
          <line x1={104} y1={270} x2={256} y2={270} />
        </g>
        <ellipse cx={180} cy={MOUTH_Y} rx={76} ry={10} fill="#8a6a4c" />
        <ellipse cx={180} cy={MOUTH_Y + 2} rx={66} ry={6} fill="#93a463" />
        <g fill="#7f8f50">
          <ellipse cx={150} cy={MOUTH_Y + 1} rx={4} ry={2.6} />
          <ellipse cx={176} cy={MOUTH_Y + 3} rx={4} ry={2.6} />
          <ellipse cx={204} cy={MOUTH_Y + 1} rx={4} ry={2.6} />
        </g>
      </g>

      {stamp.lines.length > 0 && (
        <g className="j-sorted-stamp">
          <rect
            x={180 - stamp.w / 2}
            y={222 - stamp.h / 2}
            width={stamp.w}
            height={stamp.h}
            rx={6}
            fill="none"
            stroke="#7a3b2a"
            strokeWidth={3}
          />
          {stamp.lines.map((l, i) => (
            <text
              key={i}
              x={180}
              y={l.y}
              textAnchor="middle"
              fontSize={l.size}
              fontWeight={l.weight}
              letterSpacing={l.spacing}
              fill="#7a3b2a"
            >
              {l.text}
            </text>
          ))}
        </g>
      )}
    </g>
  );
}
