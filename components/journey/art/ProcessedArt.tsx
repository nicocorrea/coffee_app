"use client";

import { useMemo, type ComponentType, type CSSProperties } from "react";
import type { Drying, ProcessKind } from "@/lib/journey/types";
import { lerp, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

const vars = (v: Record<string, string>) => v as CSSProperties;

/** "#rrggbb" a → b by k (0–1). */
function mix(a: string, b: string, k: number): string {
  const ch = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return `#${[0, 1, 2]
    .map((i) =>
      Math.round(lerp(ch(a, i), ch(b, i), k))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

const DRY_MS = 7000;
const DRY_DELAY = 400;
const SUN_PASSES = 4.5;

// ─── What dries: whole cherries (natural, anaerobic) or beans, each with its own colour ramp ───

type Look = {
  shape: "cherry" | "bean";
  /** body colour, wet (start) → dry (end) */
  body: [string, string];
  /** the sticky honey coat around the bean */
  coat?: [string, string];
  seam?: [string, string];
  /** how glossy it starts and ends */
  gloss: [number, number];
  /** water droplets on the bean, fading as it dries */
  wet?: boolean;
};

const LOOK: Record<ProcessKind, Look> = {
  // red cherries darken to plum and shrink
  natural: { shape: "cherry", body: ["#c0392b", "#4a2030"], gloss: [0.5, 0.08] },
  // wine-dark cherries out of the tank, drying almost black
  anaerobic: { shape: "cherry", body: ["#a52a45", "#3a1626"], gloss: [0.45, 0.1] },
  // pale, wet parchment beans drying to a clean cream
  washed: { shape: "bean", body: ["#cdbb8a", "#ebdcb4"], seam: ["#b09c66", "#d2bf90"], gloss: [0.55, 0.12], wet: true },
  // sticky amber-coated beans darkening from golden to deep amber
  honey: {
    shape: "bean",
    body: ["#e0a63e", "#a95c28"],
    coat: ["#efbd45", "#b8652a"],
    seam: ["#a8702a", "#6e3a1a"],
    gloss: [0.75, 0.5],
  },
  // hulled while damp: dark, glossy green beans
  "wet-hulled": {
    shape: "bean",
    body: ["#34502f", "#55704a"],
    seam: ["#22381f", "#3a5233"],
    gloss: [0.6, 0.25],
    wet: true,
  },
  // a plain drying scene
  other: { shape: "bean", body: ["#d9c79c", "#c6a874"], seam: ["#b39a6a", "#9d7f4f"], gloss: [0.3, 0.08] },
};

/** The one drawing every item on the surface `<use>`s, so a frame only repaints the defs. */
function ItemDef({ look, k }: { look: Look; k: number }) {
  const body = mix(look.body[0], look.body[1], k);
  const gloss = lerp(look.gloss[0], look.gloss[1], k);
  if (look.shape === "cherry") {
    const r = lerp(8.5, 6.8, k);
    return (
      <g id="j-processed-item">
        <circle r={r} fill={body} />
        <circle cx={-r * 0.34} cy={-r * 0.34} r={r * 0.26} fill="#fff" opacity={gloss} />
      </g>
    );
  }
  const seam = look.seam ? mix(look.seam[0], look.seam[1], k) : "#000";
  return (
    <g id="j-processed-item">
      {look.coat && <ellipse rx={8.4} ry={6.2} fill={mix(look.coat[0], look.coat[1], k)} opacity={0.8} />}
      <ellipse rx={7} ry={4.8} fill={body} />
      <path d="M-5 0.9 Q0 -1.5 5 0.7" stroke={seam} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      <ellipse cx={-2.6} cy={-2.1} rx={2.6} ry={1.1} fill="#fff" opacity={gloss} />
      {look.wet && (
        <g fill="#eef6f6" opacity={1 - k}>
          <circle cx={3.6} cy={-2.6} r={1.1} />
          <circle cx={-4.6} cy={2.2} r={0.8} />
        </g>
      )}
    </g>
  );
}

// ─── Where it dries ───

type Slot = { x: number; y: number; s: number; a: number; d: number };

const tilt = (i: number, r: number) => ((i * 37 + r * 53) % 50) - 25;

function rows(spec: { y: number; s: number; step: number; from: number; to: number }[], start: number): Slot[] {
  return spec.flatMap((row, r) =>
    Array.from({ length: Math.floor((row.to - row.from) / row.step) + 1 }, (_, i) => {
      const x = row.from + i * row.step;
      return { x, y: row.y, s: row.s, a: tilt(i, r), d: start + (x / 360) * 0.7 + r * 0.1 };
    }),
  );
}

function slotsFor(drying: Drying, shape: Look["shape"], start: number): Slot[] {
  const cherry = shape === "cherry";
  if (drying === "raised-beds")
    return cherry
      ? rows(
          [
            { y: 167, s: 1, step: 21, from: 50, to: 323 },
            { y: 176, s: 1, step: 21, from: 40, to: 313 },
          ],
          start,
        )
      : rows(
          [
            { y: 172, s: 1, step: 16, from: 44, to: 318 },
            { y: 177, s: 1, step: 16, from: 36, to: 324 },
            { y: 182, s: 1, step: 16, from: 42, to: 318 },
          ],
          start,
        );
  if (drying === "patio")
    return cherry
      ? rows(
          [
            { y: 212, s: 0.62, step: 15, from: 40, to: 322 },
            { y: 228, s: 0.8, step: 19, from: 32, to: 330 },
            { y: 248, s: 1, step: 23, from: 26, to: 336 },
          ],
          start,
        )
      : rows(
          [
            { y: 210, s: 0.62, step: 12, from: 38, to: 324 },
            { y: 222, s: 0.74, step: 14, from: 32, to: 330 },
            { y: 236, s: 0.87, step: 17, from: 28, to: 334 },
            { y: 252, s: 1, step: 20, from: 24, to: 340 },
          ],
          start,
        );
  // In the drum: a heap at the bottom of its window (drum-local coordinates).
  const heap: [number, number][] = [
    [-30, 16],
    [-15, 18],
    [0, 17],
    [15, 18],
    [30, 16],
    [-23, 7],
    [-8, 8],
    [8, 7],
    [23, 8],
    [-15, -1],
    [0, 0],
    [15, -1],
  ];
  return heap.map(([x, y], i) => ({ x, y, s: cherry ? 0.85 : 1, a: tilt(i, 1), d: start + i * 0.05 }));
}

function Items({ slots }: { slots: Slot[] }) {
  return (
    <>
      {slots.map(({ x, y, s, a, d }) => (
        <g key={`${x}-${y}`} className="j-pop" style={motionVars({ d })}>
          <use href="#j-processed-item" transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} />
        </g>
      ))}
    </>
  );
}

function Beds({ honey }: { honey: boolean }) {
  return (
    <>
      <path d="M-10 230 Q100 200 200 222 T370 214 V300 H-10 Z" fill="#a9b28c" />
      <g stroke="#6b4a32" strokeWidth={5} strokeLinecap="round">
        <line x1={52} y1={196} x2={46} y2={272} />
        <line x1={180} y1={196} x2={180} y2={276} />
        <line x1={308} y1={196} x2={314} y2={272} />
      </g>
      <g stroke="#5e4532" strokeWidth={2.5} strokeLinecap="round" opacity={0.7}>
        <line x1={50} y1={232} x2={178} y2={240} />
        <line x1={182} y1={240} x2={310} y2={232} />
      </g>
      <rect x={26} y={186} width={308} height={12} rx={3} fill="#8a6a4c" />
      <path d="M28 198 L332 198" stroke="#5e4532" strokeWidth={2} strokeDasharray="2 4" />
      {honey && (
        <g fill="#d99a2b">
          {[72, 124, 170, 216, 262, 296].map((x, i) => (
            <g key={x} className="j-fade" style={motionVars({ d: 2.4 + i * 0.15 })}>
              <path d={`M${x - 2.6} 197 Q${x} ${206 + (i % 3) * 3} ${x + 2.6} 197 Z`} />
              <circle cx={x} cy={207 + (i % 3) * 3} r={2.4} />
            </g>
          ))}
        </g>
      )}
    </>
  );
}

function Patio({ honey }: { honey: boolean }) {
  const fronts = [-60, 20, 100, 180, 260, 340, 420];
  return (
    <>
      <path d="M-10 214 Q110 192 220 204 T370 198 V300 H-10 Z" fill="#a9b28c" />
      <path d="M18 200 L342 200 L384 300 L-24 300 Z" fill="#dccfbd" />
      <path d="M18 200 L342 200" stroke="#c4b49e" strokeWidth={3} strokeLinecap="round" />
      <g stroke="#cbbca7" strokeWidth={1.5}>
        {[217, 238, 264].map((y) => (
          <line key={y} x1={-30} y1={y} x2={390} y2={y} />
        ))}
        {fronts.map((x) => (
          <line key={x} x1={180 + (x - 180) * 0.68} y1={200} x2={x} y2={300} />
        ))}
      </g>
      {honey && (
        <g fill="#e2b33c" opacity={0.35}>
          {[60, 130, 196, 262, 318].map((x, i) => (
            <ellipse key={x} cx={x} cy={256 - (i % 2) * 18} rx={16} ry={3.4} />
          ))}
        </g>
      )}
    </>
  );
}

/** A rake, for turning what dries on the patio. */
function Rake() {
  return (
    <g className="j-rise" style={motionVars({ d: 0.5 })}>
      <line x1={64} y1={128} x2={76} y2={248} stroke="#8a6a4c" strokeWidth={4} strokeLinecap="round" />
      <rect x={54} y={246} width={46} height={6} rx={2} fill="#6b4a32" />
      <g stroke="#6b4a32" strokeWidth={2.5} strokeLinecap="round">
        {[58, 66, 74, 82, 90, 97].map((x) => (
          <line key={x} x1={x} y1={252} x2={x - 1} y2={258} />
        ))}
      </g>
    </g>
  );
}

/** A rotating drum dryer heated from below; what dries tumbles inside its window. */
function Drum({ cx, slots }: { cx: number; slots: Slot[] }) {
  return (
    <>
      <path d="M-10 214 Q110 194 220 206 T370 200 V300 H-10 Z" fill="#a9b28c" />
      <path d="M-10 240 Q180 230 370 240 V300 H-10 Z" fill="#d9c7ae" />
      <g transform={`translate(${cx} 172)`}>
        <ellipse cx={0} cy={80} rx={98} ry={6} fill="#4a3328" opacity={0.18} />
        <g stroke="#5d4532" strokeWidth={6} strokeLinecap="round">
          <line x1={-58} y1={36} x2={-70} y2={78} />
          <line x1={58} y1={36} x2={70} y2={78} />
          <line x1={-66} y1={64} x2={66} y2={64} strokeWidth={4} />
        </g>
        {/* burner */}
        <rect x={-20} y={46} width={40} height={18} rx={3} fill="#6b4a32" />
        <g transform="translate(0 46)">
          <g className="j-processed-flame">
            <path d="M-9 0 C -9 -8 -3 -10 0 -16 C 3 -10 9 -8 9 0 Z" fill="#e2b33c" />
            <path d="M-4 0 C -4 -4 -1 -6 0 -9 C 1 -6 4 -4 4 0 Z" fill="#c7684f" />
          </g>
        </g>
        {/* body and end caps */}
        <ellipse cx={-86} cy={0} rx={12} ry={40} fill="#6f7b7c" />
        <rect x={-86} y={-40} width={172} height={80} fill="#8e9a9b" />
        <rect x={-86} y={-34} width={172} height={7} fill="#b4bfbf" opacity={0.6} />
        <g stroke="#6f7b7c" strokeWidth={3} strokeDasharray="4 10">
          <line className="j-processed-spin" x1={-86} y1={-21} x2={86} y2={-21} />
          <line className="j-processed-spin" x1={-86} y1={31} x2={86} y2={31} />
        </g>
        <g fill="#6f7b7c">
          <rect x={-62} y={-40} width={6} height={80} />
          <rect x={56} y={-40} width={6} height={80} />
        </g>
        <ellipse cx={86} cy={0} rx={12} ry={40} fill="#a9b4b4" />
        <circle cx={86} cy={0} r={6} fill="#6f7b7c" />
        {/* the window */}
        <rect x={-42} y={-27} width={84} height={54} rx={9} fill="#3a2c26" stroke="#5d686a" strokeWidth={4} />
        <clipPath id="j-processed-window">
          <rect x={-40} y={-25} width={80} height={50} rx={8} />
        </clipPath>
        <g clipPath="url(#j-processed-window)">
          <g className="j-processed-tumble">
            <rect x={-40} y={-25} width={80} height={50} fill="none" />
            <Items slots={slots} />
          </g>
        </g>
        <rect x={-34} y={-22} width={22} height={5} rx={2.5} fill="#fff" opacity={0.18} />
        {/* heat rising */}
        <g stroke="#c7684f" strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6}>
          {[-30, 0, 30].map((x, i) => (
            <path
              key={x}
              className="j-processed-heat"
              style={motionVars({ d: 0.4 + i * 0.6 })}
              d={`M${x} -48 q4 -5 0 -10 q-4 -5 0 -10`}
            />
          ))}
        </g>
      </g>
    </>
  );
}

// ─── What happens before drying, standing behind the beds (or beside the drum) ───

/** Washed: a pulper strips the red fruit; the beans drop into a water tank to ferment. */
function Pulper() {
  return (
    <>
      {/* stripped fruit, out of the side chute */}
      <path d="M232 126 L216 146" stroke="#7a3426" strokeWidth={5} strokeLinecap="round" />
      <path d="M196 190 Q212 160 228 190 Z" fill="#a8322a" />
      <g fill="#c0392b">
        <circle cx={206} cy={176} r={2.6} />
        <circle cx={214} cy={170} r={2.6} />
        <circle cx={219} cy={180} r={2.6} />
      </g>
      {/* the tank */}
      <rect x={222} y={148} width={100} height={8} rx={2} fill="#b3a594" />
      <rect x={226} y={154} width={92} height={36} fill="#c9bcab" />
      <rect x={230} y={158} width={84} height={32} fill="#8fb8bb" />
      <line x1={230} y1={159.5} x2={314} y2={159.5} stroke="#c3dddd" strokeWidth={2} />
      <g className="j-fade" style={motionVars({ d: 1.2 })} fill="#d9caa0">
        <ellipse cx={248} cy={176} rx={5} ry={3.4} />
        <ellipse cx={263} cy={183} rx={5} ry={3.4} />
        <ellipse cx={281} cy={173} rx={5} ry={3.4} />
        <ellipse cx={296} cy={181} rx={5} ry={3.4} />
        <ellipse cx={306} cy={170} rx={5} ry={3.4} />
        <ellipse cx={272} cy={167} rx={5} ry={3.4} />
      </g>
      <g fill="none" stroke="#eef6f6" strokeWidth={1.4}>
        {[
          [244, 184, 0.3, 2.2],
          [270, 186, 1.1, 2.6],
          [290, 182, 0.7, 1.8],
          [306, 186, 1.6, 2.4],
          [258, 180, 1.9, 1.6],
        ].map(([x, y, d, r]) => (
          <circle key={x} className="j-processed-bubble" style={motionVars({ d })} cx={x} cy={y} r={r} />
        ))}
      </g>
      {/* the pulper on its legs over the water */}
      <g stroke="#7a3426" strokeWidth={4} strokeLinecap="round">
        <line x1={238} y1={134} x2={236} y2={150} />
        <line x1={268} y1={134} x2={270} y2={150} />
      </g>
      <path d="M230 90 Q252 74 274 90 Z" fill="#c0392b" />
      <g fill="#a8322a">
        <circle cx={242} cy={86} r={3} />
        <circle cx={254} cy={82} r={3} />
        <circle cx={264} cy={86} r={3} />
      </g>
      <path d="M226 88 L278 88 L266 108 L238 108 Z" fill="#c7684f" />
      <rect x={232} y={106} width={40} height={30} rx={4} fill="#a84f3a" />
      <rect x={232} y={116} width={40} height={3} fill="#f0b49b" opacity={0.6} />
      <path d="M246 136 L258 136 L256 144 L248 144 Z" fill="#7a3426" />
      <g transform="translate(284 121)">
        <g className="j-processed-crank">
          <circle r={11} fill="none" stroke="#7a3426" strokeWidth={3} />
          <g stroke="#7a3426" strokeWidth={2}>
            <line x1={-11} y1={0} x2={11} y2={0} />
            <line x1={0} y1={-11} x2={0} y2={11} />
          </g>
          <circle cx={8} cy={-8} r={2.4} fill="#6b4a32" />
        </g>
      </g>
      <circle cx={284} cy={121} r={3} fill="#7a3426" />
      {[0.4, 0.7, 1, 1.3].map((d, i) => (
        <g key={d} className="j-processed-drop" style={vars({ "--d": `${d}s`, "--dy": "24px" })}>
          <ellipse cx={252 + (i % 2) * 2} cy={145} rx={3.6} ry={5} fill="#d9caa0" />
        </g>
      ))}
    </>
  );
}

/** Anaerobic: cherries ferment in a sealed steel tank; a valve lets the gas bubble out. */
function SealedTank() {
  return (
    <>
      <path d="M270 102 L270 86 Q270 82 274 82 L286 82" stroke="#8a9190" strokeWidth={4} fill="none" />
      <rect x={282} y={80} width={12} height={16} rx={3} fill="#dbe9ea" stroke="#8a9190" strokeWidth={2} />
      <rect x={284} y={88} width={8} height={6} rx={1.5} fill="#9fc2c4" />
      <g fill="none" stroke="#8a9190" strokeWidth={1.4}>
        {[
          [288, 74, 0.6, 2.4],
          [286, 72, 1.2, 1.8],
          [290, 74, 1.8, 2],
          [287, 73, 2.4, 2.6],
        ].map(([x, y, d, r]) => (
          <circle key={d} className="j-processed-gas" style={motionVars({ d })} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g stroke="#6f7676" strokeWidth={4} strokeLinecap="round">
        <line x1={248} y1={186} x2={246} y2={194} />
        <line x1={292} y1={186} x2={294} y2={194} />
      </g>
      <path d="M238 120 Q238 100 270 98 Q302 100 302 120 Z" fill="url(#j-processed-steel)" />
      <rect x={238} y={118} width={64} height={70} rx={5} fill="url(#j-processed-steel)" />
      <rect x={236} y={118} width={68} height={6} rx={2} fill="#8a9190" />
      <g fill="#6f7676">
        {[244, 256, 268, 280, 292].map((x) => (
          <circle key={x} cx={x} cy={121} r={1.4} />
        ))}
      </g>
      <ellipse cx={270} cy={100} rx={9} ry={3} fill="#8a9190" />
      <circle cx={270} cy={152} r={14} fill="#3a1626" stroke="#8a9190" strokeWidth={3} />
      <g fill="#7a2a3a">
        <circle cx={265} cy={157} r={4} />
        <circle cx={274} cy={158} r={4} />
        <circle cx={270} cy={150} r={4} fill="#8e3448" />
        <circle cx={262} cy={149} r={3.4} />
        <circle cx={278} cy={149} r={3.4} />
      </g>
      <rect x={259} y={142} width={8} height={3} rx={1.5} fill="#fff" opacity={0.3} />
      <rect x={244} y={128} width={6} height={52} rx={3} fill="#fff" opacity={0.22} />
    </>
  );
}

/** Wet-hulled: a huller strips the damp parchment; dark green beans drop out the front. */
function Huller() {
  return (
    <>
      <g stroke="#7a3426" strokeWidth={4} strokeLinecap="round">
        <line x1={246} y1={156} x2={244} y2={192} />
        <line x1={292} y1={156} x2={294} y2={192} />
      </g>
      <path d="M238 96 Q270 80 302 96 Z" fill="#e0cfa0" />
      <g fill="#cdb98a">
        <ellipse cx={254} cy={92} rx={4} ry={2.6} />
        <ellipse cx={270} cy={88} rx={4} ry={2.6} />
        <ellipse cx={285} cy={92} rx={4} ry={2.6} />
      </g>
      <g fill="#eef6f6">
        <circle cx={262} cy={89} r={1.2} />
        <circle cx={278} cy={90} r={1.2} />
        <circle cx={292} cy={93} r={1} />
      </g>
      <path d="M234 94 L306 94 L292 114 L248 114 Z" fill="#c7684f" />
      <rect x={238} y={112} width={64} height={44} rx={5} fill="#a84f3a" />
      <rect x={238} y={124} width={64} height={3} fill="#f0b49b" opacity={0.6} />
      <rect x={302} y={128} width={14} height={22} rx={3} fill="#7a3426" />
      <circle cx={309} cy={139} r={5} fill="#a84f3a" stroke="#6b4a32" strokeWidth={2} />
      <path d="M262 156 L278 156 L276 166 L264 166 Z" fill="#7a3426" />
      {/* the stripped parchment blows out of the side chute */}
      <path d="M238 136 L224 148" stroke="#7a3426" strokeWidth={6} strokeLinecap="round" />
      <g fill="#d8c48e">
        {[
          [-26, -14, 0.5],
          [-34, 4, 0.75],
          [-20, 14, 1],
          [-30, -4, 1.25],
          [-16, -20, 1.5],
        ].map(([tx, ty, d]) => (
          <rect
            key={d}
            className="j-processed-chaff"
            style={vars({ "--d": `${d}s`, "--tx": `${tx}px`, "--ty": `${ty}px` })}
            x={220}
            y={148}
            width={5}
            height={3}
            rx={1}
          />
        ))}
      </g>
      {[0.5, 0.8, 1.1, 1.4].map((d, i) => (
        <g key={d} className="j-processed-drop" style={vars({ "--d": `${d}s`, "--dy": "20px" })}>
          <ellipse cx={269 + (i % 2) * 2} cy={168} rx={3.6} ry={5} fill="#34502f" />
        </g>
      ))}
    </>
  );
}

const PREP: Partial<Record<ProcessKind, ComponentType>> = {
  washed: Pulper,
  anaerobic: SealedTank,
  "wet-hulled": Huller,
};

const STARS: [number, number][] = [
  [140, 62],
  [168, 104],
  [204, 54],
  [236, 120],
  [300, 60],
  [330, 104],
  [120, 132],
  [62, 140],
];

/**
 * Processed: the days of drying. A counter runs from day 1 to the longest drying time while the sun
 * crosses the sky four and a half times, the sky fading through night and day. What dries, and any
 * step before it, shows the process; the surface (raised beds, a patio, a drum dryer) shows the drying.
 */
export function ProcessedArt({ j, active }: ArtProps) {
  const { process, drying, days } = j.processed;
  const t = useTween(active, DRY_MS, DRY_DELAY);
  const look = LOOK[process];
  const Prep = PREP[process];
  const start = Prep ? 2.2 : 0.3; // when items land on the surface

  const p = t >= 1 ? 0.5 : (t * SUN_PASSES) % 1;
  const arc = Math.sin(p * Math.PI);
  const lit = Math.pow(arc, 0.6);
  const day = Math.max(1, Math.round(lerp(1, Math.max(1, days.max), t)));
  const k = smooth(t);

  const drumX = Prep ? 112 : 180;
  const slots = useMemo(() => slotsFor(drying, look.shape, start), [drying, look.shape, start]);
  const items = useMemo(() => <Items slots={slots} />, [slots]);

  // Behind the beds the prep step stands raised, above their load; behind the patio, on its far edge.
  // Beside the drum it is drawn smaller, standing on the ground to the drum's right.
  const prepAt =
    drying === "mechanical"
      ? "translate(268 246) scale(0.78) translate(-259 -190)"
      : drying === "patio"
        ? "translate(0 10)"
        : "translate(0 -22)";

  return (
    <g data-art="processed" data-variant={`${process} ${drying}`}>
      <defs>
        <ItemDef look={look} k={k} />
        <linearGradient id="j-processed-steel" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c9cfcd" />
          <stop offset="0.35" stopColor="#e4e8e6" />
          <stop offset="1" stopColor="#959c9b" />
        </linearGradient>
      </defs>

      <rect width={360} height={300} fill={mix("#5a4438", "#f6e3cf", lit)} />
      <g fill="#fbf8f5" opacity={0.9 * (1 - lit)}>
        {STARS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={1.4} />
        ))}
      </g>
      <g transform={`translate(${lerp(10, 350, p)} ${200 - arc * 150})`}>
        <circle r={34} fill="#efc27a" opacity={0.25} />
        <circle r={22} fill="#efc27a" />
      </g>
      <g data-depth="0.08">
        <path d="M-10 196 Q70 168 150 186 T300 176 T370 184 V300 H-10 Z" fill="#c3c49b" />
      </g>

      {Prep && drying !== "mechanical" && (
        <g transform={prepAt}>
          <g className="j-rise" style={motionVars({ d: 0.1 })}>
            <Prep />
          </g>
        </g>
      )}

      {drying === "raised-beds" && (
        <>
          <Beds honey={process === "honey"} />
          {items}
        </>
      )}
      {drying === "patio" && (
        <>
          <Patio honey={process === "honey"} />
          {items}
          <Rake />
        </>
      )}
      {drying === "mechanical" && (
        <>
          <Drum cx={drumX} slots={slots} />
          {Prep && (
            <g transform={prepAt}>
              <g className="j-rise" style={motionVars({ d: 0.1 })}>
                <Prep />
              </g>
            </g>
          )}
        </>
      )}

      <rect width={360} height={300} fill="#2a1c15" opacity={0.3 * (1 - lit)} pointerEvents="none" />

      <g className="j-fade" style={motionVars({ d: 0.2 })}>
        <rect x={40} y={44} width={78} height={62} rx={12} fill="#fbf8f5" opacity={0.92} />
        <text x={54} y={64} fontSize={11} fontWeight={600} fill="#7a675b" letterSpacing={2}>
          DAY
        </text>
        <text
          className="numerals"
          x={54}
          y={96}
          fontSize={day >= 100 ? 26 : 34}
          fontWeight={700}
          fill="#2a1c15"
        >
          {day}
        </text>
      </g>
    </g>
  );
}
