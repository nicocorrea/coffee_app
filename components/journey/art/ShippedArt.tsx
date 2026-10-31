"use client";

import { lerp, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

type Pt = [number, number];

// The route arcs over the sea from the export port to the roaster.
const FROM: Pt = [80, 92];
const CTRL: Pt = [180, 18];
const TO: Pt = [280, 92];

const at = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const pt = ([x, y]: Pt) => `${x.toFixed(1)} ${y.toFixed(1)}`;

/** The route's first `t` of the way (de Casteljau), as a path. */
function travelled(t: number): string {
  const c = at(FROM, CTRL, t);
  const end = at(c, at(CTRL, TO, t), t);
  return `M${pt(FROM)} Q${pt(c)} ${pt(end)}`;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** A port or city name, clipped and kept inside the frame's safe area. */
function place(name: string, x: number) {
  const text = name.length > 16 ? `${name.slice(0, 15).trimEnd()}…` : name;
  const size = text.length > 12 ? 10 : 11;
  const half = (text.length * size * 0.56) / 2;
  return { text, size, x: Math.min(316 - half, Math.max(44 + half, x)) };
}

/** A wave band that repeats every `len`, long enough to slide one full frame (360) and loop. */
function wave(y: number, amp: number, len: number): string {
  let d = `M0 ${y}`;
  for (let x = 0; x < 760; x += len) d += ` q${len / 4} ${-amp} ${len / 2} 0 t${len / 2} 0`;
  return `${d} V300 H0 Z`;
}

const CONTAINERS: [number, number, string][] = [
  [166, 190, "#a84f3a"],
  [190, 190, "#8c9873"],
  [214, 190, "#c9a26b"],
  [178, 172, "#6e4128"],
  [202, 172, "#a84f3a"],
];

/**
 * Shipped: a container ship rides the swell at dusk. Above it the route arcs from the export port
 * (or the country, when there is no usual port) to the roaster, and a dot sails along it.
 */
export function ShippedArt({ j, active }: ArtProps) {
  const t = easeInOut(useTween(active, 5000, 600));
  const from = place(j.shipped.port ?? j.place.countryNames[0] ?? "Origin", FROM[0]);
  const to = place(j.shipped.arrival, TO[0]);
  const c = at(FROM, CTRL, t);
  const dot = at(c, at(CTRL, TO, t), t);

  return (
    <g data-art="shipped" data-variant="sea">
      <defs>
        <linearGradient id="j-shipped-dusk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e7b48e" />
          <stop offset="0.75" stopColor="#f6e1cc" />
        </linearGradient>
      </defs>
      <rect width={360} height={300} fill="url(#j-shipped-dusk)" />

      <g data-depth="0.06">
        <circle cx={268} cy={194} r={46} fill="#f2c88f" opacity={0.35} />
        <circle cx={268} cy={194} r={32} fill="#f2c88f" />
        <g className="j-drift">
          <g fill="none" stroke="#a87a5e" strokeWidth={1.6} strokeLinecap="round">
            <path d="M92 142 q5 -5 10 0 q5 -5 10 0" />
            <path d="M116 132 q4 -4 8 0 q4 -4 8 0" />
          </g>
        </g>
      </g>

      {/* the route */}
      <g data-depth="0.03">
        <path
          d={`M${pt(FROM)} Q${pt(CTRL)} ${pt(TO)}`}
          fill="none"
          stroke="#a8722f"
          strokeOpacity={0.45}
          strokeWidth={2}
          strokeDasharray="3 6"
        />
        {t > 0 && <path d={travelled(t)} fill="none" stroke="#a84f3a" strokeWidth={2.4} strokeLinecap="round" />}
        <circle cx={FROM[0]} cy={FROM[1]} r={4} fill="#7a675b" />
        <circle cx={TO[0]} cy={TO[1]} r={4} fill="#7a675b" />
        <g className="j-fade" style={motionVars({ d: 0.3 })} fontWeight={600} fill="#7a675b" textAnchor="middle">
          <text x={from.x} y={FROM[1] + 20} fontSize={from.size}>
            {from.text}
          </text>
          <text x={to.x} y={TO[1] + 20} fontSize={to.size}>
            {to.text}
          </text>
        </g>
        <circle cx={dot[0]} cy={dot[1]} r={7} fill="#fbf8f5" opacity={0.9} />
        <circle cx={dot[0]} cy={dot[1]} r={5} fill="#a84f3a" />
      </g>

      {/* the sea, back to front, with the ship riding between the swells */}
      <g className="j-shipped-wave" style={motionVars({ dur: 7 })}>
        <path d={wave(222, 6, 90)} fill="#9fb3b0" />
      </g>
      <g className="j-shipped-sail">
        <g className="j-shipped-bob">
          <g fill="#7a675b">
            {[0, 1, 2].map((i) => (
              <circle key={i} className="j-shipped-puff" style={motionVars({ d: i })} cx={150} cy={166} r={6} />
            ))}
          </g>
          <rect x={144} y={168} width={10} height={20} fill="#2a1c15" />
          <rect x={144} y={174} width={10} height={3} fill="#a84f3a" />
          <rect x={126} y={186} width={34} height={22} rx={2} fill="#efe4d8" />
          <g fill="#7a675b">
            <rect x={131} y={191} width={6} height={5} rx={1} />
            <rect x={140} y={191} width={6} height={5} rx={1} />
            <rect x={149} y={191} width={6} height={5} rx={1} />
          </g>
          {CONTAINERS.map(([x, y, fill]) => (
            <g key={`${x}-${y}`}>
              <rect x={x} y={y} width={22} height={18} fill={fill} />
              <g stroke="#2a1c15" strokeOpacity={0.18} strokeWidth={1.2}>
                <line x1={x + 6} y1={y + 3} x2={x + 6} y2={y + 15} />
                <line x1={x + 11} y1={y + 3} x2={x + 11} y2={y + 15} />
                <line x1={x + 16} y1={y + 3} x2={x + 16} y2={y + 15} />
              </g>
            </g>
          ))}
          <path d="M108 208 L258 208 L242 234 L124 234 Z" fill="#2a1c15" />
          <rect x={116} y={214} width={134} height={3} fill="#a84f3a" />
          <circle cx={238} cy={222} r={2.4} fill="#efe4d8" opacity={0.7} />
        </g>
      </g>
      <g className="j-shipped-wave" style={motionVars({ dur: 5 })}>
        <path d={wave(232, 7, 60)} fill="#7f9a99" />
      </g>
      <g className="j-shipped-wave" style={motionVars({ dur: 3.6 })}>
        <path d={wave(248, 8, 120)} fill="#5f7f80" />
        <g fill="#fbf8f5" opacity={0.35}>
          {[30, 150, 270, 390, 510, 630].map((x) => (
            <rect key={x} x={x} y={258} width={22} height={2} rx={1} />
          ))}
        </g>
      </g>
    </g>
  );
}
