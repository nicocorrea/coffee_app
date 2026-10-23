import { scoreOf } from "@/lib/flavour";
import type { BeanProfile } from "@/lib/schema";

const ALL_AXES = [
  ["acidity", "Acidity"],
  ["sweetness", "Sweetness"],
  ["body", "Body"],
  ["creaminess", "Creaminess"],
  ["bitterness", "Bitterness"],
  ["finish", "Finish"],
] as const;

const W = 360;
const C = 130;
const R = 74;

const point = (i: number, n: number, r: number) => {
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  return [W / 2 + Math.cos(a) * r, C + Math.sin(a) * r] as const;
};

export function FlavourRadar({ flavour }: { flavour: BeanProfile["flavour"] }) {
  // Results saved before a quality existed have no score for it; chart only what was rated.
  const axes = ALL_AXES.flatMap(([key, label]) => {
    const score = scoreOf(flavour, key);
    return score === null ? [] : [{ key, label, score }];
  });
  const n = axes.length;
  const shape = axes.map(({ score }, i) => point(i, n, (score / 5) * R).join(",")).join(" ");
  const summary = axes.map(({ label, score }) => `${label} ${score} of 5`).join(", ");

  return (
    <svg viewBox={`0 0 ${W} 250`} className="mx-auto w-full max-w-sm" role="img" aria-label={summary}>
      {[1, 2, 3, 4, 5].map((step) => (
        <polygon
          key={step}
          points={axes.map((_, i) => point(i, n, (step / 5) * R).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = point(i, n, R);
        return <line key={i} x1={W / 2} y1={C} x2={x} y2={y} stroke="var(--color-line)" strokeWidth={1} />;
      })}
      <polygon
        points={shape}
        fill="var(--color-cascara)"
        fillOpacity={0.35}
        stroke="var(--color-cascara)"
        strokeWidth={2}
        strokeLinejoin="round"
        className="bloom"
        style={{ transformOrigin: `${W / 2}px ${C}px` }}
      />
      {axes.map(({ key, label, score }, i) => {
        const [x, y] = point(i, n, R + 14);
        const anchor = Math.abs(x - W / 2) < 4 ? "middle" : x > W / 2 ? "start" : "end";
        return (
          <text key={key} x={x} y={i === 0 ? y - 6 : y + 6} textAnchor={anchor} dominantBaseline="middle" fontSize={15} fill="var(--color-muted)">
            {label} <tspan fill="var(--color-ink)">{score}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
