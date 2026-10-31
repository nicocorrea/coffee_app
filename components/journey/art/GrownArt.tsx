"use client";

import type { Journey, Setting } from "@/lib/journey/types";
import { easeOut, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

type Peak = Journey["grown"]["peak"];
type Ridge = { d: string; shade: string[]; summit: [number, number] };

const BASE = 210;

/** A smooth hill line from gaussian bumps: [centre x, height, width]. */
function hills(base: number, bumps: [number, number, number][]): Ridge {
  let summit: [number, number] = [180, base];
  const pts: string[] = [];
  for (let x = -10; x <= 370; x += 10) {
    const y = base - bumps.reduce((s, [c, h, w]) => s + h * Math.exp(-(((x - c) / w) ** 2)), 0);
    if (y < summit[1]) summit = [x, y];
    pts.push(`${x} ${y.toFixed(1)}`);
  }
  return { d: `M${pts.join(" L")} L370 380 L-10 380 Z`, shade: [], summit };
}

/** Jagged mountains whose summit stands `h` above the base line; their right faces are in shadow. */
function mountains(h: number): Ridge {
  const y = (f: number) => +(BASE - f * h).toFixed(1);
  return {
    d: `M-10 ${BASE + 20} L60 ${y(0.43)} L95 ${y(0.25)} L170 ${y(1)} L245 ${y(0.357)} L290 ${y(0.571)} L370 ${y(0.07)} L370 380 L-10 380 Z`,
    // Shadowed faces run down behind the hills in front, so they never show a lower edge.
    shade: [
      `M170 ${y(1)} L245 ${y(0.357)} L222 300 L180 300 Z`,
      `M60 ${y(0.43)} L95 ${y(0.25)} L84 300 Z`,
      `M290 ${y(0.571)} L370 ${y(0.07)} L370 300 L322 300 Z`,
    ],
    summit: [170, y(1)],
  };
}

/** The far range: 0 is a neutral hillside (altitude unknown), 1 low rolling hills, 4 tall mountains. */
function ridgeFor(peak: Peak): Ridge {
  if (peak === 0)
    return hills(204, [
      [110, 50, 80],
      [262, 40, 70],
    ]);
  if (peak === 1)
    return hills(208, [
      [90, 36, 64],
      [226, 26, 58],
      [334, 22, 50],
    ]);
  return mountains(({ 2: 84, 3: 112, 4: 140 } as const)[peak]);
}

function Tree({
  x,
  y,
  h,
  r,
  d,
  sway = 0,
  tones = ["#5f7a4e", "#6f8a5c", "#567046"],
}: {
  x: number;
  y: number;
  h: number;
  r: number;
  d: number;
  sway?: number;
  tones?: [string, string, string];
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="j-grow" style={motionVars({ d })}>
        <g className="j-sway" style={{ animationDelay: `${-sway}s` }}>
          <rect x={-3} y={-h} width={6} height={h} fill="#6b4a32" />
          <circle cx={0} cy={-h - r * 0.35} r={r} fill={tones[0]} />
          <circle cx={-r * 0.66} cy={-h + r * 0.2} r={r * 0.64} fill={tones[1]} />
          <circle cx={r * 0.66} cy={-h + r * 0.12} r={r * 0.68} fill={tones[2]} />
        </g>
      </g>
    </g>
  );
}

function Shrub({
  x,
  y,
  rx,
  ry,
  d,
  fill,
  cherries,
}: {
  x: number;
  y: number;
  rx: number;
  ry: number;
  d: number;
  fill: string;
  cherries: [number, number][];
}) {
  const cr = Math.max(1.6, rx * 0.13);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="j-pop" style={motionVars({ d })}>
        <ellipse rx={rx} ry={ry} fill={fill} />
        {cherries.map(([cx, cy], i) => (
          <circle key={i} cx={cx * rx} cy={cy * ry} r={cr} fill="#c0392b" />
        ))}
      </g>
    </g>
  );
}

const BERRIES: [number, number][][] = [
  [
    [-0.3, -0.13],
    [0.25, 0.2],
    [0.45, -0.4],
  ],
  [
    [-0.36, 0],
    [0.18, -0.44],
    [0.45, 0.25],
  ],
  [
    [-0.26, -0.28],
    [0.37, 0.14],
  ],
];

const SHADE_TREES: Record<Exclude<Setting, "sun">, Parameters<typeof Tree>[0][]> = {
  // Tall canopy trees standing over the coffee.
  forest: [
    // further back: smaller and hazier
    {
      x: 124,
      y: 240,
      h: 92,
      r: 23,
      d: 0.5,
      sway: 0.8,
      tones: ["#7f9668", "#8ca275", "#768e60"],
    },
    {
      x: 236,
      y: 238,
      h: 100,
      r: 25,
      d: 0.55,
      sway: 2.2,
      tones: ["#7f9668", "#8ca275", "#768e60"],
    },
    { x: 54, y: 270, h: 136, r: 32, d: 0.6 },
    {
      x: 306,
      y: 266,
      h: 146,
      r: 33,
      d: 0.75,
      sway: 1.5,
      tones: ["#567046", "#5f7a4e", "#6f8a5c"],
    },
  ],
  // A few shade trees scattered among the rows.
  shade: [
    { x: 58, y: 268, h: 72, r: 24, d: 0.6 },
    {
      x: 232,
      y: 250,
      h: 52,
      r: 18,
      d: 0.7,
      sway: 2.4,
      tones: ["#6f8a5c", "#5f7a4e", "#567046"],
    },
    {
      x: 304,
      y: 262,
      h: 84,
      r: 27,
      d: 0.8,
      sway: 1.5,
      tones: ["#567046", "#5f7a4e", "#6f8a5c"],
    },
  ],
};

/** Open rows in full sun, smaller as they recede. */
function SunRows() {
  const rows = [
    { y: 232, rx: 8, ry: 6, step: 22, from: 22, fill: "#6f8a5c", d: 0.9 },
    { y: 246, rx: 12, ry: 9, step: 30, from: 14, fill: "#5f7a4e", d: 1.05 },
    { y: 266, rx: 18, ry: 13, step: 42, from: 8, fill: "#4f6a3f", d: 1.2 },
  ];
  return (
    <>
      <path d="M-10 228 Q180 214 370 226 V380 H-10 Z" fill="#a3a776" />
      <g stroke="#93976a" strokeWidth={1.5} fill="none">
        <path d="M-10 239 Q180 228 370 237" />
        <path d="M-10 255 Q180 245 370 253" />
        <path d="M-10 280 Q180 270 370 278" />
      </g>
      {rows.map((row, ri) =>
        Array.from({ length: Math.ceil((370 - row.from) / row.step) }, (_, i) => {
          const x = row.from + i * row.step;
          return (
            <Shrub
              key={`${ri}-${i}`}
              x={x}
              y={row.y}
              rx={row.rx}
              ry={row.ry}
              d={row.d + (x / 360) * 0.4}
              fill={i % 2 ? row.fill : ri === 0 ? "#7c9467" : "#567046"}
              cherries={ri === 0 ? [] : BERRIES[i % 3]}
            />
          );
        }),
      )}
    </>
  );
}

/**
 * Grown: dawn over the slopes where the coffee grows. The far range follows the altitude (no snow:
 * coffee never grows that high), the setting decides what stands among the shrubs, and a line marks
 * the summit's height, counting up to the top of the altitude range.
 */
export function GrownArt({ j, active }: ArtProps) {
  const { peak, setting, altitudeM } = j.grown;
  const t = useTween(active, 1800, 1700);
  const ridge = ridgeFor(peak);
  const [sx, sy] = ridge.summit;
  const sunny = setting === "sun";
  const metres = altitudeM ? Math.round(easeOut(t) * altitudeM.max) : 0;

  return (
    <g data-art="grown" data-variant={`peak-${peak} ${setting}`}>
      <defs>
        <linearGradient id="j-grown-mist" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity={0} />
          <stop offset="0.5" stopColor="#fff" stopOpacity={0.6} />
          <stop offset="1" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="j-grown-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sunny ? "#f5d6b2" : "#f3d9c0"} />
          <stop offset="1" stopColor="#fbf3ea" />
        </linearGradient>
      </defs>
      <rect width={360} height={300} fill="url(#j-grown-sky)" />

      <g className="j-grown-sun">
        <circle cx={262} cy={92} r={sunny ? 52 : 44} fill="#efc27a" opacity={0.25} />
        <circle cx={262} cy={92} r={30} fill="#efc27a" />
      </g>
      <g className="j-drift" opacity={0.9}>
        <ellipse cx={84} cy={66} rx={34} ry={9} fill="#fff" />
        <ellipse cx={102} cy={58} rx={18} ry={10} fill="#fff" />
      </g>
      <g
        className="j-drift"
        style={{
          animationDuration: "20s",
          animationDirection: "alternate-reverse",
        }}
        opacity={0.7}
      >
        <ellipse cx={292} cy={142} rx={26} ry={7} fill="#fff" />
      </g>

      <g data-depth="0.14">
        <path d={ridge.d} fill="#cdb8a0" />
        {ridge.shade.map((d) => (
          <path key={d} d={d} fill="#c2ab92" />
        ))}
      </g>
      <g className="j-drift">
        <rect x={-40} y={peak > 1 ? 168 : 182} width={440} height={34} fill="url(#j-grown-mist)" />
      </g>
      <g data-depth="0.07">
        <path d="M-10 250 Q60 190 130 225 T260 205 T370 220 V380 H-10 Z" fill="#a9b28c" />
      </g>

      {setting !== "sun" && SHADE_TREES[setting].map((tree, i) => <Tree key={i} {...tree} />)}

      {sunny ? (
        <SunRows />
      ) : (
        <>
          <path d="M-10 272 Q90 246 180 262 T370 255 V380 H-10 Z" fill="#8c9873" />
          <Shrub x={110} y={262} rx={20} ry={15} d={1} fill="#4f6a3f" cherries={BERRIES[0]} />
          <Shrub x={160} y={256} rx={22} ry={16} d={1.15} fill="#5f7a4e" cherries={BERRIES[1]} />
          <Shrub x={210} y={262} rx={19} ry={14} d={1.3} fill="#4f6a3f" cherries={BERRIES[2]} />
          <Shrub x={258} y={258} rx={17} ry={13} d={1.45} fill="#5f7a4e" cherries={BERRIES[0]} />
        </>
      )}

      {altitudeM && (
        <g>
          <line
            className="j-draw"
            style={motionVars({ d: 1.6, dur: 1.2, len: 304 - sx })}
            x1={sx}
            y1={sy}
            x2={304}
            y2={sy}
            stroke="#a84f3a"
            strokeWidth={1.5}
          />
          <circle className="j-pop" style={motionVars({ d: 1.4 })} cx={sx} cy={sy} r={4} fill="#a84f3a" />
          <text
            className="j-fade numerals"
            style={motionVars({ d: 1.9 })}
            x={304}
            y={sy - 10}
            fontSize={17}
            fontWeight={700}
            fill="#a84f3a"
            stroke="#fbf3ea"
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
            textAnchor="end"
          >
            {metres.toLocaleString("en-US")} m
          </text>
        </g>
      )}
    </g>
  );
}
