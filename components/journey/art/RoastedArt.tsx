"use client";

import { ROAST_LEVELS, type RoastLevel } from "@/lib/schema";
import { lerp, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

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

/** A colour k (0–1) of the way along a list of stops. */
function ramp(stops: string[], k: number): string {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

// Green and yellow, then the app's --color-roast-* tokens, light → dark.
const GREEN = "#9aa46a";
const YELLOW = "#d6b56c";
const ROAST: Record<RoastLevel, string> = {
  light: "#b07b4f",
  "medium-light": "#8e5a36",
  medium: "#6e4128",
  "medium-dark": "#4e2d1c",
  dark: "#2e1a11",
};
const SCALE = [GREEN, YELLOW, ...ROAST_LEVELS.map((l) => ROAST[l])];

/** Where the roaster drops the beans, by level. */
const END_C: Record<RoastLevel, number> = {
  light: 205,
  "medium-light": 210,
  medium: 215,
  "medium-dark": 222,
  dark: 228,
};
const SECOND_CRACK: ReadonlySet<RoastLevel> = new Set(["medium-dark", "dark"]);

const ROAST_MS = 6500;
const FIRST_AT = 0.84;
const SECOND_AT = 0.96;

const smooth = (t: number) => t * t * (3 - 2 * t);

// The roast scale along the bottom: one segment per colour, labelled under some of them.
const BAR = { x: 55, y: 234, w: 34, gap: 2, h: 9 };
const segX = (i: number) => BAR.x + i * (BAR.w + BAR.gap);
const LABELS: [number, string][] = [
  [0, "green"],
  [1, "yellow"],
  [2, "light"],
  [4, "medium"],
  [6, "dark"],
];

const DRUM = { x: 116, y: 124, r: 62 };
const BEAN = { x: 254, y: 116 };

// Beans tumbling in the drum, around its centre: [x, y, angle].
const TUMBLE: [number, number, number][] = [
  [-18, -22, 10],
  [14, -23, 60],
  [-25, 11, 110],
  [20, 20, 150],
  [0, -34, 30],
  [32, -2, 80],
  [-34, -6, 130],
  [2, 35, 170],
  [-8, 18, 45],
  [8, -5, 95],
];

/** A ring of short rays and a word: the bean popping. */
function Crack({ rays, r, len, label, size, at }: {
  rays: number[];
  r: number;
  len: number;
  label: [number, number];
  size: number;
  at: boolean;
}) {
  return (
    <g className={`j-roasted-crack${at ? " is-on" : ""}`}>
      <g stroke="#f2c88f" strokeWidth={size > 12 ? 3 : 2.4} strokeLinecap="round">
        {rays.map((a) => {
          const c = Math.cos((a * Math.PI) / 180);
          const s = Math.sin((a * Math.PI) / 180);
          return <line key={a} x1={c * r} y1={s * r} x2={c * (r + len)} y2={s * (r + len)} />;
        })}
      </g>
      <text x={label[0]} y={label[1]} textAnchor="middle" fontSize={size} fontWeight={800} fill="#f2c88f">
        crack!
      </text>
    </g>
  );
}

/**
 * Roasted: the drum spins over the burner, and beans tumble inside. The big bean ramps from green
 * through yellow to this coffee's roast while the temperature climbs; it pops ("crack!") near the
 * end, and a darker roast pops a second time. The marker on the roast scale stops on the level.
 */
export function RoastedArt({ j, active }: ArtProps) {
  const level = j.roasted.level;
  const t = useTween(active, ROAST_MS, 500);
  const stops = SCALE.slice(0, 3 + ROAST_LEVELS.indexOf(level));
  const k = smooth(t);
  const bean = ramp(stops, k);
  const temp = Math.round(lerp(20, END_C[level], 1 - (1 - t) * (1 - t)));
  const dark = Math.max(0, ROAST_LEVELS.indexOf(level) - 2) / 2; // 0 up to medium, 1 at dark
  const marker = segX(k * (stops.length - 1)) + BAR.w / 2;
  const grow = 1 + 0.12 * k; // beans swell as they roast

  return (
    <g data-art="roasted" data-variant={level}>
      <defs>
        <radialGradient id="j-roasted-glow">
          <stop offset="0" stopColor="#c7684f" stopOpacity={0.9} />
          <stop offset="0.55" stopColor="#a84f3a" stopOpacity={0.35} />
          <stop offset="1" stopColor="#a84f3a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id="j-roasted-window" cx="0.5" cy="0.62" r="0.6">
          <stop offset="0" stopColor="#7a4a2c" />
          <stop offset="1" stopColor="#24170f" />
        </radialGradient>
        <radialGradient id="j-roasted-spot">
          <stop offset="0" stopColor="#5a4030" />
          <stop offset="1" stopColor="#2a1c15" />
        </radialGradient>
        <g id="j-roasted-bean">
          <ellipse rx={6} ry={8} fill={bean} />
          <path d="M0.8 -6.6 C -1.8 -2, 2 2, -0.6 6.6" stroke="#000" strokeOpacity={0.3} strokeWidth={1.4} fill="none" />
          <ellipse cx={-2.4} cy={-3} rx={1.2} ry={2.4} fill="#fff" opacity={0.18} />
        </g>
      </defs>
      <rect width={360} height={300} fill="#2a1c15" />

      {/* the roaster: chimney, hopper, drum, burner */}
      <g data-depth="0.04">
        <g style={{ opacity: 0.35 + 0.65 * k }}>
          <g className="j-roasted-glow">
            <circle cx={DRUM.x} cy={DRUM.y + 8} r={98} fill="url(#j-roasted-glow)" />
          </g>
        </g>
        <rect x={166} y={50} width={14} height={50} fill="#3a2a22" />
        <rect x={163} y={50} width={20} height={6} rx={2} fill="#4e3a30" />
        <g fill="#a8927f" style={{ opacity: 0.15 + 0.35 * k }}>
          {[0, 0.9, 1.8].map((d) => (
            <circle key={d} className="j-roasted-smoke" style={motionVars({ d })} cx={173} cy={46} r={5} />
          ))}
        </g>
      </g>
      <path d="M94 44 L138 44 L126 66 L106 66 Z" fill="#4e3a30" />
      <rect x={92} y={42} width={48} height={5} rx={2} fill="#6e4128" />
      <g stroke="#3a2a22" strokeWidth={7} strokeLinecap="round">
        <line x1={76} y1={172} x2={64} y2={218} />
        <line x1={156} y1={172} x2={168} y2={218} />
      </g>
      <rect x={88} y={206} width={56} height={10} rx={3} fill="#3a2a22" />
      {[100, 116, 132].map((x, i) => (
        <g key={x} transform={`translate(${x} 206)`}>
          <g className="j-roasted-flame" style={motionVars({ d: i * 0.12 })}>
            <path d="M-7 0 C -7 -7 -2 -9 0 -14 C 2 -9 7 -7 7 0 Z" fill="#e2b33c" />
            <path d="M-3 0 C -3 -4 -1 -5 0 -8 C 1 -5 3 -4 3 0 Z" fill="#c7684f" />
          </g>
        </g>
      ))}
      <circle cx={DRUM.x} cy={DRUM.y} r={DRUM.r} fill="#3a2a22" stroke="#6e4128" strokeWidth={8} />
      <circle cx={DRUM.x} cy={DRUM.y} r={DRUM.r - 13} fill="url(#j-roasted-window)" />
      <g transform={`translate(${DRUM.x} ${DRUM.y})`}>
        <g className="j-roasted-spin">
          <circle r={DRUM.r - 13} fill="none" />
          {TUMBLE.map(([x, y, a]) => (
            <use key={`${x}-${y}`} href="#j-roasted-bean" transform={`translate(${x} ${y}) rotate(${a}) scale(${grow})`} />
          ))}
          <g stroke="#4e3a30" strokeWidth={3} strokeLinecap="round">
            <line x1={0} y1={-47} x2={0} y2={47} />
            <line x1={-47} y1={0} x2={47} y2={0} />
          </g>
        </g>
      </g>
      <circle cx={DRUM.x} cy={DRUM.y} r={8} fill="#6e4128" />
      <path
        d={`M${DRUM.x - 40} ${DRUM.y - 26} A 49 49 0 0 1 ${DRUM.x - 9} ${DRUM.y - 47}`}
        stroke="#fff"
        strokeOpacity={0.12}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />

      {/* the big bean */}
      <circle cx={BEAN.x} cy={BEAN.y} r={60} fill="url(#j-roasted-spot)" />
      <g transform={`translate(${BEAN.x} ${BEAN.y})`}>
        <Crack rays={[-90, -40, -140, 0, 180]} r={52} len={9} label={[0, -68]} size={14} at={t >= FIRST_AT} />
        {SECOND_CRACK.has(level) && (
          <Crack rays={[105, 130]} r={52} len={6} label={[-58, 62]} size={11} at={t >= SECOND_AT} />
        )}
        <g transform={`scale(${grow})`}>
          <ellipse rx={32} ry={44} fill={bean} stroke="#000" strokeOpacity={0.15} strokeWidth={1.5} />
          <path d="M4 -39 C -11 -12, 12 12, -4 39" fill="none" stroke="#000" strokeOpacity={0.3} strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={-12} cy={-18} rx={5} ry={11} fill="#fff" opacity={0.12 + 0.1 * dark} />
        </g>
        <text className="numerals" y={86} textAnchor="middle" fontSize={20} fontWeight={700} fill="#fbf8f5">
          {temp} °C
        </text>
      </g>

      {/* the roast scale */}
      <g>
        <rect x={BAR.x - 2} y={BAR.y - 2} width={segX(SCALE.length) - BAR.gap - BAR.x + 4} height={BAR.h + 4} rx={6.5} fill="#4a3328" />
        {SCALE.map((c, i) => (
          <rect
            key={c}
            x={segX(i)}
            y={BAR.y}
            width={BAR.w}
            height={BAR.h}
            rx={i === 0 || i === SCALE.length - 1 ? 4.5 : 0}
            fill={c}
            stroke={i === stops.length - 1 ? "#fbf8f5" : "none"}
            strokeOpacity={0.5 * k}
          />
        ))}
        <g fontSize={9.5} fontWeight={600} textAnchor="middle">
          {LABELS.map(([i, name]) => (
            <text key={name} x={segX(i) + BAR.w / 2} y={BAR.y + 23} fill={name === level ? "#fbf8f5" : "#a8927f"}>
              {name}
            </text>
          ))}
        </g>
        <path
          d={`M${(marker - 6).toFixed(1)} ${BAR.y - 11} L${(marker + 6).toFixed(1)} ${BAR.y - 11} L${marker.toFixed(1)} ${BAR.y - 3} Z`}
          fill="#fbf8f5"
        />
      </g>
    </g>
  );
}
