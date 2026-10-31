"use client";

import { lerp, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** A font size (≤ max) that fits `text` in `width`, for a face about `em` wide per character. */
const fit = (text: string, width: number, max: number, em = 0.72) =>
  +Math.max(7, Math.min(max, width / Math.max(1, text.length * em))).toFixed(1);

/** The bag's label: the coffee's name in at most two lines (the process, shown below it, dropped). */
function nameLines(name: string, process: string): string[] {
  let words = name.trim().split(/\s+/).filter(Boolean);
  const tail = process.trim().toLowerCase().split(/\s+/);
  const ends = words.slice(-tail.length).map((w) => w.toLowerCase());
  if (words.length > tail.length && ends.join(" ") === tail.join(" ")) words = words.slice(0, -tail.length);
  const lines: string[] = [];
  for (const w of words) {
    const last = lines[lines.length - 1];
    if (last !== undefined && (last + " " + w).length <= 10) lines[lines.length - 1] = `${last} ${w}`;
    else lines.push(w);
  }
  if (lines.length > 2) lines.splice(1, lines.length - 1, lines.slice(1).join(" "));
  return lines.map((l) => clip(l.toUpperCase(), 16));
}

// The wall calendar: 7 days a row, at least three weeks.
const CAL = { x: 194, y: 114, h: 76, dx: 17, w: 13 };
const MAX_DAYS = 42;

// A few roasted beans spilled on the shelf: [x, y, angle].
const SPILLED: [number, number, number][] = [
  [190, 251, -18],
  [203, 252, 24],
  [220, 251, 70],
];

const EMPTY = "#eae0d6";
const SETTLING = "#dcc7b2";
const BEST = "#a84f3a";
const AFTER = "#b9bf9c";

/**
 * Rested: the bag sits on a shelf and its valve puffs out gas, less as the days pass. A wall
 * calendar fills day by day, highlighting the window when this coffee should be at its best.
 */
export function RestedArt({ j, active }: ArtProps) {
  const { min, max } = j.rested.days;
  const total = Math.min(MAX_DAYS, Math.max(21, Math.ceil(max)));
  const rows = Math.ceil(total / 7);
  const dy = Math.min(24, CAL.h / rows);
  const ch = dy - 5;
  const t = useTween(active, 4200, 600);
  const filled = Math.round(lerp(0, total, t));

  const name = nameLines(j.coffeeName, j.processed.processLabel);
  const sub = clip(`${j.processed.processLabel.toLowerCase()} · ${j.roasted.level}`, 26);
  const legend: [string, string][] = [
    [SETTLING, "settling"],
    [BEST, "at its best"],
    ...(max < total ? ([[AFTER, "still good"]] as [string, string][]) : []),
  ];
  const legendY = CAL.y + rows * dy + 10;

  return (
    <g data-art="rested">
      <rect width={360} height={300} fill="#f3ece5" />

      {/* the shelf */}
      <rect x={0} y={248} width={360} height={10} fill="#c9a77d" />
      <rect x={0} y={258} width={360} height={5} fill="#b08d62" />
      <rect x={0} y={263} width={360} height={37} fill="#e8ddd1" />
      <ellipse cx={112} cy={248} rx={70} ry={4} fill="#a8835a" opacity={0.45} />

      {/* the bag */}
      <g className="j-rise" style={motionVars({ d: 0.2 })}>
        <path d="M58 64 L166 64 L178 248 L46 248 Z" fill="#c9a77d" />
        <path d="M58 64 L166 64 L167 90 L57 90 Z" fill="#b8956b" />
        <rect x={52} y={74} width={120} height={5} rx={2.5} fill="#cfc8bd" />
        <path d="M66 96 L60 240" stroke="#b8956b" strokeWidth={2} opacity={0.6} />
        <path d="M158 96 L166 240" stroke="#b8956b" strokeWidth={2} opacity={0.6} />
        <circle cx={112} cy={116} r={11} fill="#8a6a4c" />
        <circle cx={112} cy={116} r={5} fill="#6b4a32" />
        <rect x={66} y={144} width={92} height={78} rx={4} fill="#fbf8f5" />
        <g textAnchor="middle" fill="#2a1c15" fontWeight={800}>
          {name.map((line, i) => (
            <text
              key={i}
              x={112}
              y={name.length === 1 ? 180 : 170 + i * 16}
              fontSize={fit(line, 80, i === 0 ? 13 : 11.5)}
              letterSpacing={1}
              fontWeight={i === 0 ? 800 : 700}
            >
              {line}
            </text>
          ))}
        </g>
        <line x1={84} y1={198} x2={140} y2={198} stroke="#ded2c6" strokeWidth={1} />
        <text x={112} y={212} textAnchor="middle" fontSize={fit(sub, 84, 9.5, 0.55)} fontWeight={600} fill="#a84f3a">
          {sub}
        </text>
      </g>
      <g fill="#b8a491" style={{ opacity: 1 - 0.7 * t }}>
        {[0.2, 1, 1.8].map((d) => (
          <circle key={d} className="j-rested-gas" style={motionVars({ d })} cx={112} cy={112} r={5} />
        ))}
      </g>

      {/* the wall calendar */}
      <g className="j-rise" style={motionVars({ d: 0.4 })}>
        <rect x={186} y={34} width={132} height={legendY + legend.length * 17 + 4 - 34} rx={8} fill="#fbf8f5" stroke="#ded2c6" />
        <g fill="#a8927f">
          <rect x={214} y={28} width={5} height={12} rx={2.5} />
          <rect x={285} y={28} width={5} height={12} rx={2.5} />
        </g>
        <text x={252} y={58} textAnchor="middle" fontSize={9.5} fontWeight={600} fill="#7a675b" letterSpacing={1.5}>
          DAYS SINCE ROAST
        </text>
        <text className="numerals" x={252} y={96} textAnchor="middle" fontSize={34} fontWeight={700} fill="#2a1c15">
          {Math.max(1, filled)}
        </text>
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const kind = day < min ? SETTLING : day <= max ? BEST : AFTER;
          const x = CAL.x + (i % 7) * CAL.dx;
          const y = CAL.y + Math.floor(i / 7) * dy;
          const marked = i < filled && (day === Math.round(min) || day === Math.round(max));
          return (
            <g key={day}>
              <rect x={x} y={y} width={CAL.w} height={ch} rx={3} fill={i < filled ? kind : EMPTY} />
              {marked && (
                <text
                  className="numerals"
                  x={x + CAL.w / 2}
                  y={y + ch / 2 + 3}
                  textAnchor="middle"
                  fontSize={Math.min(9, ch - 4)}
                  fontWeight={700}
                  fill="#fbf8f5"
                >
                  {day}
                </text>
              )}
            </g>
          );
        })}
        <g fontSize={10.5} fill="#7a675b" fontWeight={600}>
          {legend.map(([fill, label], i) => (
            <g key={label}>
              <rect x={CAL.x} y={legendY + i * 17} width={10} height={10} rx={2} fill={fill} />
              <text x={CAL.x + 16} y={legendY + i * 17 + 9}>
                {label}
              </text>
            </g>
          ))}
        </g>
      </g>
      <g>
        <g className="j-fade" style={motionVars({ d: 0.9 })}>
          {SPILLED.map(([x, y, a]) => (
            <g key={x} transform={`translate(${x} ${y}) rotate(${a})`}>
              <ellipse rx={5.5} ry={4} fill="#8e5a36" />
              <path d="M-4 0.4 Q0 -1.2 4 0.4" stroke="#5a3a24" strokeWidth={1.1} fill="none" />
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}
