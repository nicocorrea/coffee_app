"use client";

import { STAGE_LABELS } from "@/lib/journey/copy";
import type { StageId } from "@/lib/journey/types";
import { easeOut, motionVars, useTween } from "../motion";
import type { ArtProps } from "./index";

const DARK: ReadonlySet<StageId> = new Set(["cover", "roasted"]);

/** A stand-in drawing that exercises the motion contract: a framed label, a drawn rule and a counter. */
function Placeholder({ id, j, active }: ArtProps & { id: StageId }) {
  const t = useTween(active, 1400, 300);
  const dark = DARK.has(id);
  const n = j.stages.indexOf(id);
  return (
    <g data-art={id} data-placeholder="">
      <rect width={360} height={300} fill={dark ? "#2a1c15" : "#eae0d6"} />
      <g data-depth="0.08">
        <g className="j-drift">
          <ellipse cx={92} cy={70} rx={34} ry={9} fill={dark ? "#4a3328" : "#fbf8f5"} opacity={0.8} />
        </g>
      </g>
      <g data-depth="0.04">
        <circle className="j-pop" style={motionVars({ d: 0.2 })} cx={180} cy={128} r={52} fill={dark ? "#4e2d1c" : "#ded2c6"} />
      </g>
      <text
        className="j-fade"
        style={motionVars({ d: 0.5 })}
        x={180}
        y={140}
        textAnchor="middle"
        fontSize={34}
        fontWeight={700}
        fill={dark ? "#f0b49b" : "#a84f3a"}
      >
        {Math.round(easeOut(t) * Math.max(n, 0))}
      </text>
      <line
        className="j-draw"
        style={motionVars({ d: 0.6, dur: 1.2, len: 200 })}
        x1={80}
        y1={214}
        x2={280}
        y2={214}
        stroke={dark ? "#a8927f" : "#7a675b"}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <text
        className="j-rise"
        style={motionVars({ d: 0.8 })}
        x={180}
        y={246}
        textAnchor="middle"
        fontSize={16}
        fontWeight={600}
        letterSpacing={3}
        fill={dark ? "#cbb9a8" : "#7a675b"}
      >
        {STAGE_LABELS[id].toUpperCase()}
      </text>
    </g>
  );
}

export function placeholderArt(id: StageId) {
  function PlaceholderArt(props: ArtProps) {
    return <Placeholder id={id} {...props} />;
  }
  PlaceholderArt.displayName = `PlaceholderArt(${id})`;
  return PlaceholderArt;
}
