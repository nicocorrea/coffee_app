"use client";

import type { CSSProperties } from "react";
import { motionVars } from "../motion";
import type { ArtProps } from "./index";

const vars = (v: Record<string, string>) => v as CSSProperties;

// The prototype's bean, raised a little so the caption clears the phone's bottom crop.
const CY = 144;

type Palette = {
  husk: [string, string];
  ridge: string;
  parch: [string, string];
  parchLine: string;
  beans: [string, string];
  seam: string;
  gloss: number;
  caption: string;
};

const DRY: Palette = {
  husk: ["#4a2030", "#542536"],
  ridge: "#6e3646",
  parch: ["#ecdcb0", "#e7d6a6"],
  parchLine: "#d8c48e",
  beans: ["#93a463", "#8a9a5b"],
  seam: "#6d7d45",
  gloss: 0.18,
  caption: "two green seeds, face to face",
};

// Washed and honey coffees reach the dry mill as parchment (the fruit came off before drying), so
// their shell is the pale parchment itself, with a thin silverskin under it. Honey's parchment keeps
// an amber tint of the dried, sticky fruit.
const PARCHMENT: Palette = {
  husk: ["#e3d0a0", "#d9c590"],
  ridge: "#c4ad74",
  parch: ["#f4ecd9", "#efe6d0"],
  parchLine: "#dfd1b0",
  beans: DRY.beans,
  seam: DRY.seam,
  gloss: DRY.gloss,
  caption: DRY.caption,
};

const HONEY: Palette = {
  ...PARCHMENT,
  husk: ["#dcb66c", "#d2a95c"],
  ridge: "#b98c45",
};

// Wet-hulled: the shell comes off still damp, and the seeds inside are darker and glossy.
const WET: Palette = {
  husk: ["#7a6040", "#866a46"],
  ridge: "#9a7e52",
  parch: ["#d9c592", "#d2bd88"],
  parchLine: "#bba66f",
  beans: ["#4f6b45", "#567046"],
  seam: "#34502f",
  gloss: 0.5,
  caption: "two damp, dark green seeds",
};

// [x, y, width, height, --tx, --ty, light?]: flecks of husk (and parchment) fly off as it splits.
const FLECKS: [number, number, number, number, number, number, boolean?][] = [
  [176, 140, 7, 4, -90, -60],
  [176, 140, 6, 5, 80, -80],
  [176, 140, 8, 3, 120, 10],
  [176, 140, 5, 5, -130, 20],
  [176, 140, 6, 3, 40, -96, true],
  [176, 140, 7, 3, -50, -100, true],
];

// Pieces of shell left lying on the floor once it has split.
const PIECES: [number, number, number][] = [
  [92, 226, -20],
  [110, 232, 30],
  [250, 230, -36],
  [270, 224, 14],
];

/**
 * Milled: the shell shakes and splits, flecks fly, the inner skin puffs away and two green seeds part.
 * The shell is the dried cherry's husk for naturals (and anaerobic or unknown processes), and the
 * parchment itself for washed and honey coffees, whose fruit came off before drying.
 */
export function MilledArt({ j }: ArtProps) {
  const wet = j.milled.wetHulled;
  const process = j.processed.process;
  const parchment = !wet && (process === "washed" || process === "honey");
  const c = wet ? WET : parchment ? (process === "honey" ? HONEY : PARCHMENT) : DRY;
  return (
    <g data-art="milled" data-variant={wet ? "wet-hulled" : "dry"} data-shell={parchment ? "parchment" : "husk"}>
      <defs>
        <radialGradient id="j-milled-bg" cx="50%" cy="48%" r="58%">
          <stop offset="0" stopColor="#f6ecdf" />
          <stop offset="1" stopColor="#e8dbcc" />
        </radialGradient>
      </defs>
      <rect width={360} height={300} fill="url(#j-milled-bg)" />
      <g data-depth="0.05" fill="none" stroke="#e2d4c3" strokeWidth={1.5}>
        <circle cx={180} cy={CY} r={96} />
        <circle cx={180} cy={CY} r={128} opacity={0.6} />
      </g>
      <ellipse cx={180} cy={CY + 84} rx={92} ry={10} fill="#d9c9b8" />

      <g className="j-fade" style={motionVars({ d: 2.3 })}>
        {PIECES.map(([x, y, a], i) => (
          <path
            key={x}
            transform={`translate(${x} ${y}) rotate(${a})`}
            d="M-9 2 Q-8 -6 0 -6 Q8 -6 9 2 Z"
            fill={c.husk[i % 2]}
          />
        ))}
        {wet && (
          <g fill="#b8d6d6" opacity={0.8}>
            <ellipse cx={140} cy={230} rx={6} ry={1.8} />
            <ellipse cx={226} cy={233} rx={8} ry={2} />
          </g>
        )}
      </g>

      {/* the two seeds, revealed */}
      <g className="j-milled-bean-l">
        <ellipse cx={164} cy={CY} rx={22} ry={34} fill={c.beans[0]} />
        <path
          d={`M168 ${CY - 30} C 158 ${CY - 10}, 172 ${CY + 10}, 162 ${CY + 30}`}
          fill="none"
          stroke={c.seam}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <ellipse cx={154} cy={CY - 16} rx={5} ry={10} fill="#fff" opacity={c.gloss} />
        {wet && <circle cx={174} cy={CY + 18} r={2.2} fill="#eef6f6" opacity={0.9} />}
      </g>
      <g className="j-milled-bean-r">
        <ellipse cx={196} cy={CY} rx={22} ry={34} fill={c.beans[1]} />
        <path
          d={`M192 ${CY - 30} C 202 ${CY - 10}, 188 ${CY + 10}, 198 ${CY + 30}`}
          fill="none"
          stroke={c.seam}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <ellipse cx={206} cy={CY - 16} rx={5} ry={10} fill="#fff" opacity={c.gloss} />
        {wet && (
          <g fill="#eef6f6" opacity={0.9}>
            <circle cx={188} cy={CY - 20} r={2} />
            <circle cx={210} cy={CY + 12} r={1.6} />
          </g>
        )}
      </g>

      {/* the parchment */}
      <g className="j-milled-parch">
        <ellipse cx={164} cy={CY} rx={26} ry={38} fill={c.parch[0]} stroke={c.parchLine} strokeWidth={2} />
        <ellipse cx={196} cy={CY} rx={26} ry={38} fill={c.parch[1]} stroke={c.parchLine} strokeWidth={2} />
      </g>

      {/* the husk, in two halves */}
      <g className="j-milled-husk-l">
        <path d={`M180 ${CY - 62} A62 62 0 0 0 180 ${CY + 62} Z`} fill={c.husk[0]} />
        <path
          d={`M150 ${CY - 38} q8 10 0 22 M140 ${CY} q10 6 2 18 M158 ${CY + 32} q6 -8 14 -2`}
          stroke={c.ridge}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
        {wet && (
          <g fill="#d6e8e8" opacity={0.8}>
            <circle cx={140} cy={CY - 24} r={2} />
            <circle cx={156} cy={CY + 10} r={1.6} />
          </g>
        )}
      </g>
      <g className="j-milled-husk-r">
        <path d={`M180 ${CY - 62} A62 62 0 0 1 180 ${CY + 62} Z`} fill={c.husk[1]} />
        <path
          d={`M206 ${CY - 42} q-8 12 2 22 M220 ${CY} q-10 6 -2 18 M198 ${CY + 36} q8 -4 12 4`}
          stroke={c.ridge}
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
        />
        {wet && (
          <g fill="#d6e8e8" opacity={0.8}>
            <circle cx={214} cy={CY - 20} r={1.8} />
            <circle cx={202} cy={CY + 22} r={2.2} />
          </g>
        )}
      </g>

      <g>
        {FLECKS.map(([x, y, w, h, tx, ty, light], i) =>
          wet && i % 2 === 1 ? (
            <circle
              key={i}
              className="j-milled-fleck"
              style={vars({ "--tx": `${tx}px`, "--ty": `${ty}px` })}
              cx={x + 3}
              cy={y + 2}
              r={2.4}
              fill="#b8d6d6"
            />
          ) : (
            <rect
              key={i}
              className="j-milled-fleck"
              style={vars({ "--tx": `${tx}px`, "--ty": `${ty}px` })}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={1}
              fill={light ? c.parchLine : c.husk[0]}
            />
          ),
        )}
      </g>

      <text
        className="j-fade"
        style={motionVars({ d: 3.2 })}
        x={180}
        y={256}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill="#7a675b"
      >
        {c.caption}
      </text>
    </g>
  );
}
