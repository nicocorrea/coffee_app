import type { BeanProfile } from "@/lib/schema";

const AXES = [
  ["acidity", "Acidity"],
  ["sweetness", "Sweetness"],
  ["body", "Body"],
  ["bitterness", "Bitterness"],
  ["finish", "Finish"],
] as const;

const W = 360;
const C = 130;
const R = 74;

const point = (i: number, r: number) => {
  const a = (Math.PI * 2 * i) / AXES.length - Math.PI / 2;
  return [W / 2 + Math.cos(a) * r, C + Math.sin(a) * r] as const;
};

export function FlavourRadar({ flavour }: { flavour: BeanProfile["flavour"] }) {
  const shape = AXES.map(([key], i) => point(i, (flavour[key] / 5) * R).join(",")).join(" ");
  const summary = AXES.map(([key, label]) => `${label} ${flavour[key]} of 5`).join(", ");

  return (
    <svg viewBox={`0 0 ${W} 250`} className="mx-auto w-full max-w-sm" role="img" aria-label={summary}>
      {[1, 2, 3, 4, 5].map((step) => (
        <polygon
          key={step}
          points={AXES.map((_, i) => point(i, (step / 5) * R).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={1}
        />
      ))}
      {AXES.map((_, i) => {
        const [x, y] = point(i, R);
        return <line key={i} x1={W / 2} y1={C} x2={x} y2={y} stroke="var(--color-line)" strokeWidth={1} />;
      })}
      <polygon points={shape} fill="var(--color-cascara)" fillOpacity={0.35} stroke="var(--color-cascara)" strokeWidth={2} strokeLinejoin="round" />
      {AXES.map(([key, label], i) => {
        const [x, y] = point(i, R + 14);
        const anchor = Math.abs(x - W / 2) < 4 ? "middle" : x > W / 2 ? "start" : "end";
        return (
          <text key={key} x={x} y={i === 0 ? y - 6 : y + 4} textAnchor={anchor} dominantBaseline="middle" fontSize={13} fill="var(--color-muted)">
            {label} <tspan fill="var(--color-ink)">{flavour[key]}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
