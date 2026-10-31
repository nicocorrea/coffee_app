"use client";

import type { CSSProperties } from "react";
import { easeOut, lerp, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

const vars = (v: Record<string, string>) => v as CSSProperties;

// ─── By hand: a branch, its cherries ripening, the ripe ones dropping into a basket ───

const LEAVES: {
  x: number;
  y: number;
  a: number;
  d: number;
  fill?: string;
  small?: boolean;
}[] = [
  { x: 60, y: 46, a: -58, d: 0.9 },
  { x: 110, y: 60, a: 38, d: 1, fill: "#6f8a5c" },
  { x: 130, y: 68, a: 160, d: 1.15, fill: "#6f8a5c", small: true },
  { x: 232, y: 68, a: -20, d: 1.1 },
  { x: 260, y: 62, a: 200, d: 1.25, fill: "#567046", small: true },
  { x: 290, y: 48, a: 62, d: 1.2, fill: "#567046" },
];

// The branch hangs this far below the prototype's, clear of the phone's progress bar and close button.
const DROP = 18;

// [x, y, delay, fall distance]: three ripen first and drop into the basket.
const CHERRIES: [number, number, number, number?][] = [
  [144, 100, 1.3],
  [161, 106, 1.4, 136 - DROP],
  [178, 98, 1.5],
  [152, 119, 1.6],
  [171, 121, 1.7, 118 - DROP],
  [190, 113, 1.8],
  [204, 97, 1.9, 138 - DROP],
  [218, 110, 2],
  [203, 125, 2.1],
];

function ByHand() {
  return (
    <>
      <rect width={360} height={300} fill="#f1e6da" />
      <circle cx={300} cy={60} r={90} fill="#f6eadf" />
      <g transform={`translate(0 ${DROP})`}>
        <path
          className="j-draw"
          style={motionVars({ len: 460, dur: 1.4 })}
          d="M-10 54 C 80 34, 160 84, 240 66 S 340 34, 370 54"
          fill="none"
          stroke="#6b4a32"
          strokeWidth={7}
          strokeLinecap="round"
        />
        <g fill="#5f7a4e">
          {LEAVES.map((l) => (
            <g key={`${l.x}-${l.y}`} transform={`translate(${l.x} ${l.y}) rotate(${l.a})`}>
              <ellipse
                className="j-pop"
                style={motionVars({ d: l.d })}
                cx={0}
                cy={-16}
                rx={l.small ? 8 : 9}
                ry={l.small ? 18 : 20}
                fill={l.fill}
              />
            </g>
          ))}
        </g>
        <g stroke="#6b4a32" strokeWidth={2} strokeLinecap="round" className="j-fade" style={motionVars({ d: 1 })}>
          <line x1={150} y1={76} x2={146} y2={92} />
          <line x1={172} y1={76} x2={172} y2={90} />
          <line x1={196} y1={72} x2={200} y2={88} />
          <line x1={214} y1={70} x2={214} y2={98} />
        </g>
        {CHERRIES.map(([cx, cy, d, dy]) => (
          <circle
            key={`${cx}-${cy}`}
            className={dy ? "j-picked-ripen j-picked-fall" : "j-picked-ripen"}
            style={vars({
              "--d": `${d}s`,
              ...(dy ? { "--dy": `${dy}px` } : {}),
            })}
            cx={cx}
            cy={cy}
            r={10}
          />
        ))}
        <g fill="#fff" opacity={0.45}>
          <circle cx={140} cy={96} r={3} />
          <circle cx={174} cy={94} r={3} />
          <circle cx={148} cy={115} r={3} />
          <circle cx={186} cy={109} r={3} />
          <circle cx={214} cy={106} r={3} />
          <circle cx={199} cy={121} r={3} />
        </g>
      </g>
      {/* The basket, raised a little so its rim stays inside the phone's crop. */}
      <g transform="translate(0 -12)">
        <g className="j-rise" style={motionVars({ d: 0.5 })}>
          <ellipse cx={180} cy={232} rx={78} ry={12} fill="#8a6a4c" />
          <g fill="#c0392b">
            <circle cx={150} cy={232} r={9} />
            <circle cx={168} cy={229} r={9} />
            <circle cx={186} cy={233} r={9} />
            <circle cx={205} cy={229} r={9} />
            <circle cx={160} cy={236} r={9} fill="#a8322a" />
            <circle cx={196} cy={237} r={9} fill="#a8322a" />
          </g>
          <path d="M102 234 L258 234 L240 292 L120 292 Z" fill="#c49a6c" />
          <g stroke="#a47c52" strokeWidth={2}>
            <line x1={106} y1={248} x2={254} y2={248} />
            <line x1={110} y1={262} x2={250} y2={262} />
            <line x1={114} y1={276} x2={246} y2={276} />
          </g>
          <g stroke="#a47c52" strokeWidth={2} opacity={0.6}>
            <line x1={140} y1={234} x2={146} y2={292} />
            <line x1={180} y1={234} x2={180} y2={292} />
            <line x1={220} y1={234} x2={214} y2={292} />
          </g>
          <ellipse cx={180} cy={234} rx={78} ry={6} fill="none" stroke="#8a6a4c" strokeWidth={4} />
        </g>
      </g>
    </>
  );
}

// ─── By machine: a straddle harvester rolls along the row, shaking cherries into its hopper ───

const ROW_Y = 216;
const BUSHES = [-26, 18, 62, 106, 150, 194, 238, 282, 326, 370];
const SHAKER_X = 190; // the shaker's middle, once the machine has stopped
const ROLL_FROM = -250;
const WHEEL_R = 15;

function Bush({ x, i, ripe, back, shake }: { x: number; i: number; ripe: boolean; back?: boolean; shake?: boolean }) {
  const tone = i % 2 ? "#5f7a4e" : "#4f6a3f";
  return (
    <g transform={`translate(${x} ${back ? 196 : ROW_Y})`}>
      <g className={shake ? "j-picked-shake" : undefined} style={shake ? motionVars({ d: 3.6 }) : undefined}>
        <ellipse rx={back ? 18 : 25} ry={back ? 18 : 30} fill={back ? "#a9b28c" : tone} />
        {!back && (
          <g fill="#c0392b" opacity={ripe ? 1 : 0} style={{ transition: "opacity 0.5s ease" }}>
            <circle cx={-10} cy={-12} r={2.8} />
            <circle cx={6} cy={-4} r={2.8} />
            <circle cx={12} cy={10} r={2.8} />
            <circle cx={-6} cy={8} r={2.8} />
            <circle cx={-14} cy={4} r={2.8} />
          </g>
        )}
      </g>
    </g>
  );
}

function Wheel({ x, turn }: { x: number; turn: number }) {
  return (
    <g transform={`translate(${x} 234) rotate(${turn})`}>
      <circle r={WHEEL_R} fill="#4a3328" />
      <circle r={WHEEL_R - 5} fill="#6b4a32" />
      <g stroke="#cbb9a8" strokeWidth={2}>
        <line x1={-8} y1={0} x2={8} y2={0} />
        <line x1={0} y1={-8} x2={0} y2={8} />
      </g>
      <circle r={3} fill="#cbb9a8" />
    </g>
  );
}

function ByMachine({ active }: { active: boolean }) {
  const roll = useTween(active, 3600, 200);
  const fill = useTween(active, 4200, 900);
  const offset = lerp(ROLL_FROM, 0, easeOut(roll));
  const turn = ((offset - ROLL_FROM) / WHEEL_R) * (180 / Math.PI);
  const heap = 0.12 + 0.88 * easeOut(fill);

  return (
    <>
      <rect width={360} height={300} fill="#f1e6da" />
      <circle cx={300} cy={60} r={90} fill="#f6eadf" />
      <g data-depth="0.06">
        <path d="M-20 214 Q180 196 380 210 V260 H-20 Z" fill="#c3c49b" />
        {BUSHES.map((x, i) => (
          <Bush key={x} x={x + 22} i={i} ripe={false} back />
        ))}
      </g>
      <path d="M-20 244 Q180 236 380 244 V320 H-20 Z" fill="#d9c7ae" />
      <g stroke="#c9b597" strokeWidth={2} fill="none" strokeLinecap="round">
        <path d="M-20 262 Q180 254 380 262" />
        <path d="M-20 282 Q180 272 380 282" />
      </g>

      {/* Behind the shaker the bushes are bare; ahead of it they are still full of red cherries. */}
      {BUSHES.map((x, i) => (
        <Bush key={x} x={x} i={i} ripe={x + 12 > SHAKER_X + offset} shake={x === 194} />
      ))}

      <g transform={`translate(${offset} 0)`}>
        <ellipse cx={184} cy={250} rx={84} ry={5} fill="#4a3328" opacity={0.18} />
        {/* the frame straddles the row: rear leg, front leg, deck */}
        <rect x={122} y={116} width={20} height={112} rx={3} fill="#a84f3a" />
        <rect x={226} y={116} width={20} height={112} rx={3} fill="#a84f3a" />
        <g stroke="#7a3426" strokeWidth={2}>
          <line x1={230} y1={140} x2={242} y2={140} />
          <line x1={230} y1={160} x2={242} y2={160} />
          <line x1={230} y1={180} x2={242} y2={180} />
          <line x1={230} y1={200} x2={242} y2={200} />
        </g>
        <rect x={110} y={100} width={148} height={34} rx={6} fill="#a84f3a" />
        <rect x={110} y={112} width={148} height={3} fill="#f0b49b" opacity={0.6} />
        <rect x={118} y={120} width={30} height={8} rx={2} fill="#7a3426" opacity={0.5} />
        <rect x={140} y={237} width={90} height={4} rx={2} fill="#7a3426" />

        {/* the shaker: a spindle of flexible rods that combs through the bush */}
        <g className="j-picked-shake">
          <rect x={SHAKER_X - 3} y={134} width={6} height={100} rx={2} fill="#7a3426" />
          <g stroke="#6b4a32" strokeWidth={2} strokeLinecap="round">
            {[146, 156, 166, 176, 186, 196, 206, 216, 226].map((y, i) => (
              <line key={y} x1={SHAKER_X - (i % 2 ? 20 : 15)} y1={y + 2} x2={SHAKER_X + (i % 2 ? 15 : 20)} y2={y - 2} />
            ))}
          </g>
        </g>

        {/* the elevator lifts the shaken cherries up into the hopper */}
        <rect x={145} y={76} width={10} height={160} rx={2} fill="#7a3426" opacity={0.4} />
        {[0, 1, 2, 3, 4].map((i) => (
          <circle
            key={i}
            className="j-picked-lift"
            style={motionVars({ d: 0.5 + i * 0.3 })}
            cx={150}
            cy={226}
            r={3.4}
            fill="#c0392b"
          />
        ))}

        <g transform={`translate(0 73) scale(1 ${heap}) translate(0 -73)`}>
          <path d="M122 74 Q140 56 163 58 Q188 54 204 74 Z" fill="#c0392b" />
          <g fill="#a8322a">
            <circle cx={142} cy={66} r={3} />
            <circle cx={162} cy={62} r={3} />
            <circle cx={180} cy={64} r={3} />
            <circle cx={192} cy={69} r={3} />
          </g>
        </g>
        <path d="M116 72 L210 72 L202 100 L124 100 Z" fill="#c7684f" />
        <line x1={113} y1={72} x2={213} y2={72} stroke="#7a3426" strokeWidth={3} strokeLinecap="round" />

        <rect x={220} y={60} width={38} height={42} rx={5} fill="#a84f3a" />
        <rect x={227} y={66} width={25} height={22} rx={3} fill="#f6eadf" opacity={0.92} />
        <rect x={216} y={55} width={46} height={7} rx={3} fill="#7a3426" />

        <Wheel x={132} turn={turn} />
        <Wheel x={236} turn={turn} />
      </g>
    </>
  );
}

/** Picked: by hand, the ripe cherries are picked into a basket; by machine, a harvester shakes the row. */
export function PickedArt({ j, active }: ArtProps) {
  const method = j.picked.method;
  return (
    <g data-art="picked" data-variant={method}>
      {method === "hand" ? <ByHand /> : <ByMachine active={active} />}
    </g>
  );
}
